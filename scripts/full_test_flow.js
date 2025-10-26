const { execSync } = require("child_process");
const readline = require("readline");

/**
 * 完整测试流程脚本
 * 自动执行: 部署 -> 创建游戏 -> 加入游戏 -> 结束游戏
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function run(cmd, description) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶️  ${description}`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`📝 执行命令: ${cmd}\n`);
  
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`\n✅ ${description} - 完成`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - 失败`);
    return false;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🎮 机密数字猜谜游戏 - 完整测试流程 🎮              ║
║                                                            ║
║              基于 Zama FHEVM Coprocessor                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log("本脚本将自动执行以下步骤:");
  console.log("1. ✅ 部署 GuessGame 合约到 Sepolia");
  console.log("2. 🎮 创建新游戏（加密目标数字）");
  console.log("3. 🎯 加入游戏（提交加密猜测）");
  console.log("4. 🏁 结束游戏（计算结果）\n");
  
  const answer = await question("是否继续? (y/n): ");
  
  if (answer.toLowerCase() !== 'y') {
    console.log("已取消");
    rl.close();
    process.exit(0);
  }
  
  console.log("\n🚀 开始测试流程...\n");
  
  // 步骤1: 部署合约
  const deploySuccess = run(
    "npx hardhat run scripts/deploy.js --network sepolia",
    "步骤1: 部署合约"
  );
  
  if (!deploySuccess) {
    console.error("\n❌ 部署失败，终止流程");
    rl.close();
    process.exit(1);
  }
  
  await question("\n按回车继续创建游戏...");
  
  // 步骤2: 创建游戏
  const createSuccess = run(
    "npx hardhat run scripts/create_game.js --network sepolia",
    "步骤2: 创建游戏"
  );
  
  if (!createSuccess) {
    console.error("\n❌ 创建游戏失败，终止流程");
    rl.close();
    process.exit(1);
  }
  
  await question("\n按回车继续加入游戏...");
  
  // 步骤3: 加入游戏
  const joinSuccess = run(
    "npx hardhat run scripts/join_game.js --network sepolia",
    "步骤3: 加入游戏"
  );
  
  if (!joinSuccess) {
    console.error("\n❌ 加入游戏失败，终止流程");
    rl.close();
    process.exit(1);
  }
  
  await question("\n按回车继续结束游戏...");
  
  // 步骤4: 结束游戏
  const endSuccess = run(
    "npx hardhat run scripts/end_game.js --network sepolia",
    "步骤4: 结束游戏"
  );
  
  if (!endSuccess) {
    console.error("\n❌ 结束游戏失败");
    rl.close();
    process.exit(1);
  }
  
  // 完成
  console.log(`
${"=".repeat(60)}
🎉 完整测试流程执行完成！
${"=".repeat(60)}

📊 测试总结:
✅ 合约部署成功
✅ 游戏创建成功
✅ 玩家加入成功
✅ 游戏结束成功

⚠️  注意:
- Gateway 解密是异步的，结果可能需要几分钟才能显示
- 请在 Sepolia 浏览器查看最终结果
- 查看 deployment.json 和 last_game.json 了解详情

📋 后续步骤:
1. 查看合约地址和游戏ID
2. 在前端集成这些功能
3. 测试多玩家场景
4. 优化 Gas 消耗

🔗 有用的链接:
- Sepolia 浏览器: https://sepolia.etherscan.io/
- Zama 文档: https://docs.zama.ai/
- Gateway 状态: https://gateway.sepolia.zama.ai/

✨ 完成!
  `);
  
  rl.close();
}

main().catch((error) => {
  console.error("\n❌ 测试流程失败:", error);
  rl.close();
  process.exit(1);
});


