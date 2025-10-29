/**
 * 部署 GuessGameFHE_v3 合约
 * 升级版：包含完整的解密流程支持
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 部署 GuessGameFHE_v3 (升级版) ...\n");
  console.log("=".repeat(60));
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  警告：余额较低，可能不足以部署合约");
  }
  
  console.log("🌐 网络:", hre.network.name);
  console.log("=".repeat(60));
  console.log("");
  
  // 部署合约
  console.log("📦 开始部署 GuessGameFHE_v3...");
  const Contract = await hre.ethers.getContractFactory("GuessGameFHE_v3");
  const contract = await Contract.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ 合约已部署!");
  console.log("📍 合约地址:", contractAddress);
  
  // 显示区块链浏览器链接
  if (hre.network.name === "sepolia") {
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  }
  
  console.log("");
  console.log("=".repeat(60));
  console.log("🎯 升级要点：");
  console.log("  ✅ Gas Limit: 500000 (修复了 0 的问题)");
  console.log("  ✅ 请求追踪: DecryptionRequest 结构");
  console.log("  ✅ 重试机制: retryDecryption()");
  console.log("  ✅ 超时处理: cancelExpiredGame()");
  console.log("  ✅ 应急解锁: emergencyResolve()");
  console.log("  ✅ 完整事件: DecryptionRequested, Completed, Failed");
  console.log("=".repeat(60));
  console.log("");
  
  // 保存部署信息
  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deployment = {
    network: hre.network.name,
    contractName: "GuessGameFHE_v3",
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: contract.deploymentTransaction()?.blockNumber,
    transactionHash: contract.deploymentTransaction()?.hash,
    upgrades: {
      from: "GuessGameFHE_v2",
      changes: [
        "修复 Gas Limit = 0 问题",
        "添加 DecryptionRequest 追踪系统",
        "实现重试机制",
        "实现超时处理",
        "添加应急管理功能",
        "完善事件系统"
      ]
    }
  };
  
  const filename = `GuessGameFHE_v3_${hre.network.name}.json`;
  const filepath = path.join(deploymentDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  
  console.log("💾 部署信息已保存到:", filename);
  console.log("");
  
  // Sepolia 验证
  if (hre.network.name === "sepolia") {
    console.log("⏳ 等待 5 个区块确认后验证合约...");
    
    // 等待确认
    const receipt = await contract.deploymentTransaction()?.wait(5);
    console.log("✅ 区块已确认");
    console.log("");
    
    try {
      console.log("🔍 开始在 Etherscan 验证合约...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: []
      });
      console.log("✅ 合约已在 Etherscan 验证");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  合约已经验证过了");
      } else {
        console.log("⚠️  验证失败:", error.message);
        console.log("   您可以稍后手动验证");
      }
    }
  }
  
  console.log("");
  console.log("=".repeat(60));
  console.log("📝 下一步：");
  console.log("  1. 更新前端配置文件中的合约地址");
  console.log("     文件: frontend/src/utils/constants_fhe.ts");
  console.log(`     地址: ${contractAddress}`);
  console.log("");
  console.log("  2. 重启前端开发服务器");
  console.log("     cd frontend && npm run dev");
  console.log("");
  console.log("  3. 测试完整解密流程");
  console.log("     - 创建游戏");
  console.log("     - 玩家加入");
  console.log("     - 结束游戏（触发解密）");
  console.log("     - 观察进度条和状态");
  console.log("=".repeat(60));
  console.log("");
  console.log("🎉 部署完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:");
    console.error(error);
    process.exit(1);
  });

