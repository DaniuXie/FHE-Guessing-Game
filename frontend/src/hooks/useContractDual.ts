/**
 * Smart Contract Interaction Hook (Dual Contract Version)
 * Supports Scheme B (Plaintext) and Scheme A (FHE)
 */

import { useState, useCallback, useMemo } from "react";
import { Contract, parseEther } from "ethers";
import { 
  CONTRACT_ADDRESS, 
  CONTRACT_ABI, 
  GameStatus 
} from "../utils/constants";
import {
  CONTRACT_ADDRESS_FHE,
  CONTRACT_ABI_FHE,
  GameStatusFHE,
} from "../utils/constants_fhe";
import { encryptNumber as encryptNumberSimple } from "../utils/fhevm";
// 使用官方推荐的 SDK
import { encryptNumber as encryptNumberFHE, initFhevmSDK } from "../utils/fhevm_fhe_official";
import { useWallet } from "./useWallet";
import { useContractType } from "../contexts/ContractContext";

export interface GameInfo {
  gameId: number;
  targetNumber?: number;  // 仅方案B可用
  owner: string;
  entryFee: bigint;
  prizePool: bigint;
  playerCount: number;
  status: GameStatus | GameStatusFHE;
  winner: string;
  createdAt: number;
  revealedTarget?: number;  // FHE解密后的目标数字
}

