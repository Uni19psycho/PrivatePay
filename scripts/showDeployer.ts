import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address (index 0):", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
