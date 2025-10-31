/**
 * Use Netlify Functions API to query game data
 * Works both locally (dev server) and on Netlify (production)
 */

import { useCallback } from 'react';

// Auto-detect API base URL
const getApiBaseUrl = () => {
  // Production: use relative URL (same domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/.netlify/functions';
  }
  // Development: check if local API server is available
  // For Netlify Functions, we'll use the Netlify Dev server
  return 'http://localhost:8888/.netlify/functions';
};

export function useNetlifyAPI() {
  const API_BASE_URL = getApiBaseUrl();

  // Get total games
  const getTotalGames = useCallback(async () => {
    try {
      console.log('🌐 [Netlify API] Querying total games...');
      const response = await fetch(`${API_BASE_URL}/games-total`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [Netlify API] Total games:', data.total);
        return data.total;
      } else {
        console.error('❌ [Netlify API] Query failed:', data.error);
        return 0;
      }
    } catch (err: any) {
      console.error('❌ [Netlify API] Connection failed:', err.message);
      console.log('💡 Tip: Make sure Netlify Functions are deployed');
      return 0;
    }
  }, [API_BASE_URL]);

  // Get game info
  const getGameInfo = useCallback(async (gameId: number) => {
    try {
      console.log(`🌐 [Netlify API] Querying game #${gameId}...`);
      const response = await fetch(`${API_BASE_URL}/game-info/${gameId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [Netlify API] Game #${gameId} queried successfully`);
        // Convert to frontend format
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
      console.error(`❌ [Netlify API] Query game #${gameId} failed:`, err.message);
      throw err;
    }
  }, [API_BASE_URL]);

  // Get games list
  const getGamesList = useCallback(async () => {
    try {
      console.log('🌐 [Netlify API] Querying games list...');
      const response = await fetch(`${API_BASE_URL}/games-list`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [Netlify API] Successfully loaded ${data.games.length} games`);
        // Convert to frontend format
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
        console.error('❌ [Netlify API] Query failed:', data.error);
        return [];
      }
    } catch (err: any) {
      console.error('❌ [Netlify API] Connection failed:', err.message);
      console.log('💡 Tip: Make sure Netlify Functions are deployed');
      return [];
    }
  }, [API_BASE_URL]);

  // Get game players and their guesses
  const getGamePlayers = useCallback(async (gameId: number) => {
    try {
      console.log(`🌐 [Netlify API] Querying players for game #${gameId}...`);
      const response = await fetch(`${API_BASE_URL}/game-players?gameId=${gameId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [Netlify API] Found ${data.players.length} players in game #${gameId}`);
        return data.players;
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(`❌ [Netlify API] Query players for game #${gameId} failed:`, err.message);
      throw err;
    }
  }, [API_BASE_URL]);

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.success;
    } catch (err) {
      return false;
    }
  }, [API_BASE_URL]);

  return {
    getTotalGames,
    getGameInfo,
    getGamesList,
    getGamePlayers,
    checkHealth,
    contractType: "netlify" as const,
    loading: false,
  };
}

