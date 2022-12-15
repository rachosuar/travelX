// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { getAddress } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
// const readlinePromises = require("node:readline/promises");
// const rlInterface = readlinePromises.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

async function main() {
  // Setup accounts
  const [travelX, airline, deployer, buyer1, buyer2] =
    await ethers.getSigners();

  // Deploy Splitter
  const splitterFactory = await ethers.getContractFactory("Splitter", deployer);
  const splitterInstance = await splitterFactory.deploy(
    [travelX.address, airline.address],
    [400, 600]
  );
  await splitterInstance.deployed();
  const splitterAddr = splitterInstance.address;

  console.log(`Spliter Contract deployed at: ${splitterAddr}`);
  console.log(`Deploying stablecoin\n`);

  // Deploy Stablecoin
  const stablecoinFactory = await ethers.getContractFactory(
    "Stablecoin",
    deployer
  );
  const stablecoinInstance = await stablecoinFactory.deploy(
    hre.ethers.utils.parseUnits("100000.0", 2)
  );
  await stablecoinInstance.deployed();
  const stablecoinAddress = stablecoinInstance.address;

  console.log(`Stablecoin Contract deployed at: ${stablecoinAddress}`);
  console.log(`Sending stablecoin to addresses..`);

  // Give stablecoin to buyers to operate
  let mintStablecoin = await stablecoinInstance.transfer(
    buyer1.address,
    hre.ethers.utils.parseUnits("2000.0", 2)
  );
  mintStablecoin.wait();
  mintStablecoin = await stablecoinInstance.transfer(
    buyer2.address,
    hre.ethers.utils.parseUnits("2000.0", 2)
  );
  mintStablecoin.wait();
  console.log(
    `Buyer 1 received ${await stablecoinInstance.balanceOf(
      buyer1.address
    )} ${await stablecoinInstance.symbol()}`
  );
  console.log(
    `Buyer 2 received ${await stablecoinInstance.balanceOf(
      buyer2.address
    )} ${await stablecoinInstance.symbol()}`
  );

  // Deploy NFTickets
  const nfticketsFactory = await ethers.getContractFactory(
    "NFTickets",
    deployer
  );
  const nftticketsInstance = await nfticketsFactory.deploy(splitterAddr);
  await nftticketsInstance.deployed();
  const nftticketsAddress = nftticketsInstance.address;

  console.log(`NFTickets Contract deployed at: ${nftticketsAddress}`);

  // Deploy Marketplace
  const marketplaceFactory = await ethers.getContractFactory(
    "TicketsMarketplace",
    deployer
  );
  const marketplaceInstance = await marketplaceFactory.deploy(
    stablecoinAddress,
    nftticketsAddress,
    splitterAddr
  );
  await marketplaceInstance.deployed();
  const marketplaceAddress = marketplaceInstance.address;

  // Pas ownership of NFT contract to marketplace contract
  const changeOwnership = await nftticketsInstance.transferOwnership(
    marketplaceAddress
  );
  changeOwnership.wait();
  console.log(`Marketplace Contract deployed at: ${marketplaceAddress}`);
  console.log(`${await nftticketsInstance.owner()} is the NFT contract owner`);
  //Generate tickets
  console.log("Marketplace generate new tickets...");
  let tokenID = (await nftticketsInstance.totalSupply()).toNumber();

  const createTicketTx = await marketplaceInstance.create(
    1672341981,
    hre.ethers.utils.parseUnits("10.0", 2),
    tokenID
  );
  createTicketTx.wait();
  console.log(
    `NFTicket number ${tokenID} was created, and you can check it details on https://gateway.pinata.cloud/${await nftticketsInstance.tokenURI(
      tokenID
    )}.json`
  );
  console.log(
    "-----------------------------------------------------------------------------------------------"
  );
  //Buy a ticket
  const marketplaceInstanceforBuyer = marketplaceInstance.connect(buyer1);
  const stablecoinInstanceforBuyer = stablecoinInstance.connect(buyer1);

  let nftPrice = await nftticketsInstance.getPrice(1);
  //Approve marketplace to take stablecoins from buyer wallet
  let approval = await stablecoinInstanceforBuyer.approve(
    marketplaceAddress,
    nftPrice
  );
  approval.wait();
  const transferTx = await marketplaceInstanceforBuyer.transferNFT(
    1,
    buyer1.address
  );
  transferTx.wait();
  console.log(
    `Transaction successful, ${await nftticketsInstance.ownerOf(
      1
    )} is the new owner`
  );
  console.log(
    `NFT price set to ${await nftticketsInstance.getPrice(
      1
    )}, It's not for sale anymore`
  );
  // Buyer 1 puts ticket on sale
  console.log(
    `Does ticket number ${tokenID} is for sale?, ${await nftticketsInstance.isOnSale(
      tokenID
    )}`
  );
  const setForSale = await marketplaceInstanceforBuyer.sellTicket(
    1,
    hre.ethers.utils.parseUnits("20.0", 2)
  );
  setForSale.wait();
  console.log(
    `Does ticket number ${tokenID} is for sale?, ${await nftticketsInstance.isOnSale(
      tokenID
    )} and it price is ${await nftticketsInstance.getPrice(tokenID)}`
  );
  console.log(
    "-----------------------------------------------------------------------------------------------"
  );
  // Buyer 2 buys ticket to buyer 1
  const marketplaceInstanceforBuyer2 = marketplaceInstance.connect(buyer2);
  const stablecoinInstanceforBuyer2 = stablecoinInstance.connect(buyer2);

  nftPrice = await nftticketsInstance.getPrice(1);
  //Approve marketplace to take stablecoins from buyer wallet
  approval = await stablecoinInstanceforBuyer2.approve(
    marketplaceAddress,
    nftPrice
  );
  approval.wait();
  const transferTxforBuyer2 = await marketplaceInstanceforBuyer2.transferNFT(
    1,
    buyer2.address
  );
  transferTxforBuyer2.wait();
  console.log(
    `Transaction successful, ${await nftticketsInstance.ownerOf(
      1
    )} is the new owner`
  );
  console.log(
    `NFT price set to ${await nftticketsInstance.getPrice(
      1
    )}, It's not for sale anymore`
  );
  console.log(
    "-----------------------------------------------------------------------------------------------"
  );
  //Check if fees are deposited
  const splitterBalance = await stablecoinInstance.balanceOf(splitterAddr);
  console.log(
    `After transacctions there are ${splitterBalance} ${await stablecoinInstance.symbol()} payed by buyer as fees `
  );
  const balanceTravelX = await splitterInstance.pending(
    stablecoinAddress,
    travelX.address
  );
  const balanceAirline = await splitterInstance.pending(
    stablecoinAddress,
    airline.address
  );

  console.log(
    `TravelX pending withdrawal are ${balanceTravelX} ${await stablecoinInstance.symbol()}`
  );
  console.log(
    `Airline pending withdrawal are ${balanceAirline} ${await stablecoinInstance.symbol()}`
  );

  // TravelX can withdrawal founds
  const splitterInstanceforTravelX = await splitterInstance.connect(travelX);
  let withdrawal = await splitterInstanceforTravelX.withdraw(
    stablecoinAddress,
    travelX.address
  );
  withdrawal.wait();

  console.log(
    `TravelX account has withdrawal ${await stablecoinInstance.balanceOf(
      travelX.address
    )} ${await stablecoinInstance.symbol()} so long`
  );

  console.log(`Finished.`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
