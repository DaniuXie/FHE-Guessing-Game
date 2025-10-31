/**
 * 使用本地 API 服务器查询游戏数据
 * 绕过浏览器的 RPC 查询限制
 */

import { useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

export function useLocalAPI() {
  // 获取游戏总数
  const getTotalGames = useCallback(async () => {
    try {
      console.log('🌐 [本地API] 查询游戏总数...');
      const response = await fetch(`${API_BASE_URL}/games/total`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [本地API] 游戏总数:', data.total);
        return data.total;
      } else {
        console.error('❌ [本地API] 查询失败:', data.error);
        return 0;
      }
    } catch (err: any) {
      console.error('❌ [本地API] 连接失败:', err.message);
      console.log('💡 提示: 确保本地 API 服务器正在运行 (npm run server)');
      return 0;
    }
  }, []);

  // 获取游戏信息
  const getGameInfo = useCallback(async (gameId: number) => {
    try {
      console.log(`🌐 [本地API] 查询游戏 #${gameId}...`);
      const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [本地API] 游戏 #${gameId} 查询成功`);
        // 转换为前端需要的格式
        return {
          id: data.game.id,
          target: data.game.target,
          owner: data.game.owner,
          entryFee: BigInt(data.game.entryFee),
          prizePool: BigInt(data.game.prizePool),
          playerCount: data.game.playerCount,
          status: data.game.status,
          winner: data.game.winner,
          createdAt: data.game.createdAt,
        };
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(`❌ [本地API] 查询游戏 #${gameId} 失败:`, err.message);
      throw err;
    }
  }, []);

  // 获取游戏列表
  const getGamesList = useCallback(async () => {
    try {
      console.log('🌐 [本地API] 查询游戏列表...');
      const response = await fetch(`${API_BASE_URL}/games`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [本地API] 成功加载 ${data.games.length} 个游戏`);
        // 转换为前端需要的格式
        return data.games.map((game: any) => ({
          id: game.id,
          target: game.target,
          owner: game.owner,
          entryFee: BigInt(game.entryFee),
          prizePool: BigInt(game.prizePool),
          playerCount: game.playerCount,
          status: game.status,
          winner: game.winner,
          createdAt: game.createdAt,
        }));
      } else {
        console.error('❌ [本地API] 查询失败:', data.error);
        return [];
      }
    } catch (err: any) {
      console.error('❌ [本地API] 连接失败:', err.message);
      console.log('💡 提示: 确保本地 API 服务器正在运行 (npm run server)');
      return [];
    }
  }, []);

  // 健康检查
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.success;
    } catch (err) {
      return false;
    }
  }, []);

  return {
    getTotalGames,
    getGameInfo,
    getGamesList,
    checkHealth,
    contractType: "api" as const,
    loading: false,
  };
}


