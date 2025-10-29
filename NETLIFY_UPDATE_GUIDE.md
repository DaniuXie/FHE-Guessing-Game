# 🔄 Netlify 更新指南 - 修复游戏列表问题

## 🐛 问题分析

**问题描述：**
- 创建游戏后刷新页面，游戏消失
- 游戏列表一直显示 "Refreshing..." 或 "Loading..."
- 控制台显示 FHE Gateway 连接失败

**根本原因：**
1. ❌ 旧合约地址配置错误
2. ❌ FHE Gateway 连接问题（已知问题，暂时无法解决）

**解决方案：**
✅ 重新部署Plaintext合约并更新配置

---

## ✅ 已完成的修复

### 1. 新合约部署

```
旧合约: 0x6bD042918869d1136043b0318FF530cAA5bE377e (可能无效)
新合约: 0x5AF7bB5030A6cCF5BA09315987E4480B40421a57 ✅

部署时间: 2025-10-29
部署网络: Sepolia Testnet
区块号: 9515274
Etherscan: https://sepolia.etherscan.io/address/0x5AF7bB5030A6cCF5BA09315987E4480B40421a57
```

### 2. 前端配置更新

已更新 `frontend/src/utils/constants.ts`：
```typescript
export const CONTRACT_ADDRESS = "0x5AF7bB5030A6cCF5BA09315987E4480B40421a57";
```

### 3. 前端重新构建

✅ 已完成构建
✅ dist 文件夹已更新
✅ 包含新的合约地址

---

## 📂 重新上传到 Netlify

### 方式 1：拖拽更新（最简单）

1. **打开 Netlify**
   ```
   https://app.netlify.com/
   ```

2. **进入您的站点**
   - 找到您的 FHE Guessing Game 站点
   - 点击进入站点详情页

3. **上传新版本**
   - 点击 "Deploys" 标签
   - 点击 "Deploy site" 按钮
   - 选择 "Upload folder"
   - 选择文件夹：`E:\ZAMAcode\02\frontend\dist`
   - 等待上传完成

4. **等待部署**
   - 状态变为 "Published"
   - 通常需要 1-2 分钟

### 方式 2：拖拽替换

1. 在 Netlify 首页
2. 直接将 `E:\ZAMAcode\02\frontend\dist` 文件夹拖拽到页面
3. 会创建一个新的部署

---

## ✅ 部署后验证

### 步骤 1: 清除浏览器缓存

**重要！** 必须清除缓存才能看到新版本：

- **Chrome**: `Ctrl + Shift + Delete` → 清除缓存图片和文件
- **或者**: 使用无痕模式 (`Ctrl + Shift + N`)

### 步骤 2: 连接钱包

1. 打开您的 Netlify 站点 URL
2. 点击 "Connect Wallet"
3. 确认 MetaMask 连接
4. 确保网络是 **Sepolia**

### 步骤 3: 选择 Scheme B (Plaintext)

⚠️ **重要：** 目前 FHE Gateway 有连接问题，所以：
- ✅ 使用 **Scheme B (Plaintext)** 进行测试
- ❌ 暂时不要使用 **Scheme A (FHE)** 

### 步骤 4: 创建游戏

1. 点击 "Create Game" 按钮
2. 填写信息：
   - **Target Number**: 50 (1-100之间)
   - **Entry Fee**: 0.001 ETH

3. 点击 "Create Game (Plaintext)"
4. 确认 MetaMask 交易
5. 等待交易确认（约10-30秒）

### 步骤 5: 验证游戏列表

**成功标志：**
- ✅ 游戏创建后立即显示在列表中
- ✅ 刷新页面后游戏仍然存在
- ✅ 显示正确的 Game ID、Entry Fee、Prize Pool
- ✅ 状态显示为 "Active"

**如果仍然有问题：**
1. 打开浏览器控制台 (F12)
2. 查看是否有错误信息
3. 检查网络是否是 Sepolia
4. 确认钱包已连接

### 步骤 6: 完整测试流程

