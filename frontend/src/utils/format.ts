/**
 * 格式化工具函数
 */

/**
 * 格式化地址为缩写形式
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 格式化ETH金额
 */
export function formatEther(wei: bigint | string): string {
  try {
    const weiValue = typeof wei === "string" ? BigInt(wei) : wei;
    const ether = Number(weiValue) / 1e18;
    return ether.toFixed(4);
  } catch {
    return "0.0000";
  }
}

/**
 * 格式化时间戳为本地时间
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const date = new Date(ts * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const now = Date.now();
  const diff = now - ts * 1000;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
}

/**
 * 验证数字范围
 */
export function validateNumber(
  value: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  const num = parseInt(value);
  
  if (isNaN(num)) {
    return { valid: false, error: "请输入有效的数字" };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `数字必须在 ${min} 到 ${max} 之间` };
  }
  
  return { valid: true };
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}


