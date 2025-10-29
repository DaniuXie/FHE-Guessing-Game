/**
 * 紧急结束游戏脚本
 * 用于前端无法正常结束游戏时
 */

const hre = require("hardhat");

async function main() {
  console.log("🚨 紧急结束游戏...\n");

  const contractAddress = "0x6bD042918869d1136043b0318FF530cAA5bE377e";
  const contract = await hre.ethers.getContractAt("GuessGameSimple", contractAddress);

  const [signer] = await hre.ethers.getSigners();
  console.log("👤 当前账户:", signer.address);
  console.log("");

  // 输入游戏 ID
  const gameId = process.argv[2] || 1;
  console.log("🎮 游戏 ID:", gameId);
  console.log("");

  try {
    // 获取游戏信息
    const info = await contract.getGameInfo(gameId);
    console.log("📊 游戏信息:");
    console.log("   目标数字:", Number(info.target));
    console.log("   房主:", info.owner);
    console.log("   玩家数:", Number(info.playerCount));
    console.log("   状态:", Number(info.status) === 0 ? "进行中" : "已结束");
    console.log("");

    if (info.owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ 错误：你不是房主，无法结束游戏");
      console.log("   房主:", info.owner);
      console.log("   你:", signer.address);
      return;
    }

    if (Number(info.status) !== 0) {
      console.log("❌ 游戏已经结束");
      return;
    }

    if (Number(info.playerCount) === 0) {
      console.log("❌ 游戏没有玩家，无法结束");
      return;
    }

    console.log("⏳ 正在结束游戏...");
    const tx = await contract.endGame(gameId, {
      gasLimit: 500000,
    });

    console.log("   交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("");

    console.log("✅ 游戏结束成功！");
    console.log("   Gas 使用:", receipt.gasUsed.toString());
    console.log("");

    // 获取最终结果
    const finalInfo = await contract.getGameInfo(gameId);
    console.log("🏆 最终结果:");
    console.log("   获胜者:", finalInfo.winner);
    
    const players = await contract.getPlayers(gameId);
    const winnerGuess = await contract.getPlayerGuess(gameId, finalInfo.winner);
    
    console.log("   获胜猜测:", Number(winnerGuess));
    console.log("   目标数字:", Number(finalInfo.target));
    console.log("   差值:", Math.abs(Number(winnerGuess) - Number(finalInfo.target)));
    console.log("   奖金:", hre.ethers.formatEther(finalInfo.prizePool), "ETH");
    console.log("");

  } catch (error) {
    console.error("❌ 结束游戏失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






