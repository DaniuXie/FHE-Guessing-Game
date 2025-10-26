/**
 * Join Game Component
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useContract, GameInfo } from "../hooks/useContractDual";
import { useWallet } from "../hooks/useWallet";
import { APP_CONFIG, GameStatus, GAME_STATUS_TEXT } from "../utils/constants";
import { validateNumber, formatEther, formatAddress } from "../utils/format";

interface JoinGameProps {
  gameId: number;
  onJoined?: () => void;
}

export function JoinGame({ gameId, onJoined }: JoinGameProps) {
  const { isConnected, address } = useWallet();
  const { joinGame, getGameInfo, getPlayers, hasPlayerGuessed, loading, contractType } =
    useContract();

  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [guess, setGuess] = useState("");
  const [loadingGame, setLoadingGame] = useState(true);

  // Load game information
  useEffect(() => {
    const load = async () => {
      if (!isConnected) {
        setLoadingGame(false);
        return;
      }

      setLoadingGame(true);
      console.log("🔍 JoinGame: Loading game info, gameId=", gameId);

      try {
        const info = await getGameInfo(gameId);
        console.log("📊 JoinGame: Got game info", info);
        setGameInfo(info);

        if (info) {
          const playersList = await getPlayers(gameId);
          setPlayers(playersList);

          if (address) {
            const guessed = await hasPlayerGuessed(gameId, address);
            setHasGuessed(guessed);
          }
        } else {
          console.error("❌ JoinGame: Game info is null");
        }
      } catch (error) {
        console.error("❌ JoinGame: Loading failed", error);
      }

      setLoadingGame(false);
    };

    load();
  }, [gameId, isConnected, address, getGameInfo, getPlayers, hasPlayerGuessed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateNumber(
      guess,
      APP_CONFIG.MIN_GUESS,
      APP_CONFIG.MAX_GUESS
    );

    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    // Check game status
    if (!gameInfo || gameInfo.status !== GameStatus.ACTIVE) {
      toast.error("Game is not in active status");
      return;
    }

    // Check if already guessed
    if (hasGuessed) {
      toast.error("You have already submitted a guess");
      return;
    }

    // Check if owner
    if (address && gameInfo.owner.toLowerCase() === address.toLowerCase()) {
      toast.error("Owner cannot join their own game");
      return;
    }

    // Join game with toast promise
    const joinPromise = joinGame(gameId, parseInt(guess));

    toast.promise(
      joinPromise,
      {
        loading: "Joining game...",
        success: async (result) => {
          if (result.success) {
            setGuess("");
            setHasGuessed(true);

            if (onJoined) {
              onJoined();
            }

            // Reload game information
            const info = await getGameInfo(gameId);
            setGameInfo(info);
            const playersList = await getPlayers(gameId);
            setPlayers(playersList);

            return "✅ Successfully joined the game!";
          }
          throw new Error(result.error || "Failed to join game");
        },
        error: (err) => `❌ ${err.message || "Failed to join game"}`,
      }
    );
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-400">Please connect wallet to join game</p>
        </div>
      </div>
    );
  }

  if (loadingGame) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-2">Loading game info...</p>
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

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        🎯 Join Game #{gameId}
        {contractType === "fhe" ? (
          <span className="ml-2 text-sm font-normal text-purple-400">
            (🔐 FHE Mode)
          </span>
        ) : (
          <span className="ml-2 text-sm font-normal text-blue-400">
            (📝 Plaintext Mode)
          </span>
        )}
      </h2>

      {/* Game Information */}
      <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-white font-semibold">
              {GAME_STATUS_TEXT[gameInfo.status]}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Owner</p>
            <p className="text-white font-mono">
              {formatAddress(gameInfo.owner)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Entry Fee</p>
            <p className="text-white font-semibold">
              {formatEther(gameInfo.entryFee)} ETH
            </p>
          </div>
          <div>
            <p className="text-gray-400">Prize Pool</p>
            <p className="text-primary-400 font-bold">
              {formatEther(gameInfo.prizePool)} ETH
            </p>
          </div>
          <div>
            <p className="text-gray-400">Players</p>
            <p className="text-white font-semibold">{gameInfo.playerCount}</p>
          </div>
          <div>
            <p className="text-gray-400">Your Status</p>
            <p className={hasGuessed ? "text-green-400" : "text-gray-400"}>
              {hasGuessed ? "✅ Joined" : "Not Joined"}
            </p>
          </div>
        </div>
      </div>

      {/* Join Form */}
      {gameInfo.status === GameStatus.ACTIVE &&
      !hasGuessed &&
      address &&
      gameInfo.owner.toLowerCase() !== address.toLowerCase() ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">
              🔢 Your Guess (1-100) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              min={APP_CONFIG.MIN_GUESS}
              max={APP_CONFIG.MAX_GUESS}
              placeholder="Enter a number between 1 and 100"
              className="input"
              required
              disabled={loading}
            />
          <p className="text-xs text-gray-400 mt-1">
            {contractType === "fhe" 
              ? "🔐 Your guess will be fully encrypted with FHE, completely confidential during the game"
              : "📝 Your guess will be stored in plaintext, viewable in game details"}
          </p>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              💰 You need to pay <span className="font-bold">{formatEther(gameInfo.entryFee)} ETH</span> as entry fee
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
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
                Submitting...
              </span>
            ) : (
              `Pay ${formatEther(gameInfo.entryFee)} ETH and Join`
            )}
          </button>
        </form>
      ) : hasGuessed ? (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 text-center">
          <p className="text-green-400 font-semibold mb-2">✅ You have already submitted a guess</p>
          <p className="text-sm text-gray-300">
            Please wait for the owner to end the game and reveal results
          </p>
        </div>
      ) : gameInfo.status !== GameStatus.ACTIVE ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">Game is not in active status</p>
        </div>
      ) : (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">Owner cannot join their own game</p>
        </div>
      )}

      {/* Player List */}
      {players.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            👥 Participating Players ({players.length})
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player}
                className="flex items-center justify-between bg-gray-700/30 rounded-lg px-4 py-2"
              >
                <span className="text-gray-400 text-sm">#{index + 1}</span>
                <span className="text-white font-mono text-sm">
                  {formatAddress(player)}
                  {address && player.toLowerCase() === address.toLowerCase() && (
                    <span className="ml-2 text-primary-400">(You)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


