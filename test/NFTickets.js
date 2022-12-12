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
        hre.ethers.utils.parseUnits("1000000.0", 18)
      );
      mintToBuyer.wait();

      const stablecoinSupply = await stablecoinInstance.totalSupply();
      expect(stablecoinSupply).to.equal(
        hre.ethers.utils.parseUnits("1000000.0", 18)
      );

      const buyerBalance = await stablecoinInstance.balanceOf(sigAddrs.buyer);
      expect(buyerBalance).to.equal(
        hre.ethers.utils.parseUnits("1000000.0", 18)
      );

      const stablecoinSymbol = await stablecoinInstance.symbol();
      expect(stablecoinSymbol).to.equal("FUSDC");
    });
    it("Should deploy NFT contract", async function () {
      const ticketsFactory = await hre.ethers.getContractFactory(
        "NFTickets",
        sigInstances.deployer
      );
      ticketsInstance = await ticketsFactory.deploy(sigAddrs.splitter);
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
        1671231974,
        hre.ethers.utils.parseUnits("1000.0", 18)
      );
      createTicket.wait();
      const balanceAfter = await ticketsInstance.balanceOf(ticketsAddress);
      const ticketPrice = await ticketsInstance.nftPrice(0);
      const ticketDeadLine = await ticketsInstance.nftDeadlineTransfer(0);
      expect(balanceAfter).to.equal(balanceBefore + 1);
      expect(ticketPrice).to.equal(hre.ethers.utils.parseUnits("1000.0", 18));
      expect(ticketDeadLine).to.equal(1671231974);
      const ticketOwner = await ticketsInstance.ownerOf(0);
      expect(ticketOwner).to.equal(ticketsAddress);
    });
    it("Should prevent create an NFT if not the owner", async function () {
      const ticketsInstanceForNonOwner = await ticketsInstance.connect(
        sigInstances.nonOwner
      );
      const createTicket = ticketsInstanceForNonOwner.createTicket(
        1671231974,
        1000
      );
      await expect(createTicket).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("Should allow to buy a ticket", async function () {
      const balanceBeforeContract = await stablecoinInstance.balanceOf(
        ticketsAddress
      );
      const balanceBeforeBuyer = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      console.log(balanceBeforeBuyer);
      const balanceBeforeContractTickets = await ticketsInstance.balanceOf(
        ticketsAddress
      );
      const balanceBeforeBuyerTickets = await ticketsInstance.balanceOf(
        sigAddrs.buyer
      );
      const ticketInstanceForBuyer = await ticketsInstance.connect(
        sigInstances.buyer
      );
      const sellTicket = await ticketInstanceForBuyer.transferNFT(
        0,
        sigAddrs.buyer
      );
      sellTicket.wait();

      const balanceAfterContract = await stablecoinInstance.balanceOf(
        ticketsAddress
      );
      const balanceAfterBuyer = await stablecoinInstance.balanceOf(
        sigAddrs.buyer
      );
      const balanceAfterContractTickets = await ticketsInstance.balanceOf(
        ticketsAddress
      );
      const balanceAfterBuyerTickets = await ticketsInstance.balanceOf(
        sigAddrs.buyer
      );

      expect(balanceAfterContract).to.equal(
        balanceBeforeContract.add(await ticketsInstance.nftPrice(0))
      );
      expect(balanceAfterBuyer).to.equal(
        balanceBeforeBuyer.sub(await ticketsInstance.nftPrice(0))
      );
    });
  });
});
/* function transferNFT(uint256 tokenID, address _to) public {
        //require(curreny == usdc, "wrong token");
        require(nftPrice[tokenID] > 0, "This ticket is not for sale");
        require(block.timestamp <= nftDeadlineTransfer[tokenID], "You can not buy this ticket. Deadline expired");
        require(USDCToken.balanceOf(msg.sender)>=nftPrice[tokenID],"The amount is not correct");
        USDCToken.approve(address(this), nftPrice[tokenID]);
        USDCToken.transfer(ownerOf(tokenID),nftPrice[tokenID]);
        nftPrice[tokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta
        safeTransferFrom(ownerOf(tokenID), _to, tokenID);
        emit nftTransfer(ownerOf(tokenID), _to, tokenID, block.timestamp);

    }
       
    }*/
