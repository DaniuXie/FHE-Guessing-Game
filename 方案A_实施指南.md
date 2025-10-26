# 🚀 方案A实施指南 - 完整FHE版本

## 📋 目标

将当前的明文游戏升级为**真正的隐私保护游戏**：
- ✅ 目标数字完全加密
- ✅ 所有猜测完全加密
- ✅ 密文状态下计算差值
- ✅ 通过 Gateway 安全解密获胜者

---

## 🎯 实施步骤

### 阶段 1: 学习准备 ⏱️ 30分钟

**目标**：快速掌握关键概念

#### 1.1 FHE 核心概念
```
什么是 FHE（全同态加密）？
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 可以在加密数据上直接计算
- 计算结果解密后等于明文计算结果
- 数据全程保持加密状态

例子：
  加密(3) + 加密(5) = 加密(8)
  解密(加密(8)) = 8
```

#### 1.2 FHEVM 关键组件
```
组件           作用                          位置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TFHE.sol       Solidity 加密库              合约端
fhevmjs        JavaScript SDK               前端
Gateway        解密服务（链下）             独立服务
ACL            访问控制                     链上合约
KMS            密钥管理                     链下服务
```

#### 1.3 数据流程
```
前端                    合约                   Gateway
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 用户输入 15
     ↓
2. SDK 加密 → handle + proof
     ↓
3. 发送到合约 ────────→ 存储 euint32
                              ↓
4.                      密文计算（比较）
                              ↓
5.                      请求解密 ─────────→ Gateway
                                                ↓
6.                      ← ─────────────── 解密结果
                              ↓
7.                      回调函数处理
```

---

### 阶段 2: 创建 FHE 合约 ⏱️ 1.5小时

**文件**：`contracts/GuessGameFHE.sol`

