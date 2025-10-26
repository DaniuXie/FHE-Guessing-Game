/**
 * Header Component
 */

import { useWallet } from "../hooks/useWallet";
import { formatAddress } from "../utils/format";

export function Header() {
  const { address, isConnected, connect, disconnect, hasMetaMask, isConnecting } = useWallet();

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Confidential Number Guessing</h1>
              <p className="text-xs text-gray-400">Powered by Zama FHEVM</p>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            {!hasMetaMask ? (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Install MetaMask
              </a>
            ) : isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Address Display */}
                <div className="bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono text-white">
                      {formatAddress(address!)}
                    </span>
                  </div>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="btn-secondary"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


