/**
 * 合约类型上下文 - 带 Gateway 自动检测和 Fallback
 * 
 * 功能：
 * 1. 自动检测 Gateway 健康状态
 * 2. Gateway 可用时自动使用 FHE 合约
 * 3. Gateway 不可用时自动降级到明文合约
 * 4. 定时轮询（60秒）并自动切换
 * 5. 状态变化通知机制
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

// Gateway 配置
const GATEWAY_URL = "https://gateway.sepolia.zama.ai";
const POLLING_INTERVAL = 60000; // 60秒

// 状态监听器
type StatusListener = (status: GatewayStatus) => void;
const statusListeners: StatusListener[] = [];

export function ContractProvider({ children }: { children: ReactNode }) {
  const [contractType, setContractType] = useState<ContractType>("simple");
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("checking");
  const [isAutoMode, setAutoMode] = useState<boolean>(true); // 默认自动模式

  /**
   * 检查 Gateway 健康状态
   */
  const checkGatewayHealth = useCallback(async (): Promise<boolean> => {
    const url = `${GATEWAY_URL}/public_key`;
    
    try {
      console.log("🔍 检测 Gateway 状态:", url);
      const resp = await fetch(url, { 
        method: "GET", 
        cache: "no-store",
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      if (!resp.ok) {
        console.warn(`⚠️ Gateway 响应异常: HTTP ${resp.status}`);
        return false;
      }
      
      const text = await resp.text();
      const isValid = text.startsWith("0x04") && text.length >= 66;
      
      if (isValid) {
        console.log("✅ Gateway 在线");
      } else {
        console.warn("⚠️ Gateway 返回格式无效");
      }
      
      return isValid;
    } catch (err) {
      console.warn("⚠️ Gateway 不可用:", err instanceof Error ? err.message : String(err));
      return false;
    }
  }, []);

  /**
   * 更新 Gateway 状态并通知监听器
   */
  const updateGatewayStatus = useCallback((newStatus: GatewayStatus) => {
    setGatewayStatus(newStatus);
    // 通知所有监听器
    statusListeners.forEach(listener => listener(newStatus));
    console.log("📡 Gateway 状态更新:", newStatus);
  }, []);

  /**
   * 初始化和轮询逻辑
   */
  useEffect(() => {
    let pollingTimer: NodeJS.Timeout | null = null;

    // 初始检查
    const initCheck = async () => {
      console.log("🚀 启动 Gateway 健康检查...");
      const isUp = await checkGatewayHealth();
      
      if (isUp) {
        updateGatewayStatus("up");
        if (isAutoMode) {
          setContractType("fhe");
          console.log("✅ 自动启用 FHE 模式");
        }
      } else {
        updateGatewayStatus("down");
        if (isAutoMode) {
          setContractType("simple");
          console.log("⚠️ Gateway 离线，使用 Fallback 模式");
        }
      }
    };

    initCheck();

    // 定时轮询
    if (isAutoMode) {
      pollingTimer = setInterval(async () => {
        const isUp = await checkGatewayHealth();
        const oldStatus = gatewayStatus;
        const newStatus: GatewayStatus = isUp ? "up" : "down";

        // 状态变化时自动切换
        if (newStatus !== oldStatus && oldStatus !== "checking") {
          if (newStatus === "up" && gatewayStatus === "down") {
            console.log("🔄 Gateway 恢复，自动切换到 FHE 模式");
            setContractType("fhe");
            updateGatewayStatus("up");
          } else if (newStatus === "down" && gatewayStatus === "up") {
            console.log("🔄 Gateway 离线，自动切换到 Fallback 模式");
            setContractType("simple");
            updateGatewayStatus("down");
          }
        } else {
          updateGatewayStatus(newStatus);
        }
      }, POLLING_INTERVAL);

      console.log("⏱️ Gateway 轮询已启动（60秒间隔）");
    }

    // 清理
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        console.log("⏹️ Gateway 轮询已停止");
      }
    };
  }, [isAutoMode, checkGatewayHealth, updateGatewayStatus, gatewayStatus]);

  /**
   * 手动切换合约时，关闭自动模式
   */
  const handleSetContractType = useCallback((type: ContractType) => {
    console.log("👆 手动切换合约:", type);
    setContractType(type);
    setAutoMode(false); // 手动切换后退出自动模式
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

