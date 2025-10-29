const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 部署 GuessGameSimple 到 Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 部署者地址:", deployer.address);

  // 检查余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 余额:", hre.ethers.formatEther(balance), "ETH");

  // 部署合约
  const GuessGameSimple = await hre.ethers.getContractFactory("GuessGameSimple");
  console.log("⏳ 正在部署合约...");
  
  const contract = await GuessGameSimple.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ GuessGameSimple 已部署到:", address);

  // 保存部署信息
  const deployment = {
    network: "sepolia",
    contractName: "GuessGameSimple",
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    "deployment_simple.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log("💾 部署信息已保存到 deployment_simple.json");

  // 验证合约是否在链上
  const code = await hre.ethers.provider.getCode(address);
  if (code === "0x") {
    console.log("❌ 部署失败：合约代码为空");
  } else {
    console.log("✅ 合约验证成功：代码已在链上");
  }

  console.log("\n📋 部署摘要:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("合约名称:", "GuessGameSimple");
  console.log("合约地址:", address);
  console.log("部署者:", deployer.address);
  console.log("网络:", "Sepolia");
  console.log("区块号:", deployment.blockNumber);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 在 Etherscan 查看:");
  console.log(`https://sepolia.etherscan.io/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });







