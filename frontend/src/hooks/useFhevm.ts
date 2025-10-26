/**
 * FHEVM SDK Hook
 */

import { useState, useEffect } from "react";
import { initFhevm, resetFhevmInstance } from "../utils/fhevm";

export function useFhevm() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError(null);

      try {
        await initFhevm();
        
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("FHEVM 初始化失败:", err);
        
        if (mounted) {
          setError(err.message || "FHEVM 初始化失败");
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const reset = () => {
    resetFhevmInstance();
    setInitialized(false);
  };

  return {
    initialized,
    loading,
    error,
    reset,
  };
}


