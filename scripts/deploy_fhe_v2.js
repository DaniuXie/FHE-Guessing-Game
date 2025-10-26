/**
 * 部署 GuessGameFHE_v2 合约到 Sepolia
 */

const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 部署 GuessGameFHE_v2 到 Sepolia");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("👤 部署者地址:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 余额:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("❌ 余额不足！至少需要 0.01 ETH");
    process.exit(1);
  }
  
  console.log("");
  console.log("⏳ 编译合约...");
  
  const GuessGameFHE_v2 = await hre.ethers.getContractFactory("GuessGameFHE_v2");
  
  console.log("⏳ 部署中...");
  const game = await GuessGameFHE_v2.deploy();
  
  console.log("⏳ 等待部署确认...");
  await game.waitForDeployment();
  
  const contractAddress = await game.getAddress();
  
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ 部署成功！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("📍 合约地址:", contractAddress);
  console.log("🌐 网络:", hre.network.name);
  console.log("⛽ Gas 使用:", "~3,000,000 (估算)");
  console.log("");
  
  // 保存部署信息
  const deploymentInfo = {
    contractName: "GuessGameFHE_v2",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    fhevmVersion: "0.7.0-0",
    solidityVersion: "0.8.24",
    features: [
      "完整FHE加密",
      "Gateway自动解密",
      "密文计算",
      "权限管理"
    ]
  };
  
  const filename = './deployment_fhe_v2.json';
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 部署信息已保存到:", filename);
  
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 下一步");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. 更新前端配置文件");
  console.log("   frontend/src/utils/constants.ts");
  console.log("   CONTRACT_ADDRESS_FHE =", contractAddress);
  console.log("");
  console.log("2. 在 Sepolia Etherscan 上验证合约：");
  console.log("   https://sepolia.etherscan.io/address/" + contractAddress);
  console.log("");
  console.log("3. 测试合约功能");
  console.log("   npx hardhat run scripts/test_fhe_game.js --network sepolia");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ 部署失败");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  });

