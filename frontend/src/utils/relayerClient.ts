/**
 * Relayer Client - Gateway Polling Client
 * Based on best practices from Zama award-winning projects
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
   * Poll Gateway decryption result (core functionality)
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
    
    console.log('🔐 Starting Gateway decryption polling...', {
      requestId: requestId.toString(),
      contractAddress,
      maxAttempts,
      estimatedTime: `${(maxAttempts * interval) / 1000} seconds`
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
        
        // Successfully got decryption result
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gateway decryption completed (attempt ${attempt})`, data);
          return {
            success: true,
            data,
            attempts: attempt
          };
        }
        
        // 404 means not ready yet
        if (response.status === 404) {
          console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Decryption not ready yet...`);
        } else {
          console.warn(`⚠️ Gateway returned abnormal status: ${response.status}`);
        }
        
      } catch (error: any) {
        console.warn(`⚠️ Polling attempt ${attempt} failed:`, error.message);
      }
      
      // Wait for next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Timeout
    throw new Error(
      `Gateway decryption timeout (attempted ${maxAttempts} times, total ${(maxAttempts * interval) / 1000} seconds)`
    );
  }
  
  /**
   * Check Gateway health status
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
      console.warn('⚠️ Gateway health check failed:', error);
      return false;
    }
  }
  
  /**
   * Get current network configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

export default RelayerClient;