1. **创建游戏** ✅
   - 使用 Scheme B (Plaintext)
   - 设置目标数字和入场费
   - 确认交易

2. **查看游戏详情**
   - 点击游戏卡片
   - 查看游戏信息
   - 确认目标数字已显示（Plaintext模式）

3. **加入游戏**（使用另一个账户）
   - 切换 MetaMask 账户
   - 输入游戏 ID
   - 输入猜测数字
   - 支付入场费

4. **结束游戏**
   - 回到创建者账户
   - 点击 "End Game"
   - 查看结果
   - 确认获胜者和奖金

---

## 🔧 新合约信息

### Plaintext 合约 (Scheme B)

```
合约名称: GuessGameSimple
合约地址: 0x5AF7bB5030A6cCF5BA09315987E4480B40421a57
网络: Sepolia (Chain ID: 11155111)
RPC URL: https://eth-sepolia.public.blastapi.io

Etherscan:
https://sepolia.etherscan.io/address/0x5AF7bB5030A6cCF5BA09315987E4480B40421a57
```

### FHE 合约 (Scheme A) - 暂时不可用

```
合约名称: GuessGameFHE_v3
合约地址: 0x5abEb1f463419F577ab51939DF978e7Ef14d5325
状态: ⚠️ Gateway 连接问题，暂时无法使用

已知问题:
- GET https://gateway.sepolia.zama.ai/public_key net::ERR_CONNECTION_CLOSED
- 这是外部服务问题，非代码问题
```

---

## 🎯 测试用例

### 测试 1: 基础功能 ✅

- [ ] 页面正常加载
- [ ] 钱包连接成功
- [ ] 可以选择 Scheme B
- [ ] 可以创建游戏
- [ ] 游戏显示在列表中

### 测试 2: 刷新持久性 ✅

- [ ] 创建游戏后刷新页面
- [ ] 游戏仍然显示在列表中
- [ ] 游戏信息正确显示
- [ ] 可以点击查看详情

### 测试 3: 完整游戏流程 ✅

- [ ] 创建游戏
- [ ] 玩家加入
- [ ] 结束游戏
- [ ] 显示结果
- [ ] 奖金转账成功

---

## 🐛 如果还有问题

### 检查清单

1. **确认合约地址正确**
   - 打开浏览器控制台 (F12)
   - 切换到 Network 标签
   - 查看 RPC 请求
   - 确认合约地址是 `0x5AF7bB5030A6cCF5BA09315987E4480B40421a57`

2. **确认网络配置**
   - MetaMask 显示 "Sepolia"
   - Chain ID: 11155111
   - 有足够的测试 ETH

3. **查看控制台日志**
   - 应该看到：`GameList: Loading game list`
   - 应该看到：`Total games: X`
   - 应该看到：`Loaded game #X`
   - 不应该有红色错误

4. **检查 Etherscan**
   - 访问：https://sepolia.etherscan.io/address/0x5AF7bB5030A6cCF5BA09315987E4480B40421a57
   - 查看合约是否存在
   - 查看最近的交易

---

## 📊 预期效果

**修复前：**
- ❌ 游戏列表一直 Loading...
- ❌ 刷新后游戏消失
- ❌ 控制台大量错误

**修复后：**
- ✅ 游戏列表正常加载
- ✅ 刷新后游戏持久显示
- ✅ 可以完整进行游戏流程
- ✅ 控制台无错误（除了FHE Gateway问题）

---

## 🚀 开始更新

**现在就重新上传到 Netlify：**

1. 打开文件夹：`E:\ZAMAcode\02\frontend\dist`
2. 访问：https://app.netlify.com/
3. 拖拽 `dist` 文件夹到页面
4. 等待部署完成
5. 清除浏览器缓存
6. 测试新版本！

**部署完成后，请测试并告诉我结果！** 🎉

---

**文档创建时间：** 2025-10-29  
**合约部署时间：** 2025-10-29  
**状态：** ✅ 准备就绪

