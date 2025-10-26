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
 * 加入游戏测试脚本
 */
async function main() {
  console.log("🎯 加入数字猜谜游戏...\n");
  
  // 读取部署信息
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ 错误: 未找到 deployment.json 文件");
    console.log("💡 请先运行: npm run deploy");
    process.exit(1);
  }
  
  // 读取游戏信息
  const gameInfoPath = path.join(__dirname, "..", "last_game.json");
  if (!fs.existsSync(gameInfoPath)) {
    console.error("❌ 错误: 未找到 last_game.json 文件");
    console.log("💡 请先运行: npm run create-game");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const gameData = JSON.parse(fs.readFileSync(gameInfoPath, "utf8"));
  
  const contractAddress = deployment.contractAddress;
  const gameId = gameData.gameId;
  
  console.log("📍 合约地址:", contractAddress);
  console.log("🎮 游戏 ID:", gameId);
  
  // 获取签名者（使用账户索引1作为玩家）
  const accounts = await hre.ethers.getSigners();
  const player = accounts.length > 1 ? accounts[1] : accounts[0];
  
  console.log("👤 玩家地址:", player.address);
  
  // 检查余额
  const balance = await hre.ethers.provider.getBalance(player.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");
  
  // 连接合约
  const GuessGame = await hre.ethers.getContractFactory("GuessGame");
  const contract = GuessGame.attach(contractAddress).connect(player);
  
  // 查询游戏信息
  console.log("📊 游戏信息:");
  const gameInfo = await contract.getGameInfo(gameId);
  console.log("   房主:", gameInfo.owner);
  console.log("   入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
  console.log("   奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
  console.log("   玩家数:", gameInfo.playerCount.toString());
  console.log("   状态:", ["ACTIVE", "CALCULATING", "ENDED"][gameInfo.status]);
  
  // 检查游戏状态
  if (gameInfo.status !== 0) {
    console.error("\n❌ 错误: 游戏不在活动状态");
    process.exit(1);
  }
  
  // 检查是否已经猜测
  const hasGuessed = await contract.hasPlayerGuessed(gameId, player.address);
  if (hasGuessed) {
    console.error("\n❌ 错误: 该账户已经提交过猜测");
    process.exit(1);
  }
  
  // 初始化 SDK
  console.log("\n🔧 初始化 fhEVM SDK...");
  const sdk = await createInstance(SDK_CONFIG);
  console.log("✅ SDK 初始化成功\n");
  
  // 玩家的猜测
  const guess = 50;  // 可以修改为任意1-100的数字
  console.log("🎲 你的猜测:", guess, "(将被加密)\n");
  
  // 加密猜测
  console.log("🔐 加密猜测...");
  const encryptedInput = await sdk.createEncryptedInput(
    player.address,
    contractAddress
  );
  const encryptedGuess = await encryptedInput.add32(guess);
  const inputProof = await encryptedInput.encrypt();
  console.log("✅ 加密完成\n");
  
  // 提交猜测
  console.log("📡 发送加入游戏交易...");
  const tx = await contract.joinGame(
    gameId,
    encryptedGuess,
    inputProof,
    { value: gameInfo.entryFee }
  );
  
  console.log("⏳ 等待交易确认...");
  console.log("   交易哈希:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ 交易已确认\n");
  
  // 显示结果
  console.log("🎉 成功加入游戏!");
  console.log("   区块号:", receipt.blockNumber);
  console.log("   Gas 消耗:", receipt.gasUsed.toString());
  
  // 查询更新后的游戏信息
  const updatedGameInfo = await contract.getGameInfo(gameId);
  console.log("\n📊 更新后的游戏信息:");
  console.log("   奖池:", hre.ethers.formatEther(updatedGameInfo.prizePool), "ETH");
  console.log("   玩家数:", updatedGameInfo.playerCount.toString());
  
  // 查询玩家列表
  const players = await contract.getPlayers(gameId);
  console.log("\n👥 当前玩家:");
  players.forEach((addr, index) => {
    console.log(`   ${index + 1}. ${addr}`);
  });
  
  console.log("\n📋 后续步骤:");
  console.log("1. 可以使用更多账户继续加入游戏");
  console.log("2. 房主结束游戏:");
  console.log("   npm run end-game");
  console.log("\n✅ 完成!");
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 加入游戏失败:", error);
    process.exit(1);
  });


