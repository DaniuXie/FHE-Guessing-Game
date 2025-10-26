/**
 * Main App Component - With Auto Gateway Management
 */

import { useState, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/Header";
import { useContractType } from "./contexts/ContractContext";

// Lazy load components for better performance
const CreateGame = lazy(() => import("./components/CreateGame").then(module => ({ default: module.CreateGame })));
const GameList = lazy(() => import("./components/GameList").then(module => ({ default: module.GameList })));
const JoinGame = lazy(() => import("./components/JoinGame").then(module => ({ default: module.JoinGame })));
const GameDetails = lazy(() => import("./components/GameDetails").then(module => ({ default: module.GameDetails })));
const ContractSelector = lazy(() => import("./components/ContractSelector").then(module => ({ default: module.ContractSelector })));
const GatewayStatusBadge = lazy(() => import("./components/GatewayStatusBadge").then(module => ({ default: module.GatewayStatusBadge })));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
);

type View = "list" | "create" | "join" | "details";

function App() {
  const { contractType, setContractType } = useContractType();
  const [view, setView] = useState<View>("list");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh game list
  const refreshGames = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle game creation
  const handleGameCreated = (gameId: number) => {
    setSelectedGameId(gameId);
    setView("details");
    refreshGames();
  };

  // Handle game selection
  const handleSelectGame = (gameId: number) => {
    setSelectedGameId(gameId);
    setView("details");
  };

  // Handle game joined
  const handleJoined = () => {
    refreshGames();
    if (selectedGameId) {
      setView("details");
    }
  };

  // Handle game ended
  const handleGameEnded = () => {
    refreshGames();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          // Success toast style
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          // Error toast style
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
          // Loading toast style
          loading: {
            iconTheme: {
              primary: "#3b82f6",
              secondary: "#fff",
            },
          },
        }}
      />
      
      <Header />

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        {/* Gateway Status Badge (Auto Management) */}
        <Suspense fallback={<LoadingFallback />}>
          <GatewayStatusBadge />
        </Suspense>

        {/* Contract Selector (Manual Switch, Optional) */}
        <Suspense fallback={<LoadingFallback />}>
          <ContractSelector 
            currentContract={contractType}
            onContractChange={(type) => {
              setContractType(type);
              setRefreshTrigger(prev => prev + 1); // Refresh list after switching
            }}
          />
        </Suspense>

        {/* Mobile-optimized Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setView("list")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all min-h-[44px] ${
              view === "list"
                ? "bg-primary-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500"
            }`}
          >
            <span className="hidden sm:inline">🎲 Game List</span>
            <span className="sm:hidden">🎲 List</span>
          </button>

          <button
            onClick={() => setView("create")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all min-h-[44px] ${
              view === "create"
                ? "bg-primary-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500"
            }`}
          >
            <span className="hidden sm:inline">➕ Create Game</span>
            <span className="sm:hidden">➕ Create</span>
          </button>

          {selectedGameId && (
            <>
              <button
                onClick={() => {
                  setView("join");
                }}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all min-h-[44px] ${
                  view === "join"
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500"
                }`}
              >
                <span className="hidden sm:inline">🎯 Join Game #{selectedGameId}</span>
                <span className="sm:hidden">🎯 Join #{selectedGameId}</span>
              </button>

              <button
                onClick={() => {
                  setView("details");
                }}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all min-h-[44px] ${
                  view === "details"
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500"
                }`}
              >
                <span className="hidden sm:inline">📊 Game Details #{selectedGameId}</span>
                <span className="sm:hidden">📊 Details #{selectedGameId}</span>
              </button>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Game List (Always Visible) */}
          <div>
            <Suspense fallback={<LoadingFallback />}>
              <GameList
                onSelectGame={handleSelectGame}
                refreshTrigger={refreshTrigger}
              />
            </Suspense>
          </div>

          {/* Right: Dynamic Content */}
          <div>
            <Suspense fallback={<LoadingFallback />}>
              {view === "create" ? (
                <CreateGame onGameCreated={handleGameCreated} />
              ) : view === "join" && selectedGameId ? (
                <JoinGame gameId={selectedGameId} onJoined={handleJoined} />
              ) : view === "details" && selectedGameId ? (
                <GameDetails gameId={selectedGameId} onGameEnded={handleGameEnded} />
              ) : (
              <div className="card">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Welcome to Confidential Number Guessing Game
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Based on Zama FHEVM with full privacy protection
                  </p>

                  <div className="text-left max-w-md mx-auto space-y-3 text-sm text-gray-300">
                    <div className="flex items-start space-x-2">
                      <span>🔐</span>
                      <p>All guesses are fully encrypted, privacy guaranteed</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span>⚡</span>
                      <p>Smart contract computes results without decryption</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span>🏆</span>
                      <p>Player closest to target number wins entire prize pool</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span>✨</span>
                      <p>Fair, transparent, fully decentralized</p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center space-x-4">
                    <button
                      onClick={() => setView("create")}
                      className="btn-primary"
                    >
                      Create Game
                    </button>
                  </div>
                </div>
              </div>
              )}
            </Suspense>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-800">
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-2">
            Powered by{" "}
            <a
              href="https://www.zama.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              Zama FHEVM
            </a>
          </p>
          <p className="text-xs text-gray-500">
            Fully Homomorphic Encryption • Complete Privacy • Fully Decentralized
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

