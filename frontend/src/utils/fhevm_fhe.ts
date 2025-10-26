/**
 * FHEVM SDK 工具函数 - 完整FHE版本
 * 使用 fhevmjs 最新版本
 */

import { createInstance, FhevmInstance } from "fhevmjs";

// Sepolia + fhEVM Coprocessor 配置
const FHEVM_CONFIG = {
  chainId: 11155111,
  networkUrl: "https://eth-sepolia.public.blastapi.io",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
};

let fhevmInstance: FhevmInstance | null = null;

/**
 * 初始化 FHEVM SDK
 */
export async function initFhevmSDK(): Promise<FhevmInstance> {
  if (fhevmInstance) {
    console.log("♻️ 使用已存在的 FHEVM 实例");
    return fhevmInstance;
  }

  console.log("🔧 初始化 FHEVM SDK...");
  console.log("📡 配置:", FHEVM_CONFIG);

  try {
    // fhevmjs@0.5.8 不需要 initFhevm()，直接创建实例
    fhevmInstance = await createInstance(FHEVM_CONFIG);
    
    console.log("✅ FHEVM SDK 初始化成功");
    return fhevmInstance;
  } catch (error) {
    console.error("❌ FHEVM SDK 初始化失败:", error);
    throw error;
  }
}

/**
 * 加密数字并生成证明
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

    // 创建加密输入
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    
    // 添加 uint32 类型的数字
    input.add32(number);

    // 加密并生成证明
    const encryptedInput = input.encrypt();

    console.log("✅ 加密完成");
    console.log("   Handle:", encryptedInput.handles[0]);
    console.log("   Proof length:", encryptedInput.inputProof.length);

    return {
      handle: encryptedInput.handles[0],
      proof: encryptedInput.inputProof,
    };
  } catch (error) {
    console.error("❌ 加密失败:", error);
    throw new Error(`加密数字失败: ${error instanceof Error ? error.message : String(error)}`);
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

/**
 * 获取公钥
 */
export async function getPublicKey(): Promise<string> {
  try {
    const instance = await initFhevmSDK();
    // @ts-ignore - API可能不完全一致
    return instance.getPublicKey?.() || "";
  } catch (error) {
    console.error("获取公钥失败:", error);
    return "";
  }
}
