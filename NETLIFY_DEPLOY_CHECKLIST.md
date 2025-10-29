# ✅ Netlify 部署检查清单

## 📋 部署前准备（已完成）

- ✅ 前端已重新构建（最新版本）
- ✅ 已创建 `_redirects` 文件（SPA 路由支持）
- ✅ 合约地址已配置
- ✅ FHEVM Gateway 配置正确

## 📂 上传信息

**上传文件夹：** `E:\ZAMAcode\02\frontend\dist`

**文件夹路径（复制使用）：**
```
E:\ZAMAcode\02\frontend\dist
```

## 🔧 项目配置信息

### 合约地址
```
FHE 合约: 0x5abEb1f463419F577ab51939DF978e7Ef14d5325
简化合约: 0x9F0A4a9ADa89dD8e1Da6F69c28A9B1a2c5f43eef
```

### 网络配置
```
网络: Sepolia Testnet
Chain ID: 11155111
RPC URL: https://eth-sepolia.public.blastapi.io
```

### FHEVM 配置
```
Gateway URL: https://gateway.sepolia.zama.ai
ACL Contract: 0x687820221192C5B662b25367F70076A37bc79b6c
```

## 🚀 Netlify 部署步骤

### 快速步骤：

1. **打开 Netlify**
   ```
   https://app.netlify.com/
   ```

2. **拖拽上传**
   - 打开文件夹：`E:\ZAMAcode\02\frontend\dist`
   - 将整个 `dist` 文件夹拖到 Netlify 页面
   - 等待上传完成

3. **检查部署**
   - 等待 "Published" 状态
   - 点击生成的 URL 测试

### 更新现有站点：

1. 进入您的站点
2. 点击 "Deploys" 标签
3. 点击 "Deploy site" → "Upload folder"
4. 选择 `E:\ZAMAcode\02\frontend\dist` 文件夹
5. 等待部署完成

## ✅ 部署后检查

部署完成后，请在浏览器中测试：

### 基础功能
- [ ] 页面正常加载
- [ ] 样式显示正确
- [ ] 路由切换正常（刷新不 404）

### 钱包功能
- [ ] 可以连接 MetaMask
- [ ] 网络切换到 Sepolia
- [ ] 显示正确的钱包地址

### 合约交互
- [ ] 可以查看游戏列表
- [ ] 可以创建游戏（简化模式）
- [ ] 可以加入游戏
- [ ] 可以结束游戏

### FHE 功能（可选测试）
- [ ] FHE 模式可以选择
- [ ] WASM 文件加载正常
- [ ] 可以创建 FHE 加密游戏
- [ ] Gateway 状态显示正常

## 🐛 常见问题快速修复

### 页面空白
→ 检查控制台错误，确认上传的是 dist 内容

### 刷新 404
→ 确认 `_redirects` 文件在 dist 中

### 钱包连接失败
→ 检查浏览器是否安装 MetaMask

### 合约调用失败
→ 确认网络是 Sepolia，钱包有测试 ETH

### WASM 加载失败
→ 检查浏览器控制台，可能需要清除缓存

## 📞 获取测试 ETH

如果需要测试 ETH：
1. 访问 Sepolia Faucet
2. 推荐：https://sepoliafaucet.com/
3. 或：https://www.alchemy.com/faucets/ethereum-sepolia

## 🎉 部署成功后

您将获得：
- 🌐 一个公开访问的 URL
- 🔒 自动 HTTPS
- 🚀 全球 CDN
- 📊 访问统计

您可以分享这个 URL 让其他人体验 FHE 加密猜数字游戏！

---

**现在就开始部署吧！** 🚀

只需将 `E:\ZAMAcode\02\frontend\dist` 文件夹拖到 Netlify 即可！

