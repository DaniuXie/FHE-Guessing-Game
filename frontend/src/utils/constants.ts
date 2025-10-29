/**
 * Application Constants Configuration
 */

// Sepolia Network Configuration (Simplified Version)
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = "https://eth-sepolia.public.blastapi.io";

// 🎯 Simplified Contract Address (Plaintext Version - GuessGameSimple)
// 🆕 Redeployed: 2025-10-29 (Fresh contract for Netlify deployment)
export const CONTRACT_ADDRESS = "0x5AF7bB5030A6cCF5BA09315987E4480B40421a57";

// 🎯 Simplified Contract ABI (Plaintext Version)
export const CONTRACT_ABI = [
  "function createGame(uint32 targetNumber, uint256 entryFee) external payable returns (uint256)",
  "function joinGame(uint256 gameId, uint32 guess) external payable",
  "function endGame(uint256 gameId) external",
  "function getGameInfo(uint256 gameId) external view returns (uint256 id, uint32 target, address owner, uint256 entryFee, uint256 prizePool, uint256 playerCount, uint8 status, address winner, uint256 createdAt)",
  "function getPlayers(uint256 gameId) external view returns (address[] memory)",
  "function getPlayerGuess(uint256 gameId, address player) external view returns (uint32)",
  "function hasPlayerGuessed(uint256 gameId, address player) external view returns (bool)",
  "function getTotalGames() external view returns (uint256)",
  "event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp)",
  "event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize, uint256 timestamp)",
];

// Game Status Enum (Simplified: Active and Ended only)
export enum GameStatus {
  ACTIVE = 0,
  ENDED = 1,
}

// Game Status Text
export const GAME_STATUS_TEXT: Record<GameStatus, string> = {
  [GameStatus.ACTIVE]: "Active",
  [GameStatus.ENDED]: "Ended",
};

// Network Configuration
export const SEPOLIA_NETWORK = {
  chainId: "0xaa36a7", // 11155111 in hex
  chainName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
};

// Application Configuration
export const APP_CONFIG = {
  MIN_GUESS: 1,
  MAX_GUESS: 100,
  MIN_ENTRY_FEE: "0.0001", // ETH
  MAX_ENTRY_FEE: "1", // ETH
  GAME_REFRESH_INTERVAL: 30000, // 30 seconds
};