#### 2.1 合约结构设计

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract GuessGameFHE is GatewayCaller {
    
    struct Game {
        uint256 id;
        euint32 encryptedTarget;     // 🔐 加密的目标数字
        address owner;
        uint256 entryFee;
        uint256 prizePool;
        address[] players;
        mapping(address => euint32) encryptedGuesses; // 🔐 加密的猜测
        GameStatus status;
        address winner;
        uint256 createdAt;
    }
    
    enum GameStatus {
        ACTIVE,
        CALCULATING,  // 新增：等待 Gateway 解密
        ENDED
    }
    
    mapping(uint256 => Game) public games;
    uint256 public totalGames;
    
    // Gateway 回调映射
    mapping(uint256 => uint256) private decryptionRequestToGameId;
    
    event GameCreated(uint256 indexed gameId, address indexed owner);
    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event DecryptionRequested(uint256 indexed gameId, uint256 requestId);
    event GameEnded(uint256 indexed gameId, address winner, uint256 prize);
}
```

#### 2.2 关键函数实现

##### 创建游戏（加密版）
```solidity
function createGame(
    einput encryptedTarget,     // SDK 加密后的数据
    bytes calldata inputProof,  // SDK 生成的证明
    uint256 entryFee
) external payable returns (uint256) {
    require(msg.value == entryFee, "Must pay entry fee");
    
    totalGames++;
    uint256 gameId = totalGames;
    
    Game storage game = games[gameId];
    game.id = gameId;
    
    // 🔐 将外部加密输入转换为合约内部的加密类型
    game.encryptedTarget = TFHE.asEuint32(encryptedTarget, inputProof);
    
    // 🔒 授权合约可以操作这个密文
    TFHE.allow(game.encryptedTarget, address(this));
    
    game.owner = msg.sender;
    game.entryFee = entryFee;
    game.prizePool = msg.value;
    game.status = GameStatus.ACTIVE;
    game.createdAt = block.timestamp;
    
    emit GameCreated(gameId, msg.sender);
    return gameId;
}
```

##### 加入游戏（加密版）
```solidity
function joinGame(
    uint256 gameId,
    einput encryptedGuess,      // 加密的猜测
    bytes calldata inputProof
) external payable {
    Game storage game = games[gameId];
    require(game.status == GameStatus.ACTIVE, "Game not active");
    require(msg.value == game.entryFee, "Incorrect entry fee");
    require(!hasPlayerGuessed[gameId][msg.sender], "Already guessed");
    
    // 🔐 转换并存储加密的猜测
    euint32 guess = TFHE.asEuint32(encryptedGuess, inputProof);
    game.encryptedGuesses[msg.sender] = guess;
    
    // 🔒 授权
    TFHE.allow(guess, address(this));
    
    game.players.push(msg.sender);
    game.prizePool += msg.value;
    hasPlayerGuessed[gameId][msg.sender] = true;
    
    emit PlayerJoined(gameId, msg.sender);
}
```

##### 结束游戏（密文计算版）
```solidity
function endGame(uint256 gameId) external {
    Game storage game = games[gameId];
    require(msg.sender == game.owner, "Only owner");
    require(game.status == GameStatus.ACTIVE, "Game not active");
    require(game.players.length > 0, "No players");
    
    // 🔐 在密文状态下找出最接近的玩家
    address bestPlayer = game.players[0];
    euint32 bestGuess = game.encryptedGuesses[bestPlayer];
    
    // 计算第一个玩家的差值
    ebool isLess = TFHE.lt(bestGuess, game.encryptedTarget);
    euint32 diff1 = TFHE.sub(game.encryptedTarget, bestGuess);
    euint32 diff2 = TFHE.sub(bestGuess, game.encryptedTarget);
    euint32 minDiff = TFHE.select(isLess, diff1, diff2);
    
    // 遍历其他玩家，密文比较
    for (uint256 i = 1; i < game.players.length; i++) {
        address player = game.players[i];
        euint32 guess = game.encryptedGuesses[player];
        
        // 计算差值
        ebool isLess2 = TFHE.lt(guess, game.encryptedTarget);
        euint32 d1 = TFHE.sub(game.encryptedTarget, guess);
        euint32 d2 = TFHE.sub(guess, game.encryptedTarget);
        euint32 currentDiff = TFHE.select(isLess2, d1, d2);
        
        // 比较差值，选择更小的
        ebool isCloser = TFHE.lt(currentDiff, minDiff);
        minDiff = TFHE.select(isCloser, currentDiff, minDiff);
        bestPlayer = TFHE.select(isCloser, player, bestPlayer); // ⚠️ 这里需要特殊处理
    }
    
    // 🚀 请求 Gateway 解密获胜者地址
    uint256[] memory cts = new uint256[](1);
    cts[0] = Gateway.toUint256(/* winner ciphertext */);
    
    uint256 requestId = Gateway.requestDecryption(
        cts,
        this.callbackEndGame.selector,
        0,
        block.timestamp + 100,
        false
    );
    
    decryptionRequestToGameId[requestId] = gameId;
    game.status = GameStatus.CALCULATING;
    
    emit DecryptionRequested(gameId, requestId);
}
```

##### Gateway 回调函数
```solidity
function callbackEndGame(
    uint256 requestId,
    address decryptedWinner
) public onlyGateway {
    uint256 gameId = decryptionRequestToGameId[requestId];
    Game storage game = games[gameId];
    
    require(game.status == GameStatus.CALCULATING, "Not calculating");
    
    game.winner = decryptedWinner;
    game.status = GameStatus.ENDED;
    
    // 转账
    payable(decryptedWinner).transfer(game.prizePool);
    
    emit GameEnded(gameId, decryptedWinner, game.prizePool);
}
```

---

### 阶段 3: 前端 SDK 集成 ⏱️ 2小时

**文件**：`frontend/src/utils/fhevm.ts`

#### 3.1 初始化 SDK

```typescript
import { createInstance, FhevmInstance } from "fhevmjs";

