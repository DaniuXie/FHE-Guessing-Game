/**
 * Contract Selector Component
 * Currently showing Scheme B (Plaintext Version)
 */

import { ContractType } from "../contexts/ContractContext";

interface ContractSelectorProps {
  currentContract: ContractType;
  onContractChange: (type: ContractType) => void;
}

export function ContractSelector({
  currentContract,
  onContractChange,
}: ContractSelectorProps) {
  return (
    <div className="mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Contract Version</h3>
        <span className="text-xs text-gray-500">Select Test Version</span>
      </div>

      <div className="flex gap-3">
        {/* Scheme B - Plaintext */}
        <button
          onClick={() => onContractChange("simple")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            currentContract === "simple"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📝</span>
              <span>Scheme B</span>
            </div>
            <p className="text-xs opacity-75">Plaintext (Recommended for testing)</p>
          </div>
        </button>

        {/* Scheme A - FHE */}
        <button
          onClick={() => onContractChange("fhe")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            currentContract === "fhe"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔐</span>
              <span>Scheme A</span>
            </div>
            <p className="text-xs opacity-75">FHE Full Encryption</p>
          </div>
        </button>
      </div>

      {/* Current Selection Info */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-blue-400">ℹ️</span>
          <div>
            {currentContract === "simple" ? (
              <>
                <p className="font-semibold text-gray-300 mb-1">
                  Current: Scheme B - Plaintext
                </p>
                <p>
                  • All data in plaintext, convenient for testing and learning
                  <br />
                  • Fast transactions, low gas cost
                  <br />
                  • Contract Address: 0x6bD042...377e
                  <br />• ✅ Stable and available
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-300 mb-1">
                  Current: Scheme A - FHE Full Encryption
                </p>
                <p>
                  • Target number and guesses fully encrypted
                  <br />
                  • Gateway auto-decryption callback
                  <br />
                  • Contract Address: 0x39686A...c442E3
                  <br />• ✅ Enabled, ready to test
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
