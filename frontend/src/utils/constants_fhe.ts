/**
 * FHE Version Constants Configuration
 */

// FHE Contract Address (GuessGameFHE_v3 - Upgraded)
export const CONTRACT_ADDRESS_FHE = "0x5abEb1f463419F577ab51939DF978e7Ef14d5325";

// FHE Contract ABI (GuessGameFHE_v3)
export const CONTRACT_ABI_FHE = [
  // Create Game (requires einput + proof)
  "function createGame(bytes memory encryptedTarget, bytes memory inputProof, uint256 entryFee) external payable returns (uint256)",
  
  // Join Game (requires einput + proof)
  "function joinGame(uint256 gameId, bytes memory encryptedGuess, bytes memory inputProof) external payable",
  
  // End Game (triggers ciphertext computation and Gateway decryption)
  "function endGame(uint256 gameId) external",
  
  // ✨ V3 New: Retry Decryption
  "function retryDecryption(uint256 gameId) external returns (uint256)",
  
  // ✨ V3 New: Cancel Expired Game
  "function cancelExpiredGame(uint256 gameId) external",
  
  // ✨ V3 New: Emergency Resolve (Owner only)
  "function emergencyResolve(uint256 gameId, uint32 target, uint32[] calldata guesses) external",
  
  // Query Functions
  "function getGameInfo(uint256 gameId) external view returns (uint256 id, address owner, uint256 entryFee, uint256 prizePool, uint256 playerCount, uint8 status, address winner, uint32 revealedTarget, uint256 createdAt)",
  "function getPlayers(uint256 gameId) external view returns (address[] memory)",
  "function getRevealedGuess(uint256 gameId, address player) external view returns (uint32)",
  "function getTotalGames() external view returns (uint256)",
  "function hasPlayerGuessed(uint256 gameId, address player) external view returns (bool)",
  
  // ✨ V3 New: Get Decryption Status
  "function getDecryptionStatus(uint256 gameId) external view returns (uint256 requestId, uint256 timestamp, uint8 retryCount, bool processed, uint8 status)",
  
  // Constants
  "function CALLBACK_GAS_LIMIT() external view returns (uint256)",
  "function REQUEST_TIMEOUT() external view returns (uint256)",
  "function MAX_RETRIES() external view returns (uint8)",
  
  // Events
  "event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp)",
  "event DecryptionRequested(uint256 indexed requestId, uint256 indexed gameId, uint256 timestamp, address requester)",
  "event DecryptionCompleted(uint256 indexed requestId, uint256 indexed gameId, uint32 target, address winner)",
  "event DecryptionFailed(uint256 indexed requestId, uint256 indexed gameId, string reason)",
  "event DecryptionRetrying(uint256 indexed gameId, uint256 oldRequestId, uint256 newRequestId, uint8 retryCount)",
  "event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize, uint32 target, uint256 timestamp)",
  "event GameExpired(uint256 indexed gameId, uint256 timestamp)",
  "event EmergencyResolved(uint256 indexed gameId, address resolver, address winner)",
];

// Game Status Enum (V3 - Updated with 5 states)
export enum GameStatusFHE {
  ACTIVE = 0,      // Game is active
  DECRYPTING = 1,  // Waiting for Gateway decryption
  ENDED = 2,       // Game has ended
  EXPIRED = 3,     // Game expired (timeout)
  CANCELLED = 4,   // Game cancelled
}

// FHE Game Status Text
export const GAME_STATUS_TEXT_FHE: Record<GameStatusFHE, string> = {
  [GameStatusFHE.ACTIVE]: "Active",
  [GameStatusFHE.DECRYPTING]: "Decrypting...",
  [GameStatusFHE.ENDED]: "Ended",
  [GameStatusFHE.EXPIRED]: "Expired",
  [GameStatusFHE.CANCELLED]: "Cancelled",
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

