const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  console.log("💰 检查钱包余额...\n");

  // 从助记词派生账户
  const mnemonic = process.env.MNEMONIC;
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  console.log("📍 钱包地址:", wallet.address);
  
  // 连接到Sepolia（使用多个备用RPC）
  const rpcs = [
    "https://eth-sepolia.public.blastapi.io",
    "https://rpc2.sepolia.org",
    "https://ethereum-sepolia-rpc.publicnode.com"
  ];
  
  let provider = null;
  for (const rpc of rpcs) {
    try {
      console.log(`🔗 尝试连接: ${rpc}`);
      provider = new ethers.JsonRpcProvider(rpc);
      await provider.getBlockNumber(); // 测试连接
      console.log("✅ 连接成功!\n");
      break;
    } catch (err) {
      console.log(`❌ 连接失败: ${err.message}`);
      provider = null;
    }
  }
  
  if (!provider) {
    throw new Error("无法连接到任何Sepolia RPC");
  }
  
  const connectedWallet = wallet.connect(provider);
  
  // 获取余额
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  
  console.log("💎 余额:", balanceEth, "ETH");
  
  if (parseFloat(balanceEth) < 0.01) {
    console.log("\n⚠️  余额不足！");
    console.log("💡 请访问水龙头获取测试币:");
    console.log("   https://sepoliafaucet.com/");
    console.log("   https://sepolia-faucet.pk910.de/");
  } else {
    console.log("\n✅ 余额充足，可以部署！");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 错误:", error);
    process.exit(1);
  });

