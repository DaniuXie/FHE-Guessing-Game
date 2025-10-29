/**
 * 检查游戏 #3 是否存在
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 检查游戏 #3 是否存在...\n");

  const contractAddress = "0xeea65B27764652050929D26bDF8024B6Ee833357";
  const contract = await hre.ethers.getContractAt("GuessGameSimple", contractAddress);

  try {
    // 获取总游戏数
    const total = await contract.getTotalGames();
    console.log("📊 总游戏数:", total.toString());
    console.log("");

    if (Number(total) >= 3) {
      // 获取游戏 #3 的信息
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎮 游戏 #3 信息:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      const gameInfo = await contract.getGameInfo(3);
      
      console.log("游戏 ID:", Number(gameInfo.id));
      console.log("目标数字:", Number(gameInfo.target));
      console.log("房主:", gameInfo.owner);
      console.log("入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
      console.log("奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
      console.log("玩家数:", Number(gameInfo.playerCount));
      console.log("状态:", Number(gameInfo.status) === 0 ? "进行中" : "已结束");
      console.log("创建时间:", new Date(Number(gameInfo.createdAt) * 1000).toLocaleString());
      console.log("");
      
      console.log("✅ 游戏 #3 存在于区块链上！");
      console.log("");
      console.log("如果前端看不到，请：");
      console.log("1. 点击游戏列表右上角的 '🔄 刷新' 按钮");
      console.log("2. 强制刷新浏览器 (Ctrl + F5)");
      console.log("3. 清除浏览器缓存");
    } else {
      console.log("❌ 游戏 #3 不存在");
      console.log(`当前只有 ${total} 个游戏`);
    }
  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






