/**
 * FHEVM SDK Utility Functions - Using official @zama-fhe/relayer-sdk
 */

// 正确的导入：使用 /web 子路径（用于浏览器环境）
import { createInstance } from "@zama-fhe/relayer-sdk/web";

// ✅ 修复：使用正确的 Sepolia 配置（基于最新的 Zama 文档）
const FHEVM_CONFIG = {
  // 链配置
  chainId: 11155111,
  network: "https://eth-sepolia.public.blastapi.io",
  networkUrl: "https://eth-sepolia.public.blastapi.io",
  
  // Gateway 配置（正确的 URL）
  gatewayUrl: "https://gateway.sepolia.zama.ai",
  
  // 合约地址（Sepolia Coprocessor 官方地址）
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  
  // ✅ 补充：验证合约地址（必需！）
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  
  // Gateway Chain ID
  gatewayChainId: 55815,
  
  // 公钥端点（重要！）
  publicKeyUrl: "https://gateway.sepolia.zama.ai/v1/public-key",
};

let fhevmInstance: any = null;

/**
 * 从 Gateway 获取公钥
 */
async function fetchPublicKey() {
  try {
    console.log("🔑 Fetching public key from Gateway...");
    const response = await fetch(FHEVM_CONFIG.publicKeyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const publicKeyData = await response.json();
    console.log("✅ Public key fetched successfully");
    console.log("   Public Key ID:", publicKeyData.publicKeyId || "N/A");
    
    return publicKeyData;
  } catch (error) {
    console.error("❌ Failed to fetch public key:", error);
    throw new Error(`Failed to fetch public key: ${error}`);
  }
}

/**
 * Initialize FHEVM SDK
 */
export async function initFhevmSDK() {
  if (fhevmInstance) {
    console.log("♻️ Using existing FHEVM instance");
    return fhevmInstance;
  }

  console.log("🔧 Initializing FHEVM SDK (fixed configuration)...");
  console.log("📡 Gateway URL:", FHEVM_CONFIG.gatewayUrl);
  console.log("🔑 Public Key URL:", FHEVM_CONFIG.publicKeyUrl);
  console.log("🏠 KMS Contract:", FHEVM_CONFIG.kmsContractAddress);

  try {
    // Step 1: Fetch public key
    const publicKeyData = await fetchPublicKey();
    
    // Step 2: Create complete config with public key
    const configWithPublicKey = {
      ...FHEVM_CONFIG,
      publicKey: publicKeyData.publicKey,
      publicKeyId: publicKeyData.publicKeyId,
    };
    
    console.log("📋 Creating instance with configuration (including public key)");
    
    // Step 3: Create instance
    fhevmInstance = await createInstance(configWithPublicKey);
    
    console.log("✅ FHEVM SDK initialized successfully");
    return fhevmInstance;
  } catch (error) {
    console.error("❌ FHEVM SDK initialization failed:", error);
    throw error;
  }
}

/**
 * Get initialized instance
 */
export function getInstance() {
  if (!fhevmInstance) {
    throw new Error("FHEVM SDK not initialized - Please call initFhevmSDK() first");
  }
  return fhevmInstance;
}

/**
 * Encrypt number and generate proof (Official SDK API)
 * @param number Number to encrypt
 * @param contractAddress Contract address
 * @param userAddress User address
 * @returns handle and proof
 */
export async function encryptNumber(
  number: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  console.log(`🔐 Encrypting number: ${number}`);

  try {
    // Ensure SDK is initialized
    const instance = await initFhevmSDK();

    // Create encrypted input (official API)
    const encInput = instance.createEncryptedInput(contractAddress, userAddress);
    
    // Add uint32 number
    encInput.add32(number);

    // Encrypt and generate proof
    const encrypted = await encInput.encrypt();

    console.log("✅ Encryption completed");
    console.log("   Handle:", encrypted.handle || encrypted.handles?.[0]);
    console.log("   Proof length:", encrypted.proof?.length || encrypted.inputProof?.length);

    // Adjust based on actual SDK return format
    return {
      handle: encrypted.handle || encrypted.handles?.[0] || "",
      proof: encrypted.proof || encrypted.inputProof || "",
    };
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error(
      `Failed to encrypt number: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check Gateway status
 */
export async function checkGatewayStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${FHEVM_CONFIG.gatewayUrl}/health`);
    return response.ok;
  } catch (error) {
    console.error("Gateway health check failed:", error);
    return false;
  }
}

