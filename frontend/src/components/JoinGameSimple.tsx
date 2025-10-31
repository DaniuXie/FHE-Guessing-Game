/**
 * Simplified Join Game Component - Uses Netlify API for queries
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNetlifyAPI } from "../hooks/useNetlifyAPI";
import { useWallet } from "../hooks/useWallet";
import { useContractSimple } from "../hooks/useContractSimple";
import { APP_CONFIG, GameStatus, GAME_STATUS_TEXT } from "../utils/constants";
import { validateNumber, formatEther, formatAddress } from "../utils/format";

interface JoinGameSimpleProps {
  gameId: number;
  onJoined?: () => void;
}

export function JoinGameSimple({ gameId, onJoined }: JoinGameSimpleProps) {
  const { isConnected, address } = useWallet();
  const { getGameInfo } = useNetlifyAPI();
  const { joinGame, loading } = useContractSimple();

  const [gameInfo, setGameInfo] = useState<any>(null);
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
      console.log("🔍 JoinGameSimple: Loading game info, gameId=", gameId);

      try {
        const info = await getGameInfo(gameId);
        console.log("📊 JoinGameSimple: Got game info", info);
        setGameInfo(info);

        // TODO: Check if current address has already guessed
        // For now, we assume they haven't
        setHasGuessed(false);
      } catch (error) {
        console.error("❌ JoinGameSimple: Loading failed", error);
      }

      setLoadingGame(false);
    };

    load();
  }, [gameId, isConnected, getGameInfo]);

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

    // Check if owner
    if (address && gameInfo.owner.toLowerCase() === address.toLowerCase()) {
      toast.error("Owner cannot join their own game");
      return;
    }

    // Join game - pass entryFee from gameInfo
    const result = await joinGame(gameId, parseInt(guess), gameInfo.entryFee);

    if (result.success) {
      toast.success("✅ Successfully joined the game!");
      setGuess("");
      setHasGuessed(true);

      if (onJoined) {
        onJoined();
      }

      // Reload game information
      try {
        const info = await getGameInfo(gameId);
        setGameInfo(info);
      } catch (error) {
        console.error("Failed to reload game info", error);
      }
    } else {
      toast.error(`❌ ${result.error || "Failed to join game"}`);
    }
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

  const status = Number(gameInfo.status);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        🎯 Join Game #{gameId}
        <span className="ml-2 text-sm font-normal text-blue-400">
          (📝 Plaintext Mode)
        </span>
      </h2>

      {/* Game Information */}
      <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-white font-semibold">
              {GAME_STATUS_TEXT[status as GameStatus]}
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
      {status === GameStatus.ACTIVE &&
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
              📝 Your guess will be stored in plaintext, viewable in game details
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
      ) : status !== GameStatus.ACTIVE ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">Game is not in active status</p>
        </div>
      ) : (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">Owner cannot join their own game</p>
        </div>
      )}
    </div>
  );
}

