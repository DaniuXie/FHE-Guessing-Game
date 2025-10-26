/**
 * Create Game Component
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { useContract } from "../hooks/useContractDual";
import { useWallet } from "../hooks/useWallet";
import { APP_CONFIG } from "../utils/constants";
import { validateNumber } from "../utils/format";

interface CreateGameProps {
  onGameCreated?: (gameId: number) => void;
}

export function CreateGame({ onGameCreated }: CreateGameProps) {
  const { isConnected } = useWallet();
  const { createGame, loading, contractType } = useContract();

  const [targetNumber, setTargetNumber] = useState("");
  const [entryFee, setEntryFee] = useState("0.001");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateNumber(
      targetNumber,
      APP_CONFIG.MIN_GUESS,
      APP_CONFIG.MAX_GUESS
    );

    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    const entryFeeNum = parseFloat(entryFee);
    if (
      isNaN(entryFeeNum) ||
      entryFeeNum < parseFloat(APP_CONFIG.MIN_ENTRY_FEE) ||
      entryFeeNum > parseFloat(APP_CONFIG.MAX_ENTRY_FEE)
    ) {
      toast.error(
        `Entry fee must be between ${APP_CONFIG.MIN_ENTRY_FEE} and ${APP_CONFIG.MAX_ENTRY_FEE} ETH`
      );
      return;
    }

    // Create game with toast promise
    const creationPromise = createGame(parseInt(targetNumber), entryFee);

    toast.promise(
      creationPromise,
      {
        loading: "Creating game...",
        success: (result) => {
          if (result.success && result.gameId) {
            setTargetNumber("");
            setEntryFee("0.001");
            
            if (onGameCreated) {
              onGameCreated(result.gameId);
            }
            
            return `✅ Game #${result.gameId} created successfully!`;
          }
          throw new Error(result.error || "Failed to create game");
        },
        error: (err) => `❌ ${err.message || "Failed to create game"}`,
      }
    );
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-400">Please connect wallet to create a game</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        🎮 Create New Game 
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Number */}
        <div>
          <label className="label">
            🎯 Target Number (1-100) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
            min={APP_CONFIG.MIN_GUESS}
            max={APP_CONFIG.MAX_GUESS}
            placeholder="Enter a number between 1 and 100"
            className="input"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            {contractType === "fhe" 
              ? "🔐 This number will be fully encrypted with FHE, completely confidential during the game"
              : "📝 This number will be stored in plaintext, for demonstration and learning only"}
          </p>
        </div>

        {/* Entry Fee */}
        <div>
          <label className="label">
            💰 Entry Fee (ETH) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            min={APP_CONFIG.MIN_ENTRY_FEE}
            max={APP_CONFIG.MAX_ENTRY_FEE}
            step="0.0001"
            placeholder="e.g.: 0.001"
            className="input"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            💎 Fee players need to pay to join the game
          </p>
        </div>

        {/* Game Rules */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">📋 Game Rules</h3>
          {contractType === "fhe" ? (
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 🔐 Target number and guesses are fully encrypted with FHE</li>
              <li>• ⚡ All data remains completely confidential during the game</li>
              <li>• 🚀 When ending the game, Gateway automatically decrypts and calculates the winner</li>
              <li>• 🏆 Player closest to the target number wins the entire prize pool</li>
              <li>• ⏱️ Decryption process takes approximately 5-15 seconds</li>
              <li>• ⚠️ FHE operations have higher gas costs, entry fee ≥ 0.001 ETH recommended</li>
            </ul>
          ) : (
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 📝 All data stored in plaintext (demo mode)</li>
              <li>• ⚡ Fast transactions, low gas cost</li>
              <li>• 🎯 Contract automatically calculates winner and transfers funds</li>
              <li>• 🏆 Player closest to the target number wins the entire prize pool</li>
              <li>• ✅ Ideal for learning and quick testing</li>
            </ul>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                viewBox="0 0 24 24"
              >
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
              Creating...
            </span>
          ) : (
            "Create Game"
          )}
        </button>
      </form>
    </div>
  );
}


