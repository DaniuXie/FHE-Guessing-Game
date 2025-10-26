/**
 * FHE Version Constants Configuration
 */

// FHE Contract Address
export const CONTRACT_ADDRESS_FHE = "0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3";

// FHE Contract ABI (GuessGameFHE_v2)
export const CONTRACT_ABI_FHE = [
  // Create Game (requires einput + proof)
  "function createGame(bytes memory encryptedTarget, bytes memory inputProof, uint256 entryFee) external payable returns (uint256)",
  
  // Join Game (requires einput + proof)
  "function joinGame(uint256 gameId, bytes memory encryptedGuess, bytes memory inputProof) external payable",
  
  // End Game (triggers ciphertext computation and Gateway decryption)
  "function endGame(uint256 gameId) external",
  
  // Query Functions
  "function getGameInfo(uint256 gameId) external view returns (uint256 id, address owner, uint256 entryFee, uint256 prizePool, uint256 playerCount, uint8 status, address winner, uint32 revealedTarget, uint256 createdAt)",
  "function getPlayers(uint256 gameId) external view returns (address[] memory)",
  "function getRevealedGuess(uint256 gameId, address player) external view returns (uint32)",
  "function getTotalGames() external view returns (uint256)",
  "function hasPlayerGuessed(uint256 gameId, address player) external view returns (bool)",
  
  // Events
  "event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp)",
  "event DecryptionRequested(uint256 indexed gameId, uint256 requestId, uint256 timestamp)",
  "event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize, uint32 target, uint256 timestamp)",
];

// Game Status Enum
export enum GameStatusFHE {
  ACTIVE = 0,      // Game is active
  DECRYPTING = 1,  // Waiting for Gateway decryption
  ENDED = 2,       // Game has ended
}

// FHE Game Status Text
export const GAME_STATUS_TEXT_FHE: Record<GameStatusFHE, string> = {
  [GameStatusFHE.ACTIVE]: "Active",
  [GameStatusFHE.DECRYPTING]: "Decrypting...",
  [GameStatusFHE.ENDED]: "Ended",
};

// FHEVM Configuration (Sepolia Coprocessor Mode)
export const FHEVM_CONFIG = {
  chainId: 11155111,
  networkUrl: "https://eth-sepolia.public.blastapi.io",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c", // Sepolia ACL Address
  kmsVerifierAddress: "0x687820221192C5B662b25367F70076A37bc79b6c", // KMS Verifier (usually same as ACL)
};

// Sepolia Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = "https://eth-sepolia.public.blastapi.io";

// Application Configuration
export const APP_CONFIG = {
  GAME_REFRESH_INTERVAL: 10000, // 10 seconds
  DECRYPTION_CHECK_INTERVAL: 5000, // Decryption status check interval
  MAX_DECRYPTION_WAIT: 120000, // Maximum decryption wait time (2 minutes)
};

