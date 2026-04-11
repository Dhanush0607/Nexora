const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying NexoraIntegrity contract...");
  console.log("─────────────────────────────────────");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from wallet:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  const NexoraIntegrity = await ethers.getContractFactory("NexoraIntegrity");
  const contract        = await NexoraIntegrity.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("─────────────────────────────────────");
  console.log("✅ Contract deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("─────────────────────────────────────");
  console.log("Copy this to server/.env:");
  console.log("CONTRACT_ADDRESS=" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });