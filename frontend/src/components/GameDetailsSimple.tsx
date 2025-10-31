/**
 * 🔥 Simplified Game Details Component
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNetlifyAPI } from "../hooks/useNetlifyAPI";
import { useContractSimple } from "../hooks/useContractSimple";
import { useWallet } from "../hooks/useWallet";
import { formatEther } from "ethers";

interface GameDetailsSimpleProps {
  gameId: number;
}

interface PlayerGuess {
  address: string;
  guess: number;
}

export function GameDetailsSimple({ gameId }: GameDetailsSimpleProps) {
  const { getGameInfo, getGamePlayers } = useNetlifyAPI();
  const { endGame, loading: contractLoading } = useContractSimple();
  const { address } = useWallet();
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGameInfo() {
      setLoading(true);
      setError("");
      
      try {
        console.log("📊 Loading game info:", gameId);
        const info = await getGameInfo(gameId);
        
        if (info) {
          console.log("✅ Game info loaded successfully:", info);
          setGameInfo(info);

          // If game is ended, also load players' guesses for transparency
          if (info.status === 1) {
            console.log("🔍 Game ended, loading players' guesses for transparency...");
            try {
              const playersList = await getGamePlayers(gameId);
              console.log("✅ Players' guesses loaded:", playersList);
              setPlayers(playersList);
            } catch (err) {
              console.error("⚠️ Failed to load players info (non-critical):", err);
              // Don't fail the whole component if players info fails
            }
          }
        } else {
          setError("Game not found");
        }
      } catch (err: any) {
        console.error("❌ Loading failed:", err);
        setError(err.message || "Loading failed");
      } finally {
        setLoading(false);
      }
    }

    loadGameInfo();
  }, [gameId, getGameInfo, getGamePlayers]);

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-400">Loading game #{gameId}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-red-400">❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-400">Game not found</p>
        </div>
      </div>
    );
  }

  const status = Number(gameInfo.status);
  const statusText = status === 0 ? "Active" : "Ended";
  const isOwner = address && gameInfo.owner.toLowerCase() === address.toLowerCase();

  const handleEndGame = async () => {
    if (!isOwner) {
      toast.error("Only the owner can end the game");
      return;
    }

    if (status !== 0) {
      toast.error("Game is already ended");
      return;
    }

    if (gameInfo.playerCount === 0) {
      toast.error("Cannot end game with no players");
      return;
    }

    const result = await endGame(gameId);

    if (result.success) {
      toast.success("✅ Game ended successfully!");
      
      // Reload game information and players' guesses
      try {
        const info = await getGameInfo(gameId);
        setGameInfo(info);

        // Load players' guesses for transparency
        if (info.status === 1) {
          const playersList = await getGamePlayers(gameId);
          setPlayers(playersList);
        }
      } catch (error) {
        console.error("Failed to reload game info", error);
      }
    } else {
      toast.error(`❌ ${result.error || "Failed to end game"}`);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        🎮 Game Details #{gameId}
        {isOwner && (
          <span className="ml-2 text-sm font-normal text-yellow-400">
            (You are the owner)
          </span>
        )}
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-gray-400 text-sm">Status</p>
          <p className="text-white font-semibold">{statusText}</p>
        </div>

        {/* Only show target number to owner in Plaintext mode */}
        {isOwner && (
          <div>
            <p className="text-gray-400 text-sm">Target Number (Owner Only)</p>
            <p className="text-yellow-400 font-semibold">{String(gameInfo.target)}</p>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Only you can see this. In Plaintext mode, the target is visible on-chain but hidden in the UI.
            </p>
          </div>
        )}

        <div>
          <p className="text-gray-400 text-sm">Creator</p>
          <p className="text-white font-mono text-sm">
            {String(gameInfo.owner).slice(0, 6)}...{String(gameInfo.owner).slice(-4)}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Entry Fee</p>
          <p className="text-white font-semibold">
            {formatEther(gameInfo.entryFee)} ETH
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Prize Pool</p>
          <p className="text-white font-semibold">
            {formatEther(gameInfo.prizePool)} ETH
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Players</p>
          <p className="text-white font-semibold">{String(gameInfo.playerCount)}</p>
        </div>

        {status === 1 && gameInfo.winner !== "0x0000000000000000000000000000000000000000" && (
          <div className="col-span-2">
            <p className="text-gray-400 text-sm mb-2">🏆 Winner</p>
            <p className="text-green-400 font-mono text-sm mb-2">
              {String(gameInfo.winner).slice(0, 6)}...{String(gameInfo.winner).slice(-4)}
            </p>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-xs">
                ✅ Prize of <span className="font-bold">{formatEther(gameInfo.prizePool)} ETH</span> has been automatically sent to the winner's wallet
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Game Results - Show after game ends (for transparency) */}
      {status === 1 && (
        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Game Results (Transparency)
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Target Number - visible to everyone after game ends */}
            <div className="col-span-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">🎯 Target Number</p>
              <p className="text-yellow-400 text-2xl font-bold">{String(gameInfo.target)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Set by creator (now public after game ended)
              </p>
            </div>
          </div>

          {/* Players' Guesses */}
          {players.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-3">👥 All Players' Guesses</p>
              <div className="space-y-2">
                {players.map((player, index) => {
                  const isWinner = player.address.toLowerCase() === gameInfo.winner.toLowerCase();
                  const diff = Math.abs(player.guess - Number(gameInfo.target));
                  
                  return (
                    <div
                      key={player.address}
                      className={`p-3 rounded-lg border ${
                        isWinner
                          ? 'bg-green-500/10 border-green-500/50'
                          : 'bg-gray-700/50 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {isWinner && <span className="text-lg">🏆</span>}
                            <p className={`font-mono text-sm ${
                              isWinner ? 'text-green-400 font-bold' : 'text-gray-300'
                            }`}>
                              {player.address.slice(0, 6)}...{player.address.slice(-4)}
                            </p>
                            {player.address.toLowerCase() === address?.toLowerCase() && (
                              <span className="text-xs text-blue-400">(You)</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            isWinner ? 'text-green-400' : 'text-white'
                          }`}>
                            {player.guess}
                          </p>
                          <p className="text-xs text-gray-400">
                            Diff: {diff}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                💡 Winner is determined by the smallest difference from the target number
              </div>
            </div>
          )}
        </div>
      )}

      {/* End Game Button for Owner */}
      {isOwner && status === 0 && (
        <div className="mt-6">
          <button
            onClick={handleEndGame}
            disabled={contractLoading || gameInfo.playerCount === 0}
            className="btn-primary w-full py-3"
          >
            {contractLoading ? (
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
                Ending Game...
              </span>
            ) : gameInfo.playerCount === 0 ? (
              "⚠️ No Players Yet"
            ) : (
              `🏁 End Game (${gameInfo.playerCount} Player${gameInfo.playerCount > 1 ? 's' : ''})`
            )}
          </button>
          {gameInfo.playerCount === 0 && (
            <p className="text-yellow-400 text-xs mt-2 text-center">
              Wait for at least one player to join before ending the game
            </p>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm">
          {isOwner ? (
            status === 0 ? (
              "✅ As the owner, you can end the game once players have joined. The winner will be the player closest to your target number."
            ) : (
              "✅ Game has ended. The prize has been automatically sent to the winner's wallet. No additional action needed."
            )
          ) : status === 1 ? (
            gameInfo.winner.toLowerCase() === address?.toLowerCase() ? (
              "🎉 Congratulations! You won! The prize has been automatically sent to your wallet."
            ) : (
              "Game has ended. Better luck next time!"
            )
          ) : (
            "✅ View game details here. Join the game to win the prize pool!"
          )}
        </p>
      </div>
    </div>
  );
}


