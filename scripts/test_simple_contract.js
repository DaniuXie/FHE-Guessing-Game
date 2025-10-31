/**
 * 测试 GuessGameSimple 合约
 */

const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5AF7bB5030A6cCF5BA09315987E4480B40421a57";
  
  console.log("🧪 测试 GuessGameSimple 合约...");
  console.log("📍 合约地址:", contractAddress);
  
  // 获取合约实例
  const GuessGameSimple = await hre.ethers.getContractFactory("GuessGameSimple");
  const contract = GuessGameSimple.attach(contractAddress);
  
  // 获取部署者
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 测试账户:", deployer.address);
  
  try {
    // 测试 1: 获取总游戏数
    console.log("\n📊 测试 1: 获取总游戏数...");
    const totalGames = await contract.getTotalGames();
    console.log("✅ 总游戏数:", totalGames.toString());
    
    // 测试 2: 创建游戏
    console.log("\n🎮 测试 2: 创建游戏...");
    const targetNumber = 42;
    const entryFee = hre.ethers.parseEther("0.001");
    
    console.log("   目标数字:", targetNumber);
    console.log("   入场费:", hre.ethers.formatEther(entryFee), "ETH");
    
    const tx = await contract.createGame(targetNumber, entryFee, {
      value: entryFee,
      gasLimit: 300000
    });
    
    console.log("📝 交易已提交:", tx.hash);
    console.log("⏳ 等待确认...");
    
    const receipt = await tx.wait();
    console.log("✅ 交易已确认! Gas 使用:", receipt.gasUsed.toString());
    
    // 获取游戏ID
    const newTotalGames = await contract.getTotalGames();
    const gameId = newTotalGames;
    console.log("🎯 游戏 ID:", gameId.toString());
    
    // 测试 3: 获取游戏信息
    console.log("\n📋 测试 3: 获取游戏信息...");
    const gameInfo = await contract.getGameInfo(gameId);
    console.log("✅ 游戏信息:");
    console.log("   - ID:", gameInfo.id.toString());
    console.log("   - 目标数字:", gameInfo.target.toString());
    console.log("   - 创建者:", gameInfo.owner);
    console.log("   - 入场费:", hre.ethers.formatEther(gameInfo.entryFee), "ETH");
    console.log("   - 奖池:", hre.ethers.formatEther(gameInfo.prizePool), "ETH");
    console.log("   - 玩家数:", gameInfo.playerCount.toString());
    console.log("   - 状态:", gameInfo.status.toString(), "(0=Active, 1=Ended)");
    
    console.log("\n✅ 所有测试通过!");
    
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    if (error.data) {
      console.error("   错误数据:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



