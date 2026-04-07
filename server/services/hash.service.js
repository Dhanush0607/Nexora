//SHA-256 hashing - creates a fingerprint of encrypted data
//this hash gets stored on the Ethereum blockchain
const crypto = require('crypto');


const HashService = {
    //generates SHA-256 hash from a string
    //Input: Concatenated ciphertext values
    //output:64-character hex string (32bytes)

    generateHash(data){
        return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
    },
    //converts hex string to bytes32 format for ethereum
    //ethereum smart contract expects bytes32
    hexToBytes32(hexString){
        //pad to 64 characters (32 bytes) if needed
        const padded = hexString.padStart(64,'0');
        return '0x' + padded;
    },

};

module.exports = HashService;