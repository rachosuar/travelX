// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { getAddress } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const readlinePromise = require("readline-promise").default;
const rlInterface = readlinePromise.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});
let nftticketsAddress;

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
  console.log(
    "-----------------------------------DEPLOYING SPLITTER (as Deployer)-----------------------------------------------"
  );

  console.log(`Spliter Contract deployed at: ${splitterAddr} ✅`);
  console.log(`Deploying stablecoin...`);

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

  console.log(
    "---------------------------------DEPLOYING STABLECOIN (as Deployer)------------------------------------------------"
  );

  console.log(`Stablecoin Contract deployed at: ${stablecoinAddress} ✅`);
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
    )} ${await stablecoinInstance.symbol()} 🤑`
  );
  console.log(
    `Buyer 2 received ${await stablecoinInstance.balanceOf(
      buyer2.address
    )} ${await stablecoinInstance.symbol()} 🤑`
  );
  console.log(
    "---------------------------------DEPLOYING NFTickets (as Deployer)------------------------------------------------"
  );
  // Deploy NFTickets
  const nfticketsFactory = await ethers.getContractFactory(
    "NFTickets",
    deployer
  );
  const nftticketsInstance = await nfticketsFactory.deploy(splitterAddr);
  await nftticketsInstance.deployed();
  const nftticketsAddress = nftticketsInstance.address;

  console.log(`NFTickets Contract deployed at: ${nftticketsAddress} ✅`);
  console.log(
    "---------------------------------DEPLOYING MARKETPLACE (as Deployer)----------------------------------------------"
  );
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
  console.log(`Marketplace Contract deployed at: ${marketplaceAddress} ✅`);
  console.log(`${await nftticketsInstance.owner()} is the NFT contract owner`);
  console.log(
    "---------------------------------CREATE TICKETS (as Marketplace owner)------------------------------------------"
  );
  console.log("Marketplace new tickets creation...");
  //Generate tickets
  let ticketQty = await rlInterface.questionAsync(
    "How many tickets do you want to create? (3 Max) :  "
  );
  let ticketCreated = 0;
  while (ticketCreated < ticketQty) {
    let tokenID = (await nftticketsInstance.totalSupply()).toNumber();

    let tokenPrice = await rlInterface.questionAsync(
      `What price should the ticket ${ticketCreated + 1} have? :   `
    );
    let ticketDOF = await rlInterface.questionAsync(
      "Which will be the ticket deadline for transfer?  (yyyy/mm/dd) :  "
    );
    const dateStr1 = ticketDOF;
    const date1 = new Date(dateStr1);
    const timestamp = Math.floor(date1.getTime() / 1000);

    const createTicketTx = await marketplaceInstance.create(
      timestamp,
      hre.ethers.utils.parseUnits(`${tokenPrice}.0`, 2),
      tokenID
    );
    createTicketTx.wait();
    console.log(
      `NFTicket number ${tokenID} was created 🛫, and you can check details on  
       🌎https://gateway.pinata.cloud${await nftticketsInstance.tokenURI(
         tokenID
       )}.json 🌏`
    );
    ticketCreated++;
  }
  console.log(
    "-------------------------------------------BUY A TICKET (as Buyer 1)-------------------------------------------------"
  );
  //Buy a ticket
  let ticketSelected = Number(
    await rlInterface.questionAsync(
      " 🎫 Which ticket do you want to buy? (ticket ID) : "
    )
  );
  const marketplaceInstanceforBuyer = marketplaceInstance.connect(buyer1);
  const stablecoinInstanceforBuyer = stablecoinInstance.connect(buyer1);

  let nftPrice = await nftticketsInstance.getPrice(ticketSelected);
  //Approve marketplace to take stablecoins from buyer wallet
  let approval = await stablecoinInstanceforBuyer.approve(
    marketplaceAddress,
    nftPrice
  );
  approval.wait();
  const transferTx = await marketplaceInstanceforBuyer.transferNFT(
    ticketSelected,
    buyer1.address
  );
  transferTx.wait();
  console.log(
    `Transaction successful ✅, ${await nftticketsInstance.ownerOf(
      ticketSelected
    )} is the new owner`
  );
  console.log(
    `NFT price set to ${await nftticketsInstance.getPrice(
      ticketSelected
    )}, It's not for sale anymore`
  );
  // Buyer 1 puts ticket on sale
  console.log(
    `Is ticket number ${ticketSelected}  for sale?, ❌  ${await nftticketsInstance.isOnSale(
      ticketSelected
    )}  ❌  `
  );
  let newPrice = Number(
    await rlInterface.questionAsync(
      `Which will be the new price for ticket ${ticketSelected}?  : `
    )
  );
  const setForSale = await marketplaceInstanceforBuyer.sellTicket(
    ticketSelected,
    hre.ethers.utils.parseUnits(`${newPrice}.0`, 2)
  );
  setForSale.wait();
  console.log(
    `Is ticket number ${ticketSelected}  for sale?, 👌🏽 ${await nftticketsInstance.isOnSale(
      ticketSelected
    )} 👌🏽 and it price is ${
      (await nftticketsInstance.getPrice(ticketSelected)) / 100
    }`
  );

  console.log(
    "---------------------------------------BUYER RE-SELL TICKET (as Buyer 2)---------------------------------------"
  );
  // Buyer 2 buys ticket to buyer 1
  const marketplaceInstanceforBuyer2 = marketplaceInstance.connect(buyer2);
  const stablecoinInstanceforBuyer2 = stablecoinInstance.connect(buyer2);

  nftPrice = await nftticketsInstance.getPrice(ticketSelected);
  //Approve marketplace to take stablecoins from buyer wallet
  approval = await stablecoinInstanceforBuyer2.approve(
    marketplaceAddress,
    nftPrice
  );
  approval.wait();
  const transferTxforBuyer2 = await marketplaceInstanceforBuyer2.transferNFT(
    ticketSelected,
    buyer2.address
  );
  transferTxforBuyer2.wait();
  console.log(
    `Transaction successful ✅, ${await nftticketsInstance.ownerOf(
      ticketSelected
    )} is the new owner`
  );
  console.log(
    `NFT price set to ${await nftticketsInstance.getPrice(
      ticketSelected
    )}, It's not for sale anymore`
  );
  console.log(
    "---------------------------------CHECK FEE DEPOSIT(as TravelX or Airline)-------------------------------------------"
  );
  //Check if fees are deposited
  const splitterBalance =
    (await stablecoinInstance.balanceOf(splitterAddr)) / 100;
  console.log(
    `After transacctions there are ${splitterBalance} ${await stablecoinInstance.symbol()} payed by buyers as fees 💰`
  );
  const balanceTravelX =
    (await splitterInstance.pending(stablecoinAddress, travelX.address)) / 100;
  const balanceAirline =
    (await splitterInstance.pending(stablecoinAddress, airline.address)) / 100;

  console.log(
    `TravelX pending withdrawal are ${balanceTravelX} ${await stablecoinInstance.symbol()}`
  );
  console.log(
    `Airline pending withdrawal are ${balanceAirline} ${await stablecoinInstance.symbol()}`
  );
  console.log(
    "---------------------------------CHECK WITHDRAWALS (as TravelX or Airline) ------------------------------------"
  );
  // TravelX can withdrawal founds
  const splitterInstanceforTravelX = await splitterInstance.connect(travelX);
  let withdrawal = await splitterInstanceforTravelX.withdraw(
    stablecoinAddress,
    travelX.address
  );
  withdrawal.wait();

  console.log(
    `TravelX account has withdrawn ${
      (await stablecoinInstance.balanceOf(travelX.address)) / 100
    } ${await stablecoinInstance.symbol()} so long`
  );

  console.log(`Thank you for your time! Have a safe flight. 👩🏻‍✈️ `);
  console.log(
    "-------------------------------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------🚀  EWOL ACADEMY  🚀 ----------------------------------------------------"
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