let instance: FhevmInstance | null = null;

export async function initFhevm(
  provider: BrowserProvider
): Promise<FhevmInstance> {
  if (instance) return instance;

  console.log("🔧 初始化 FHEVM SDK...");

  // 创建实例
  instance = await createInstance({
    chainId: SEPOLIA_CHAIN_ID,
    networkUrl: SEPOLIA_RPC_URL,
    gatewayUrl: GATEWAY_URL, // 需要配置
    aclAddress: ACL_ADDRESS,
    kmsAddress: KMS_ADDRESS,
  });

  console.log("✅ FHEVM SDK 初始化成功");
  return instance;
}
```

#### 3.2 加密用户输入

```typescript
export async function encryptNumber(
  number: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; inputProof: string }> {
  
  if (!instance) {
    throw new Error("FHEVM SDK not initialized");
  }

  console.log(`🔐 加密数字: ${number}`);

  // 创建加密输入
  const input = instance.createEncryptedInput(
    contractAddress,
    userAddress
  );

  // 添加要加密的数字
  input.add32(number);

  // 加密并生成证明
  const encryptedInput = input.encrypt();

  console.log("✅ 加密完成");

  return {
    handle: encryptedInput.handles[0],
    inputProof: encryptedInput.inputProof,
  };
}
```

#### 3.3 更新合约调用

**文件**：`frontend/src/hooks/useContract.ts`

```typescript
const createGame = useCallback(
  async (targetNumber: number, entryFeeEth: string) => {
    if (!contract || !address || !provider) {
      throw new Error("请先连接钱包");
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🎮 创建游戏...");
      console.log("   目标数字:", targetNumber);
      console.log("   入场费:", entryFeeEth, "ETH");

      // 🔐 加密目标数字
      const encrypted = await encryptNumber(
        targetNumber,
        CONTRACT_ADDRESS,
        address
      );

      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const entryFee = parseEther(entryFeeEth);

      // 🚀 调用 FHE 合约
      const tx = await contractWithSigner.createGame(
        encrypted.handle,        // einput
        encrypted.inputProof,    // bytes
        entryFee,
        { value: entryFee }
      );

      console.log("⏳ 等待交易确认...", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ 游戏创建成功!");

      // ... 解析事件获取 gameId

      setLoading(false);
      return { success: true, gameId, txHash: tx.hash };
    } catch (err: any) {
      console.error("❌ 创建游戏失败:", err);
      setError(err.message || "创建游戏失败");
      setLoading(false);
      return { success: false, error: err.message };
    }
  },
  [contract, address, provider]
);
```

---

### 阶段 4: 配置和部署 ⏱️ 30分钟

#### 4.1 更新常量配置

**文件**：`frontend/src/utils/constants.ts`

```typescript
// Sepolia + fhEVM Coprocessor 配置
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/YOUR_KEY";

// fhEVM Coprocessor 地址（Sepolia）
export const GATEWAY_URL = "https://gateway.sepolia.fhevm.io"; // 需要确认正确地址
export const ACL_ADDRESS = "0x..."; // 需要查询官方文档
export const KMS_ADDRESS = "0x..."; // 需要查询官方文档

// 新的 FHE 合约地址（部署后更新）
export const CONTRACT_ADDRESS_FHE = "0x...";
```

#### 4.2 部署脚本

**文件**：`scripts/deploy_fhe.js`

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🚀 部署 GuessGameFHE 到 Sepolia...");
  console.log("👤 部署者:", deployer.address);
  console.log("💰 余额:", hre.ethers.formatEther(
    await deployer.provider.getBalance(deployer.address)
  ), "ETH");

  const GuessGameFHE = await hre.ethers.getContractFactory("GuessGameFHE");
  
  console.log("⏳ 部署中...");
  const game = await GuessGameFHE.deploy();
  await game.waitForDeployment();

  const address = await game.getAddress();
  console.log("✅ GuessGameFHE 已部署到:", address);

  // 保存部署信息
  const fs = require('fs');
  const deployInfo = {
    contractName: "GuessGameFHE",
    contractAddress: address,
    deployerAddress: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    './deployment_fhe.json',
    JSON.stringify(deployInfo, null, 2)
  );
  
  console.log("💾 部署信息已保存");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

### 阶段 5: 测试验证 ⏱️ 1小时

#### 5.1 测试脚本

**文件**：`scripts/test_fhe_game.js`

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🧪 测试 FHE 游戏流程...\n");

  const contractAddress = "0x..."; // 部署后的地址
  const contract = await hre.ethers.getContractAt(
    "GuessGameFHE",
    contractAddress
  );

  // 测试 1: 创建游戏
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("测试 1: 创建加密游戏");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // ... 实现测试逻辑
  
  // 测试 2: 加入游戏
  // 测试 3: 结束游戏
  // 测试 4: 验证 Gateway 回调
  
  console.log("\n✅ 所有测试通过!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## ⚠️ 重要注意事项

### 1. Gateway 地址配置

需要查询 Zama 官方文档获取 Sepolia 上的正确地址：
- Gateway URL
- ACL 合约地址
- KMS 地址

**参考文档**：
- https://docs.zama.ai/fhevm/getting-started/devnet
- https://github.com/zama-ai/fhevm-contracts

### 2. 选择最简问题

**问题**：密文状态下无法直接选择地址

在上面的 `endGame` 函数中，我们需要解决这个问题：
```solidity
// ❌ 无法直接这样做
bestPlayer = TFHE.select(isCloser, player, bestPlayer);
```

**解决方案**：
- 方案 A: 解密所有猜测，明文计算（部分隐私）
- 方案 B: 只解密获胜者的猜测值，反向查找地址
- 方案 C: 使用玩家索引，解密索引值

### 3. Gas 成本

FHE 操作的 Gas 成本比普通操作高很多：
- 加密操作：~200,000 gas
- 密文比较：~100,000 gas
- Gateway 解密：需要额外等待时间

---

## 📚 参考资源

### 官方文档
1. FHEVM 文档：https://docs.zama.ai/fhevm
2. fhevmjs SDK：https://docs.zama.ai/fhevm/tutorials/build-a-dapp
3. Gateway 文档：https://docs.zama.ai/fhevm/fundamentals/gateway

### 示例代码
1. 加密计数器：https://github.com/zama-ai/fhevm-hardhat-template
2. ConfidentialERC20：https://github.com/zama-ai/fhevm/blob/main/examples/ConfidentialERC20.sol

### 技术支持
1. Zama Discord：https://discord.gg/zama
2. GitHub Issues：https://github.com/zama-ai/fhevm/issues

---

## 🎯 实施检查清单

```
阶段 1: 学习准备
□ 理解 FHE 基本原理
□ 了解 FHEVM 组件
□ 理解数据流程

阶段 2: 创建 FHE 合约
□ 定义 Game 结构（使用 euint32）
□ 实现 createGame（加密输入）
□ 实现 joinGame（加密输入）
□ 实现 endGame（密文计算）
□ 实现 Gateway 回调
□ 编译通过

阶段 3: 前端 SDK 集成
□ 初始化 fhevmjs
□ 实现 encryptNumber 函数
□ 更新 createGame 调用
□ 更新 joinGame 调用
□ 处理 Gateway 状态

阶段 4: 配置和部署
□ 获取正确的 Gateway 配置
□ 更新常量文件
□ 部署 FHE 合约
□ 验证合约

阶段 5: 测试验证
□ 测试创建加密游戏
□ 测试加入游戏
□ 测试密文计算
□ 验证 Gateway 回调
□ 完整流程测试
```

---

**准备好开始了吗？我们从哪一步开始？** 🚀


