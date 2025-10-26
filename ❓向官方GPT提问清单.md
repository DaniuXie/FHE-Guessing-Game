# ❓ 向 Zama 官方 GPT 提问清单

## 🎯 第一部分：基本问题（必问）

### 问题1: Vite 兼容性

```
我正在使用 Vite + React + TypeScript 开发 FHEVM DApp 前端。

遇到的问题：
- 使用 fhevmjs@0.6.2 时，出现以下模块导出错误：
  * The requested module '/node_modules/keccak/index.js' does not provide an export named 'default'
  * The requested module '/node_modules/bigint-buffer/dist/browser.js' does not provide an export named 'toBigIntBE'
  
- 使用 fhevmjs@0.5.8 时，出现：
  * The requested module '/node_modules/sha3/index.js' does not provide an export named 'Keccak'

我的配置：
- Vite: 5.4.21
- React: 18.2.0
- TypeScript: 5.2.2
- fhevmjs: 尝试了 0.5.8 和 0.6.2 版本
- 目标网络: Sepolia + fhEVM Coprocessor

问题：
1. fhevmjs 是否完全兼容 Vite？
2. 如果兼容，应该使用哪个版本？
3. 需要哪些特殊的 Vite 配置？
4. 能否提供完整的 vite.config.ts 示例？
```

---

### 问题2: 推荐的构建工具

```
承接上一个问题。

如果 fhevmjs 不兼容 Vite，那么：
1. 官方推荐使用什么构建工具？（Webpack / Rollup / 其他？）
2. 能否提供完整的项目模板或示例仓库？
3. 是否有官方维护的 React + fhevmjs 样板项目？
```

---

### 问题3: SDK 包名确认

```
关于 FHEVM 的 JavaScript SDK：

我看到文档中提到：
- @zama-fhe/relayer-sdk
- fhevmjs

问题：
1. 这两个包有什么区别？
2. 对于 Sepolia + Coprocessor 模式的前端开发，应该使用哪个包？
3. 它们的最新稳定版本分别是多少？
4. npm 安装命令是什么？
```

---

## 🎯 第二部分：具体代码示例（重要）

### 问题4: 完整的初始化代码

```
请提供一个**完整的、可直接运行的**前端代码示例，包括：

1. SDK 初始化（Sepolia + Coprocessor 模式）
2. 加密用户输入（euint32）
3. 生成 inputProof（attestation）
4. 调用智能合约

要求：
- 使用 React + TypeScript
- 包含完整的 import 语句
- 包含正确的配置参数
- 适用于 Sepolia 测试网

我的合约接口：
```solidity
function createGame(
    einput encryptedTarget,
    bytes memory inputProof,
    uint256 entryFee
) external payable;
```

期望得到类似这样的完整代码：
```typescript
import { ??? } from "???";  // 正确的包名和导入

// 初始化
const instance = await ???;

// 加密
const { handle, proof } = await ???;

// 调用合约
await contract.createGame(handle, proof, entryFee, { value: entryFee });
```
```

---

### 问题5: Vite 完整配置

```
如果 fhevmjs 可以与 Vite 配合使用，请提供：

1. 完整的 vite.config.ts 文件
2. 完整的 package.json（依赖部分）
3. 是否需要 polyfills？
4. 是否需要特殊的 optimizeDeps 配置？
5. 是否需要设置 CORS 头？

我当前的 vite.config.ts：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['fhevmjs'],
  },
  build: {
    target: 'esnext',
  },
});
```

这样够吗？还需要什么？
```

---

## 🎯 第三部分：架构和最佳实践

### 问题6: Coprocessor 模式的完整流程

```
我的智能合约使用 GatewayCaller，结构如下：

```solidity
contract GuessGameFHE_v2 is GatewayCaller {
    euint32 private targetNumber;
    
    function createGame(
        einput encryptedTarget,
        bytes memory inputProof,
        uint256 entryFee
    ) external payable {
        targetNumber = TFHE.asEuint32(encryptedTarget, inputProof);
        TFHE.allowThis(targetNumber);
        // ...
    }
    
    function endGame(uint256 gameId) external {
        uint256[] memory cts = new uint256[](2);
        cts[0] = Gateway.toUint256(targetNumber);
        cts[1] = Gateway.toUint256(playerGuess);
        Gateway.requestDecryption(cts, this.callback.selector, ...);
    }
    
    function callback(uint256 requestId, uint256[] memory decryptedValues) public onlyGateway {
        // 处理解密结果
    }
}
```

问题：
1. 前端应该如何配置 Gateway URL 和 ACL Contract 地址？
2. Sepolia 测试网的这些地址分别是什么？
3. 解密回调通常需要多长时间？
4. 前端如何监听解密完成事件？
5. 是否需要实现超时重试机制？
```

---

### 问题7: 完整的项目示例

```
请提供或推荐：

