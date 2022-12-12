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

      const stablecoinSupply = await stablecoinInstance.totalSupply();
      expect(stablecoinSupply).to.equal(0);

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
  });
});
