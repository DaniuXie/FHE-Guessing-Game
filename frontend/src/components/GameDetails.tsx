/**
 * Game Details and Management Component (Upgraded with Decryption Support)
 */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useContract, GameInfo } from "../hooks/useContractDual";
import { useWallet } from "../hooks/useWallet";
import { useDecryption } from "../hooks/useDecryption";
import { DecryptionProgress } from "./DecryptionProgress";
import { GameStatus, GAME_STATUS_TEXT } from "../utils/constants";
import { GameStatusFHE, GAME_STATUS_TEXT_FHE } from "../utils/constants_fhe";
import { formatEther, formatAddress, formatTimestamp } from "../utils/format";

interface GameDetailsProps {
  gameId: number;
  onGameEnded?: () => void;
}

export function GameDetails({ gameId, onGameEnded }: GameDetailsProps) {
  const { isConnected, address } = useWallet();
  const { contract, endGame, getGameInfo, getPlayers, getPlayerGuess, loading, contractType } = useContract();

  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, number>>({});
  const [loadingGame, setLoadingGame] = useState(true);
  const [showDecryptionModal, setShowDecryptionModal] = useState(false);

  // 使用新的解密 Hook
  const {
    requestDecryption,
    status: decryptStatus,
    progress: decryptProgress,
    error: decryptError,
    reset: resetDecryption
  } = useDecryption(contract);

  // Load game details (using useCallback to avoid closure traps)
  const loadGameDetails = useCallback(async () => {
    if (!isConnected) {
      setLoadingGame(false);
      return;
    }

    setLoadingGame(true);
    console.log("🔍 GameDetails: Loading game info, gameId=", gameId);

    try {
      const info = await getGameInfo(gameId);
      console.log("📊 GameDetails: Got game info", info);
      
      if (!info) {
        console.error("❌ GameDetails: Game info is null");
        setGameInfo(null);
        setLoadingGame(false);
        return;
      }

      setGameInfo(info);

      const playersList = await getPlayers(gameId);
      setPlayers(playersList);

      // Simplified version: can directly view all player guesses (plaintext)
      const guesses: Record<string, number> = {};
      for (const player of playersList) {
        const guess = await getPlayerGuess(gameId, player);
        guesses[player] = guess;
      }
      setPlayerGuesses(guesses);
      
      console.log("✅ GameDetails: Loading complete");
    } catch (error) {
      console.error("❌ GameDetails: Loading failed", error);
      setGameInfo(null);
    }

    setLoadingGame(false);
  }, [gameId, isConnected, getGameInfo, getPlayers, getPlayerGuess]); // Fixed: include all dependencies

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadGameDetails();
    };

    load();

    return () => {
      mounted = false;
    };
  }, [loadGameDetails]); // 🔧 修复：只依赖 loadGameDetails（它已经包含了所有依赖）

  // FHE版本：使用新的解密流程
  const handleEndGameFHE = async () => {
    if (!gameInfo) {
      toast.error("游戏信息未加载");
      return;
    }

    if (gameInfo.playerCount === 0) {
      toast.error("游戏中没有玩家，无法结束");
      return;
    }

    if (
      !window.confirm(
        `确认结束游戏吗？\n\n这将触发 FHE 解密流程：\n1. 提交解密请求（10-30秒）\n2. Gateway 解密（30-90秒）\n3. 链上回调（5-15秒）\n\n总共预计 1-2 分钟`
      )
    ) {
      return;
    }

    try {
      setShowDecryptionModal(true);
      resetDecryption();
      
      // 使用新的解密流程
      const result = await requestDecryption(gameId);
      
      console.log('解密结果:', result);
      
      // 刷新游戏信息
      await loadGameDetails();
      
      if (onGameEnded) {
        onGameEnded();
      }
      
      toast.success('🎉 游戏结束！获胜者已确定');
      
      // 3秒后自动关闭模态框
      setTimeout(() => {
        setShowDecryptionModal(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('解密失败:', error);
      toast.error(`解密失败: ${error.message || '未知错误'}`);
      // 保持模态框打开以显示错误
    }
  };

  // 明文版本：使用原有逻辑
  const handleEndGameSimple = async () => {
    if (!gameInfo) {
      toast.error("Game information not loaded");
      return;
    }

    if (gameInfo.playerCount === 0) {
      toast.error("No players in game, cannot end");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to end the game?\n\nTarget Number: ${gameInfo.targetNumber}\nThis will automatically calculate the closest guess and distribute the prize pool.`
      )
    ) {
      return;
    }

    // End game with toast promise
    const endPromise = endGame(gameId);

    toast.promise(
      endPromise,
      {
        loading: "Ending game and calculating winner...",
        success: (result) => {
          if (result.success) {
            // Refresh game information
            setTimeout(() => {
              loadGameDetails();
            }, 2000);

            if (onGameEnded) {
              onGameEnded();
            }

            return "✅ Game ended successfully! Winner determined.";
          }
          throw new Error(result.error || "Failed to end game");
        },
        error: (err) => `❌ ${err.message || "Failed to end game"}`,
      }
    );
  };

  // 根据合约类型选择处理函数
  const handleEndGame = contractType === "fhe" ? handleEndGameFHE : handleEndGameSimple;

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-400">Please connect wallet first</p>
        </div>
      </div>
    );
  }

  if (loadingGame) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-2">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-400">Game not found</p>
        </div>
      </div>
    );
  }

  const isOwner =
    address && gameInfo.owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Game Details #{gameId}
          {contractType === "fhe" ? (
            <span className="ml-2 text-sm font-normal text-purple-400">
              (🔐 FHE)
            </span>
          ) : (
            <span className="ml-2 text-sm font-normal text-blue-400">
              (📝 Plaintext)
            </span>
          )}
        </h2>
        <span
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            (contractType === "fhe" 
              ? gameInfo.status === GameStatusFHE.ACTIVE 
              : gameInfo.status === GameStatus.ACTIVE)
              ? "bg-green-900/50 text-green-400"
              : (contractType === "fhe" && gameInfo.status === GameStatusFHE.DECRYPTING)
                ? "bg-purple-900/50 text-purple-400"
                : "bg-gray-600 text-gray-300"
          }`}
        >
          {contractType === "fhe" 
            ? GAME_STATUS_TEXT_FHE[gameInfo.status as GameStatusFHE]
            : GAME_STATUS_TEXT[gameInfo.status as GameStatus]}
        </span>
      </div>

      {/* FHE Decryption Status */}
      {contractType === "fhe" && gameInfo.status === GameStatusFHE.DECRYPTING && (
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
          <div className="flex items-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mr-3"></div>
            <div>
              <p className="text-purple-400 font-semibold">🔄 Gateway is decrypting...</p>
              <p className="text-sm text-purple-300 mt-1">
                Estimated 5-15 seconds, please wait. Results will be displayed automatically after decryption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Owner</p>
          <p className="text-white font-mono">
            {formatAddress(gameInfo.owner)}
            {isOwner && <span className="ml-2 text-primary-400">(You)</span>}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Created</p>
          <p className="text-white">{formatTimestamp(gameInfo.createdAt)}</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Entry Fee</p>
          <p className="text-white font-semibold text-lg">
            {formatEther(gameInfo.entryFee)} ETH
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary-900/50 to-primary-800/50 rounded-lg p-4 border border-primary-700">
          <p className="text-primary-300 text-sm mb-1">Prize Pool</p>
          <p className="text-primary-400 font-bold text-2xl">
            {formatEther(gameInfo.prizePool)} ETH
          </p>
        </div>
      </div>

      {/* Target Number Display */}
      <div className="mb-6 bg-primary-900/30 border border-primary-700 rounded-lg p-4">
        <p className="text-primary-300 text-sm mb-1">🎯 Target Number</p>
        {contractType === "fhe" ? (
          // FHE Mode: Display encrypted or decrypted number
          gameInfo.revealedTarget !== undefined && gameInfo.revealedTarget !== 0 ? (
            <p className="text-primary-400 font-bold text-3xl">{gameInfo.revealedTarget}</p>
          ) : (
            <p className="text-purple-400 font-semibold text-xl">🔐 Encrypted (Revealed after game ends)</p>
          )
        ) : (
          // Plaintext Mode: Visible when game ends or to owner
          gameInfo.status === GameStatus.ENDED || isOwner ? (
            <p className="text-primary-400 font-bold text-3xl">
              {gameInfo.targetNumber}
              {isOwner && gameInfo.status !== GameStatus.ENDED && (
                <span className="ml-2 text-xs text-yellow-400">(Owner only)</span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 font-semibold text-xl">🔒 Hidden (Revealed after game ends)</p>
          )
        )}
      </div>

      {/* Game Ended Status */}
      {gameInfo.status === GameStatus.ENDED && (
        <div className="mb-6 bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">🏆 Game Ended</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Winner:</span>
              <span className="text-white font-mono">
                {formatAddress(gameInfo.winner)}
                {address && gameInfo.winner.toLowerCase() === address.toLowerCase() && (
                  <span className="ml-2 text-green-400">(You won! 🎉)</span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Winning Guess:</span>
              <span className="text-green-400 font-bold text-xl">
                {playerGuesses[gameInfo.winner] || "Unknown"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Target Number:</span>
              <span className="text-primary-400 font-bold text-xl">
                {gameInfo.targetNumber}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Difference:</span>
              <span className="text-yellow-400 font-bold text-xl">
                {Math.abs((playerGuesses[gameInfo.winner] || 0) - gameInfo.targetNumber)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-green-700">
              <span className="text-gray-300">Prize:</span>
              <span className="text-green-400 font-bold text-2xl">
                {formatEther(gameInfo.prizePool)} ETH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Player List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          👥 Participating Players ({gameInfo.playerCount})
        </h3>
        
        {players.length === 0 ? (
          <div className="bg-gray-700/30 rounded-lg p-6 text-center">
            <p className="text-gray-400">No players yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => {
              const guess = playerGuesses[player] || 0;
              const diff = Math.abs(guess - gameInfo.targetNumber);
              const isWinner = gameInfo.status === GameStatus.ENDED && 
                              player.toLowerCase() === gameInfo.winner.toLowerCase();
              
              return (
                <div
                  key={player}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    isWinner 
                      ? "bg-green-900/30 border border-green-700" 
                      : "bg-gray-700/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-semibold">#{index + 1}</span>
                    <span className="text-white font-mono">
                      {formatAddress(player)}
                    </span>
                    {address && player.toLowerCase() === address.toLowerCase() && (
                      <span className="text-xs bg-primary-900/50 text-primary-400 px-2 py-1 rounded">
                        You
                      </span>
                    )}
                    {isWinner && (
                      <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
                        🏆 Winner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-white font-semibold">Guess: {guess}</p>
                      <p className="text-xs text-gray-400">Diff: {diff}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* End Game Button (Owner only) */}
      {isOwner && gameInfo.status === GameStatus.ACTIVE && (
        <div className="pt-6 border-t border-gray-700">
          <button
            onClick={handleEndGame}
            disabled={loading || gameInfo.playerCount === 0}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : contractType === "fhe" ? (
              "🔐 End Game (FHE Decryption)"
            ) : (
              "🏁 End Game and Calculate Winner"
            )}
          </button>
          
          {gameInfo.playerCount === 0 && (
            <p className="text-sm text-gray-400 text-center mt-2">
              At least 1 player required to end game
            </p>
          )}
          
          {contractType === "fhe" && gameInfo.playerCount > 0 && (
            <p className="text-xs text-purple-400 text-center mt-2">
              💡 使用 FHE 加密解密流程，预计耗时 1-2 分钟
            </p>
          )}
        </div>
      )}

      {/* 🆕 解密进度模态框 (FHE only) */}
      {showDecryptionModal && contractType === "fhe" && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border-2 border-purple-500">
            <h3 className="text-xl font-bold text-white mb-4">
              🔐 FHE 解密进度
            </h3>
            
            <DecryptionProgress 
              status={decryptStatus}
              progress={decryptProgress}
              error={decryptError}
            />
            
            {/* 操作按钮 */}
            <div className="mt-6 space-y-2">
              {decryptStatus === 'failed' && (
                <>
                  <button
                    onClick={() => {
                      resetDecryption();
                      handleEndGameFHE();
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  >
                    🔄 重试
                  </button>
                  <button
                    onClick={() => setShowDecryptionModal(false)}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
                  >
                    关闭
                  </button>
                </>
              )}
              
              {decryptStatus === 'success' && (
                <button
                  onClick={() => setShowDecryptionModal(false)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  ✅ 查看结果
                </button>
              )}
              
              {(decryptStatus === 'idle' || decryptStatus === 'requesting' || 
                decryptStatus === 'polling' || decryptStatus === 'waiting') && (
                <p className="text-xs text-gray-400 text-center">
                  请耐心等待，不要关闭此窗口
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