1. 一个完整的 FHEVM DApp GitHub 仓库示例
   - 要求：React + TypeScript
   - 要求：使用 Coprocessor 模式（不是 Native 模式）
   - 要求：已部署到 Sepolia 测试网
   - 要求：可以直接 clone 并运行

2. 官方是否有类似的参考项目？

3. 如果有，请提供：
   - GitHub 仓库链接
   - 在线演示地址（如果有）
   - 安装和运行说明
```

---

## 🎯 第四部分：故障排查

### 问题8: 常见错误和解决方案

```
关于我遇到的具体错误：

错误1:
```
Uncaught SyntaxError: The requested module '/node_modules/keccak/index.js' 
does not provide an export named 'default'
```

错误2:
```
Uncaught SyntaxError: The requested module '/node_modules/bigint-buffer/dist/browser.js' 
does not provide an export named 'toBigIntBE'
```

错误3:
```
Uncaught SyntaxError: The requested module '/node_modules/sha3/index.js' 
does not provide an export named 'Keccak'
```

这些是：
1. fhevmjs 的已知问题吗？
2. 是否有官方的解决方案或 workaround？
3. 是否需要降级某些依赖？
4. 其他开发者是如何解决的？
```

---

## 📋 完整的提问模板（可直接复制）

### 综合版本（推荐）

```
你好！我正在开发一个 FHEVM DApp，遇到了前端集成问题。

【项目背景】
- 技术栈: React 18 + TypeScript + Vite 5.4.21
- 目标网络: Sepolia + fhEVM Coprocessor
- 智能合约: 已完成，使用 fhevm@0.7.0-0，继承 GatewayCaller
- 合约功能: 接收加密输入 (einput + bytes inputProof)

【遇到的问题】
使用 fhevmjs 时，遇到多个模块导出错误：

1. fhevmjs@0.6.2:
   - keccak 模块: "does not provide an export named 'default'"
   - bigint-buffer 模块: "does not provide an export named 'toBigIntBE'"

2. fhevmjs@0.5.8:
   - sha3 模块: "does not provide an export named 'Keccak'"

这些错误导致页面空白，无法加载。

【我的配置】
vite.config.ts:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['fhevmjs'],
  },
  build: {
    target: 'esnext',
  },
});
```

我的代码：
```typescript
import { createInstance, FhevmInstance } from "fhevmjs";

const FHEVM_CONFIG = {
  chainId: 11155111,
  networkUrl: "https://eth-sepolia.public.blastapi.io",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
};

const instance = await createInstance(FHEVM_CONFIG);
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add32(number);
const encryptedInput = input.encrypt();
```

【我的问题】
1. fhevmjs 是否兼容 Vite？应该使用哪个版本？
2. 如果不兼容，推荐使用什么构建工具？
3. 能否提供完整的、可运行的 React + fhevmjs 示例项目？
4. 是否有官方的 GitHub 仓库可以参考？
5. 这些模块导出错误有官方的解决方案吗？
6. Sepolia Coprocessor 模式的正确配置参数是什么？

【期望】
- 完整的项目配置示例
- 可直接运行的代码
- 或者官方示例项目的链接

非常感谢！
```

---

## 💡 提问技巧

### ✅ 好的提问方式：
1. **具体**：提供完整的错误信息
2. **详细**：说明你的技术栈和版本号
3. **清晰**：明确你想要什么（示例代码、配置、还是仓库链接）
4. **尝试过**：说明你已经尝试了什么
5. **代码**：提供你当前的代码片段

### ❌ 不好的提问方式：
1. "fhevmjs 怎么用？" → 太宽泛
2. "我的代码报错了" → 没有具体信息
3. "有没有文档？" → 先看官方文档，然后问具体问题

---

## 🎯 预期得到的答案

### 理想情况：
1. ✅ 明确的版本号（例如：使用 fhevmjs@0.X.X）
2. ✅ 完整的配置文件
3. ✅ 可运行的代码示例
4. ✅ GitHub 仓库链接
5. ✅ 已知问题的 workaround

### 如果官方GPT回答不清楚：
1. 追问具体的包名和版本
2. 要求提供 GitHub Issues 链接
3. 询问官方文档的具体章节
4. 询问是否有官方的 Discord/Telegram 社区

---

## 📌 重要提示

1. **截图保存错误信息**：方便进一步讨论
2. **记录官方的回答**：告诉我答案，我可以帮你实施
3. **询问替代方案**：如果 Vite 不行，问 Webpack 怎么配置
4. **索要示例项目**：完整的项目比代码片段更有用

---

## 🚀 下一步

向官方GPT提问后，请：

1. **把官方的回答完整地告诉我**
2. **如果有示例仓库链接，发给我**
3. **如果有新的配置要求，发给我**

我会帮你：
- ✅ 实施官方推荐的方案
- ✅ 调整项目配置
- ✅ 集成示例代码
- ✅ 测试完整流程

---

**祝你提问顺利！期待官方的答复！** 🎉


