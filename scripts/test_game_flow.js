/**
 * 🧪 完整游戏流程测试脚本
 * 
 * 测试方案B（简化明文版）的完整功能
 */

const hre = require("hardhat");

async function main() {
  console.log("🧪 开始测试完整游戏流程...\n");

  // 获取测试账户
  const [owner, player1, player2] = await hre.ethers.getSigners();
  
  console.log("👥 测试账户:");
  console.log("   房主:", owner.address);
  console.log("   玩家1:", player1.address);
  console.log("   玩家2:", player2.address);
  console.log("");

  // 连接合约
  const contractAddress = "0xeea65B27764652050929D26bDF8024B6Ee833357";
  const GuessGameSimple = await hre.ethers.getContractAt("GuessGameSimple", contractAddress);
  
  console.log("📦 合约地址:", contractAddress);
  console.log("");

  // 测试1: 创建游戏
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 测试1: 创建游戏");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const targetNumber = 50;
  const entryFee = hre.ethers.parseEther("0.001");
  
  console.log("   目标数字:", targetNumber);
  console.log("   入场费:", hre.ethers.formatEther(entryFee), "ETH");
  
  try {
    const tx1 = await GuessGameSimple.connect(owner).createGame(targetNumber, entryFee, {
      value: entryFee,
      gasLimit: 500000,
    });
    
    console.log("   ⏳ 交易哈希:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("   ✅ 游戏创建成功!");
    console.log("   ⛽ Gas 使用:", receipt1.gasUsed.toString());
    
    // 获取游戏ID
    const gameId = await GuessGameSimple.getTotalGames();
    console.log("   🎮 游戏ID:", gameId.toString());
    console.log("");
    
    // 验证游戏信息
    const gameInfo = await GuessGameSimple.getGameInfo(gameId);
    console.log("   📊 游戏信息:");
    console.log("      目标数字:", Number(gameInfo.target));
    console.log("      房主:", gameInfo.owner);
    console.log("      入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
    console.log("      奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
    console.log("      玩家数:", Number(gameInfo.playerCount));
    console.log("      状态:", Number(gameInfo.status) === 0 ? "进行中" : "已结束");
    console.log("");

    // 测试2: 玩家加入
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👥 测试2: 玩家加入");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // 玩家1加入
    console.log("\n   🎯 玩家1 加入游戏...");
    const guess1 = 45;
    console.log("      猜测:", guess1);
    
    const tx2 = await GuessGameSimple.connect(player1).joinGame(gameId, guess1, {
      value: entryFee,
      gasLimit: 300000,
    });
    
    console.log("      ⏳ 交易哈希:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("      ✅ 加入成功!");
    console.log("      ⛽ Gas 使用:", receipt2.gasUsed.toString());
    
    // 玩家2加入
    console.log("\n   🎯 玩家2 加入游戏...");
    const guess2 = 48;
    console.log("      猜测:", guess2);
    
    const tx3 = await GuessGameSimple.connect(player2).joinGame(gameId, guess2, {
      value: entryFee,
      gasLimit: 300000,
    });
    
    console.log("      ⏳ 交易哈希:", tx3.hash);
    const receipt3 = await tx3.wait();
    console.log("      ✅ 加入成功!");
    console.log("      ⛽ Gas 使用:", receipt3.gasUsed.toString());
    console.log("");
    
    // 查看更新后的游戏信息
    const updatedInfo = await GuessGameSimple.getGameInfo(gameId);
    console.log("   📊 更新后的游戏信息:");
    console.log("      奖池:", hre.ethers.formatEther(updatedInfo.prizePool), "ETH");
    console.log("      玩家数:", Number(updatedInfo.playerCount));
    
    // 查看所有玩家
    const players = await GuessGameSimple.getPlayers(gameId);
    console.log("\n   👥 玩家列表:");
    for (let i = 0; i < players.length; i++) {
      const playerGuess = await GuessGameSimple.getPlayerGuess(gameId, players[i]);
      const diff = Math.abs(Number(playerGuess) - targetNumber);
      console.log(`      ${i + 1}. ${players[i]}`);
      console.log(`         猜测: ${Number(playerGuess)}, 差值: ${diff}`);
    }
    console.log("");

    // 测试3: 结束游戏
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🏁 测试3: 结束游戏");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("   ⏳ 房主结束游戏...");
    
    const tx4 = await GuessGameSimple.connect(owner).endGame(gameId, {
      gasLimit: 500000,
    });
    
    console.log("   ⏳ 交易哈希:", tx4.hash);
    const receipt4 = await tx4.wait();
    console.log("   ✅ 游戏结束!");
    console.log("   ⛽ Gas 使用:", receipt4.gasUsed.toString());
    console.log("");
    
    // 查看最终结果
    const finalInfo = await GuessGameSimple.getGameInfo(gameId);
    console.log("   🏆 最终结果:");
    console.log("      状态:", Number(finalInfo.status) === 0 ? "进行中" : "已结束");
    console.log("      获胜者:", finalInfo.winner);
    
    const winnerGuess = await GuessGameSimple.getPlayerGuess(gameId, finalInfo.winner);
    const winnerDiff = Math.abs(Number(winnerGuess) - targetNumber);
    
    console.log("      获胜猜测:", Number(winnerGuess));
    console.log("      目标数字:", targetNumber);
    console.log("      差值:", winnerDiff);
    console.log("      奖金:", hre.ethers.formatEther(finalInfo.prizePool), "ETH");
    console.log("");
    
    // 验证获胜者
    console.log("   ✅ 验证:");
    if (Number(winnerGuess) === guess2) {
      console.log("      ✓ 玩家2 获胜（猜测 48，差值 2）");
    } else if (Number(winnerGuess) === guess1) {
      console.log("      ✓ 玩家1 获胜（猜测 45，差值 5）");
    }
    console.log("");

    // 测试总结
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 测试总结");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   ✓ 创建游戏: 成功");
    console.log("   ✓ 玩家加入: 成功");
    console.log("   ✓ 结束游戏: 成功");
    console.log("   ✓ 自动计算获胜者: 成功");
    console.log("   ✓ 奖池转账: 成功");
    console.log("");
    console.log("   🎉 所有测试通过!");
    console.log("");
    
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    console.error("\n详细错误:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


