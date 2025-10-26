# 📚 FHEVM DApp 项目开发经验总结

> **项目名称：** 机密数字猜谜游戏  
> **技术栈：** Solidity + FHEVM + React + TypeScript + Hardhat  
> **部署网络：** Sepolia Testnet  
> **开发时间：** 2025年10月  
> **文档目的：** 为未来的 FHEVM 项目开发提供参考

---

## 📋 目录

1. [项目概述](#项目概述)
2. [核心技术问题与解决方案](#核心技术问题与解决方案)
3. [智能合约开发经验](#智能合约开发经验)
4. [前端集成经验](#前端集成经验)
5. [部署和测试经验](#部署和测试经验)
6. [最佳实践总结](#最佳实践总结)
7. [避坑指南](#避坑指南)
8. [参考资源](#参考资源)

---

## 1. 项目概述

### 1.1 项目目标

开发一个基于 Zama FHEVM 的完全隐私保护的数字猜谜游戏，包括：
- ✅ 完全加密的游戏逻辑（方案A - FHE）
- ✅ 明文测试版本（方案B - Plaintext）
- ✅ 自动 Gateway Fallback 机制
- ✅ 双合约架构

### 1.2 技术架构

```
后端（智能合约）
├── GuessGameSimple.sol     # 方案B - 明文测试合约
└── GuessGameFHE_v2.sol     # 方案A - FHE 加密合约

前端（React DApp）
├── 双合约支持（ContractContext）
├── 自动 Gateway 健康检查
├── 智能 Fallback 切换
└── 状态可视化（GatewayStatusBadge）

开发工具
├── Hardhat（合约编译和部署）
├── Vite（前端构建）
└── ethers.js v6（区块链交互）
```

### 1.3 最终成果

- ✅ 双合约成功部署到 Sepolia
- ✅ 完整的游戏流程（创建、加入、结束）
- ✅ 自动 Gateway 健康检查和 Fallback
- ✅ 企业级容错设计
- ✅ 完整的隐私保护逻辑

---

## 2. 核心技术问题与解决方案

### 2.1 FHEVM 库版本问题 ⚠️ 关键

#### 问题描述
```
初始使用 fhevm@0.3.0，发现：
❌ 缺少 GatewayCaller.sol 接口
❌ 缺少 TFHE.allow() 函数
❌ TFHE.asEuint32() API 不同
❌ 缺少 TFHE.allowThis() 函数
```

#### 解决方案
```bash
# 升级到最新版本
npm install fhevm@^0.7.0-0
npm install fhevm-core-contracts@^0.6.1
```

#### 经验教训
- ✅ **始终使用最新的稳定版本**
- ✅ 检查官方文档的版本要求
- ✅ 升级前先查看 CHANGELOG
- ⚠️ 旧版本文档可能不适用

#### 代码示例（正确的 API）
```solidity
// fhevm@0.7.0+ 正确用法
import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract MyContract is GatewayCaller {
    // 导入加密输入
    function createGame(einput encryptedTarget, bytes calldata inputProof) public {
        euint32 target = TFHE.asEuint32(encryptedTarget, inputProof);
        TFHE.allowThis(target);  // ✅ 0.7.0 支持
        TFHE.allow(target, msg.sender);  // ✅ 0.7.0 支持
    }
}
```

---

### 2.2 Relayer CORS 和 403 问题 ⚠️ 核心难点

#### 问题描述
```
❌ Access to 'https://relayer.testnet.zama.cloud/v1/keyurl' 
   from origin 'http://localhost:5173' has been blocked by CORS policy

❌ 403 Forbidden

❌ Relayer didn't response correctly. Bad JSON.
```

#### 根本原因
1. Zama 官方 Relayer 服务对 `localhost` 有访问限制
2. 可能需要 API Key 或认证（未公开文档）
3. 可能只允许白名单域名访问

#### 解决方案：自动 Fallback 机制

**策略：** 不依赖单一外部服务，实现双合约架构

```typescript
// 1. Gateway 健康检查
const checkGatewayHealth = async (): Promise<boolean> => {
  try {
    const resp = await fetch(`${GATEWAY_URL}/public_key`, { 
      method: "GET", 
      cache: "no-store",
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    const text = await resp.text();
    return text.startsWith("0x04") && text.length >= 66;
  } catch {
    return false;
  }
};

// 2. 自动切换合约
useEffect(() => {
  const init = async () => {
    const isUp = await checkGatewayHealth();
    setGatewayStatus(isUp ? "up" : "down");
    setContractType(isUp ? "fhe" : "simple");
  };
  init();
  
  // 定时轮询（60秒）
  const interval = setInterval(init, 60000);
  return () => clearInterval(interval);
}, []);
```

#### 经验教训
- ✅ **永远不要依赖单一外部服务**
- ✅ 实现 Fallback 机制
- ✅ 提供明文测试版本
- ✅ 清晰的状态提示
- ⚠️ Gateway/Relayer 服务可能不稳定
- ⚠️ localhost 开发可能受限

#### 替代方案
1. **部署到真实域名**（推荐生产环境）
2. **使用官方 React 模板**（包含正确配置）
3. **联系 Zama 申请 API 访问权限**
4. **自建 Gateway/Relayer 服务**（复杂）

---

### 2.3 SDK 选择问题 ⚠️ 重要

#### 问题背景
Zama 提供了多个 SDK，容易混淆：
- `fhevmjs` - 旧版本，已不推荐
- `@zama-fhe/relayer-sdk` - 新版本，官方推荐

#### 初期问题
```typescript
// ❌ 错误：使用了 fhevmjs
import { createInstance } from "fhevmjs";

// 问题：
// 1. WASM 加载错误
// 2. 模块导出问题
// 3. API 不一致
```

#### 正确做法
```typescript
// ✅ 正确：使用官方 Relayer SDK
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

// 使用内置配置
const config = {
  ...SepoliaConfig,  // ✅ 包含所有必需字段
  networkUrl: "https://eth-sepolia.public.blastapi.io"
};

const fhevmInstance = await createInstance(config);
```

#### Vite 配置（关键）
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      "@zama-fhe/relayer-sdk/web"  // ✅ 使用 /web 子路径
    ]
  }
});
```

#### 经验教训
- ✅ **查看官方最新推荐**
- ✅ 使用正确的子路径导入（`/web`）
- ✅ 使用内置配置（`SepoliaConfig`）
- ⚠️ 不要混用不同的 SDK
- ⚠️ 注意包的 `package.json` exports 配置

---

### 2.4 前端状态管理问题 🐛 常见陷阱

#### 问题 1: useEffect 闭包陷阱

**症状：**
```typescript
// ❌ 错误：函数引用过期
useEffect(() => {
  loadGames();  // 这个函数可能引用了旧的状态
}, [contractType]);  // 依赖不完整
```

**解决方案：**
```typescript
// ✅ 正确：使用 useCallback
const loadGames = useCallback(async () => {
  // 函数逻辑
}, [contract, getTotalGames, getGameInfo]);  // 完整依赖

useEffect(() => {
  loadGames();
}, [loadGames]);  // 只依赖 useCallback 的函数
```

#### 问题 2: 状态更新不及时

**症状：**
```typescript
// 切换合约后，游戏列表不刷新
setContractType("fhe");
// 列表还显示旧合约的数据
```

**解决方案：**
```typescript
// ✅ 添加刷新触发器
const [refreshTrigger, setRefreshTrigger] = useState(0);

const handleContractChange = (type: ContractType) => {
  setContractType(type);
  setRefreshTrigger(prev => prev + 1);  // 触发刷新
};

useEffect(() => {
  loadGames();
}, [contractType, refreshTrigger]);
```

#### 经验教训
- ✅ 正确使用 `useCallback` 避免闭包陷阱
- ✅ 完整的依赖数组
- ✅ 使用刷新触发器强制更新
- ⚠️ 不要漏掉任何依赖
- ⚠️ 不要直接在 useEffect 中引用可变函数

---

### 2.5 浏览器缓存问题 🔄 频繁遇到

#### 问题描述
```
问题 1: 代码更新后页面不变化
问题 2: 合约地址更新后还是旧数据
问题 3: SDK 修复后还是报错
```

#### 解决方案

**方案 1: 硬刷新**
```
Windows: Ctrl + F5
Mac: Cmd + Shift + R
```

**方案 2: 清除缓存**
```
Chrome DevTools (F12)
→ Network 标签
→ 勾选 "Disable cache"
→ 刷新页面
```

**方案 3: 无痕模式测试**
```
Ctrl + Shift + N (Chrome)
Cmd + Shift + N (Mac)
```

**方案 4: 服务器重启**
```bash
# 杀掉 Node 进程
taskkill /F /IM node.exe /T

# 重新启动
cd frontend && npm run dev
```

#### Vite 配置优化
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    // 开发时禁用缓存
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});
```

#### 经验教训
- ✅ **每次部署新合约后硬刷新**
- ✅ 开发时保持 DevTools 打开并禁用缓存
- ✅ 遇到奇怪问题先尝试无痕模式
- ⚠️ 不要假设浏览器会自动更新
- ⚠️ 提醒用户刷新浏览器

---

## 3. 智能合约开发经验

### 3.1 Coprocessor 模式 vs Native 模式

#### 模式对比

| 特性 | Coprocessor 模式 | Native 模式 |
|------|-----------------|-------------|
| 部署网络 | 标准 EVM（Sepolia等） | Zama 专用链 |
| FHE 执行 | 链下（Gateway） | 链上（预编译合约） |
| Gas 成本 | ⚠️ 较高（回调） | ✅ 较低 |
| 延迟 | ⚠️ 5-15秒（解密） | ✅ 即时 |
| 复杂度 | ⚠️ 需要 Gateway 回调 | ✅ 简单 |
| 适用场景 | 标准 EVM 链 | Zama 生态 |

#### Coprocessor 模式关键点

**1. 继承 GatewayCaller**
```solidity
import "fhevm/gateway/GatewayCaller.sol";

contract MyGame is GatewayCaller {
    // 自动获得 Gateway 回调支持
}
```

**2. 请求解密**
```solidity
uint256[] memory cts = new uint256[](2);
cts[0] = Gateway.toUint256(encryptedValue1);
cts[1] = Gateway.toUint256(encryptedValue2);

uint256 requestId = Gateway.requestDecryption(
    cts,
    this.callbackFunction.selector,
    0,  // Gas limit
    block.timestamp + 1 days,  // Expiry
    false  // Not single user
);
```

**3. 实现回调**
```solidity
function callbackFunction(
    uint256 requestId,
    uint256 decryptedValue1,
    uint256 decryptedValue2
) public onlyGateway {
    // 处理解密结果
}
```

#### 经验教训
- ✅ Coprocessor 模式适合部署到标准 EVM 链
- ✅ Native 模式性能更好但限制更多
- ⚠️ Gateway 回调有延迟（5-15秒）
- ⚠️ 需要处理回调失败的情况

---

### 3.2 权限管理（ACL）

#### 核心概念
```solidity
// TFHE.allow() 授权系统
// 必须明确授予权限才能操作密文
```

#### 常见权限操作

**1. 合约自己访问**
```solidity
euint32 value = TFHE.asEuint32(input, proof);
TFHE.allowThis(value);  // ✅ 合约自己可以访问
```

**2. 授权给特定地址**
```solidity
TFHE.allow(value, msg.sender);  // ✅ 授权给调用者
TFHE.allow(value, ownerAddress);  // ✅ 授权给房主
```

**3. 授权给 Gateway（重要）**
```solidity
// 解密前必须授权给 Gateway
TFHE.allow(encryptedTarget, Gateway.GATEWAY_CONTRACT_ADDRESS);
TFHE.allow(encryptedGuess, Gateway.GATEWAY_CONTRACT_ADDRESS);
```

#### 权限检查
```solidity
// 合约会自动检查权限
// 如果没有权限，交易会 revert
```

#### 经验教训
- ✅ **始终记得授权**
- ✅ 请求解密前授权给 Gateway
- ✅ 用户查询数据前授权给用户
- ⚠️ 权限不会自动传递
- ⚠️ 权限错误会导致 revert

---

### 3.3 双合约架构设计

#### 设计理念
```
目标：
1. FHE 合约（完全加密）
2. 明文合约（测试和 Fallback）
3. 兼容的接口
4. 前端统一调用
```

#### 接口设计（关键）
```solidity
// 方案B - 明文合约
contract GuessGameSimple {
    function createGame(uint32 targetNumber) public payable {
        // 直接使用明文
    }
    
    function endGame(uint256 gameId) public {
        // 直接计算
    }
}

// 方案A - FHE 合约
contract GuessGameFHE is GatewayCaller {
    function createGame(einput encryptedTarget, bytes calldata inputProof) 
        public payable {
        // 使用加密数据
    }
    
    function endGame(uint256 gameId) public {
        // 请求 Gateway 解密
        // 等待回调
    }
    
    function _gatewayCallback(uint256 requestId, uint256 decryptedTarget, ...) 
        public onlyGateway {
        // 处理解密结果
    }
}
```

#### 状态枚举差异
```solidity
// 方案B - 简单状态
enum GameStatus {
    ACTIVE,   // 游戏进行中
    ENDED     // 游戏结束
}

// 方案A - 包含解密状态
enum GameStatusFHE {
    ACTIVE,       // 游戏进行中
    DECRYPTING,   // Gateway 解密中
    ENDED         // 游戏结束
}
```

#### 经验教训
- ✅ **设计兼容的接口**
- ✅ 明文合约用于测试和 Fallback
- ✅ FHE 合约用于生产和隐私保护
- ✅ 前端统一抽象层
- ⚠️ 状态管理要考虑异步解密

---

## 4. 前端集成经验

### 4.1 双合约抽象层

#### 设计模式
```typescript
// Context 管理当前合约类型
export type ContractType = "simple" | "fhe";

// Hook 统一接口
export function useContractDual() {
  const { contractType } = useContractType();
  
  // 根据类型选择合约
  const contract = contractType === "fhe" 
    ? fheContract 
    : simpleContract;
  
  // 统一接口
  return {
    createGame,
    joinGame,
    endGame,
    getGameInfo,
    // ...
  };
}
```

#### 加密逻辑分支
```typescript
const createGame = async (targetNumber: number, entryFee: string) => {
  if (contractType === "fhe") {
    // FHE 模式：加密
    const { handle, proof } = await encryptNumberFHE(
      targetNumber,
      CONTRACT_ADDRESS_FHE,
      address
    );
    await contractFHE.createGame(handle, proof, { value });
  } else {
    // 明文模式：直接传递
    await contractSimple.createGame(targetNumber, { value });
  }
};
```

#### 经验教训
- ✅ **统一的接口设计**
- ✅ 在 Hook 层面处理差异
- ✅ 组件无需知道底层实现
- ✅ 易于切换和测试

---

### 4.2 Gateway 健康检查系统

#### 完整实现
```typescript
// 1. 健康检查函数
const checkGatewayHealth = async (): Promise<boolean> => {
  const url = `${GATEWAY_URL}/public_key`;
  try {
    const resp = await fetch(url, { 
      method: "GET", 
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return false;
    const text = await resp.text();
    // 验证公钥格式
    return text.startsWith("0x04") && text.length >= 66;
  } catch (error) {
    console.warn("⚠️ Gateway 不可用:", error);
    return false;
  }
};

// 2. 定时轮询
useEffect(() => {
  const pollGateway = async () => {
    const isUp = await checkGatewayHealth();
    const newStatus: GatewayStatus = isUp ? "up" : "down";
    
    if (newStatus !== gatewayStatus) {
      setGatewayStatus(newStatus);
      
      // 自动切换合约
      if (isAutoMode) {
        setContractType(isUp ? "fhe" : "simple");
      }
    }
  };
  
  // 立即检查
  pollGateway();
  
  // 每 60 秒检查一次
  const interval = setInterval(pollGateway, 60000);
  
  return () => clearInterval(interval);
}, [gatewayStatus, isAutoMode]);

// 3. 状态徽章显示
<GatewayStatusBadge />
```

#### 状态管理
```typescript
export type GatewayStatus = "up" | "down" | "checking";

interface ContractContextType {
  gatewayStatus: GatewayStatus;
  contractType: ContractType;
  isAutoMode: boolean;
  setAutoMode: (auto: boolean) => void;
}
```

#### 经验教论
- ✅ **5秒超时保护**
- ✅ 60秒轮询间隔（不要太频繁）
- ✅ 验证公钥格式（不只是 HTTP 200）
- ✅ 自动/手动模式切换
- ✅ 清晰的状态提示

---

### 4.3 ethers.js v6 使用要点

#### 版本变化
```typescript
// ❌ ethers.js v5 (旧版)
import { ethers } from "ethers";
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// ✅ ethers.js v6 (新版)
import { ethers } from "ethers";
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();  // ⚠️ 注意 await
```

#### 合约实例化
```typescript
// 正确的顺序
// 1. 创建 Provider
const provider = new ethers.BrowserProvider(window.ethereum);

// 2. 获取 Signer（异步）
const signer = await provider.getSigner();

// 3. 创建合约实例
const contract = new ethers.Contract(address, abi, signer);
```

#### 常见错误
```typescript
// ❌ 错误：使用 Provider 调用 write 方法
const contract = new ethers.Contract(address, abi, provider);
await contract.createGame(...);  // ❌ 会报错：no signer

// ✅ 正确：使用 Signer
const contract = new ethers.Contract(address, abi, signer);
await contract.createGame(...);  // ✅ 成功
```

#### 经验教训
- ✅ **v6 API 有破坏性变更**
- ✅ `getSigner()` 是异步的
- ✅ Write 操作必须用 Signer
- ✅ Read 操作可以用 Provider
- ⚠️ 不要混用 v5 和 v6 的代码示例

---

### 4.4 隐私保护前端逻辑

#### 问题
```
方案B（明文合约）：
- 目标数字存储在链上（明文）
- 但不应该让玩家看到
```

#### 解决方案
```typescript
// 根据身份和游戏状态决定显示
{contractType === "simple" && (
  // 游戏结束 OR 是房主
  gameInfo.status === GameStatus.ENDED || isOwner ? (
    <显示目标数字 />
  ) : (
    <显示"🔒 隐藏" />
  )
)}
```

#### 完整逻辑
```typescript
// 1. 判断身份
const isOwner = address && 
  gameInfo.owner.toLowerCase() === address.toLowerCase();

// 2. 条件显示
{contractType === "fhe" ? (
  // FHE：根据是否解密
  gameInfo.revealedTarget ? (
    <p>{gameInfo.revealedTarget}</p>
  ) : (
    <p>🔐 已加密</p>
  )
) : (
  // 明文：根据游戏状态和身份
  gameInfo.status === GameStatus.ENDED || isOwner ? (
    <p>{gameInfo.targetNumber}</p>
  ) : (
    <p>🔒 隐藏</p>
  )
)}
```

#### 经验教训
- ✅ **前端模拟隐私保护**
- ✅ 明确区分"身份"和"状态"
- ✅ 提供清晰的视觉反馈
- ⚠️ 这不是真正的隐私保护（数据在链上）
- ⚠️ FHE 才能提供密码学级别的保护

---

## 5. 部署和测试经验

### 5.1 Hardhat 配置

#### 网络配置
```javascript
// hardhat.config.js
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",  // FHE 合约
      },
      {
        version: "0.8.20",  // 明文合约（兼容）
      },
    ],
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://eth-sepolia.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};
```

#### 环境变量
```bash
# .env
PRIVATE_KEY=你的私钥
SEPOLIA_URL=https://eth-sepolia.public.blastapi.io
ALCHEMY_KEY=可选
```

#### 部署脚本
```javascript
// scripts/deploy_fhe.js
const hre = require("hardhat");

async function main() {
  console.log("📦 部署 GuessGameFHE_v2...");
  
  const GuessGameFHE = await hre.ethers.getContractFactory("GuessGameFHE_v2");
  const game = await GuessGameFHE.deploy();
  await game.waitForDeployment();
  
  const address = await game.getAddress();
  console.log("✅ 合约地址:", address);
  
  // 保存部署信息
  const fs = require("fs");
  fs.writeFileSync(
    "deployment_fhe_v2.json",
    JSON.stringify({ address, timestamp: Date.now() }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

#### 经验教训
- ✅ **使用 .env 管理私钥**
- ✅ 多个 Solidity 版本配置
- ✅ 保存部署信息到 JSON
- ✅ 使用多个 RPC 备份
- ⚠️ 不要提交私钥到 Git

---

### 5.2 测试策略

#### 测试层次
```
1. 单元测试（Hardhat）
   ├── 合约逻辑测试
   └── 边界条件测试

2. 集成测试（前端 + 合约）
   ├── 完整游戏流程
   ├── 多钱包交互
   └── 异常情况处理

3. 手动测试
   ├── 不同浏览器
   ├── 不同钱包
   └── 网络问题模拟
```

#### 测试用例设计
```javascript
// 测试脚本示例
describe("GuessGame", function () {
  it("应该成功创建游戏", async function () {
    const game = await createGame(50, "0.001");
    expect(game.status).to.equal(GameStatus.ACTIVE);
  });
  
  it("应该允许玩家加入", async function () {
    await joinGame(0, 45);
    const players = await getPlayers(0);
    expect(players.length).to.equal(1);
  });
  
  it("应该正确计算获胜者", async function () {
    await endGame(0);
    const winner = await getWinner(0);
    expect(winner).to.not.equal(ethers.ZeroAddress);
  });
});
```

#### 测试检查清单
- ✅ 正常流程
- ✅ 边界条件（0, 最大值）
- ✅ 权限检查
- ✅ 余额变化
- ✅ Event 触发
- ✅ Revert 条件

#### 经验教训
- ✅ **先测试明文合约（快速）**
- ✅ 再测试 FHE 合约（慢，有延迟）
- ✅ 使用多个测试账号
- ✅ 记录每次测试的 Gas 消耗
- ⚠️ FHE 测试需要等待 Gateway 回调

---

## 6. 最佳实践总结

### 6.1 智能合约

```solidity
// ✅ 最佳实践清单

1. 使用最新的 fhevm 库版本
2. 继承 GatewayCaller（Coprocessor 模式）
3. 明确的权限管理（TFHE.allow）
4. 完整的 Event 日志
5. 安全的状态管理
6. 详细的注释和文档
7. 边界条件检查
8. 可升级性考虑
```

### 6.2 前端开发

```typescript
// ✅ 最佳实践清单

1. 使用官方 Relayer SDK
2. 正确的 Vite 配置（/web 子路径）
3. 使用 SepoliaConfig 内置配置
4. 实现 Gateway 健康检查
5. 自动 Fallback 机制
6. 完整的错误处理
7. 清晰的状态提示
8. 正确的 useEffect 依赖
9. 避免闭包陷阱
10. 处理浏览器缓存
```

### 6.3 项目结构

```
📁 project/
├── 📁 contracts/           # 智能合约
│   ├── GuessGameSimple.sol
│   └── GuessGameFHE_v2.sol
├── 📁 scripts/             # 部署脚本
│   ├── deploy_simple.js
│   └── deploy_fhe_v2.js
├── 📁 frontend/            # React 前端
│   ├── 📁 src/
│   │   ├── 📁 components/  # UI 组件
│   │   ├── 📁 hooks/       # 自定义 Hooks
│   │   ├── 📁 contexts/    # React Context
│   │   └── 📁 utils/       # 工具函数
│   └── vite.config.ts
├── 📁 参考/                # 参考文档
├── hardhat.config.js
├── package.json
├── .env                    # 环境变量（不提交）
└── README.md
```

---

## 7. 避坑指南

### 7.1 常见错误

#### 错误 1: TFHE.allow() not found
```solidity
// ❌ 错误
TFHE.allow(value, address);  // fhevm@0.3.0 不支持

// ✅ 解决
npm install fhevm@^0.7.0-0  // 升级版本
```

#### 错误 2: Gateway 回调失败
```solidity
// ❌ 错误：没有授权给 Gateway
Gateway.requestDecryption(cts, ...);

// ✅ 解决：先授权
TFHE.allow(value, Gateway.GATEWAY_CONTRACT_ADDRESS);
Gateway.requestDecryption(cts, ...);
```

#### 错误 3: SDK 初始化失败
```typescript
// ❌ 错误：缺少必需字段
const config = {
  chainId: 11155111,
  networkUrl: "...",
  // ❌ 缺少很多必需字段
};

// ✅ 解决：使用内置配置
import { SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
const config = { ...SepoliaConfig };
```

#### 错误 4: useEffect 闭包陷阱
```typescript
// ❌ 错误
useEffect(() => {
  loadGames();  // 引用过期
}, [contractType]);

// ✅ 解决
const loadGames = useCallback(async () => {
  // ...
}, [dependencies]);

useEffect(() => {
  loadGames();
}, [loadGames]);
```

#### 错误 5: 浏览器缓存
```
// ❌ 问题：代码更新但页面不变

// ✅ 解决
Ctrl + F5 (硬刷新)
无痕模式测试
重启前端服务器
```

### 7.2 性能优化

```typescript
// 1. Gateway 健康检查
✅ 5秒超时
✅ 60秒轮询间隔
❌ 不要每秒检查

// 2. 状态更新
✅ 使用 useCallback 缓存函数
✅ 合理的依赖数组
❌ 避免不必要的重渲染

// 3. 合约调用
✅ 批量读取数据
✅ 缓存不变的数据
❌ 避免重复的链上查询
```

---

## 8. 参考资源

### 8.1 官方文档

- **Zama 官方文档**: https://docs.zama.ai/
- **FHEVM 文档**: https://docs.zama.ai/fhevm
- **Gateway 文档**: https://docs.zama.ai/fhevm/guides/gateway
- **Relayer SDK**: https://github.com/zama-ai/fhevm

### 8.2 示例项目

- **官方 React 模板**: https://github.com/zama-ai/fhevm-react-template
- **Voting-Fun 项目**: 参考项目，有完整的 Fallback 实现
- **本项目**: 机密数字猜谜游戏

### 8.3 开发工具

- **Hardhat**: https://hardhat.org/
- **ethers.js v6**: https://docs.ethers.org/v6/
- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/

### 8.4 测试网络

- **Sepolia Testnet**:
  - Chain ID: 11155111
  - RPC: https://eth-sepolia.public.blastapi.io
  - 水龙头: https://sepoliafaucet.com/

- **Zama Gateway (Sepolia)**:
  - Gateway URL: https://gateway.sepolia.zama.ai
  - Relayer URL: https://relayer.testnet.zama.cloud

---

## 9. 总结

### 9.1 关键收获

1. **技术栈选择**
   - ✅ 使用最新的 fhevm 库
   - ✅ 使用官方 Relayer SDK
   - ✅ ethers.js v6

2. **架构设计**
   - ✅ 双合约架构（FHE + Plaintext）
   - ✅ 自动 Fallback 机制
   - ✅ 统一的抽象层

3. **用户体验**
   - ✅ 清晰的状态提示
   - ✅ 自动/手动模式切换
   - ✅ 优雅的降级方案

4. **开发效率**
   - ✅ 先开发明文版本（快速迭代）
   - ✅ 再开发 FHE 版本（完整功能）
   - ✅ 充分测试和文档

### 9.2 未来改进方向

1. **功能扩展**
   - 多人对战模式
   - 排行榜系统
   - 奖励机制
   - 房间聊天

2. **性能优化**
   - 减少链上交互次数
   - 批量操作支持
   - 链下数据缓存

3. **安全加固**
   - 完整的安全审计
   - 防作弊机制
   - 异常情况处理

4. **用户体验**
   - 更丰富的动画
   - 移动端适配
   - 多语言支持

### 9.3 致谢

感谢 Zama 团队提供的 FHEVM 技术和文档支持。

---

## 附录

### A. 快速开始检查清单

```bash
# 1. 环境准备
□ Node.js 18+
□ npm 或 yarn
□ MetaMask 钱包
□ Sepolia ETH

# 2. 项目初始化
□ npm install（根目录）
□ npm install（frontend 目录）
□ 配置 .env 文件

# 3. 合约部署
□ npx hardhat compile
□ npx hardhat run scripts/deploy_simple.js --network sepolia
□ npx hardhat run scripts/deploy_fhe_v2.js --network sepolia

# 4. 前端配置
□ 更新 CONTRACT_ADDRESS（constants.ts）
□ 更新 CONTRACT_ADDRESS_FHE（constants_fhe.ts）
□ npm run dev

# 5. 测试
□ 连接钱包
□ 创建游戏
□ 加入游戏
□ 结束游戏
□ 切换合约模式
□ 验证 Fallback
```

### B. 故障排查流程

```
问题出现
    ↓
1. 检查控制台错误
    ↓
2. 硬刷新浏览器（Ctrl + F5）
    ↓
3. 检查钱包连接
    ↓
4. 检查网络选择（Sepolia）
    ↓
5. 检查合约地址
    ↓
6. 重启前端服务器
    ↓
7. 清除浏览器缓存
    ↓
8. 无痕模式测试
    ↓
9. 查看本文档对应章节
```

---

**文档版本**: 1.0  
**最后更新**: 2025年10月  
**维护者**: AI Assistant  
**许可证**: MIT

---

🎉 **祝你的下一个 FHEVM 项目成功！**


