/**
 * FHEVM SDK 工具函数 - 使用官方推荐的 @zama-fhe/relayer-sdk
 */

// 正确的导入：使用 /web 子路径（用于浏览器环境）
// ✅ 直接导入官方的 SepoliaConfig，包含所有必需的合约地址
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

// 使用官方内置的 Sepolia 配置
const FHEVM_CONFIG = {
  ...SepoliaConfig,  // ✅ 包含所有必需字段
  networkUrl: "https://eth-sepolia.public.blastapi.io",  // 可选：自定义 RPC
};

let fhevmInstance: any = null;

/**
 * 初始化 FHEVM SDK
 */
export async function initFhevmSDK() {
  if (fhevmInstance) {
    console.log("♻️ 使用已存在的 FHEVM 实例");
    return fhevmInstance;
  }

  console.log("🔧 初始化 FHEVM SDK (官方 Relayer SDK)...");
  console.log("📡 使用官方 SepoliaConfig");
  console.log("🔑 KMS Contract Address:", FHEVM_CONFIG.kmsContractAddress);
  console.log("📋 完整配置:");
  console.log(JSON.stringify(FHEVM_CONFIG, null, 2));

  try {
    fhevmInstance = await createInstance(FHEVM_CONFIG);
    
    // 如果 SDK 需要额外的初始化步骤（查看 SDK 文档）
    if (fhevmInstance.initSDK) {
      await fhevmInstance.initSDK();
    }
    
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

