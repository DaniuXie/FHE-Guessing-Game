/**
 * Gateway Status Badge Component
 * Display current Gateway status and contract mode
 * 
 * Status Description:
 * - up (online): Gateway normal, using FHE encryption
 * - down (offline): Gateway unavailable, using Fallback plaintext mode
 * - checking: Checking Gateway status
 */

import { useEffect, useState } from "react";
import { useContractType, GatewayStatus, onGatewayStatusChange } from "../contexts/ContractContext";

export function GatewayStatusBadge() {
  const { gatewayStatus, contractType, isAutoMode, setAutoMode } = useContractType();
  const [showDetails, setShowDetails] = useState(false);

  // Configure display styles for different statuses
  const statusConfig: Record<GatewayStatus, {
    icon: string;
    text: string;
    description: string;
    bgColor: string;
    textColor: string;
  }> = {
    up: {
      icon: "🛡️",
      text: "FHE Encryption Online",
      description: "Gateway online, using full encryption mode",
      bgColor: "bg-green-500/20",
      textColor: "text-green-400",
    },
    down: {
      icon: "⚠️",
      text: "Fallback Mode",
      description: "Gateway offline, using plaintext test mode",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-400",
    },
    checking: {
      icon: "🔄",
      text: "Checking...",
      description: "Checking Gateway status",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
    },
  };

  const config = statusConfig[gatewayStatus];

  return (
    <div className="mb-4">
      {/* 主徽章 */}
      <div
        className={`
          ${config.bgColor} ${config.textColor}
          border border-current
          rounded-lg p-3
          transition-all duration-300
          hover:shadow-lg
          cursor-pointer
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">{config.icon}</span>
            <div>
              <div className="font-semibold text-sm">{config.text}</div>
              <div className="text-xs opacity-75">
                Current: {contractType === "fhe" ? "Scheme A (FHE)" : "Scheme B (Plaintext)"}
              </div>
            </div>
          </div>

          {/* Auto/Manual Mode Indicator */}
          <div className="flex items-center gap-2">
            {isAutoMode ? (
              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">
                🤖 Auto
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-400/30">
                👆 Manual
              </span>
            )}
            <span className="text-xs opacity-50">
              {showDetails ? "▼" : "▶"}
            </span>
          </div>
        </div>
      </div>

      {/* Details (shown when expanded) */}
      {showDetails && (
        <div className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-sm">
          <div className="space-y-3">
            {/* Status Description */}
            <div>
              <div className="font-semibold text-gray-300 mb-1">Status Info</div>
              <p className="text-gray-400 text-xs">{config.description}</p>
            </div>

            {/* Contract Information */}
            <div>
              <div className="font-semibold text-gray-300 mb-2">Contract Info</div>
              <div className="space-y-1 text-xs text-gray-400">
                {contractType === "fhe" ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-400">🔐</span>
                      <div>
                        <div className="font-semibold text-purple-400">Scheme A - FHE Full Encryption</div>
                        <div className="mt-1">Target number and guesses fully encrypted</div>
                        <div className="mt-1 font-mono text-xs">
                          0x39686A...c442E3
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">📝</span>
                      <div>
                        <div className="font-semibold text-blue-400">Scheme B - Plaintext Test Version</div>
                        <div className="mt-1">Data in plaintext, convenient for testing</div>
                        <div className="mt-1 font-mono text-xs">
                          0x6bD042...377e
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Auto Mode Control */}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-300 mb-1">Auto Switch</div>
                  <p className="text-xs text-gray-400">
                    {isAutoMode 
                      ? "Auto-select contract based on Gateway status" 
                      : "Manual contract selection (auto-switch disabled)"
                    }
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoMode(!isAutoMode);
                  }}
                  className={`
                    px-3 py-1 rounded text-xs font-semibold transition-all
                    ${isAutoMode 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                    }
                  `}
                >
                  {isAutoMode ? "Disable" : "Enable"}
                </button>
              </div>
            </div>

            {/* Gateway Status History (optional) */}
            <div className="pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Auto-check Gateway health every 60 seconds</span>
                </div>
                {gatewayStatus === "down" && (
                  <div className="mt-2 flex items-start gap-2 text-orange-400">
                    <span>💡</span>
                    <span>Will auto-switch back to FHE mode when Gateway recovers</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

