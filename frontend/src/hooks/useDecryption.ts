/**
 * 完整的解密流程 Hook
 * 处理从提交请求到获取结果的完整流程
 */

import { useState, useCallback } from 'react';
import { Contract } from 'ethers';
import RelayerClient from '../utils/relayerClient';

export type DecryptionStatus = 'idle' | 'requesting' | 'polling' | 'waiting' | 'success' | 'failed';

export interface DecryptionResult {
  gameId: number;
  target: number;
  winner: string;
  status: number;
}

export interface UseDecryptionReturn {
  requestDecryption: (gameId: number) => Promise<DecryptionResult>;
  status: DecryptionStatus;
  progress: number;
  error: string | null;
  result: DecryptionResult | null;
  reset: () => void;
}

/**
 * 使用解密功能的 Hook
 */
export function useDecryption(contract: Contract | null): UseDecryptionReturn {
  const [status, setStatus] = useState<DecryptionStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecryptionResult | null>(null);
  
  /**
   * 完整的解密请求流程
   */
  const requestDecryption = useCallback(async (gameId: number): Promise<DecryptionResult> => {
    if (!contract) {
      throw new Error('合约未初始化');
    }
    
    try {
      setStatus('requesting');
      setProgress(0);
      setError(null);
      setResult(null);
      
      console.log('🎮 开始解密游戏:', gameId);
      
      // ===== Step 1: 提交链上解密请求 =====
      setProgress(10);
      const tx = await contract.endGame(gameId);
      console.log('📝 交易已提交:', tx.hash);
      
      setProgress(20);
      const receipt = await tx.wait();
      console.log('✅ 交易已确认');
      
      // ===== Step 2: 从事件中获取 requestId =====
      setProgress(30);
      
      // 查找 DecryptionRequested 事件
      let requestId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          
          if (parsed && parsed.name === 'DecryptionRequested') {
            requestId = parsed.args.requestId;
            console.log('🔑 解密请求ID:', requestId.toString());
            break;
          }
        } catch (e) {
          // 忽略解析失败的日志
        }
      }
      
      if (!requestId) {
        throw new Error('未找到 DecryptionRequested 事件');
      }
      
      // ===== Step 3: 轮询 Gateway（关键步骤）=====
      setStatus('polling');
      console.log('⏳ 开始轮询 Gateway...');
      
      const relayerClient = new RelayerClient('sepolia');
      
      await relayerClient.pollDecryption(
        requestId,
        await contract.getAddress(),
        {
          maxAttempts: 60,  // 5分钟
          interval: 5000,   // 5秒
          onProgress: (pollProgress) => {
            // 30-80% 分配给轮询阶段
            const percentage = 30 + (pollProgress.percentage * 0.5);
            setProgress(Math.round(percentage));
            console.log(`轮询进度: ${pollProgress.current}/${pollProgress.total}`);
          }
        }
      );
      
      console.log('✅ Gateway 解密完成');
      
      // ===== Step 4: 等待链上回调完成 =====
      setStatus('waiting');
      setProgress(85);
      console.log('⏳ 等待链上回调...');
      
      await waitForCallbackCompletion(contract, gameId, (waitProgress) => {
        const percentage = 85 + (waitProgress * 0.15);
        setProgress(Math.round(percentage));
      });
      
      // ===== Step 5: 获取最终结果 =====
      setProgress(95);
      const gameInfo = await contract.getGameInfo(gameId);
      
      const decryptionResult: DecryptionResult = {
        gameId,
        target: Number(gameInfo.revealedTarget),
        winner: gameInfo.winner,
        status: Number(gameInfo.status)
      };
      
      setProgress(100);
      setStatus('success');
      setResult(decryptionResult);
      
      console.log('🎉 解密流程完成!', decryptionResult);
      
      return decryptionResult;
      
    } catch (err: any) {
      console.error('❌ 解密失败:', err);
      setStatus('failed');
      setError(err.message || '解密失败');
      throw err;
    }
  }, [contract]);
  
  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);
  
  return {
    requestDecryption,
    status,
    progress,
    error,
    result,
    reset
  };
}

/**
 * 等待链上回调完成
 */
async function waitForCallbackCompletion(
  contract: Contract,
  gameId: number,
  onProgress: (progress: number) => void
): Promise<void> {
  const MAX_WAIT = 120; // 2分钟
  const INTERVAL = 2000; // 2秒
  
  for (let i = 0; i < MAX_WAIT; i++) {
    onProgress(i / MAX_WAIT);
    
    const game = await contract.getGameInfo(gameId);
    
    // GameStatus: 0=ACTIVE, 1=DECRYPTING, 2=ENDED, 3=EXPIRED, 4=CANCELLED
    const gameStatus = Number(game.status);
    if (gameStatus === 2) { // ENDED
      console.log('✅ 回调已在链上完成');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, INTERVAL));
  }
  
  throw new Error('等待回调超时 - 请检查合约状态或重试');
}

export default useDecryption;

