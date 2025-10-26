const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * 结束游戏测试脚本
 */
async function main() {
  console.log("🏁 结束游戏并计算结果...\n");
  
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
  
  // 获取签名者（必须是游戏创建者）
  const [owner] = await hre.ethers.getSigners();
  console.log("👤 操作者地址:", owner.address);
  
  // 连接合约
  const GuessGame = await hre.ethers.getContractFactory("GuessGame");
  const contract = GuessGame.attach(contractAddress);
  
  // 查询游戏信息
  console.log("\n📊 游戏信息:");
  const gameInfo = await contract.getGameInfo(gameId);
  console.log("   房主:", gameInfo.owner);
  console.log("   入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
  console.log("   奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
  console.log("   玩家数:", gameInfo.playerCount.toString());
  console.log("   状态:", ["ACTIVE", "CALCULATING", "ENDED"][gameInfo.status]);
  
  // 检查是否是房主
  if (gameInfo.owner.toLowerCase() !== owner.address.toLowerCase()) {
    console.error("\n❌ 错误: 只有房主可以结束游戏");
    console.log("   房主:", gameInfo.owner);
    console.log("   当前账户:", owner.address);
    process.exit(1);
  }
  
  // 检查游戏状态
  if (gameInfo.status !== 0) {
    console.error("\n❌ 错误: 游戏不在活动状态");
    if (gameInfo.status === 2) {
      console.log("   游戏已结束");
      console.log("   获胜者:", gameInfo.winner);
      console.log("   目标数字:", gameInfo[6].toString());
      console.log("   获胜猜测:", gameInfo.winningGuess.toString());
    }
    process.exit(1);
  }
  
  // 检查是否有玩家
  if (gameInfo.playerCount === 0n) {
    console.error("\n❌ 错误: 游戏没有玩家");
    console.log("💡 请先运行: npm run join-game");
    process.exit(1);
  }
  
  // 查询玩家列表
  const players = await contract.getPlayers(gameId);
  console.log("\n👥 参与玩家:");
  players.forEach((addr, index) => {
    console.log(`   ${index + 1}. ${addr}`);
  });
  
  console.log("\n⚠️  注意: 结束游戏将:");
  console.log("   1. 请求 Gateway 解密所有猜测");
  console.log("   2. 计算最接近目标的猜测");
  console.log("   3. 将奖池转给获胜者");
  console.log("   4. 这个过程可能需要几分钟\n");
  
  // 结束游戏
  console.log("📡 发送结束游戏交易...");
  const tx = await contract.endGame(gameId);
  
  console.log("⏳ 等待交易确认...");
  console.log("   交易哈希:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ 交易已确认\n");
  
  console.log("🎯 游戏状态已更新:");
  console.log("   区块号:", receipt.blockNumber);
  console.log("   Gas 消耗:", receipt.gasUsed.toString());
  
  // 查询更新后的状态
  const updatedInfo = await contract.getGameInfo(gameId);
  console.log("\n📊 当前状态:", ["ACTIVE", "CALCULATING", "ENDED"][updatedInfo.status]);
  
  if (updatedInfo.status === 1) {
    console.log("\n⏳ 正在等待 Gateway 解密...");
    console.log("💡 这个过程通常需要 1-5 分钟");
    console.log("\n📋 监控结果:");
    console.log("   1. 查看交易事件:");
    console.log(`      https://sepolia.etherscan.io/tx/${tx.hash}`);
    console.log("   2. 查询游戏状态:");
    console.log(`      await contract.getGameInfo(${gameId})`);
    console.log("   3. 等待 GameEnded 事件");
  } else if (updatedInfo.status === 2) {
    console.log("\n🎉 游戏已结束!");
    console.log("   获胜者:", updatedInfo.winner);
    console.log("   目标数字:", gameData.targetNumber);
    console.log("   获胜猜测:", updatedInfo.winningGuess.toString());
    console.log("   奖金:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
  }
  
  console.log("\n✅ 完成!");
  console.log("\n💡 提示: 由于 Gateway 回调是异步的，");
  console.log("   可能需要等待几分钟后再次查询游戏状态");
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 结束游戏失败:", error);
    process.exit(1);
  });


