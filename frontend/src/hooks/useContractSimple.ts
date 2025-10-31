/**
 * 🔥 最简化的合约交互 Hook
 * 回到最基础的实现，去掉所有复杂的逻辑
 */

import { useState, useCallback, useMemo } from "react";
import { Contract, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/constants";
import { useWallet } from "./useWallet";

export function useContractSimple() {
  const { provider, address } = useWallet();
  const [loading, setLoading] = useState(false);

  // 创建合约实例
  const contract = useMemo(() => {
    if (!provider || !address) return null;
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [provider, address]);

  // 创建游戏 - 最简化版本
  const createGame = useCallback(
    async (targetNumber: number, entryFeeEth: string) => {
      if (!contract || !address || !provider) {
        throw new Error("Please connect wallet first");
      }

      setLoading(true);

      try {
        console.log("🎮 Creating game (Plaintext mode)");
        console.log("   Target number:", targetNumber);
        console.log("   Entry fee:", entryFeeEth, "ETH");
        console.log("   Contract address:", CONTRACT_ADDRESS);
        console.log("   User address:", address);

        console.log("⏳ Step 1: Getting signer...");
        const signer = await provider.getSigner();
        console.log("✅ Signer obtained");
        
        console.log("⏳ Step 2: Connecting contract...");
        const contractWithSigner = contract.connect(signer);
        console.log("✅ Contract connected");
        
        console.log("⏳ Step 3: Converting entry fee...");
        const entryFee = parseEther(entryFeeEth);
        console.log("✅ Entry fee converted:", entryFee.toString());

        console.log("⏳ Step 4: Preparing transaction data...");
        
        // Use native window.ethereum API (bypass ethers.js)
        console.log("🔧 Using native window.ethereum API (bypassing ethers.js)...");
        
        // Encode function call
        const iface = contractWithSigner.interface;
        const data = iface.encodeFunctionData("createGame", [targetNumber, entryFee]);
        
        console.log("   Transaction data:", data);
        console.log("   Target address:", CONTRACT_ADDRESS);
        console.log("   msg.value:", entryFee.toString());
        console.log("🚀 Calling window.ethereum.request...");
        
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            value: '0x' + entryFee.toString(16),
            data: data,
          }]
        });

        console.log("✅ 交易已发送:", txHash);
        console.log("⏳ 等待交易确认...");
        console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/tx/${txHash}`);
        
        // 使用多个 RPC 节点轮询（更可靠）
        console.log("🔄 使用多个 RPC 节点轮询交易状态...");
        
        // Sepolia 公共 RPC 节点列表
        const rpcUrls = [
          "https://rpc.sepolia.org",
          "https://eth-sepolia.public.blastapi.io", 
          "https://sepolia.gateway.tenderly.co",
          "https://ethereum-sepolia-rpc.publicnode.com",
        ];
        
        let receipt = null;
        let attempts = 0;
        
        while (!receipt && attempts < 60) { // 最多等待 3 分钟
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒间隔
          
          // 轮流使用不同的 RPC 节点
          const rpcUrl = rpcUrls[attempts % rpcUrls.length];
          console.log(`   尝试 ${attempts}/60: 使用 ${rpcUrl.split('/')[2]}...`);
          
          try {
            // 直接用 fetch 调用 RPC（最原始的方式）
            const response = await Promise.race([
              fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionReceipt',
                  params: [txHash],
                  id: 1
                })
              }),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error("请求超时")), 5000)
              )
            ]);
            
            const data = await response.json();
            
            if (data.result) {
              receipt = data.result;
              console.log("   ✅ 收到收据!");
              console.log("      区块:", parseInt(receipt.blockNumber, 16));
              console.log("      状态:", receipt.status);
              
              if (receipt.status === "0x1") {
                console.log("✅ 交易确认成功！");
                break;
              } else {
                console.error("❌ 交易被 revert");
                throw new Error("Transaction reverted");
              }
            } else {
              console.log("   ⏳ 交易仍在 pending...");
            }
          } catch (err: any) {
            console.error(`   ⚠️ 查询出错: ${err.message}`);
          }
        }
        
        if (!receipt) {
          console.error("❌ 轮询超时，但交易可能已成功");
          throw new Error("交易确认超时（请在 Etherscan 查看交易状态）");
        }
        
        // 解析 gameId
        let gameId = 0;
        if (receipt.logs && receipt.logs.length > 0) {
          const gameCreatedTopic = "0x7ed9b48d83e08a25a1572b27a365dfb386da7860c996e684e541e3433b792147";
          const log = receipt.logs.find((l: any) => l.topics[0] === gameCreatedTopic);
          
          if (log && log.topics[1]) {
            gameId = parseInt(log.topics[1], 16);
            console.log("🎮 Successfully created game #" + gameId);
          }
        }

        setLoading(false);
        return { success: true, gameId, txHash: receipt.transactionHash };
      } catch (err: any) {
        console.error("❌ Failed to create game:", err);
        setLoading(false);
        return { success: false, error: err.message };
      }
    },
    [contract, address, provider]
  );

  // Get total games (with automatic fallback)
  const getTotalGames = useCallback(
    async () => {
      // Step 1: Try MetaMask
      try {
        console.log(`🔍 [Method 1] Querying total games using MetaMask...`);
        console.log("   Contract address:", CONTRACT_ADDRESS);
        
        const data = "0x7b2f1595"; // getTotalGames()
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        const from = accounts[0];
        
        const callPromise = (window as any).ethereum.request({
          method: 'eth_call',
          params: [{ from, to: CONTRACT_ADDRESS, data }, 'latest']
        });
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );
        
        const result = await Promise.race([callPromise, timeoutPromise]);
        const totalNum = parseInt(result, 16);
        console.log("✅ MetaMask succeeded! Total games:", totalNum);
        return totalNum;
      } catch (err: any) {
        console.warn("⚠️ MetaMask failed:", err.message);
      }

      // Step 2: Fallback to public RPC
      const fallbackRPCs = [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://eth-sepolia.public.blastapi.io",
        "https://sepolia.gateway.tenderly.co",
      ];

      for (const rpcUrl of fallbackRPCs) {
        try {
          console.log(`🔁 [Fallback] Trying public RPC: ${rpcUrl.split("//")[1].split("/")[0]}`);
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          
          const totalPromise = contract.getTotalGames();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
          );
          
          const total = await Promise.race([totalPromise, timeoutPromise]);
          const totalNum = Number(total);
          console.log("✅ Fallback succeeded! Total games:", totalNum);
          return totalNum;
        } catch (err: any) {
          console.warn(`   ❌ ${rpcUrl.split("//")[1].split("/")[0]} failed`);
          continue;
        }
      }

      console.error("❌ All query methods failed");
      return 0;
    },
    []
  );

  // Get game info (with automatic fallback)
  const getGameInfo = useCallback(
    async (gameId: number) => {
      // Step 1: Try MetaMask
      try {
        console.log(`🔍 [Method 1] Querying game #${gameId} using MetaMask...`);
        
        const functionSig = "0x82d2f1e0";
        const paddedGameId = gameId.toString(16).padStart(64, "0");
        const data = functionSig + paddedGameId;
        
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        const from = accounts[0];
        
        const callPromise = (window as any).ethereum.request({
          method: 'eth_call',
          params: [{ from, to: CONTRACT_ADDRESS, data }, 'latest']
        });
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );
        
        const result = await Promise.race([callPromise, timeoutPromise]);
        const hexData = result.slice(2);
        const info = {
          id: parseInt(hexData.slice(0, 64), 16),
          target: parseInt(hexData.slice(64, 128), 16),
          owner: "0x" + hexData.slice(152, 192),
          entryFee: BigInt("0x" + hexData.slice(192, 256)),
          prizePool: BigInt("0x" + hexData.slice(256, 320)),
          playerCount: parseInt(hexData.slice(320, 384), 16),
          status: parseInt(hexData.slice(384, 448), 16),
          winner: "0x" + hexData.slice(472, 512),
          createdAt: parseInt(hexData.slice(512, 576), 16),
        };
        console.log(`✅ MetaMask succeeded! Game #${gameId}:`, info);
        return info;
      } catch (err: any) {
        console.warn(`⚠️ MetaMask failed:`, err.message);
      }

      // Step 2: Fallback to public RPC
      const fallbackRPCs = [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://eth-sepolia.public.blastapi.io",
        "https://sepolia.gateway.tenderly.co",
      ];

      for (const rpcUrl of fallbackRPCs) {
        try {
          console.log(`🔁 [Fallback] Trying public RPC: ${rpcUrl.split("//")[1].split("/")[0]}`);
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          
          const infoPromise = contract.getGameInfo(gameId);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
          );
          
          const info = await Promise.race([infoPromise, timeoutPromise]);
          console.log(`✅ Fallback succeeded! Game #${gameId}`);
          return info;
        } catch (err: any) {
          console.warn(`   ❌ ${rpcUrl.split("//")[1].split("/")[0]} failed`);
          continue;
        }
      }

      console.error(`❌ All query methods failed`);
      throw new Error("Query failed");
    },
    []
  );

  // Join game
  const joinGame = useCallback(
    async (gameId: number, guess: number, entryFee: bigint) => {
      if (!contract || !address || !provider) {
        throw new Error("Please connect wallet first");
      }

      setLoading(true);

      try {
        console.log("🎯 Joining game (Plaintext mode)");
        console.log("   Game ID:", gameId);
        console.log("   Guess:", guess);
        console.log("   Entry fee:", entryFee.toString());
        console.log("   Contract address:", CONTRACT_ADDRESS);
        console.log("   User address:", address);

        console.log("⏳ Step 1: Getting signer...");
        const signer = await provider.getSigner();
        console.log("✅ Signer obtained");
        
        console.log("⏳ Step 2: Connecting contract...");
        const contractWithSigner = contract.connect(signer);
        console.log("✅ Contract connected");
        
        console.log("⏳ Step 3: Preparing transaction data...");
        
        // Use native window.ethereum API (bypass ethers.js)
        console.log("🔧 Using native window.ethereum API (bypassing ethers.js)...");
        
        // Encode function call
        const iface = contractWithSigner.interface;
        const data = iface.encodeFunctionData("joinGame", [gameId, guess]);
        
        console.log("   Transaction data:", data);
        console.log("   Target address:", CONTRACT_ADDRESS);
        console.log("   msg.value:", entryFee.toString());
        console.log("🚀 Calling window.ethereum.request...");
        
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            value: '0x' + entryFee.toString(16),
            data: data,
          }]
        });

        console.log("✅ Transaction sent:", txHash);
        console.log("⏳ Waiting for transaction confirmation...");
        console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/tx/${txHash}`);
        
        // Poll using multiple RPC nodes (more reliable)
        console.log("🔄 Polling transaction status using multiple RPC nodes...");
        
        // Sepolia public RPC node list
        const rpcUrls = [
          "https://rpc.sepolia.org",
          "https://eth-sepolia.public.blastapi.io", 
          "https://sepolia.gateway.tenderly.co",
          "https://ethereum-sepolia-rpc.publicnode.com",
        ];
        
        let receipt = null;
        let attempts = 0;
        
        while (!receipt && attempts < 60) { // Max wait 3 minutes
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second interval
          
          // Rotate through different RPC nodes
          const rpcUrl = rpcUrls[attempts % rpcUrls.length];
          console.log(`   Attempt ${attempts}/60: Using ${rpcUrl.split('/')[2]}...`);
          
          try {
            // Direct fetch to RPC (most primitive method)
            const response = await Promise.race([
              fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionReceipt',
                  params: [txHash],
                  id: 1
                })
              }),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error("Request timeout")), 5000)
              )
            ]);
            
            const data = await response.json();
            
            if (data.result) {
              receipt = data.result;
              console.log("   ✅ Receipt received!");
              console.log("      Block:", parseInt(receipt.blockNumber, 16));
              console.log("      Status:", receipt.status);
              
              if (receipt.status === "0x1") {
                console.log("✅ Transaction confirmed successfully!");
                break;
              } else {
                console.error("❌ Transaction reverted");
                throw new Error("Transaction reverted");
              }
            } else {
              console.log("   ⏳ Transaction still pending...");
            }
          } catch (err: any) {
            console.error(`   ⚠️ Query error: ${err.message}`);
          }
        }
        
        if (!receipt) {
          console.error("❌ Polling timeout, but transaction may have succeeded");
          throw new Error("Transaction confirmation timeout (Please check status on Etherscan)");
        }

        console.log("🎯 Successfully joined game #" + gameId);

        setLoading(false);
        return { success: true, txHash: receipt.transactionHash };
      } catch (err: any) {
        console.error("❌ Failed to join game:", err);
        setLoading(false);
        return { success: false, error: err.message };
      }
    },
    [contract, address, provider]
  );

  // End game
  const endGame = useCallback(
    async (gameId: number) => {
      if (!contract || !address || !provider) {
        throw new Error("Please connect wallet first");
      }

      setLoading(true);

      try {
        console.log("🏁 Ending game");
        console.log("   Game ID:", gameId);
        console.log("   Contract address:", CONTRACT_ADDRESS);
        console.log("   User address:", address);

        console.log("⏳ Step 1: Getting signer...");
        const signer = await provider.getSigner();
        console.log("✅ Signer obtained");
        
        console.log("⏳ Step 2: Connecting contract...");
        const contractWithSigner = contract.connect(signer);
        console.log("✅ Contract connected");
        
        console.log("⏳ Step 3: Preparing transaction data...");
        
        // Use native window.ethereum API
        console.log("🔧 Using native window.ethereum API...");
        
        // Encode function call
        const iface = contractWithSigner.interface;
        const data = iface.encodeFunctionData("endGame", [gameId]);
        
        console.log("   Transaction data:", data);
        console.log("   Target address:", CONTRACT_ADDRESS);
        console.log("🚀 Calling window.ethereum.request...");
        
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            data: data,
          }]
        });

        console.log("✅ Transaction sent:", txHash);
        console.log("⏳ Waiting for transaction confirmation...");
        console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/tx/${txHash}`);
        
        // Poll using multiple RPC nodes
        console.log("🔄 Polling transaction status using multiple RPC nodes...");
        
        const rpcUrls = [
          "https://rpc.sepolia.org",
          "https://eth-sepolia.public.blastapi.io", 
          "https://sepolia.gateway.tenderly.co",
          "https://ethereum-sepolia-rpc.publicnode.com",
        ];
        
        let receipt = null;
        let attempts = 0;
        
        while (!receipt && attempts < 60) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const rpcUrl = rpcUrls[attempts % rpcUrls.length];
          console.log(`   Attempt ${attempts}/60: Using ${rpcUrl.split('/')[2]}...`);
          
          try {
            const response = await Promise.race([
              fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionReceipt',
                  params: [txHash],
                  id: 1
                })
              }),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error("Request timeout")), 5000)
              )
            ]);
            
            const data = await response.json();
            
            if (data.result) {
              receipt = data.result;
              console.log("   ✅ Receipt received!");
              console.log("      Block:", parseInt(receipt.blockNumber, 16));
              console.log("      Status:", receipt.status);
              
              if (receipt.status === "0x1") {
                console.log("✅ Transaction confirmed successfully!");
                break;
              } else {
                console.error("❌ Transaction reverted");
                throw new Error("Transaction reverted");
              }
            } else {
              console.log("   ⏳ Transaction still pending...");
            }
          } catch (err: any) {
            console.error(`   ⚠️ Query error: ${err.message}`);
          }
        }
        
        if (!receipt) {
          console.error("❌ Polling timeout, but transaction may have succeeded");
          throw new Error("Transaction confirmation timeout (Please check status on Etherscan)");
        }

        console.log("🏁 Game ended #" + gameId);

        setLoading(false);
        return { success: true, txHash: receipt.transactionHash };
      } catch (err: any) {
        console.error("❌ Failed to end game:", err);
        setLoading(false);
        return { success: false, error: err.message };
      }
    },
    [contract, address, provider]
  );

  return {
    createGame,
    joinGame,
    endGame,
    getTotalGames,
    getGameInfo,
    loading,
    contractType: "simple" as const,
  };
}

