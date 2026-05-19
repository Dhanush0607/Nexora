require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url:      process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.BACKEND_WALLET_PRIVATE_KEY],
    },
  },
};