/**
 * 列出所有游戏
 * 用法: npx hardhat run scripts/list_games.js --network sepolia
 */

const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x5AF7bB5030A6cCF5BA09315987E4480B40421a57";
  
  console.log("\n🎮 正在查询游戏列表...");
  console.log("合约地址:", CONTRACT_ADDRESS);
  console.log("网络:", hre.network.name);
  console.log("");

  // 获取合约实例
  const GuessGame = await hre.ethers.getContractAt("GuessGameSimple", CONTRACT_ADDRESS);

  try {
    // 查询游戏总数
    console.log("📊 正在查询游戏总数...");
    const totalGames = await GuessGame.getTotalGames();
    console.log(`✅ 游戏总数: ${totalGames}\n`);

    if (totalGames == 0) {
      console.log("没有游戏");
      return;
    }

    // 显示最近20个游戏
    const start = Math.max(1, Number(totalGames) - 19);
    console.log(`📋 显示游戏 #${start} 到 #${totalGames}:\n`);
    console.log("═".repeat(80));

    for (let i = Number(totalGames); i >= start; i--) {
      try {
        const info = await GuessGame.getGameInfo(i);
        
        const status = info.status == 0 ? "🟢 进行中" : "🔴 已结束";
        const entryFee = hre.ethers.formatEther(info.entryFee);
        const prizePool = hre.ethers.formatEther(info.prizePool);
        const owner = info.owner.slice(0, 10) + "..." + info.owner.slice(-4);
        
        console.log(`游戏 #${i} ${status}`);
        console.log(`  创建者: ${owner}`);
        console.log(`  入场费: ${entryFee} ETH`);
        console.log(`  奖池:   ${prizePool} ETH`);
        console.log(`  玩家数: ${info.playerCount}`);
        if (info.status == 1) {
          const winner = info.winner == "0x0000000000000000000000000000000000000000" 
            ? "无" 
            : info.winner.slice(0, 10) + "..." + info.winner.slice(-4);
          console.log(`  赢家:   ${winner}`);
        }
        console.log("─".repeat(80));
      } catch (err) {
        console.log(`游戏 #${i}: 查询失败`);
        console.log("─".repeat(80));
      }
    }

    console.log("\n✅ 查询完成！");
    console.log("\n💡 提示:");
    console.log("  - 使用 'npx hardhat run scripts/check_game_full_info.js --network sepolia' 查看详细信息");
    console.log("  - 游戏 ID 从 1 开始");

  } catch (error) {
    console.error("\n❌ 查询失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


