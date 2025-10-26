/**
 * Wallet Connection Hook
 */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { BrowserProvider } from "ethers";
import { SEPOLIA_NETWORK } from "../utils/constants";

export interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask is installed
  const hasMetaMask = useCallback(() => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!hasMetaMask()) {
      const errorMsg = "Please install MetaMask wallet";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
      }));
      toast.error(errorMsg);
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    const connectionPromise = (async () => {
      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      // Get chain ID
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if on Sepolia network
      if (chainId !== 11155111) {
        // Try to switch to Sepolia
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_NETWORK.chainId }],
          });
          // Switch successful, get new network info
          const newNetwork = await provider.getNetwork();
          const newChainId = Number(newNetwork.chainId);
          
          setState({
            address,
            provider,
            chainId: newChainId,
            isConnecting: false,
            error: null,
          });
          
          return address;
        } catch (switchError: any) {
          // If network doesn't exist, try to add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [SEPOLIA_NETWORK],
              });
              // Add successful, get new network info
              const newNetwork = await provider.getNetwork();
              const newChainId = Number(newNetwork.chainId);
              
              setState({
                address,
                provider,
                chainId: newChainId,
                isConnecting: false,
                error: null,
              });
              
              return address;
            } catch (addError) {
              throw new Error("Unable to add Sepolia network");
            }
          } else {
            throw new Error("Please switch to Sepolia testnet");
          }
        }
      } else {
        setState({
          address,
          provider,
          chainId,
          isConnecting: false,
          error: null,
        });
        
        return address;
      }
    })();

    toast.promise(
      connectionPromise,
      {
        loading: "Connecting wallet...",
        success: (address) => `✅ Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
        error: (err) => {
          console.error("Wallet connection failed:", err);
          const errorMessage = err.message || "Connection failed";
          
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: errorMessage,
          }));
          
          return `❌ ${errorMessage}`;
        },
      }
    );
  }, [hasMetaMask]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      provider: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
    toast.success("Wallet disconnected");
    console.log("🔌 Wallet disconnected");
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!hasMetaMask()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        // Account changed, reconnect
        toast.info("Account changed, reconnecting...");
        connect();
      }
    };

    const handleChainChanged = () => {
      // Chain changed, reload page
      toast.info("Network changed, reloading page...");
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [hasMetaMask, connect, disconnect, state.address]);

  // Check connection status on page load
  useEffect(() => {
    if (!hasMetaMask()) return;

    const checkConnection = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        
        if (accounts.length > 0) {
          // Already connected, auto-restore connection state
          connect();
        }
      } catch (error) {
        console.error("Failed to check connection status:", error);
      }
    };

    checkConnection();
  }, [hasMetaMask, connect]);

  return {
    ...state,
    isConnected: !!state.address,
    connect,
    disconnect,
    hasMetaMask: hasMetaMask(),
  };
}

