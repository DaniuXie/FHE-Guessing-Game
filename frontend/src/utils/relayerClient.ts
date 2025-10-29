/**
 * Relayer Client - Gateway 轮询客户端
 * 基于 Zama 获奖项目最佳实践
 */

// Relayer 配置
const RELAYER_CONFIG = {
  sepolia: {
    url: 'https://gateway.sepolia.zama.ai/v1/public-decrypt',
    chainId: 11155111
  },
  local: {
    url: 'http://localhost:8545',
    chainId: 31337
  }
};

export type NetworkType = 'sepolia' | 'local';

export interface PollOptions {
  maxAttempts?: number;
  interval?: number;
  onProgress?: (progress: { current: number; total: number; percentage: number }) => void;
}

export interface PollResult {
  success: boolean;
  data?: any;
  attempts: number;
}

export class RelayerClient {
  private config: { url: string; chainId: number };
  
  constructor(network: NetworkType = 'sepolia') {
    const configForNetwork = RELAYER_CONFIG[network];
    if (!configForNetwork) {
      throw new Error(`Unsupported network: ${network}`);
    }
    this.config = configForNetwork;
  }
  
  /**
   * 轮询 Gateway 解密结果（核心功能）
   */
  async pollDecryption(
    requestId: string | bigint,
    contractAddress: string,
    options: PollOptions = {}
  ): Promise<PollResult> {
    const {
      maxAttempts = 60,      // 5分钟（60次 * 5秒）
      interval = 5000,       // 5秒一次
      onProgress = null
    } = options;
    
    console.log('🔐 开始轮询 Gateway 解密...', {
      requestId: requestId.toString(),
      contractAddress,
      maxAttempts,
      estimatedTime: `${(maxAttempts * interval) / 1000}秒`
    });
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 调用进度回调
        if (onProgress) {
          onProgress({
            current: attempt,
            total: maxAttempts,
            percentage: Math.round((attempt / maxAttempts) * 100)
          });
        }
        
        // 转换 requestId 为十六进制字符串
        const handleHex = typeof requestId === 'bigint' 
          ? `0x${requestId.toString(16)}`
          : requestId.toString().startsWith('0x')
            ? requestId.toString()
            : `0x${BigInt(requestId).toString(16)}`;
        
        // 请求 Gateway
        const response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            handle: handleHex,
            contractAddress: contractAddress,
            chainId: this.config.chainId
          })
        });
        
        // 成功获取解密结果
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gateway 解密完成（第 ${attempt} 次尝试）`, data);
          return {
            success: true,
            data,
            attempts: attempt
          };
        }
        
        // 404 表示还未准备好
        if (response.status === 404) {
          console.log(`⏳ 尝试 ${attempt}/${maxAttempts}：解密尚未完成...`);
        } else {
          console.warn(`⚠️ Gateway 返回异常状态: ${response.status}`);
        }
        
      } catch (error: any) {
        console.warn(`⚠️ 轮询尝试 ${attempt} 失败:`, error.message);
      }
      
      // 等待下一次尝试
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // 超时
    throw new Error(
      `Gateway 解密超时（已尝试 ${maxAttempts} 次，共 ${(maxAttempts * interval) / 1000}秒）`
    );
  }
  
  /**
   * 检查 Gateway 健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const baseUrl = this.config.url.replace('/v1/public-decrypt', '');
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Gateway 健康检查失败:', error);
      return false;
    }
  }
  
  /**
   * 获取当前网络配置
   */
  getConfig() {
    return { ...this.config };
  }
}

export default RelayerClient;

