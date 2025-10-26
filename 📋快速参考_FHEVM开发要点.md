# 📋 FHEVM 开发快速参考

> **速查表** - 关键问题和解决方案

---

## 🔥 最关键的 5 个问题

### 1. ⚠️ Relayer CORS 403 错误

**问题：**
```
❌ localhost 无法访问 Relayer 服务
❌ 403 Forbidden
```

**解决方案：**
```typescript
// 实现自动 Fallback
// ✅ 方案B（明文）+ 方案A（FHE）
// ✅ Gateway 健康检查
// ✅ 自动切换
```

---

### 2. ⚠️ fhevm 版本问题

**问题：**
```solidity
// ❌ fhevm@0.3.0 缺少很多功能
TFHE.allow()  // ❌ 不存在
GatewayCaller  // ❌ 不存在
```

**解决：**
```bash
# ✅ 升级到最新版
npm install fhevm@^0.7.0-0
npm install fhevm-core-contracts@^0.6.1
```

---

### 3. ⚠️ SDK 选择

**问题：**
```
fhevmjs ❌ 旧版本
@zama-fhe/relayer-sdk ✅ 官方推荐
```

**正确做法：**
```typescript
// ✅ 使用正确的导入路径
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

// ✅ 使用内置配置
const config = { ...SepoliaConfig };
```

**Vite 配置：**
```typescript
// vite.config.ts
optimizeDeps: {
  include: ["@zama-fhe/relayer-sdk/web"]  // ⚠️ 必须加 /web
}
```

---

### 4. ⚠️ useEffect 闭包陷阱

**问题：**
```typescript
// ❌ 函数引用过期
useEffect(() => {
  loadGames();
}, [contractType]);  // ❌ 依赖不完整
```

**解决：**
```typescript
// ✅ 使用 useCallback
const loadGames = useCallback(async () => {
  // ...
}, [contract, getTotalGames, getGameInfo]);

useEffect(() => {
  loadGames();
}, [loadGames]);  // ✅ 只依赖 useCallback
```

---

### 5. ⚠️ 浏览器缓存

**问题：**
```
代码更新但页面不变化
```

**解决：**
```
1. Ctrl + F5（硬刷新）
2. 无痕模式测试
3. 重启前端服务器
4. DevTools → Disable cache
```

---

## 🎯 核心代码片段

### Solidity - FHE 合约模板

```solidity
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract MyGame is GatewayCaller {
    // 1. 接收加密输入
    function createGame(einput encryptedValue, bytes calldata inputProof) 
        public payable {
        euint32 value = TFHE.asEuint32(encryptedValue, inputProof);
        TFHE.allowThis(value);  // 合约自己访问
        TFHE.allow(value, msg.sender);  // 授权给用户
    }
    
    // 2. 请求解密
    function endGame(uint256 gameId) public {
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(encryptedValue);
        
        // 授权给 Gateway
        TFHE.allow(encryptedValue, Gateway.GATEWAY_CONTRACT_ADDRESS);
        
        // 请求解密
        uint256 requestId = Gateway.requestDecryption(
            cts,
            this.callbackFunction.selector,
            0,
            block.timestamp + 1 days,
            false
        );
    }
    
    // 3. Gateway 回调
    function callbackFunction(uint256 requestId, uint256 decrypted) 
        public onlyGateway {
        // 处理解密结果
    }
}
```

---

### TypeScript - Gateway 健康检查

```typescript
// 1. 健康检查
const checkGatewayHealth = async (): Promise<boolean> => {
  try {
    const resp = await fetch(`${GATEWAY_URL}/public_key`, { 
      method: "GET", 
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    const text = await resp.text();
    return text.startsWith("0x04") && text.length >= 66;
  } catch {
    return false;
  }
};

// 2. 自动切换
useEffect(() => {
  const init = async () => {
    const isUp = await checkGatewayHealth();
    setGatewayStatus(isUp ? "up" : "down");
    if (isAutoMode) {
      setContractType(isUp ? "fhe" : "simple");
    }
  };
  
  init();
  const interval = setInterval(init, 60000);  // 60秒
  return () => clearInterval(interval);
}, []);
```

---

### TypeScript - SDK 初始化

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

// ✅ 使用官方配置
const config = {
  ...SepoliaConfig,  // 包含所有必需字段
  networkUrl: "https://eth-sepolia.public.blastapi.io"
};

// 初始化
const fhevmInstance = await createInstance(config);

// 加密
const encInput = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
encInput.add32(number);
const encrypted = await encInput.encrypt();

// 使用
await contract.createGame(encrypted.handles[0], encrypted.inputProof, { value });
```

---

## 🛠️ 配置文件

### hardhat.config.js

```javascript
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.24" },  // FHE
      { version: "0.8.20" }   // 兼容
    ]
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.public.blastapi.io",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    }
  }
};
```

---

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "@zama-fhe/relayer-sdk/web"  // ⚠️ 必须
    ]
  }
});
```

---

## 📋 开发检查清单

### 智能合约

```
□ 使用 fhevm@^0.7.0-0
□ 继承 GatewayCaller
□ 正确使用 TFHE.allow()
□ 授权给 Gateway（解密前）
□ 实现 _gatewayCallback
□ Event 日志完整
□ 边界条件检查
```

### 前端

```
□ 使用 @zama-fhe/relayer-sdk
□ 导入 /web 子路径
□ 使用 SepoliaConfig
□ 实现 Gateway 健康检查
□ 自动 Fallback 机制
□ 正确的 useCallback
□ 完整的依赖数组
□ 硬刷新测试
```

---

## ⚡ 故障排查

```
1. ❌ 合约部署失败
   → 检查 Solidity 版本
   → 检查 fhevm 版本
   → 检查 Gas 限制

2. ❌ SDK 初始化失败
   → 使用 SepoliaConfig
   → 检查导入路径（/web）
   → 检查 Vite 配置

3. ❌ Gateway 请求失败
   → 检查是否授权
   → 检查回调函数
   → 检查 Gas 限制

4. ❌ 前端显示错误
   → 硬刷新（Ctrl + F5）
   → 无痕模式
   → 重启服务器
   → 检查控制台

5. ❌ 状态不更新
   → 检查 useEffect 依赖
   → 使用 useCallback
   → 添加刷新触发器
```

---

## 🎯 最佳实践

### 开发顺序

```
1. 先开发明文合约（方案B）
   ✅ 快速迭代
   ✅ 测试逻辑
   
2. 再开发 FHE 合约（方案A）
   ✅ 完整功能
   ✅ 隐私保护
   
3. 实现自动 Fallback
   ✅ 容错设计
   ✅ 用户体验
```

### 测试策略

```
1. 本地测试
   → 明文合约（快）
   
2. 测试网测试
   → FHE 合约（慢）
   → 完整流程
   
3. 多钱包测试
   → 不同角色
   → 边界条件
```

---

## 📚 参考资源

- **Zama 文档**: https://docs.zama.ai/fhevm
- **Gateway 指南**: https://docs.zama.ai/fhevm/guides/gateway
- **官方模板**: https://github.com/zama-ai/fhevm-react-template
- **完整总结**: `📚项目开发经验总结_FHEVM.md`

---

## 🆘 遇到问题？

1. 查看 `📚项目开发经验总结_FHEVM.md`（详细版）
2. 查看官方文档
3. 检查 GitHub Issues
4. 咨询官方 GPT

---

**保存这个文件，下次开发 FHEVM 项目时直接参考！** 🚀

