const { expect } = require("chai");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const {
  weeks,
  days,
} = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");

let ticketsInstance;
let ticketsAddress;

let stablecoinInstance;
let stablecoinAddress;

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

    it("Should deploy NFT contract", async function () {
      const ticketsFactory = await hre.ethers.getContractFactory(
        "NFTickets",
        sigInstances.deployer
      );

      ticketsInstance = await ticketsFactory.deploy(sigAddrs.deployer);
      await ticketsInstance.deployed();

      ticketsAddress = ticketsInstance.address;

      //set stablecoin token
      const setStablecoin = await ticketsInstance.setToken(stablecoinAddress);
      setStablecoin.wait();

      const stablecoinOwner = await stablecoinInstance.owner();
      expect(stablecoinOwner).to.equal(sigAddrs.deployer);
    });

    it("Should create an NFT Ticket", async function () {
      const balanceBefore = await ticketsInstance.balanceOf(ticketsAddress);
      const createTicket = await ticketsInstance.createTicket(
        1672341981,
        hre.ethers.utils.parseUnits("1000.0", 2)
      );
      createTicket.wait();

      const balanceAfter = await ticketsInstance.balanceOf(ticketsAddress);
      const ticketPrice = await ticketsInstance.nftPrice(0);
      const ticketDeadLine = await ticketsInstance.nftDeadlineTransfer(0);

      expect(balanceAfter).to.equal(balanceBefore + 1);
      expect(ticketPrice).to.equal(hre.ethers.utils.parseUnits("1000.0", 2));
      expect(ticketDeadLine).to.equal(1672341981);
      const ticketOwner = await ticketsInstance.ownerOf(0);
      expect(ticketOwner).to.equal(ticketsAddress);
    });

    it("Should prevent create an NFT if not the owner", async function () {
      const ticketsInstanceForNonOwner = await ticketsInstance.connect(
        sigInstances.nonOwner
      );

      const createTicket = ticketsInstanceForNonOwner.createTicket(
        1672341981,
        hre.ethers.utils.parseUnits("1000.0", 2)
      );
      await expect(createTicket).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should allow to buy a ticket", async function () {
      const ticketsInstanceForContract = await ticketsInstance.connect(
        ticketsAddress
      );

      const ticketInstanceForBuyer = await ticketsInstance.connect(
        sigInstances.buyer
      );
      const BuyerStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.buyer
      );

      const nftPrice = await ticketsInstance.nftPrice(0);

      const StablecoinContractBalanceBefore =
        await stablecoinInstance.balanceOf(ticketsAddress);
      const StablecoinBuyerBalanceBefore = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      const TicketsContractBalanceBefore = await ticketsInstance.balanceOf(
        ticketsAddress
      );
      const TicketsBuyerBalanceBefore = await ticketsInstance.balanceOf(
        sigAddrs.buyer
      );

      const paymentApprove = await BuyerStablecoinInstance.approve(
        ticketsAddress,
        nftPrice
      );
      paymentApprove.wait();

      // const transferApprove = await ticketsInstance.approve(sigAddrs.buyer, 0);
      // transferApprove.wait();

      // const addressAprobado = await ticketsInstance.getApproved(0)
      // console.log(addressAprobado)

      const buyTicket = await ticketInstanceForBuyer.transferNFT(
        0,
        sigAddrs.buyer
      );
      buyTicket.wait();

      const StablecoinContractBalanceAfter = await stablecoinInstance.balanceOf(
        ticketsAddress
      );
      const StablecoinBuyerBalanceAfter = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      const TicketsContractBalanceAfter = await ticketsInstance.balanceOf(
        ticketsAddress
      );
      const TicketsBuyerBalanceAfter = await ticketsInstance.balanceOf(
        sigAddrs.buyer
      );

      expect(StablecoinContractBalanceAfter).to.equal(
        StablecoinContractBalanceBefore.add(nftPrice)
      );

      expect(StablecoinBuyerBalanceAfter).to.equal(
        StablecoinBuyerBalanceBefore.sub(nftPrice)
      );

      expect(TicketsContractBalanceAfter).to.equal(
        TicketsContractBalanceBefore.sub(1)
      );

      expect(TicketsBuyerBalanceAfter).to.equal(
        TicketsBuyerBalanceBefore.add(1)
      );

      expect(await ticketsInstance.ownerOf(0)).to.equal(sigAddrs.buyer);
    });

    it("Should set NFT Price to 0 after transfer", async function () {
      const nftPriceAfterTransfer = await ticketsInstance.nftPrice(0);
      expect(nftPriceAfterTransfer).to.equal(0);
    });

    it("Should prevent a nonOwner to set NFT Price", async function () {
      const ticketsInstanceForNonOwner = await ticketsInstance.connect(
        sigInstances.nonOwner
      );
      const setPriceTx = ticketsInstanceForNonOwner.sellTicket(
        0,
        hre.ethers.utils.parseUnits("250", 2)
      );
      await expect(setPriceTx).to.be.revertedWith(
        "You are not the owner of this ticket"
      );
    });

    it("Should allow Owner to set NFT Price", async function () {
      const ticketsInstanceBuyer = await ticketsInstance.connect(
        sigInstances.buyer
      );
      const setPriceTx = await ticketsInstanceBuyer.sellTicket(
        0,
        hre.ethers.utils.parseUnits("250", 2)
      );

      expect(await ticketsInstance.nftPrice(0)).to.equal(
        hre.ethers.utils.parseUnits("250", 2)
      );
    });

    it("Should prevent to buy NFT after Deadline", async function () {
      await helpers.time.increaseTo(1672356381);

      const ticketsInstanceForNonOwner = await ticketsInstance.connect(
        sigInstances.nonOwner
      );

      const buyTicketTx = ticketsInstanceForNonOwner.transferNFT(
        0,
        sigAddrs.nonOwner
      );

      await expect(buyTicketTx).to.be.revertedWith(
        "You can not buy this ticket. Deadline expired"
      );
    });
  });
});
