const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 部署 GuessGame 合约到 Sepolia
 */
async function main() {
  console.log("🚀 开始部署 GuessGame 合约...\n");
  
  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署账户:", deployer.address);
  
  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");
  
  if (balance === 0n) {
    console.error("❌ 错误: 账户余额为0，无法部署合约");
    console.log("💡 请访问 https://sepoliafaucet.com/ 获取测试币");
    process.exit(1);
  }
  
  // 获取合约工厂
  console.log("📦 编译合约...");
  const GuessGame = await hre.ethers.getContractFactory("GuessGame");
  
  // 部署合约
  console.log("⏳ 正在部署合约...");
  const guessGame = await GuessGame.deploy();
  
  // 等待部署确认
  await guessGame.waitForDeployment();
  const contractAddress = await guessGame.getAddress();
  
  console.log("\n✅ 部署成功!");
  console.log("📍 合约地址:", contractAddress);
  
  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployerBalance: hre.ethers.formatEther(balance),
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 部署信息已保存到 deployment.json\n");
  
  // 验证合约是否部署成功
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("❌ 错误: 合约部署失败!");
    process.exit(1);
  }
  
  console.log("✅ 合约已在链上验证\n");
  
  // 显示后续步骤
  console.log("📋 后续步骤:");
  console.log("1. 记录合约地址:", contractAddress);
  console.log("2. 在 Sepolia 浏览器查看:");
  console.log("   https://sepolia.etherscan.io/address/" + contractAddress);
  console.log("3. 测试创建游戏:");
  console.log("   npm run create-game");
  console.log("4. 更新前端配置中的合约地址\n");
  
  // Etherscan 验证提示
  if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("💡 提示: 可以验证合约源码:");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  }
  
  console.log("\n🎉 部署完成!");
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });



