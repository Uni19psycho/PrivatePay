import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Wallet = await ethers.getContractFactory("FHEPrivateWallet");
  const wallet = await Wallet.deploy();

  await wallet.waitForDeployment();

  console.log("FHEPrivateWallet deployed to:", await wallet.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
