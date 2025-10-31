/**
 * Contract Type Context - Default to Plaintext (Scheme B)
 * 
 * Features:
 * 1. Default to Plaintext mode (Scheme B)
 * 2. Gateway health detection
 * 3. Manual switch to FHE mode when Gateway is available
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type ContractType = "simple" | "fhe";
export type GatewayStatus = "up" | "down" | "checking";

interface ContractContextType {
  contractType: ContractType;
  setContractType: (type: ContractType) => void;
  gatewayStatus: GatewayStatus;
  isAutoMode: boolean;
  setAutoMode: (auto: boolean) => void;
  checkGatewayHealth: () => Promise<boolean>;
}

const ContractContext = createContext<ContractContextType | undefined>(
  undefined
);

// Gateway configuration
const GATEWAY_URL = "https://gateway.sepolia.zama.ai";
const POLLING_INTERVAL = 60000; // 60 seconds

// Status listeners
type StatusListener = (status: GatewayStatus) => void;
const statusListeners: StatusListener[] = [];

export function ContractProvider({ children }: { children: ReactNode }) {
  const [contractType, setContractType] = useState<ContractType>("simple"); // Default: Plaintext (Scheme B)
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("checking");
  const [isAutoMode, setAutoMode] = useState<boolean>(false); // Default: Manual mode, stay in Plaintext

  /**
   * Check Gateway health status
   */
  const checkGatewayHealth = useCallback(async (): Promise<boolean> => {
    const url = `${GATEWAY_URL}/public_key`;
    
    try {
      console.log("🔍 Checking Gateway status:", url);
      const resp = await fetch(url, { 
        method: "GET", 
        cache: "no-store",
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      
      if (!resp.ok) {
        console.warn(`⚠️ Gateway response error: HTTP ${resp.status}`);
        return false;
      }
      
      const text = await resp.text();
      const isValid = text.startsWith("0x04") && text.length >= 66;
      
      if (isValid) {
        console.log("✅ Gateway online");
      } else {
        console.warn("⚠️ Gateway returned invalid format");
      }
      
      return isValid;
    } catch (err) {
      console.warn("⚠️ Gateway unavailable:", err instanceof Error ? err.message : String(err));
      return false;
    }
  }, []);

  /**
   * Update Gateway status and notify listeners
   */
  const updateGatewayStatus = useCallback((newStatus: GatewayStatus) => {
    setGatewayStatus(newStatus);
    // Notify all listeners
    statusListeners.forEach(listener => listener(newStatus));
    console.log("📡 Gateway status updated:", newStatus);
  }, []);

  /**
   * Initialization and polling logic
   */
  useEffect(() => {
    let pollingTimer: NodeJS.Timeout | null = null;

    // Initial check
    const initCheck = async () => {
      console.log("🚀 Starting Gateway health check...");
      const isUp = await checkGatewayHealth();
      
      if (isUp) {
        updateGatewayStatus("up");
        if (isAutoMode) {
          setContractType("fhe");
          console.log("✅ Auto-enabled FHE mode");
        }
      } else {
        updateGatewayStatus("down");
        if (isAutoMode) {
          setContractType("simple");
          console.log("⚠️ Gateway offline, using Fallback mode");
        }
      }
    };

    initCheck();

    // Periodic polling
    if (isAutoMode) {
      pollingTimer = setInterval(async () => {
        const isUp = await checkGatewayHealth();
        const oldStatus = gatewayStatus;
        const newStatus: GatewayStatus = isUp ? "up" : "down";

        // Auto-switch on status change
        if (newStatus !== oldStatus && oldStatus !== "checking") {
          if (newStatus === "up" && gatewayStatus === "down") {
            console.log("🔄 Gateway recovered, switching to FHE mode");
            setContractType("fhe");
            updateGatewayStatus("up");
          } else if (newStatus === "down" && gatewayStatus === "up") {
            console.log("🔄 Gateway offline, switching to Fallback mode");
            setContractType("simple");
            updateGatewayStatus("down");
          }
        } else {
          updateGatewayStatus(newStatus);
        }
      }, POLLING_INTERVAL);

      console.log("⏱️ Gateway polling started (60s interval)");
    }

    // Cleanup
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        console.log("⏹️ Gateway polling stopped");
      }
    };
  }, [isAutoMode, checkGatewayHealth, updateGatewayStatus, gatewayStatus]);

  /**
   * Manual contract switch, disable auto mode
   */
  const handleSetContractType = useCallback((type: ContractType) => {
    console.log("👆 Manual contract switch:", type);
    setContractType(type);
    setAutoMode(false); // Exit auto mode after manual switch
  }, []);

  return (
    <ContractContext.Provider 
      value={{ 
        contractType, 
        setContractType: handleSetContractType, 
        gatewayStatus,
        isAutoMode,
        setAutoMode,
        checkGatewayHealth
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContractType() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error("useContractType must be used within a ContractProvider");
  }
  return context;
}

/**
 * 订阅 Gateway 状态变化
 */
export function onGatewayStatusChange(listener: StatusListener): () => void {
  statusListeners.push(listener);
  return () => {
    const index = statusListeners.indexOf(listener);
    if (index > -1) {
      statusListeners.splice(index, 1);
    }
  };
}

