// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract NexoraIntegrity {

    address public owner;
    mapping(string => bytes32) private userDataHashes;
    mapping(string => uint256) public lastUpdated;

    event HashStored(
        string  indexed userId,
        bytes32         dataHash,
        uint256         timestamp
    );

    event HashVerified(
        string  indexed userId,
        bool            isValid,
        uint256         timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeHash(
        string  calldata userId,
        bytes32          dataHash
    ) external onlyOwner {
        userDataHashes[userId] = dataHash;
        lastUpdated[userId]    = block.timestamp;
        emit HashStored(userId, dataHash, block.timestamp);
    }

    function getHash(
        string calldata userId
    ) external view onlyOwner returns (bytes32) {
        return userDataHashes[userId];
    }

    function verifyHash(
        string  calldata userId,
        bytes32          dataHash
    ) external returns (bool) {
        bool isValid = (userDataHashes[userId] == dataHash);
        emit HashVerified(userId, isValid, block.timestamp);
        return isValid;
    }

    function hasHash(
        string calldata userId
    ) external view returns (bool) {
        return userDataHashes[userId] != bytes32(0);
    }
}