export function useContract() {
  const { provider, address } = useWallet();
  const { contractType } = useContractType();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 根据合约类型选择地址和ABI
  const contractAddress = useMemo(
    () => (contractType === "fhe" ? CONTRACT_ADDRESS_FHE : CONTRACT_ADDRESS),
    [contractType]
  );

  const contractABI = useMemo(
    () => (contractType === "fhe" ? CONTRACT_ABI_FHE : CONTRACT_ABI),
    [contractType]
  );

  // 创建合约实例
  const contract = useMemo(() => {
    if (!provider || !address) return null;
    return new Contract(contractAddress, contractABI, provider);
  }, [provider, address, contractAddress, contractABI]);

  // 🎯 Create game
  const createGame = useCallback(
    async (targetNumber: number, entryFeeEth: string) => {
      if (!contract || !address || !provider) {
        throw new Error("Please connect wallet first");
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🎮 Creating game [${contractType === "fhe" ? "FHE" : "Plaintext"}]...`);
        console.log("   Target number:", targetNumber);
        console.log("   Entry fee:", entryFeeEth, "ETH");
        console.log("🔍 Contract address:", contractAddress);
        console.log("🔍 User address:", address);

        // ethers v6: getSigner() gets default signer
        const signer = await provider.getSigner();
        console.log("✅ Signer obtained");
        const signerAddress = await signer.getAddress();
        console.log("   Signer address:", signerAddress);
        
        // Ensure signer address matches connected address
        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error(`Address mismatch: signer=${signerAddress}, expected=${address}`);
        }
        
        const contractWithSigner = contract.connect(signer);
        console.log("✅ Contract connected to signer");
        const entryFee = parseEther(entryFeeEth);
        console.log("✅ Entry fee converted:", entryFee.toString());

        let tx;

        if (contractType === "fhe") {
          // Scheme A: FHE encryption (using official Relayer SDK)
          console.log("🔐 Using FHE encryption (official SDK /web)...");
          
          // Ensure FHEVM SDK is initialized
          await initFhevmSDK();
          
          // ✅ Follow manual 3.5: createEncryptedInput → add32 → encrypt
          const { handle, proof } = await encryptNumberFHE(
            targetNumber,
            contractAddress,
            address
          );
          
          console.log("✅ Encryption completed");
          console.log("   Handle:", handle);
          console.log("   Proof length:", proof.length);
          
          tx = await contractWithSigner.createGame(
            handle,
            proof,
            entryFee,
            { value: entryFee }
          );
        } else {
          // Scheme B: Plaintext
          console.log("📝 Using plaintext mode...");
          const plainNumber = await encryptNumberSimple(targetNumber);
          console.log("🔍 Preparing to call contract createGame:");
          console.log("   - Target number (uint32):", plainNumber, typeof plainNumber);
          console.log("   - Entry fee (uint256):", entryFee.toString(), "wei");
          console.log("   - msg.value:", entryFee.toString(), "wei");
          console.log("   - Contract address:", contractWithSigner.target);
          
          // Build transaction object
          const txParams = {
            value: entryFee,
            gasLimit: 200000, // Manually set Gas Limit to avoid estimation
          };
          
          console.log("   - Transaction params:", JSON.stringify({
            value: txParams.value.toString(),
            gasLimit: txParams.gasLimit
          }));
          
          console.log("⏳ Calling createGame, waiting for MetaMask confirmation...");
          
          try {
            tx = await contractWithSigner.createGame(plainNumber, entryFee, txParams);
            console.log("✅ MetaMask confirmation completed, transaction sent:", tx.hash);
          } catch (txError: any) {
            console.error("❌ Transaction sending failed:", txError);
            console.error("   Error code:", txError.code);
            console.error("   Error message:", txError.message);
            if (txError.reason) {
              console.error("   Revert reason:", txError.reason);
            }
            if (txError.data) {
              console.error("   Error data:", txError.data);
            }
            throw txError;
          }
        }

        console.log("⏳ Waiting for transaction confirmation...", tx.hash);
        const receipt = await tx.wait();

        console.log("✅ Game created successfully!");

        // 解析事件获取游戏ID
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === "GameCreated";
          } catch {
            return false;
          }
        });

        let gameId = 0;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          gameId = Number(parsed?.args?.gameId || 0);
        } else {
          gameId = Number(await contract.getTotalGames());
        }

        setLoading(false);
        return { success: true, gameId, txHash: receipt.transactionHash };
      } catch (err: any) {
        console.error("❌ 创建游戏失败:", err);
        const errorMsg = err.message || "创建游戏失败";
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [contract, address, provider, contractType, contractAddress]
  );

  // 🎯 加入游戏
  const joinGame = useCallback(
    async (gameId: number, guess: number) => {
      if (!contract || !address || !provider) {
        throw new Error("请先连接钱包");
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🎯 加入游戏 [${contractType === "fhe" ? "FHE" : "明文"}]...`);
        console.log("   游戏ID:", gameId);
        console.log("   猜测:", guess);

        // 获取游戏信息（入场费）
        const gameInfo = await contract.getGameInfo(gameId);
        const entryFee = gameInfo.entryFee;

        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);

        let tx;

        if (contractType === "fhe") {
          // 方案A：FHE 加密（使用官方 Relayer SDK）
          console.log("🔐 使用 FHE 加密猜测（官方 SDK /web）...");
          
          // 确保 FHEVM SDK 已初始化
          await initFhevmSDK();
          
          const { handle, proof } = await encryptNumberFHE(
            guess,
            contractAddress,
            address
          );

          tx = await contractWithSigner.joinGame(
            gameId,
            handle,
            proof,
            { value: entryFee }
          );
        } else {
          // 方案B：明文
          console.log("📝 使用明文猜测...");
          const plainGuess = await encryptNumberSimple(guess);
          tx = await contractWithSigner.joinGame(gameId, plainGuess, {
            value: entryFee,
          });
        }

        console.log("⏳ 等待交易确认...", tx.hash);
        await tx.wait();

        console.log("✅ 加入游戏成功!");

        setLoading(false);
        return { success: true, txHash: tx.hash };
      } catch (err: any) {
        console.error("❌ 加入游戏失败:", err);
        const errorMsg = err.message || "加入游戏失败";
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [contract, address, provider, contractType, contractAddress]
  );

  // 🎯 结束游戏
  const endGame = useCallback(
    async (gameId: number) => {
      if (!contract || !address || !provider) {
        throw new Error("请先连接钱包");
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🏁 结束游戏...");
        console.log("   游戏ID:", gameId);

        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);

        const tx = await contractWithSigner.endGame(gameId);

        console.log("⏳ 等待交易确认...", tx.hash);
        await tx.wait();

        console.log("✅ 游戏结束成功!");

        if (contractType === "fhe") {
          console.log("⏳ FHE模式：等待 Gateway 解密中...");
        }

        setLoading(false);
        return { success: true, txHash: tx.hash };
      } catch (err: any) {
        console.error("❌ 结束游戏失败:", err);
        const errorMsg = err.message || "结束游戏失败";
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [contract, address, provider, contractType]
  );

  // 获取游戏信息
  const getGameInfo = useCallback(
    async (gameId: number): Promise<GameInfo | null> => {
      if (!contract) {
        console.error("❌ getGameInfo: contract 为 null");
        return null;
      }

      try {
        console.log("🔍 开始获取游戏信息，gameId=", gameId);
        const info = await contract.getGameInfo(gameId);
        console.log("📊 原始数据", info);

        // 验证数据完整性
        if (!info || !info.owner || info.owner === "0x0000000000000000000000000000000000000000") {
          console.error("❌ 游戏信息无效", info);
          return null;
        }

        const gameInfo: GameInfo = {
          gameId: Number(info.id),
          owner: info.owner,
          entryFee: info.entryFee,
          prizePool: info.prizePool,
          playerCount: Number(info.playerCount),
          status: Number(info.status),
          winner: info.winner,
          createdAt: Number(info.createdAt),
        };

        // 根据合约类型添加特定字段
        if (contractType === "simple") {
          gameInfo.targetNumber = Number(info.target);
        } else if (contractType === "fhe") {
          // FHE 合约返回 revealedTarget
          if (info.revealedTarget !== undefined) {
            gameInfo.revealedTarget = Number(info.revealedTarget);
          }
        }

        console.log("✅ 游戏信息处理完成", gameInfo);
        return gameInfo;
      } catch (err: any) {
        console.error("❌ 获取游戏信息失败", err);
        console.error("   错误详情:", err.message);
        return null;
      }
    },
    [contract, contractType]
  );

  // 获取总游戏数
  const getTotalGames = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const total = await contract.getTotalGames();
      return Number(total);
    } catch (err) {
      console.error("获取总游戏数失败:", err);
      return 0;
    }
  }, [contract]);

  // 获取玩家列表
  const getPlayers = useCallback(
    async (gameId: number): Promise<string[]> => {
      if (!contract) return [];

      try {
        return await contract.getPlayers(gameId);
      } catch (err) {
        console.error("获取玩家列表失败:", err);
        return [];
      }
    },
    [contract]
  );

  // 🎯 获取玩家的猜测
  const getPlayerGuess = useCallback(
    async (gameId: number, playerAddress: string): Promise<number> => {
      if (!contract) return 0;

      try {
        if (contractType === "simple") {
          const guess = await contract.getPlayerGuess(gameId, playerAddress);
          return Number(guess);
        } else {
          // FHE 版本：只有游戏结束后才能看到解密的猜测
          const guess = await contract.getRevealedGuess(gameId, playerAddress);
          return Number(guess);
        }
      } catch (err) {
        console.error("获取玩家猜测失败:", err);
        return 0;
      }
    },
    [contract, contractType]
  );

  // 检查是否已猜测
  const hasPlayerGuessed = useCallback(
    async (gameId: number, playerAddress: string): Promise<boolean> => {
      if (!contract) return false;

      try {
        return await contract.hasPlayerGuessed(gameId, playerAddress);
      } catch (err) {
        console.error("检查猜测状态失败:", err);
        return false;
      }
    },
    [contract]
  );

  return {
    contract,
    loading,
    error,
    contractType,
    createGame,
    joinGame,
    endGame,
    getGameInfo,
    getTotalGames,
    getPlayers,
    getPlayerGuess,
    hasPlayerGuessed,
  };
}

