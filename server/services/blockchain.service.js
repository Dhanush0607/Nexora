// services/blockchain.service.js
// Calls smart contract functions — storeHash and getHash

const { ethers }    = require('ethers');
const { getContract } = require('../config/blockchain');
const logger        = require('../utils/logger');

const BlockchainService = {

  /**
   * Store SHA-256 hash on Ethereum blockchain
   * Called after QR generation
   *
   * @param {string} userId   - MongoDB user ID
   * @param {string} hashHex  - 64 char SHA-256 hex string
   * @returns {string}        - Ethereum transaction hash
   */
  async storeHash(userId, hashHex) {
    try {
      const contract = getContract();

      // Convert hex string to bytes32 format
      const hashBytes32 = ethers.zeroPadValue('0x' + hashHex, 32);

      logger.info(`Storing hash on blockchain for user: ${userId}`);

      // Call smart contract function
      const tx = await contract.storeHash(userId, hashBytes32);

      // Wait for transaction to be mined
      logger.info(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      logger.info(`Hash stored on blockchain! TX: ${tx.hash}`);
      logger.info(`Block number: ${receipt.blockNumber}`);

      return tx.hash; // Return transaction hash

    } catch (error) {
      logger.error(`Blockchain storeHash error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Retrieve stored hash from Ethereum blockchain
   * Called during QR verification
   *
   * @param {string} userId - MongoDB user ID
   * @returns {string}      - stored hash as hex string
   */
  async getHash(userId) {
    try {
      const contract = getContract();

      // Call smart contract view function (no gas needed)
      const hashBytes32 = await contract.getHash(userId);

      // Convert bytes32 back to hex string
      const hashHex = hashBytes32.slice(2); // Remove '0x' prefix

      logger.info(`Hash retrieved from blockchain for user: ${userId}`);

      return hashHex;

    } catch (error) {
      logger.error(`Blockchain getHash error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Check if user has a hash stored on blockchain
   * @param {string} userId
   * @returns {boolean}
   */
  async hasHash(userId) {
    try {
      const contract = getContract();
      return await contract.hasHash(userId);
    } catch (error) {
      logger.error(`Blockchain hasHash error: ${error.message}`);
      return false;
    }
  },

};

module.exports = BlockchainService;