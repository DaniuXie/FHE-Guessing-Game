/**
 * Complete Decryption Flow Hook
 * Handles the complete flow from submitting request to getting result
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
   * Hook for using decryption functionality
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
      throw new Error('Contract not initialized');
    }
    
    try {
      setStatus('requesting');
      setProgress(0);
      setError(null);
      setResult(null);
      
      console.log('🎮 Starting game decryption:', gameId);
      
      // ===== Step 1: Submit on-chain decryption request =====
      setProgress(10);
      const tx = await contract.endGame(gameId);
      console.log('📝 Transaction submitted:', tx.hash);
      
      setProgress(20);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed');
      
      // ===== Step 2: Get requestId from events =====
      setProgress(30);
      
      // Find DecryptionRequested event
      let requestId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          
          if (parsed && parsed.name === 'DecryptionRequested') {
            requestId = parsed.args.requestId;
            console.log('🔑 Decryption request ID:', requestId.toString());
            break;
          }
        } catch (e) {
          // Ignore parsing failures
        }
      }
      
      if (!requestId) {
        throw new Error('DecryptionRequested event not found');
      }
      
      // ===== Step 3: Poll Gateway (critical step) =====
      setStatus('polling');
      console.log('⏳ Starting Gateway polling...');
      
      const relayerClient = new RelayerClient('sepolia');
      
      await relayerClient.pollDecryption(
        requestId,
        await contract.getAddress(),
        {
          maxAttempts: 60,  // 5 minutes
          interval: 5000,   // 5 seconds
          onProgress: (pollProgress) => {
            // 30-80% allocated to polling phase
            const percentage = 30 + (pollProgress.percentage * 0.5);
            setProgress(Math.round(percentage));
            console.log(`Polling progress: ${pollProgress.current}/${pollProgress.total}`);
          }
        }
      );
      
      console.log('✅ Gateway decryption completed');
      
      // ===== Step 4: Wait for on-chain callback completion =====
      setStatus('waiting');
      setProgress(85);
      console.log('⏳ Waiting for on-chain callback...');
      
      await waitForCallbackCompletion(contract, gameId, (waitProgress) => {
        const percentage = 85 + (waitProgress * 0.15);
        setProgress(Math.round(percentage));
      });
      
      // ===== Step 5: Get final result =====
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
      
      console.log('🎉 Decryption flow completed!', decryptionResult);
      
      return decryptionResult;
      
    } catch (err: any) {
      console.error('❌ Decryption failed:', err);
      setStatus('failed');
      setError(err.message || 'Decryption failed');
      throw err;
    }
  }, [contract]);
  
  /**
   * Reset state
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
 * Wait for on-chain callback completion
 */
async function waitForCallbackCompletion(
  contract: Contract,
  gameId: number,
  onProgress: (progress: number) => void
): Promise<void> {
  const MAX_WAIT = 120; // 2 minutes
  const INTERVAL = 2000; // 2 seconds
  
  for (let i = 0; i < MAX_WAIT; i++) {
    onProgress(i / MAX_WAIT);
    
    const game = await contract.getGameInfo(gameId);
    
    // GameStatus: 0=ACTIVE, 1=DECRYPTING, 2=ENDED, 3=EXPIRED, 4=CANCELLED
    const gameStatus = Number(game.status);
    if (gameStatus === 2) { // ENDED
      console.log('✅ Callback completed on-chain');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, INTERVAL));
  }
  
  throw new Error('Callback timeout - Please check contract status or retry');
}

export default useDecryption;

