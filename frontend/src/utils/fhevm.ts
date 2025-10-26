/**
 * 🎯 简化版 FHEVM 工具（明文版本）
 * 
 * ⚠️ 注意：此版本不使用 FHE 加密，所有数据明文传输
 * 这是为了先让应用跑起来，后续会升级到完整FHE版本
 */

/**
 * 初始化 FHEVM SDK（空实现，保持接口兼容性）
 */
export async function initFhevm(): Promise<void> {
  console.log("ℹ️  简化版本：无需初始化 FHEVM SDK");
  return Promise.resolve();
}

/**
 * "加密"一个数字（实际直接返回明文）
 * 
 * @param number - 要"加密"的数字
 * @returns 原始数字（明文）
 */
export async function encryptNumber(number: number): Promise<number> {
  console.log(`📝 使用明文数字: ${number}`);
  return number;
}

/**
 * 重置 SDK 实例（空实现，保持接口兼容性）
 */
export function resetFhevmInstance(): void {
  console.log("ℹ️  简化版本：无需重置 FHEVM SDK");
}
