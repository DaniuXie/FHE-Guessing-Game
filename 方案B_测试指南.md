# 🧪 方案B 测试指南（简化明文版）

## 📋 测试前准备

### 1. 确认部署信息
- ✅ **合约地址**: `0xeea65B27764652050929D26bDF8024B6Ee833357`
- ✅ **网络**: Sepolia Testnet
- ✅ **区块浏览器**: [Etherscan](https://sepolia.etherscan.io/address/0xeea65B27764652050929D26bDF8024B6Ee833357)

### 2. 前端服务
- ✅ **本地地址**: http://localhost:5174
- ✅ **状态**: 应该已在运行中

### 3. 测试钱包
- ✅ **主钱包**: `0x88B3B71B8392d0Bd7C0F253FE19622D80Fb7e949`
- ✅ **余额**: ~0.6 ETH (Sepolia)
- 🔄 **建议**: 准备第二个钱包用于测试多人游戏

---

## 🎯 测试流程

### 测试1: 创建游戏 ✨
**目标**: 验证游戏创建功能

1. **打开前端**
   - 访问 http://localhost:5174
   - 连接 MetaMask 钱包

2. **创建游戏**
   - 点击"创建游戏"标签
   - 输入目标数字: `50` (1-100之间)
   - 输入入场费: `0.001` ETH
   - 点击"创建游戏"按钮

3. **预期结果**
   - ✅ MetaMask 弹出交易确认
   - ✅ 交易成功后显示游戏 ID
   - ✅ 可以在"游戏列表"中看到新游戏
   - ✅ 游戏状态为"进行中"
   - ✅ 奖池 = 0.001 ETH

4. **验证数据**
   ```javascript
   // 在浏览器控制台执行
   const gameId = 1; // 你的游戏ID
   const gameInfo = await contract.getGameInfo(gameId);
   console.log("目标数字:", Number(gameInfo.target)); // 应该是 50
   console.log("房主:", gameInfo.owner);
   console.log("入场费:", ethers.formatEther(gameInfo.entryFee));
   ```

---

### 测试2: 加入游戏 🎮
**目标**: 验证玩家加入和猜测功能

**方法A: 使用第二个钱包（推荐）**
1. 在 MetaMask 中切换到另一个账户
2. 确保有足够的 Sepolia ETH
3. 连接钱包到前端
4. 在游戏列表中找到刚创建的游戏
5. 点击"加入游戏"
6. 输入猜测: `45` (接近目标)
7. 确认交易

**方法B: 使用同一个钱包（仅测试合约拒绝）**
1. 尝试加入自己创建的游戏
2. 应该看到错误: "Owner cannot join"

**预期结果**
- ✅ 交易成功
- ✅ 玩家列表更新（显示新玩家）
- ✅ 奖池增加 0.001 ETH
- ✅ 玩家猜测可见（简化版特性）
- ✅ 显示与目标数字的差值

---

### 测试3: 多人加入 👥
**目标**: 验证多玩家场景

1. 使用更多钱包（或让其他人）加入游戏
2. 建议猜测值:
   - 玩家1: `45` (差值 5)
   - 玩家2: `55` (差值 5)
   - 玩家3: `48` (差值 2) ← 应该获胜
   - 玩家4: `70` (差值 20)

3. **预期结果**
   - ✅ 每个玩家成功加入
   - ✅ 奖池持续增长
   - ✅ 所有猜测实时可见
   - ✅ 差值自动计算显示

---

### 测试4: 结束游戏并计算获胜者 🏁
**目标**: 验证自动获胜者计算

1. **切换回房主钱包**
   - 在 MetaMask 中切换到创建游戏的账户

2. **查看游戏详情**
   - 点击游戏进入详情页
   - 确认所有玩家和猜测已显示
   - 确认目标数字显示正确 (50)

3. **结束游戏**
   - 点击"🏁 结束游戏并计算获胜者"
   - 确认弹窗中的目标数字
   - 批准交易

4. **预期结果**
   - ✅ 交易成功
   - ✅ 游戏状态变为"已结束"
   - ✅ 自动识别最接近的玩家（玩家3，猜测48）
   - ✅ 奖池转账给获胜者
   - ✅ 显示完整结果:
     - 获胜者地址
     - 获胜猜测: 48
     - 目标数字: 50
     - 差值: 2
     - 奖金: (玩家数 × 0.001) ETH

5. **验证链上数据**
   ```javascript
   const gameInfo = await contract.getGameInfo(gameId);
   console.log("游戏状态:", gameInfo.status); // 1 = ENDED
   console.log("获胜者:", gameInfo.winner);
   
   const winnerGuess = await contract.getPlayerGuess(gameId, gameInfo.winner);
   console.log("获胜猜测:", Number(winnerGuess)); // 48
   console.log("目标数字:", Number(gameInfo.target)); // 50
   console.log("差值:", Math.abs(Number(winnerGuess) - Number(gameInfo.target))); // 2
   ```

---

### 测试5: 边界情况 🔍

#### 5.1 空游戏结束
1. 创建游戏但不让任何人加入
2. 尝试结束游戏
3. **预期**: 显示错误 "游戏没有玩家，无法结束"

#### 5.2 重复加入
1. 使用同一钱包加入游戏两次
2. **预期**: 第二次交易失败 "Already guessed"

#### 5.3 无效猜测
1. 尝试输入 0 或 101
2. **预期**: 前端验证拒绝，或合约拒绝 "Guess must be 1-100"

#### 5.4 错误的入场费
1. 尝试用错误金额加入游戏
2. **预期**: 交易失败 "Incorrect entry fee"

#### 5.5 非房主结束游戏
1. 使用非房主钱包尝试结束游戏
2. **预期**: 前端不显示按钮，或合约拒绝 "Only owner can end"

---

## 📊 测试检查表

### 功能测试
- [ ] 创建游戏
- [ ] 单人加入游戏
- [ ] 多人加入游戏
- [ ] 结束游戏
- [ ] 自动计算获胜者
- [ ] 奖池转账

### UI/UX 测试
- [ ] 钱包连接
- [ ] 游戏列表显示
- [ ] 游戏详情显示
- [ ] 实时数据更新
- [ ] 错误提示清晰
- [ ] 加载状态明确

### 数据正确性
- [ ] 目标数字正确
- [ ] 玩家猜测正确
- [ ] 差值计算正确
- [ ] 获胜者判断正确
- [ ] 奖池金额正确
- [ ] 余额变化正确

### 错误处理
- [ ] 重复加入拒绝
- [ ] 房主加入拒绝
- [ ] 空游戏结束拒绝
- [ ] 无效猜测拒绝
- [ ] 错误金额拒绝
- [ ] 非房主结束拒绝

---

## 🐛 已知问题

### 问题1: 简化版隐私性
**现象**: 所有玩家的猜测和目标数字都是公开的
**原因**: 方案B 是明文版本，不使用 FHE 加密
**影响**: 玩家可以看到其他人的猜测，可能影响游戏公平性
**解决**: 升级到方案A（完整 FHE 版本）

### 问题2: Gas 成本
**现象**: `endGame()` 函数会遍历所有玩家
**影响**: 玩家越多，Gas 越高（线性增长）
**建议**: 建议最多 20-30 个玩家

---

## 🎉 成功标准

### 最低标准 ✅
- [x] 合约编译通过
- [x] 合约部署成功
- [x] 前端启动无错误
- [ ] 可以创建游戏
- [ ] 可以加入游戏
- [ ] 可以结束游戏

### 完整标准 🌟
- [ ] 所有功能正常工作
- [ ] UI 响应流畅
- [ ] 错误处理完善
- [ ] 数据显示准确
- [ ] 多人游戏稳定

---

## 📝 测试日志模板

```markdown
## 测试日志 - [日期]

### 测试环境
- 前端: http://localhost:5174
- 合约: 0xeea65B27764652050929D26bDF8024B6Ee833357
- 测试账户: 0x...

### 测试1: 创建游戏
- 目标数字: 50
- 入场费: 0.001 ETH
- 结果: ✅ 成功 / ❌ 失败
- 游戏ID: 1
- 交易哈希: 0x...
- 备注: 

### 测试2: 加入游戏
- 游戏ID: 1
- 玩家: 0x...
- 猜测: 45
- 结果: ✅ 成功 / ❌ 失败
- 交易哈希: 0x...
- 备注: 

### 测试3: 结束游戏
- 游戏ID: 1
- 玩家数: 3
- 获胜者: 0x...
- 获胜猜测: 48
- 结果: ✅ 成功 / ❌ 失败
- 交易哈希: 0x...
- 备注: 

### 发现的问题
1. [问题描述]
   - 重现步骤: 
   - 错误信息: 
   - 临时解决: 

### 总结
- 通过测试: X / Y
- 主要问题: 
- 下一步: 
```

---

## 🚀 快速测试脚本

### 合约交互脚本
```javascript
// 在浏览器控制台执行

// 1. 获取合约实例
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contractAddress = "0xeea65B27764652050929D26bDF8024B6Ee833357";
const contractABI = [/* 从 constants.ts 复制 */];
const contract = new ethers.Contract(contractAddress, contractABI, signer);

// 2. 创建游戏
const tx1 = await contract.createGame(50, ethers.parseEther("0.001"), {
  value: ethers.parseEther("0.001")
});
await tx1.wait();
console.log("游戏创建成功:", tx1.hash);

// 3. 查询游戏
const gameId = await contract.getTotalGames();
const gameInfo = await contract.getGameInfo(gameId);
console.log("游戏信息:", gameInfo);

// 4. 加入游戏（切换账户后执行）
const tx2 = await contract.joinGame(gameId, 45, {
  value: gameInfo.entryFee
});
await tx2.wait();
console.log("加入成功:", tx2.hash);

// 5. 结束游戏（房主执行）
const tx3 = await contract.endGame(gameId);
await tx3.wait();
console.log("游戏结束:", tx3.hash);

// 6. 查看结果
const finalInfo = await contract.getGameInfo(gameId);
console.log("获胜者:", finalInfo.winner);
const winnerGuess = await contract.getPlayerGuess(gameId, finalInfo.winner);
console.log("获胜猜测:", Number(winnerGuess));
console.log("目标数字:", Number(finalInfo.target));
```

---

*测试愉快！如有问题请记录到测试日志中。* 🎮✨

