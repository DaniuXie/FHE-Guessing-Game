/**
 * 智能合约交互 Hook（简化版 - 明文版本）
 */

import { useState, useCallback, useMemo } from "react";
import { Contract, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, GameStatus } from "../utils/constants";
import { encryptNumber } from "../utils/fhevm";
import { useWallet } from "./useWallet";

export interface GameInfo {
  gameId: number;
  targetNumber: number;  // 🎯 简化版：明文存储目标数字
  owner: string;
  entryFee: bigint;
  prizePool: bigint;
  playerCount: number;
  status: GameStatus;
  winner: string;
  createdAt: number;
}

export function useContract() {
  const { provider, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建合约实例
  const contract = useMemo(() => {
    if (!provider || !address) return null;
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [provider, address]);

  // 🎯 创建游戏（简化版：直接传入明文数字）
  const createGame = useCallback(
    async (targetNumber: number, entryFeeEth: string) => {
      if (!contract || !address || !provider) {
        throw new Error("请先连接钱包");
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🎮 创建游戏...");
        console.log("   目标数字:", targetNumber);
        console.log("   入场费:", entryFeeEth, "ETH");

        // 简化版：直接使用明文数字（不加密）
        const plainNumber = await encryptNumber(targetNumber);

        // 获取signer并发送交易
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        const entryFee = parseEther(entryFeeEth);
        
        // 🎯 注意：createGame 需要发送入场费作为 msg.value
        const tx = await contractWithSigner.createGame(plainNumber, entryFee, {
          value: entryFee,
        });

        console.log("⏳ 等待交易确认...", tx.hash);
        const receipt = await tx.wait();

        console.log("✅ 游戏创建成功!");

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
          // 备选方案：查询总游戏数
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
    [contract, address, provider]
  );

  // 🎯 加入游戏（简化版：直接传入明文猜测）
  const joinGame = useCallback(
    async (gameId: number, guess: number) => {
      if (!contract || !address || !provider) {
        throw new Error("请先连接钱包");
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🎯 加入游戏...");
        console.log("   游戏ID:", gameId);
        console.log("   猜测:", guess);

        // 获取游戏信息（入场费）
        const gameInfo = await contract.getGameInfo(gameId);
        const entryFee = gameInfo.entryFee;

        // 简化版：直接使用明文猜测（不加密）
        const plainGuess = await encryptNumber(guess);

        // 获取signer并发送交易
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        const tx = await contractWithSigner.joinGame(gameId, plainGuess, {
          value: entryFee,
        });

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
    [contract, address, provider]
  );

  // 🎯 结束游戏（简化版：自动计算获胜者）
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
        
        // 🎯 简化版：合约会自动计算获胜者
        const tx = await contractWithSigner.endGame(gameId);

        console.log("⏳ 等待交易确认...", tx.hash);
        await tx.wait();

        console.log("✅ 游戏结束成功!");

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
    [contract, address, provider]
  );

  // 获取游戏信息
  const getGameInfo = useCallback(
    async (gameId: number): Promise<GameInfo | null> => {
      if (!contract) {
        console.error("❌ getGameInfo: contract 为 null");
        return null;
      }

      try {
        console.log("🔍 useContract: 开始获取游戏信息，gameId=", gameId);
        const info = await contract.getGameInfo(gameId);
        console.log("📊 useContract: 原始数据", info);
        
        // 验证数据完整性
        if (!info || !info.owner || info.owner === "0x0000000000000000000000000000000000000000") {
          console.error("❌ useContract: 游戏信息无效", info);
          return null;
        }
        
        const gameInfo = {
          gameId: Number(info.id),
          targetNumber: Number(info.target),  // 🎯 简化版：返回明文目标数字
          owner: info.owner,
          entryFee: info.entryFee,
          prizePool: info.prizePool,
          playerCount: Number(info.playerCount),
          status: Number(info.status) as GameStatus,
          winner: info.winner,
          createdAt: Number(info.createdAt),
        };
        
        console.log("✅ useContract: 游戏信息处理完成", gameInfo);
        return gameInfo;
      } catch (err: any) {
        console.error("❌ useContract: 获取游戏信息失败", err);
        console.error("   错误详情:", err.message);
        return null;
      }
    },
    [contract]
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

  // 🎯 获取玩家的猜测（简化版新增功能）
  const getPlayerGuess = useCallback(
    async (gameId: number, playerAddress: string): Promise<number> => {
      if (!contract) return 0;

      try {
        const guess = await contract.getPlayerGuess(gameId, playerAddress);
        return Number(guess);
      } catch (err) {
        console.error("获取玩家猜测失败:", err);
        return 0;
      }
    },
    [contract]
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
    createGame,
    joinGame,
    endGame,
    getGameInfo,
    getTotalGames,
    getPlayers,
    getPlayerGuess,  // 🎯 新增方法
    hasPlayerGuessed,
  };
}
