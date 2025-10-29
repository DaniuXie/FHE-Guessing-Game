/**
 * FHEVM SDK 工具函数 - 使用官方推荐的 @zama-fhe/relayer-sdk
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
    console.log("🔑 正在从 Gateway 获取公钥...");
    const response = await fetch(FHEVM_CONFIG.publicKeyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const publicKeyData = await response.json();
    console.log("✅ 公钥获取成功");
    console.log("   Public Key ID:", publicKeyData.publicKeyId || "N/A");
    
    return publicKeyData;
  } catch (error) {
    console.error("❌ 获取公钥失败:", error);
    throw new Error(`Failed to fetch public key: ${error}`);
  }
}

/**
 * 初始化 FHEVM SDK
 */
export async function initFhevmSDK() {
  if (fhevmInstance) {
    console.log("♻️ 使用已存在的 FHEVM 实例");
    return fhevmInstance;
  }

  console.log("🔧 初始化 FHEVM SDK (修复版配置)...");
  console.log("📡 Gateway URL:", FHEVM_CONFIG.gatewayUrl);
  console.log("🔑 Public Key URL:", FHEVM_CONFIG.publicKeyUrl);
  console.log("🏠 KMS Contract:", FHEVM_CONFIG.kmsContractAddress);

  try {
    // 步骤 1: 获取公钥
    const publicKeyData = await fetchPublicKey();
    
    // 步骤 2: 创建包含公钥的完整配置
    const configWithPublicKey = {
      ...FHEVM_CONFIG,
      publicKey: publicKeyData.publicKey,
      publicKeyId: publicKeyData.publicKeyId,
    };
    
    console.log("📋 使用配置创建实例（含公钥）");
    
    // 步骤 3: 创建实例
    fhevmInstance = await createInstance(configWithPublicKey);
    
    console.log("✅ FHEVM SDK 初始化成功");
    return fhevmInstance;
  } catch (error) {
    console.error("❌ FHEVM SDK 初始化失败:", error);
    throw error;
  }
}

/**
 * 获取已初始化的实例
 */
export function getInstance() {
  if (!fhevmInstance) {
    throw new Error("FHEVM SDK 未初始化 - 请先调用 initFhevmSDK()");
  }
  return fhevmInstance;
}

/**
 * 加密数字并生成证明（官方 SDK API）
 * @param number 要加密的数字
 * @param contractAddress 合约地址
 * @param userAddress 用户地址
 * @returns handle 和 proof
 */
export async function encryptNumber(
  number: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  console.log(`🔐 加密数字: ${number}`);

  try {
    // 确保 SDK 已初始化
    const instance = await initFhevmSDK();

    // 创建加密输入（官方 API）
    const encInput = instance.createEncryptedInput(contractAddress, userAddress);
    
    // 添加 uint32 类型的数字
    encInput.add32(number);

    // 加密并生成证明
    const encrypted = await encInput.encrypt();

    console.log("✅ 加密完成");
    console.log("   Handle:", encrypted.handle || encrypted.handles?.[0]);
    console.log("   Proof length:", encrypted.proof?.length || encrypted.inputProof?.length);

    // 根据实际 SDK 返回的格式调整
    return {
      handle: encrypted.handle || encrypted.handles?.[0] || "",
      proof: encrypted.proof || encrypted.inputProof || "",
    };
  } catch (error) {
    console.error("❌ 加密失败:", error);
    throw new Error(
      `加密数字失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 检查 Gateway 状态
 */
export async function checkGatewayStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${FHEVM_CONFIG.gatewayUrl}/health`);
    return response.ok;
  } catch (error) {
    console.error("Gateway 健康检查失败:", error);
    return false;
  }
}

