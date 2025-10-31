/**
 * Shared configuration for Netlify Functions
 */

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0x5AF7bB5030A6cCF5BA09315987E4480B40421a57';

// Contract ABI (minimal - only what we need)
const CONTRACT_ABI = [
  "function getTotalGames() view returns (uint256)",
  "function getGameInfo(uint256 gameId) view returns (uint256 id, uint256 target, address owner, uint256 entryFee, uint256 prizePool, uint256 playerCount, uint8 status, address winner, uint256 createdAt)"
];

// RPC endpoints with fallback
const RPC_ENDPOINTS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://eth-sepolia.public.blastapi.io',
  'https://sepolia.gateway.tenderly.co'
];

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Create contract instance with fallback RPC
 */
async function getContract() {
  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true,
        batchMaxCount: 1
      });
      
      // Test connection
      await provider.getNetwork();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      return { contract, provider, rpcUrl };
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error('All RPC endpoints failed');
}

/**
 * Success response
 */
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true, ...data })
  };
}

/**
 * Error response
 */
function errorResponse(message, statusCode = 500) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message })
  };
}

module.exports = {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  RPC_ENDPOINTS,
  CORS_HEADERS,
  getContract,
  successResponse,
  errorResponse
};


