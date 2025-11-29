import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying usdFHE with deployer:", deployer.address);

  const UsdFhe = await hre.ethers.getContractFactory("UsdFheToken");

  // 1,000,000 usdFHE with 6 decimals
  const initialSupply = hre.ethers.parseUnits("1000000", 6);

  const token = await UsdFhe.deploy(initialSupply);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("usdFHE deployed to:", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
