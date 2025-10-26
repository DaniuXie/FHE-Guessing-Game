# ❓ 向官方 GPT 提问：Relayer CORS 403 错误

## 问题描述

我在使用 `@zama-fhe/relayer-sdk` 时遇到 CORS 和 403 错误：

### 错误信息

```
Access to fetch at 'https://relayer.testnet.zama.cloud/v1/keyurl' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET https://relayer.testnet.zama.cloud/v1/keyurl net::ERR_FAILED 403 (Forbidden)

Error: Relayer didn't response correctly. Bad JSON.
```

### 我的配置

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

const FHEVM_CONFIG = {
  ...SepoliaConfig,
  networkUrl: "https://eth-sepolia.public.blastapi.io",
};

const instance = await createInstance(FHEVM_CONFIG);
```

完整配置内容：
```json
{
  "aclContractAddress": "0x687820221192C5B662b25367F70076A37bc79b6c",
  "kmsContractAddress": "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  "inputVerifierContractAddress": "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  "verifyingContractAddressDecryption": "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  "verifyingContractAddressInputVerification": "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  "chainId": 11155111,
  "gatewayChainId": 55815,
  "relayerUrl": "https://relayer.testnet.zama.cloud"
}
```

### 技术栈

- React 18 + TypeScript
- Vite 5.4.21
- `@zama-fhe/relayer-sdk@0.2.0`
- 开发环境：`http://localhost:5173`

## 问题

1. **官方测试网 Relayer 是否允许从 localhost 访问？**
   - 如果不允许，应该如何配置？
   - 需要部署到真实域名吗？

2. **是否需要 API Key 或 Auth Token？**
   - 如果需要，如何获取？
   - 如何在配置中添加？

3. **官方 React 模板是如何处理这个问题的？**
   - 它们使用的是同样的 Relayer URL 吗？
   - 它们有特殊的配置吗？

4. **对于本地开发，推荐的方案是什么？**
   - 使用代理？
   - 部署自己的 Relayer？
   - 使用不同的 Relayer URL？

5. **403 错误是正常的吗？**
   - 这是权限问题还是服务配置问题？
   - 有官方的测试用 Relayer 吗？

## 期望答案

- 明确的配置方法（如果需要 Auth）
- 本地开发的推荐方案
- 或者官方 React 模板的链接，让我参考它们的实现

非常感谢！

