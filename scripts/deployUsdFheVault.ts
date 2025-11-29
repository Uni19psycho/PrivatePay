import { ethers } from "hardhat";

async function main() {
  const token = process.env.USD_FHE_ADDRESS;
  if (!token) {
    throw new Error("USD_FHE_ADDRESS missing in env");
  }

  const Vault = await ethers.getContractFactory("UsdFheVault");
  const vault = await Vault.deploy(token);

  await vault.waitForDeployment();
  console.log("UsdFheVault deployed to:", await vault.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
