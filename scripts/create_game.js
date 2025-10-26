const hre = require("hardhat");
const { createInstance } = require("@zama-fhe/relayer-sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * SDK配置 - Sepolia Coprocessor
 */
const SDK_CONFIG = {
  chainId: 11155111,
  networkUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
  relayerUrl: "https://relayer.testnet.zama.cloud",
  gatewayUrl: "https://gateway.sepolia.zama.ai/",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
};

/**
 * 创建游戏测试脚本
 */
async function main() {
  console.log("🎮 创建加密数字猜谜游戏...\n");
  
  // 读取部署信息
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ 错误: 未找到 deployment.json 文件");
    console.log("💡 请先运行: npm run deploy");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  
  console.log("📍 合约地址:", contractAddress);
  
  // 获取签名者
  const [signer] = await hre.ethers.getSigners();
  console.log("👤 创建者地址:", signer.address);
  
  // 检查余额
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");
  
  // 连接合约
  const GuessGame = await hre.ethers.getContractFactory("GuessGame");
  const contract = GuessGame.attach(contractAddress);
  
  // 初始化 SDK
  console.log("🔧 初始化 fhEVM SDK...");
  const sdk = await createInstance(SDK_CONFIG);
  console.log("✅ SDK 初始化成功\n");
  
  // 游戏参数
  const targetNumber = 42;  // 目标数字（1-100）
  const entryFee = hre.ethers.parseEther("0.001");  // 0.001 ETH
  
  console.log("🎯 游戏设置:");
  console.log("   目标数字:", targetNumber, "(加密)");
  console.log("   入场费:", hre.ethers.formatEther(entryFee), "ETH\n");
  
  // 加密目标数字
  console.log("🔐 加密目标数字...");
  const encryptedInput = await sdk.createEncryptedInput(
    signer.address,
    contractAddress
  );
  const encryptedTarget = await encryptedInput.add32(targetNumber);
  const inputProof = await encryptedInput.encrypt();
  console.log("✅ 加密完成\n");
  
  // 创建游戏
  console.log("📡 发送创建游戏交易...");
  const tx = await contract.createGame(
    encryptedTarget,
    inputProof,
    entryFee
  );
  
  console.log("⏳ 等待交易确认...");
  console.log("   交易哈希:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ 交易已确认\n");
  
  // 解析事件获取游戏ID
  const gameCreatedEvent = receipt.logs.find(
    log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === "GameCreated";
      } catch {
        return false;
      }
    }
  );
  
  let gameId;
  if (gameCreatedEvent) {
    const parsed = contract.interface.parseLog(gameCreatedEvent);
    gameId = parsed.args.gameId;
    console.log("🎮 游戏创建成功!");
    console.log("   游戏 ID:", gameId.toString());
    console.log("   区块号:", receipt.blockNumber);
    console.log("   Gas 消耗:", receipt.gasUsed.toString());
  } else {
    // 备选方案：查询合约获取最新游戏ID
    gameId = await contract.getTotalGames();
    console.log("🎮 游戏创建成功!");
    console.log("   游戏 ID:", gameId.toString());
  }
  
  // 查询游戏信息
  console.log("\n📊 游戏信息:");
  const gameInfo = await contract.getGameInfo(gameId);
  console.log("   房主:", gameInfo.owner);
  console.log("   入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
  console.log("   奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
  console.log("   玩家数:", gameInfo.playerCount.toString());
  console.log("   状态:", ["ACTIVE", "CALCULATING", "ENDED"][gameInfo.status]);
  
  // 保存游戏信息用于后续测试
  const gameInfoPath = path.join(__dirname, "..", "last_game.json");
  fs.writeFileSync(gameInfoPath, JSON.stringify({
    gameId: gameId.toString(),
    targetNumber: targetNumber,  // 仅用于测试，实际不应保存
    entryFee: entryFee.toString(),
    creator: signer.address,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log("\n💾 游戏信息已保存到 last_game.json");
  
  console.log("\n📋 后续步骤:");
  console.log("1. 使用其他账户加入游戏:");
  console.log("   npm run join-game");
  console.log("2. 结束游戏并查看结果:");
  console.log("   npm run end-game");
  console.log("\n🎉 完成!");
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 创建游戏失败:", error);
    process.exit(1);
  });



