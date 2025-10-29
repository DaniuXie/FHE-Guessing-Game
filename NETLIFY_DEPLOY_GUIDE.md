# 🚀 Netlify 手动部署指南

## 📦 准备工作

✅ **已完成：**
- 前端已重新构建（最新版本）
- 已生成 `_redirects` 文件（用于 SPA 路由支持）
- 构建文件位于：`E:\ZAMAcode\02\frontend\dist`

## 📂 需要上传的文件夹

**上传路径：** `E:\ZAMAcode\02\frontend\dist`

**包含的文件：**
```
dist/
├── index.html              (0.87 KB)
├── _redirects              (18 B - SPA路由配置)
└── assets/
    ├── *.js                (JavaScript 文件)
    ├── *.css               (样式文件)
    ├── *.wasm              (FHE WebAssembly 文件)
    └── ...
```

**总大小：** 约 5.5 MB

## 🌐 Netlify 网页部署步骤

### 方式 1：拖拽上传（最简单）

1. **访问 Netlify**
   - 打开：https://app.netlify.com/
   - 登录您的账号

2. **拖拽部署**
   - 在首页找到 "Sites" 标签
   - 将整个 `E:\ZAMAcode\02\frontend\dist` 文件夹直接拖拽到页面上
   - Netlify 会自动上传和部署

3. **等待部署完成**
   - 上传完成后会自动构建
   - 几秒钟后显示绿色 "Published"
   - 会生成一个随机域名，如：`random-name-12345.netlify.app`

### 方式 2：手动上传（更新现有站点）

1. **进入现有站点**
   - 在 Netlify Dashboard 找到您的 FHE Guessing Game 站点
   - 点击进入站点详情

2. **上传新版本**
   - 点击 "Deploys" 标签
   - 点击 "Deploy site" 按钮
   - 选择 "Upload folder"
   - 选择 `E:\ZAMAcode\02\frontend\dist` 文件夹
   - 上传完成后自动部署

3. **查看部署状态**
   - 在 "Deploys" 页面查看部署进度
   - 等待状态变为 "Published"

## ⚙️ 重要配置检查

### 1. 站点设置

**Build & deploy → Deploy settings:**
- **Build command:** 留空（手动上传无需构建）
- **Publish directory:** 留空或 `.`（因为直接上传 dist 内容）

### 2. 环境变量（可选）

如果您的应用需要环境变量：
1. 进入 **Site settings → Environment variables**
2. 添加需要的变量（如 API Keys 等）

⚠️ **注意：** Vite 项目的环境变量在构建时被打包，所以：
- 如果修改了环境变量（如合约地址），需要重新构建
- 运行 `npm run build` 后重新上传 `dist` 文件夹

### 3. 域名设置（可选）

**Domain management:**
- 可以设置自定义域名
- 或使用 Netlify 提供的免费域名

## 🔍 部署后验证

部署完成后，请检查：

1. **✅ 首页加载正常**
   - 访问站点 URL
   - 确认页面正常显示

2. **✅ 路由工作正常**
   - 刷新页面不会 404
   - 多亏了 `_redirects` 文件

3. **✅ 钱包连接正常**
   - 点击 "Connect Wallet"
   - MetaMask 能正常弹出

4. **✅ FHE 功能正常**
   - 尝试创建游戏（选择 FHE 模式）
   - 检查 WASM 文件加载

5. **✅ 合约交互正常**
   - 确认合约地址正确
   - 网络设置为 Sepolia

## 🐛 常见问题

### 问题 1：上传后页面空白
**解决方案：**
- 检查浏览器控制台是否有错误
- 确认上传的是 `dist` 文件夹的**内容**（不是包含 dist 的父文件夹）

### 问题 2：刷新页面 404
**解决方案：**
- 确认 `_redirects` 文件已包含在 dist 中
- 内容应为：`/* /index.html 200`

### 问题 3：WASM 文件加载失败
**解决方案：**
- 检查 Netlify Headers 设置
- 可能需要添加 CORS 头
- 通常 Netlify 会自动处理 WASM MIME 类型

### 问题 4：合约地址不对
**解决方案：**
- 检查 `frontend/src/utils/constants.ts` 中的合约地址
- 修改后需要重新运行 `npm run build`
- 重新上传 dist 文件夹

## 📊 当前项目配置

**部署的合约地址（已在代码中）：**
- 请查看 `frontend/src/utils/constants.ts`
- 请查看 `frontend/src/utils/constants_fhe.ts`

**网络：** Sepolia Testnet

**RPC：** https://eth-sepolia.public.blastapi.io

**Gateway：** https://gateway.sepolia.zama.ai

## 🎉 部署成功后

部署成功后，您会得到：
- 📱 一个可访问的 URL（如：`your-site.netlify.app`）
- 🔒 自动 HTTPS 证书
- 🌍 全球 CDN 加速
- 📊 访问统计

您可以分享这个 URL 给任何人使用您的 FHE 猜数字游戏！

---

**准备好了吗？** 
现在就将 `E:\ZAMAcode\02\frontend\dist` 文件夹拖拽到 Netlify 吧！🚀

