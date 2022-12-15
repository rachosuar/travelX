const { ethers } = require("hardhat");

deployer = require("./deploy.js");

async function main() {
  console.log(deployer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
