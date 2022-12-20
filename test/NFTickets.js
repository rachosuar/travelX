const { expect } = require("chai");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const {
  weeks,
  days,
} = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");
const { ethers } = require("hardhat");

let marketplaceInstance;
let marketplaceAddress;

let stablecoinInstance;
let stablecoinAddress;

let nftAddress;
let nftInstance;

let splitterInstance;
let splitterAddr;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  "deployer",
  "travelX",
  "airline",
  "seller",
  "buyer",
  "nonOwner",
  "splitter",
];

describe("NFTickets", function () {
  describe("Initialization", function () {
    it("Should initialize signers", async function () {
      const testSigners = await hre.ethers.getSigners();
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        sigInstances[signerRole] = testSigners[iSigner];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
      }
    });

    it("Should deploy the stablecoin contract", async function () {
      const stablecoinFactory = await hre.ethers.getContractFactory(
        "Stablecoin",
        sigInstances.deployer
      );
      stablecoinInstance = await stablecoinFactory.deploy(0);
      await stablecoinInstance.deployed();

      stablecoinAddress = stablecoinInstance.address;

      const mintToBuyer = await stablecoinInstance.mintTokens(
        sigAddrs.buyer,
        hre.ethers.utils.parseUnits("100000.0", 2)
      );
      mintToBuyer.wait();

      const stablecoinSupply = await stablecoinInstance.totalSupply();
      expect(stablecoinSupply).to.equal(
        hre.ethers.utils.parseUnits("100000.0", 2)
      );

      const buyerBalance = await stablecoinInstance.balanceOf(sigAddrs.buyer);
      expect(buyerBalance).to.equal(hre.ethers.utils.parseUnits("100000.0", 2));

      const stablecoinSymbol = await stablecoinInstance.symbol();
      expect(stablecoinSymbol).to.equal("FUSDC");
    });
    it("Should deploy the splitter contract", async function () {
      const splitterFactory = await hre.ethers.getContractFactory(
        "Splitter",
        sigInstances.deployer
      );
      splitterInstance = await splitterFactory.deploy(
        [sigAddrs.travelX, sigAddrs.airline],
        [400, 600]
      );
      splitterAddr = splitterInstance.address;
      expect(splitterAddr).to.be.a.properAddress;
    });
    it("Should deploy NFT contract", async function () {
      const nftFactory = await hre.ethers.getContractFactory(
        "NFTickets",
        sigInstances.deployer
      );

      nftInstance = await nftFactory.deploy(splitterAddr);
      await nftInstance.deployed();
      nftAddress = nftInstance.address;

      let nftOwner = await nftInstance.owner();
      expect(nftOwner).to.equal(sigAddrs.deployer);
    });

    it("Should deploy marketplace contract", async function () {
      const marketplaceFactory = await hre.ethers.getContractFactory(
        "TicketsMarketplace",
        sigInstances.deployer
      );

      marketplaceInstance = await marketplaceFactory.deploy(
        stablecoinAddress,
        nftAddress,
        splitterAddr
      );
      await marketplaceInstance.deployed();

      marketplaceAddress = marketplaceInstance.address;

      const marketplaceOwner = await marketplaceInstance.owner();
      expect(marketplaceOwner).to.equal(sigAddrs.deployer);
    });
    it("Should transfer ownership of NFTickets to Marketplace contract", async function () {
      const ownershipChange = await nftInstance.transferOwnership(
        marketplaceAddress
      );
      ownershipChange.wait();
      nftOwner = await nftInstance.owner();
      expect(nftOwner).to.equal(marketplaceAddress);
    });

    it("Should create an NFT Ticket", async function () {
      const balanceBefore = await nftInstance.balanceOf(marketplaceAddress);
      let tokenId = Number(await nftInstance.totalSupply());

      const createTicket = await marketplaceInstance.create(
        1672341981,
        hre.ethers.utils.parseUnits("1000.0", 2),
        tokenId
      );
      createTicket.wait();
      const balanceAfter = await nftInstance.balanceOf(marketplaceAddress);
      const ticketPrice = await nftInstance.nftPrice(tokenId);
      const ticketDeadLine = await nftInstance.nftDeadlineTransfer(tokenId);
      expect(balanceAfter).to.equal(balanceBefore + 1);
      expect(ticketPrice).to.equal(hre.ethers.utils.parseUnits("1000.0", 2));
      expect(ticketDeadLine).to.equal(1672341981);
      const ticketOwner = await nftInstance.ownerOf(tokenId);
      expect(ticketOwner).to.equal(marketplaceAddress);
    });

    it("Should prevent create an NFT if not the owner", async function () {
      const marketplaceInstanceForNonOwner = marketplaceInstance.connect(
        sigInstances.nonOwner
      );
      tokenId = nftInstance.totalSupply;
      const createTicket = marketplaceInstanceForNonOwner.create(
        1672341981,
        hre.ethers.utils.parseUnits("1000.0", 2),
        tokenId
      );
      await expect(createTicket).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should allow to buy a ticket", async function () {
      const marketplaceInstanceForBuyer = await marketplaceInstance.connect(
        sigInstances.buyer
      );
      const BuyerStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.buyer
      );
      const nftPrice = await nftInstance.getPrice(1);
      const StablecoinContractBalanceBefore =
        await stablecoinInstance.balanceOf(marketplaceAddress);
      const StablecoinBuyerBalanceBefore = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      const splitterBalanceBefore = await stablecoinInstance.balanceOf(
        splitterAddr
      );
      const nftContractBalanceBefore = await nftInstance.balanceOf(
        marketplaceAddress
      );
      const nftBuyerBalanceBefore = await nftInstance.balanceOf(sigAddrs.buyer);
      const paymentApprove = await BuyerStablecoinInstance.approve(
        marketplaceAddress,
        nftPrice
      );
      paymentApprove.wait();

      const buyTicket = await marketplaceInstanceForBuyer.transferNFT(
        1,
        sigAddrs.buyer
      );
      buyTicket.wait();

      const StablecoinContractBalanceAfter = await stablecoinInstance.balanceOf(
        marketplaceAddress
      );
      const StablecoinBuyerBalanceAfter = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      const splitterBalanceAfter = await stablecoinInstance.balanceOf(
        splitterAddr
      );
      const nftContractBalanceAfter = await nftInstance.balanceOf(
        marketplaceAddress
      );
      const nftBuyerBalanceAfter = await nftInstance.balanceOf(sigAddrs.buyer);

      expect(StablecoinContractBalanceAfter).to.equal(
        StablecoinContractBalanceBefore.add(nftPrice.mul(95).div(100))
      );
      expect(splitterBalanceBefore).to.equal(
        splitterBalanceAfter.sub(nftPrice.mul(5).div(100))
      );

      expect(StablecoinBuyerBalanceAfter).to.equal(
        StablecoinBuyerBalanceBefore.sub(nftPrice)
      );

      expect(nftContractBalanceAfter).to.equal(nftContractBalanceBefore.sub(1));

      expect(nftBuyerBalanceAfter).to.equal(nftBuyerBalanceBefore.add(1));

      expect(await nftInstance.ownerOf(1)).to.equal(sigAddrs.buyer);
    });

    it("Should set NFT Price to 0 after transfer", async function () {
      const nftPriceAfterTransfer = await nftInstance.nftPrice(0);
      expect(nftPriceAfterTransfer).to.equal(0);
    });

    it("Should prevent a nonOwner to set NFT Price", async function () {
      const marketplaceInstanceForNonOwner = await marketplaceInstance.connect(
        sigInstances.nonOwner
      );
      const setPriceTx = marketplaceInstanceForNonOwner.sellTicket(
        1,
        hre.ethers.utils.parseUnits("250", 2)
      );
      await expect(setPriceTx).to.be.revertedWith(
        "You are not the owner of this ticket"
      );
    });
    it("Should prevent to transfer NFT if price is set to 0", async function () {
      const marketplaceInstanceForNonOwner = await marketplaceInstance.connect(
        sigInstances.nonOwner
      );
      const buyTicketTx = marketplaceInstanceForNonOwner.transferNFT(
        1,
        sigAddrs.nonOwner
      );
      await expect(buyTicketTx).to.be.revertedWith("Ticket is not for sale");
    });

    it("Should allow Owner to set NFT Price", async function () {
      const marketplaceInstanceBuyer = await marketplaceInstance.connect(
        sigInstances.buyer
      );
      const setPriceTx = await marketplaceInstanceBuyer.sellTicket(
        1,
        hre.ethers.utils.parseUnits("250", 2)
      );
      setPriceTx.wait();

      expect(await nftInstance.nftPrice(1)).to.equal(
        hre.ethers.utils.parseUnits("250", 2)
      );
    });

    it("Should prevent to buy NFT after Deadline", async function () {
      await helpers.time.increaseTo(1672356381);
      const marketplaceInstanceForNonOwner = await marketplaceInstance.connect(
        sigInstances.nonOwner
      );
      const buyTicketTx = marketplaceInstanceForNonOwner.transferNFT(
        1,
        sigAddrs.nonOwner
      );
      await expect(buyTicketTx).to.be.revertedWith("Ticket is not for sale");
    });
  });
  describe("Splitter", function () {
    it("Should show pending payments for each account", async function () {
      let totalSplitter = await stablecoinInstance.balanceOf(splitterAddr);
      let travelxPending = await splitterInstance.pending(
        stablecoinAddress,
        sigAddrs.travelX
      );
      let airlinePending = await splitterInstance.pending(
        stablecoinAddress,
        sigAddrs.airline
      );

      expect(totalSplitter).to.equal(travelxPending.add(airlinePending));
      expect(travelxPending).to.equal(totalSplitter.mul(40).div(100));
      expect(airlinePending).to.equal(totalSplitter.mul(60).div(100));
    });

    it("Should deploy the stablecoin contract", async function () {});
  });
});
