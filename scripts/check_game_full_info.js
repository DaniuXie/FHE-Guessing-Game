/**
 * 完整检查游戏信息
 */

const hre = require("hardhat");

async function main() {
  const contractAddress = "0x6bD042918869d1136043b0318FF530cAA5bE377e";
  const contract = await hre.ethers.getContractAt("GuessGameSimple", contractAddress);

  const gameId = 1;
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 游戏 #1 完整信息");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  try {
    const info = await contract.getGameInfo(gameId);
    
    console.log("📊 返回的原始数据:");
    console.log("   id:", info.id.toString());
    console.log("   target:", info.target.toString());
    console.log("   owner:", info.owner);
    console.log("   entryFee:", hre.ethers.formatEther(info.entryFee), "ETH");
    console.log("   prizePool:", hre.ethers.formatEther(info.prizePool), "ETH");
    console.log("   playerCount:", info.playerCount.toString());
    console.log("   status:", info.status.toString(), info.status === 0n ? "(进行中)" : "(已结束)");
    console.log("   winner:", info.winner);
    console.log("   createdAt:", new Date(Number(info.createdAt) * 1000).toLocaleString());
    console.log("");

    // 检查是否有数据丢失
    if (info.id === 0n || info.id === undefined) {
      console.log("❌ 警告：游戏 ID 为 0 或 undefined");
    }
    
    if (info.owner === "0x0000000000000000000000000000000000000000") {
      console.log("❌ 警告：owner 地址为零地址");
    }

    // 获取玩家列表
    const players = await contract.getPlayers(gameId);
    console.log("👥 玩家列表:");
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const guess = await contract.getPlayerGuess(gameId, player);
      const diff = Math.abs(Number(guess) - Number(info.target));
      const isWinner = player.toLowerCase() === info.winner.toLowerCase();
      console.log(`   ${i + 1}. ${player}`);
      console.log(`      猜测: ${guess.toString()}, 差值: ${diff} ${isWinner ? "🏆 获胜者" : ""}`);
    }
    console.log("");

    console.log("✅ 游戏信息完整");
    
  } catch (error) {
    console.error("❌ 获取失败:", error.message);
    console.error("   详细错误:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });













