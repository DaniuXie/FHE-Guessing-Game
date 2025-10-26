# 🎮 机密数字猜谜游戏

基于 Zama FHEVM 的完全隐私保护区块链游戏

---

## ✨ 项目亮点

🔐 **完全隐私保护** - 使用全同态加密(FHE)技术  
🚀 **两个实现方案** - 从简单到完整FHE  
⚡ **Gateway 自动解密** - 无需手动解密操作  
✅ **完整测试通过** - 部署到 Sepolia 测试网  
📚 **详细文档** - 学习笔记和实现指南

---

## 🎯 两个方案

### 方案B - GuessGameSimple (入门版)

**特点**：完全明文版本，简单易用

```
✅ 明文存储目标数字和猜测
✅ 直接计算获胜者
✅ 用户体验最佳
✅ Gas成本低

合约地址: 0x6bD042918869d1136043b0318FF530cAA5bE377e
网络: Sepolia Testnet
状态: ✅ 完整运行
```

### 方案A - GuessGameFHE_v2 (完整FHE版) ⭐

**特点**：真正的隐私保护游戏

```
✅ 目标数字加密存储 (euint32)
✅ 所有猜测加密存储 (euint32)
✅ 密文状态下计算差值
✅ Gateway 自动解密获胜者
✅ 游戏进行中完全保密

合约地址: 0x39686AAfd7d68Ab66253f92bF72c5D16b0c442E3
网络: Sepolia Testnet
状态: ✅ 已部署
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd 02
```

### 2. 安装依赖

```bash
# 安装智能合约依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
MNEMONIC="你的钱包助记词"
ALCHEMY_KEY="你的Alchemy API Key"
ETHERSCAN_API_KEY="你的Etherscan API Key"
```

### 4. 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:5174

---

## 📋 技术栈

### 智能合约
- Solidity 0.8.20 / 0.8.24
- Hardhat 2.19.0
- fhEVM 0.7.0-0
- OpenZeppelin Contracts

### 前端
- React 18
- TypeScript
- Vite 5
- ethers.js 6
- fhevmjs
- TailwindCSS 3

### 区块链
- Sepolia Testnet
- fhEVM Coprocessor
- Gateway (gateway.sepolia.zama.ai)

---

## 🎮 游戏玩法

### 创建游戏
1. 连接钱包
2. 输入目标数字 (1-100)
3. 设置入场费
4. 支付入场费创建游戏

### 加入游戏
1. 选择游戏
2. 输入你的猜测
3. 支付入场费加入

### 结束游戏
1. 房主触发结束
2. 合约自动计算获胜者
3. 最接近的玩家获得全部奖池

---

## 📁 项目结构

```
E:\ZAMAcode\02\
├── contracts/                    # 智能合约
│   ├── GuessGameSimple.sol      # 方案B (明文版)
│   └── GuessGameFHE_v2.sol      # 方案A (完整FHE版)
├── scripts/                      # 部署和测试脚本
│   ├── deploy_simple.js
│   └── deploy_fhe_v2.js
├── frontend/                     # React前端
│   ├── src/
│   │   ├── components/          # React组件
│   │   ├── hooks/              # 自定义Hooks
│   │   └── utils/              # 工具函数
│   └── package.json
├── deployment_simple.json        # 方案B部署信息
├── deployment_fhe_v2.json       # 方案A部署信息
└── *.md                         # 文档

重要文档:
├── README_FINAL.md              # 总体说明 (当前文件)
├── FHE_学习总结.md              # FHE学习笔记
├── 🎉方案A完整实现成功.md      # 方案A完成总结
└── 🎉升级成功.md               # fhevm升级记录
```

---

## 🔧 开发命令

### 编译合约
```bash
npx hardhat compile
```

### 部署合约
```bash
# 部署方案B
npx hardhat run scripts/deploy_simple.js --network sepolia

# 部署方案A
npx hardhat run scripts/deploy_fhe_v2.js --network sepolia
```

### 运行测试
```bash
npx hardhat test
```

### 启动前端
```bash
cd frontend
npm run dev
```

---

## 📖 核心功能

### 方案A - FHE版本的独特功能

#### 1. 加密输入

```typescript
// 前端 SDK 加密
const encrypted = await encryptNumber(
  targetNumber,
  contractAddress,
  userAddress
);

// 返回: { handle, proof }
```

#### 2. 合约存储密文

```solidity
// 导入并存储加密数据
euint32 target = TFHE.asEuint32(einput, proof);
TFHE.allowThis(target);
TFHE.allow(target, msg.sender);
```

#### 3. 密文计算

```solidity
// 完全在密文状态下计算
euint32 diff = _encryptedAbsDiff(guess, target);
ebool isCloser = TFHE.lt(currentDiff, minDiff);
```

#### 4. Gateway 解密

```solidity
// 请求解密
uint256 requestId = Gateway.requestDecryption(...);

// 回调处理
function callbackEndGame(uint256 requestId, uint256[] memory decrypted) 
    public onlyGateway {
    // 处理解密数据
}
```

---

## 🔐 隐私保护对比

| 功能 | 方案B (Simple) | 方案A (FHE) |
|------|---------------|-------------|
| 目标数字 | 明文 | euint32密文 |
| 玩家猜测 | 明文 | euint32密文 |
| 游戏中查看 | ✅ 所有人可见 | ❌ 完全保密 |
| 密文计算 | ❌ | ✅ |
| Gateway解密 | ❌ | ✅ |
| 隐私级别 | ⭐ | ⭐⭐⭐⭐⭐ |
| Gas成本 | 低 | 高 |
| 用户体验 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 📚 学习资源

### 官方文档
- [Zama FHEVM 文档](https://docs.zama.ai/fhevm)
- [fhevmjs SDK](https://docs.zama.ai/fhevm-js)
- [Gateway 文档](https://docs.zama.ai/fhevm/fundamentals/gateway)

### 示例项目
- [fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [ConfidentialERC20](https://github.com/zama-ai/fhevm/blob/main/examples/ConfidentialERC20.sol)

### 本项目文档
- `FHE_学习总结.md` - FHE基础概念
- `方案A_实施指南.md` - 详细实施步骤
- `🎉方案A完整实现成功.md` - 完成总结

---

## 🎯 里程碑

- [x] 学习 FHE 和 FHEVM 基础
- [x] 实现方案B (明文版)
- [x] 升级 fhevm 库 (0.3.0 → 0.7.0-0)
- [x] 创建完整 FHE 合约 (GuessGameFHE_v2)
- [x] 集成 Gateway 自动解密
- [x] 前端集成 fhevmjs SDK
- [x] 部署到 Sepolia 测试网
- [x] 完整文档和说明

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- Zama Team - 提供 FHEVM 技术
- OpenZeppelin - 智能合约库
- Hardhat Team - 开发工具

---

## 📞 联系方式

如有问题或建议，欢迎联系。

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

---

**创建时间**: 2025-10-25  
**最后更新**: 2025-10-25  
**版本**: 1.0.0

