/**
 * 验证新合约状态
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 验证新合约状态...\n");

  const newAddress = "0x6bD042918869d1136043b0318FF530cAA5bE377e";
  const contract = await hre.ethers.getContractAt("GuessGameSimple", newAddress);

  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 新合约信息");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("合约地址:", newAddress);
    console.log("网络: Sepolia Testnet");
    console.log("");

    // 获取总游戏数
    const total = await contract.getTotalGames();
    console.log("📊 总游戏数:", Number(total));
    console.log("");

    if (Number(total) === 0) {
      console.log("✅ 验证成功！");
      console.log("✅ 这是一个全新的合约");
      console.log("✅ 没有历史游戏数据");
      console.log("✅ 可以开始创建游戏了！");
      console.log("");
      console.log("🎯 建议：");
      console.log("1. 刷新浏览器 (Ctrl + F5)");
      console.log("2. 连接钱包");
      console.log("3. 创建第一个游戏");
      console.log("4. 游戏 ID 将从 #1 开始");
    } else {
      console.log("⚠️  注意：合约已有", Number(total), "个游戏");
      console.log("这可能不是全新的合约");
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ 验证失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

