/**
 * Game List Component
 */

import { useState, useEffect, useCallback } from "react";
import { useContractSimple } from "../hooks/useContractSimple";
import { useNetlifyAPI } from "../hooks/useNetlifyAPI";
import { useWallet } from "../hooks/useWallet";
import { GameStatus, GAME_STATUS_TEXT, APP_CONFIG } from "../utils/constants";
import { formatEther, formatAddress, formatRelativeTime } from "../utils/format";

interface GameInfo {
  gameId: number;
  target?: number;
  owner: string;
  entryFee: bigint;
  prizePool: bigint;
  playerCount: number;
  status: number;
  createdAt: number;
}

interface GameListProps {
  onSelectGame?: (gameId: number) => void;
  refreshTrigger?: number;
}

export function GameList({ onSelectGame, refreshTrigger }: GameListProps) {
  const { isConnected } = useWallet();
  const netlifyAPI = useNetlifyAPI();
  const directQuery = useContractSimple();

  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoLoad, setAutoLoad] = useState(false); // 🔧 默认不自动加载
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [useAPI, setUseAPI] = useState(true); // 🔧 默认尝试使用 Netlify API
  const contractType = "simple"; // 🔧 明文合约类型（Netlify API 查询的是明文合约）

  // Load game list (using useCallback to avoid closure traps)
  const loadGames = useCallback(async () => {
    setLoading(true);
    console.log("🔍 GameList: Manually loading game list...");

    try {
      let total = 0;
      let gamesList: GameInfo[] = [];

      // 🔧 Try Netlify API first
      if (useAPI) {
        console.log("🌐 Trying Netlify Functions API...");
        const apiHealth = await netlifyAPI.checkHealth();
        
        if (apiHealth) {
          console.log("✅ Netlify API available");
          total = await netlifyAPI.getTotalGames();
          console.log("📊 GameList: Total games (API)", total);
          
          if (total === 0) {
            setGames([]);
            setLoading(false);
            return;
          }

          // Load recent games (max 20)
          const start = Math.max(1, total - 19);
          for (let i = total; i >= start; i--) {
            try {
              const info = await netlifyAPI.getGameInfo(i);
              if (info) {
                const gameInfo: GameInfo = {
                  gameId: info.id,
                  target: info.target,
                  owner: info.owner,
                  entryFee: info.entryFee,
                  prizePool: info.prizePool,
                  playerCount: info.playerCount,
                  status: info.status,
                  createdAt: info.createdAt,
                };
                gamesList.push(gameInfo);
                console.log(`✅ GameList: Loaded game #${i} (API)`);
              }
            } catch (err) {
              console.error(`⚠️ GameList: Failed to load game #${i}`, err);
            }
          }

          setGames(gamesList);
          console.log("✅ GameList: Game list loaded via Netlify API, total", gamesList.length, "games");
          setLoading(false);
          return;
        } else {
          console.warn("⚠️ Netlify API unavailable, using direct query (will timeout)...");
        }
      }

      // Fallback: Use direct query (will fail)
      console.log("🔍 Using direct query method...");
      total = await directQuery.getTotalGames();
      console.log("📊 GameList: Total games (Direct)", total);
      
      if (total === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      // Load recent games (max 20)
      const start = Math.max(1, total - 19);
      for (let i = total; i >= start; i--) {
        try {
          const info = await directQuery.getGameInfo(i);
          if (info) {
            const gameInfo: GameInfo = {
              gameId: Number(info[0] || info.id || i),
              target: info[1] ? Number(info[1]) : undefined,
              owner: String(info[2] || info.owner),
              entryFee: BigInt(info[3] || info.entryFee || 0),
              prizePool: BigInt(info[4] || info.prizePool || 0),
              playerCount: Number(info[5] || info.playerCount || 0),
              status: Number(info[6] || info.status || 0),
              createdAt: Number(info[8] || info.createdAt || 0),
            };
            gamesList.push(gameInfo);
            console.log(`✅ GameList: Loaded game #${i}`);
          }
        } catch (err) {
          console.error(`⚠️ GameList: Failed to load game #${i}`, err);
        }
      }

      setGames(gamesList);
      console.log("✅ GameList: Game list loaded, total", gamesList.length, "games");
    } catch (error) {
      console.error("❌ GameList: Failed to load game list", error);
    } finally {
      setLoading(false);
    }
  }, [useAPI, netlifyAPI, directQuery]); // Fixed: include all dependencies

  // ✅ 启用自动加载
  useEffect(() => {
    if (isConnected) {
      loadGames();
    }
  }, [isConnected, refreshTrigger, loadGames]);

  // 🔧 禁用定时刷新（网络太慢）
  // useEffect(() => {
  //   if (!isConnected || !autoLoad) return;
  //   const interval = setInterval(() => {
  //     loadGames();
  //   }, APP_CONFIG.GAME_REFRESH_INTERVAL);
  //   return () => clearInterval(interval);
  // }, [isConnected, autoLoad, loadGames]);

  // Filter games
  const filteredGames = games.filter((game) => {
    if (filter === "active") return game.status === GameStatus.ACTIVE;
    if (filter === "ended") return game.status === GameStatus.ENDED;
    return true;
  });

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-400">Please connect wallet to view game list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🎲 Game List</h2>
        
        <button
          onClick={loadGames}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-primary-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("ended")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "ended"
              ? "bg-primary-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Ended
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          All
        </button>
      </div>

      {/* Game List */}
      {loading && games.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-300 text-lg font-medium">Loading game list...</p>
          <p className="text-gray-500 text-sm mt-2">Trying multiple RPC nodes, please wait...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
          <div className="text-6xl mb-4">🎮</div>
          <p className="text-gray-300 text-lg font-medium mb-2">Unable to load game list via browser</p>
          <p className="text-gray-400 text-sm mb-4">
            Your network environment is blocking RPC queries
          </p>
          <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto text-left">
            <p className="text-yellow-400 font-semibold mb-2">💡 Solution:</p>
            <p className="text-gray-300 text-sm mb-2">Use Hardhat script to query:</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded text-xs mb-2">
              npx hardhat run scripts/list_games.js --network sepolia
            </code>
            <p className="text-gray-400 text-xs">Or temporarily disable VPN and refresh</p>
          </div>
          <button
            onClick={loadGames}
            disabled={loading}
            className="btn-secondary text-sm px-6 py-2 mt-4"
          >
            {loading ? "Retrying..." : "🔄 Retry Loading"}
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No games match the filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <div
              key={game.gameId}
              className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => onSelectGame?.(game.gameId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {game.status === GameStatus.ACTIVE
                      ? "🎮"
                      : "🏆"}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Game #{game.gameId}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(game.createdAt)}
                    </p>
                  </div>
                </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  game.status === GameStatus.ACTIVE
                    ? "bg-green-900/50 text-green-400"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {GAME_STATUS_TEXT[game.status as GameStatus]}
              </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Owner</p>
                  <p className="text-white font-mono">
                    {formatAddress(game.owner)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Entry Fee</p>
                  <p className="text-white font-semibold">
                    {formatEther(game.entryFee)} ETH
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Players</p>
                  <p className="text-white font-semibold">
                    {game.playerCount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Prize Pool</p>
                  <p className="text-primary-400 font-bold">
                    {formatEther(game.prizePool)} ETH
                  </p>
                </div>
              </div>

              {game.status === GameStatus.ENDED && game.winner && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">🏆 Winner</p>
                      <p className="text-green-400 font-mono text-sm">
                        {formatAddress(game.winner)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-400">✅ Prize Sent</p>
                      <p className="text-xs text-gray-400">{formatEther(game.prizePool)} ETH</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


