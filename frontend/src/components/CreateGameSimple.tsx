/**
 * 🔥 Simplified Create Game Component
 */

import { useState } from "react";
import { useContractSimple } from "../hooks/useContractSimple";
import { useWallet } from "../hooks/useWallet";

interface CreateGameSimpleProps {
  onGameCreated?: (gameId: number) => void;
}

export function CreateGameSimple({ onGameCreated }: CreateGameSimpleProps) {
  const { isConnected } = useWallet();
  const { createGame, loading } = useContractSimple();
  const [targetNumber, setTargetNumber] = useState("42");
  const [entryFee, setEntryFee] = useState("0.001");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Creating...");

    const result = await createGame(parseInt(targetNumber), entryFee);

    if (result.success) {
      setMessage(
        `✅ Game Created Successfully!\n` +
        `Game ID: #${result.gameId}\n` +
        `Transaction: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}\n` +
        `Check the game list on the left`
      );
      
      // Refresh game list only, don't navigate
      if (onGameCreated) {
        // Pass 0 to indicate refresh only
        setTimeout(() => {
          onGameCreated(0);
        }, 2000); // Wait 2 seconds for block confirmation
      }
      
      // Clear form
      setTargetNumber("42");
      setEntryFee("0.001");
    } else {
      setMessage("❌ Failed: " + result.error);
    }
  };

  if (!isConnected) {
    return <div className="card">Please connect your wallet first</div>;
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        🎮 Create Game
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Target Number (1-100)</label>
          <input
            type="number"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
            min="1"
            max="100"
            className="input"
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">Entry Fee (ETH)</label>
          <input
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            step="0.0001"
            className="input"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Creating..." : "Create Game"}
        </button>

        {message && (
          <div className={`mt-4 p-4 rounded text-sm whitespace-pre-line ${
            message.startsWith("✅") 
              ? "bg-green-500/10 border border-green-500/30 text-green-400" 
              : message.startsWith("❌")
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : "bg-gray-700 text-white"
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

