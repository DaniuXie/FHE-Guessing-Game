/**
 * Game List Component
 */

import { useState, useEffect, useCallback } from "react";
import { useContract } from "../hooks/useContractDual";
import { useWallet } from "../hooks/useWallet";
import { GameInfo } from "../hooks/useContractDual";
import { GameStatus, GAME_STATUS_TEXT, APP_CONFIG } from "../utils/constants";
import { GameStatusFHE, GAME_STATUS_TEXT_FHE } from "../utils/constants_fhe";
import { formatEther, formatAddress, formatRelativeTime } from "../utils/format";

interface GameListProps {
  onSelectGame?: (gameId: number) => void;
  refreshTrigger?: number;
}

export function GameList({ onSelectGame, refreshTrigger }: GameListProps) {
  const { isConnected } = useWallet();
  const { getTotalGames, getGameInfo, contractType } = useContract();

  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all"); // 🔧 默认显示全部游戏

  // Load game list (using useCallback to avoid closure traps)
  const loadGames = useCallback(async () => {
    setLoading(true);
    console.log("🔍 GameList: Loading game list");

    try {
      const total = await getTotalGames();
      console.log("📊 GameList: Total games", total);
      const gamesList: GameInfo[] = [];

      // Load recent games (max 20)
      const start = Math.max(1, total - 19);
      for (let i = total; i >= start; i--) {
        const info = await getGameInfo(i);
        if (info) {
          gamesList.push(info);
          console.log(`✅ GameList: Loaded game #${i}`, info);
        }
      }

      setGames(gamesList);
      console.log("✅ GameList: Game list loaded, total", gamesList.length, "games");
    } catch (error) {
      console.error("❌ GameList: Failed to load game list", error);
    } finally {
      setLoading(false);
    }
  }, [getTotalGames, getGameInfo]); // Fixed: include all dependencies

  useEffect(() => {
    if (isConnected) {
      loadGames();
    }
  }, [isConnected, refreshTrigger, loadGames]); // 🔧 修复：添加 loadGames 依赖

  // 定时刷新
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      loadGames();
    }, APP_CONFIG.GAME_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, loadGames]); // 🔧 修复：添加 loadGames 依赖

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
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-2">Loading...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No games yet</p>
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
                  (contractType === "fhe" 
                    ? game.status === GameStatusFHE.ACTIVE 
                    : game.status === GameStatus.ACTIVE)
                    ? "bg-green-900/50 text-green-400"
                    : (contractType === "fhe" && game.status === GameStatusFHE.DECRYPTING)
                      ? "bg-purple-900/50 text-purple-400"
                      : "bg-gray-600 text-gray-300"
                }`}
              >
                {contractType === "fhe" 
                  ? GAME_STATUS_TEXT_FHE[game.status as GameStatusFHE]
                  : GAME_STATUS_TEXT[game.status as GameStatus]}
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
                  <p className="text-xs text-gray-400">Winner</p>
                  <p className="text-green-400 font-mono text-sm">
                    {formatAddress(game.winner)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


