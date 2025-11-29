import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const deployer = await signer.getAddress();

  const tokenAddress =
    process.env.USD_FHE_ADDRESS ??
    "0x15Bf4B782Ac42d5EB7fBd3aEbb9736b4e2C625bd";

  const to =
    process.env.USD_FHE_RECIPIENT ??
    "0x4592B9d4780545219130440f1A1abeEca4822C62";

  const amountHuman = 100n;

  console.log("Deployer:", deployer);
  console.log("Token   :", tokenAddress);
  console.log("To      :", to);
  console.log("Amount  :", amountHuman.toString(), "usdFHE");

  const token = await ethers.getContractAt("UsdFHE", tokenAddress, signer);

  const decimals: bigint = await token.decimals();
  const amount = ethers.parseUnits(amountHuman.toString(), Number(decimals));

  const balanceBefore: bigint = await token.balanceOf(deployer);
  console.log("Deployer balance before:", balanceBefore.toString());

  const tx = await token.transfer(to, amount);
  console.log("Transfer tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Mined in block:", receipt.blockNumber);

  const balanceAfter: bigint = await token.balanceOf(deployer);
  console.log("Deployer balance after :", balanceAfter.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
