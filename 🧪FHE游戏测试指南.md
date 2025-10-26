# 🧪 FHE游戏测试指南

## 📋 测试准备

**FHE 合约已部署**: `0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3`  
**网络**: Sepolia Testnet  
**状态**: ✅ 已部署，待测试

---

## ⚠️ 重要提示

FHE 版本的游戏需要使用 **fhevmjs SDK** 在浏览器环境中加密数据。

**无法在 Hardhat 脚本中直接测试完整流程**，因为：
- einput 需要浏览器环境的 SDK 生成
- 加密操作需要访问 Gateway 服务
- SDK 初始化需要 window.ethereum

---

## 🎯 三种测试方式

### 方式 1: 快速验证合约状态 ⚡

**最简单，验证合约已正确部署**

```bash
cd E:\ZAMAcode\02
npx hardhat run scripts/test_fhe_game.js --network sepolia
```

**会检查**:
- ✅ 合约是否可访问
- ✅ 基本函数是否可调用
- ✅ Gateway 是否在线
- ✅ 合约地址是否正确

---

### 方式 2: 前端界面测试 🌐 (推荐！)

**最完整，测试实际用户体验**

#### 步骤 1: 更新前端配置

编辑 `frontend/src/utils/constants.ts`:

```typescript
// 在文件中添加 FHE 合约地址
export const CONTRACT_ADDRESS_FHE = "0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3";

// 或者直接替换现有地址
export const CONTRACT_ADDRESS = "0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3";
```

#### 步骤 2: 更新前端逻辑使用 FHE SDK

编辑 `frontend/src/hooks/useContract.ts`:

```typescript
// 导入 FHE 加密函数
import { encryptNumber } from "../utils/fhevm_fhe";

// 在 createGame 中使用
const createGame = async (targetNumber, entryFeeEth) => {
  // 1. 加密目标数字
  const { handle, proof } = await encryptNumber(
    targetNumber,
    CONTRACT_ADDRESS_FHE,
    address
  );
  
  // 2. 调用合约
  const tx = await contract.createGame(handle, proof, entryFee, {
    value: entryFee
  });
  
  // 3. 等待确认
  await tx.wait();
};
```

#### 步骤 3: 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:5174

#### 步骤 4: 测试流程

```
1. 连接钱包 (MetaMask)
   ↓
2. 创建游戏
   - 输入目标数字（如 15）
   - 设置入场费（如 0.002 ETH）
   - SDK 自动加密
   - 发送交易
   ↓
3. 另一个账号加入游戏
   - 输入猜测（如 10）
   - SDK 自动加密
   - 支付入场费
   ↓
4. 房主结束游戏
   - 触发密文计算
   - 请求 Gateway 解密
   - 等待回调 (可能需要几十秒)
   ↓
5. 查看结果
   - 获胜者地址
   - 解密后的数据
```

---

### 方式 3: Hardhat Console 交互 🖥️

**最灵活，适合调试**

#### 步骤 1: 启动控制台

```bash
npx hardhat console --network sepolia
```

#### 步骤 2: 连接合约

```javascript
const contractAddress = "0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3";
const contract = await ethers.getContractAt("GuessGameFHE_v2", contractAddress);

// 检查状态
const totalGames = await contract.getTotalGames();
console.log("总游戏数:", totalGames.toString());

// 获取游戏信息
if (totalGames > 0) {
  const info = await contract.getGameInfo(1);
  console.log("游戏 #1:", info);
}
```

---

## 🔍 当前状态检查

运行此命令检查合约状态：

```bash
npx hardhat run scripts/test_fhe_game.js --network sepolia
```

**预期输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 测试 FHE 游戏合约
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 合约地址: 0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3
🌐 网络: sepolia

✅ 总游戏数: 0
✅ Gateway 在线
✅ 合约接口验证通过
```

---

## 📝 测试检查清单

### 基础验证 ✅
```
□ 合约地址可访问
□ getTotalGames() 可调用
□ Gateway 服务在线
□ 合约在 Etherscan 上可见
```

### 完整功能测试 (需要前端)
```
□ 创建游戏 (加密输入)
□ 加入游戏 (加密猜测)
□ 结束游戏 (密文计算)
□ Gateway 解密回调
□ 查看解密结果
```

---

## ⚠️ 可能遇到的问题

### 问题 1: SDK 初始化失败

**错误**: "FHEVM SDK 初始化失败"

**解决**:
```javascript
// 检查 Gateway 配置
const FHEVM_CONFIG = {
  chainId: 11155111,
  networkUrl: "https://eth-sepolia.public.blastapi.io",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
};
```

### 问题 2: 加密失败

**错误**: "加密数字失败"

**解决**:
- 确保钱包已连接
- 确保在浏览器环境
- 检查 SDK 是否正确导入

### 问题 3: Gateway 回调超时

**现象**: 游戏状态一直是 "DECRYPTING"

**原因**: Gateway 处理需要时间

**解决**:
- 等待更长时间 (30-60秒)
- 检查 Gateway 状态
- 查看交易是否成功

---

## 🔧 调试技巧

### 1. 查看合约事件

```bash
npx hardhat console --network sepolia

const contract = await ethers.getContractAt("GuessGameFHE_v2", "0x3968...");

// 监听事件
contract.on("GameCreated", (gameId, owner) => {
  console.log("游戏创建:", gameId, owner);
});

contract.on("DecryptionRequested", (gameId, requestId) => {
  console.log("请求解密:", gameId, requestId);
});

contract.on("GameEnded", (gameId, winner) => {
  console.log("游戏结束:", gameId, winner);
});
```

### 2. 查看 Gateway 日志

访问: https://gateway.sepolia.zama.ai/health

### 3. 查看 Etherscan

访问合约页面查看所有交易：
https://sepolia.etherscan.io/address/0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3

---

## 🎯 推荐测试流程

### 第一次测试 - 基础验证

```bash
# 1. 检查合约状态
npx hardhat run scripts/test_fhe_game.js --network sepolia

# 2. 查看 Etherscan
# 访问合约页面确认部署成功
```

### 第二次测试 - 前端集成

```bash
# 1. 更新前端配置
# 编辑 frontend/src/utils/constants.ts

# 2. 启动前端
cd frontend
npm run dev

# 3. 在浏览器中测试
# 连接钱包 → 创建游戏 → 加入 → 结束
```

---

## 📊 测试结果记录模板

```markdown
## 测试记录

**日期**: 2025-10-25
**合约**: 0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3
**测试人**: 

### 基础验证
- [ ] 合约可访问
- [ ] Gateway 在线
- [ ] 函数可调用

### 功能测试
- [ ] 创建游戏
  - 目标数字: 
  - 交易哈希: 
  - Gas 使用: 
  
- [ ] 加入游戏
  - 猜测数字: 
  - 交易哈希: 
  - Gas 使用: 
  
- [ ] 结束游戏
  - 交易哈希: 
  - 解密时间: 
  - 获胜者: 
  
### 问题记录
- 

### 总结
- 
```

---

## 🚀 现在开始测试！

**立即运行**:

```bash
npx hardhat run scripts/test_fhe_game.js --network sepolia
```

**查看结果，然后决定下一步！** ✨

