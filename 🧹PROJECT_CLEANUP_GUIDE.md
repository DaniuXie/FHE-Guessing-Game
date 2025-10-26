# 🧹 Project Cleanup Guide for GitHub Release

## Files to DELETE Before Uploading

### ❌ Sensitive Files (NEVER commit these!)
```
.env
*.secret
*.key
deployment_*.json
scripts/test_wallet.txt
任何包含私钥或助记词的文件
```

### ❌ Temporary Documentation Files
```
update_debug_log.md
自查日志相关文件
临时隐藏目标数字.md
⚠️临时方案说明.md
🔧修复字段名.md
🔧最终修复说明.md
🆕新合约部署说明.md
🎯快速开始测试.md
🎯现在该怎么做.md
🎯当前测试结果和建议.md
📊项目总览.md
✅项目完成状态.md
❓Relayer_CORS_403问题.md
❓向官方GPT提问清单.md
```

### ❌ Internal Development Notes
```
参考/ 文件夹下的所有文件:
  - 官方GPT关于前端的回答.txt
  - 如何在合约中公开解密某个值？.txt
  - 向官方GPT提问清单.txt
  - 在 FHEVM 上创建一个 保密（Confidential）ERC-20 Token.txt
  - GATEWAY_AUTO_FALLBACK_UPDATE.md
  - QUICK_REFERENCE.md
  - ZAMA_PROJECT_LESSONS_LEARNED.md
  - Sepolia + fhEVM Coprocessor 解决方案.txt
```

### ❌ Development Files
```
🎯快速批量翻译脚本.sh
启动前端.bat
重启前端.bat
🌍国际化_英文版实施方案.md
🌍English_Internationalization_Complete.md
🌍完整翻译对照表.md
🎯国际化和优化_最终报告.md
🚀快速完成UI翻译.md
✅英文翻译进度_快速完成中.md
✅UI翻译_英文版_最终实施报告.md
🎉UI翻译_全部完成.md
🚀下一步_增强功能实施计划.md
```

### ❌ Old/Deprecated Contracts
```
contracts/GuessGame.sol (如果有)
contracts/GuessGameFHE.sol (保留 v2 版本即可)
```

### ❌ Build Artifacts (already in .gitignore)
```
node_modules/
frontend/node_modules/
dist/
frontend/dist/
artifacts/
cache/
```

---

## ✅ Files to KEEP

### Core Project Files
```
✅ README.md (新的专业版)
✅ CONTRIBUTING.md (新创建)
✅ DEPLOYMENT.md (新创建)
✅ LICENSE (如果有)
✅ .gitignore (新创建)
✅ package.json
✅ hardhat.config.js
✅ tsconfig.json
```

### Smart Contracts
```
✅ contracts/GuessGameSimple.sol
✅ contracts/GuessGameFHE_v2.sol
```

### Deployment Scripts
```
✅ scripts/deploy_simple.js
✅ scripts/deploy_fhe_v2.js
✅ scripts/check_balance.js
```

### Frontend
```
✅ frontend/
  ├── src/
  │   ├── components/
  │   ├── contexts/
  │   ├── hooks/
  │   ├── utils/
  │   ├── App.tsx
  │   ├── main.tsx
  │   └── index.css
  ├── public/
  ├── index.html
  ├── package.json
  ├── vite.config.ts
  ├── tsconfig.json
  └── tailwind.config.js
```

### Documentation (Optional, but recommended)
```
✅ 📚项目开发经验总结_FHEVM.md (可选，改名为 LESSONS_LEARNED.md)
✅ 📋快速参考_FHEVM开发要点.md (可选，改名为 FHEVM_QUICK_REFERENCE.md)
✅ 🎉项目增强功能_全部完成.md (可选，改名为 CHANGELOG.md)
```

---

## 🔧 Cleanup Script

Create and run this script to automate cleanup:

```bash
#!/bin/bash
# cleanup.sh - Run this before pushing to GitHub

echo "🧹 Starting project cleanup..."

# Remove sensitive files
rm -f .env
rm -f *.secret
rm -f *.key
rm -f deployment_*.json

# Remove temporary docs
rm -f update_debug_log.md
rm -f ⚠️临时方案说明.md
rm -f 🔧*.md
rm -f 🆕*.md
rm -f 🎯*.md
rm -f 📊*.md
rm -f ✅项目完成状态.md
rm -f ❓*.md
rm -f 临时*.md

# Remove development files
rm -f *.bat
rm -f *.sh
rm -f 🌍*.md
rm -f 🚀*.md
rm -f ✅英文*.md
rm -f ✅UI*.md

# Remove reference folder
rm -rf 参考/

# Remove old contracts
rm -f contracts/GuessGame.sol

# Clean build artifacts (just in case)
rm -rf node_modules/
rm -rf frontend/node_modules/
rm -rf artifacts/
rm -rf cache/
rm -rf dist/
rm -rf frontend/dist/

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review remaining files"
echo "2. Run: git status"
echo "3. Run: git add ."
echo "4. Run: git commit -m 'chore: initial commit'"
echo "5. Run: git push origin main"
```

---

## 📝 Recommended File Renaming (Optional)

Make documentation more professional:

```bash
# Optional: Rename Chinese docs to English
mv 📚项目开发经验总结_FHEVM.md LESSONS_LEARNED.md
mv 📋快速参考_FHEVM开发要点.md FHEVM_QUICK_REFERENCE.md
mv 🎉项目增强功能_全部完成.md CHANGELOG.md
mv 🔒隐私问题修复.md PRIVACY_FIX_NOTES.md
mv 🎉自动Fallback实现完成.md AUTO_FALLBACK_IMPLEMENTATION.md
mv ✅性能优化完成.md PERFORMANCE_OPTIMIZATION.md
mv ✅移动端响应式完成.md MOBILE_RESPONSIVE.md
```

---

## 🎯 Final Project Structure

After cleanup, your project should look like:

```
fhe-guessing-game/
├── contracts/
│   ├── GuessGameSimple.sol
│   └── GuessGameFHE_v2.sol
├── scripts/
│   ├── deploy_simple.js
│   ├── deploy_fhe_v2.js
│   └── check_balance.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore
├── .env.example (template, no secrets)
├── package.json
├── hardhat.config.js
├── README.md
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── LICENSE
└── (Optional) CHANGELOG.md, LESSONS_LEARNED.md, etc.
```

---

## ⚠️ Important Reminders

### Before Pushing to GitHub:

1. **Never commit** `.env` or private keys
2. **Double check** `.gitignore` is working
3. **Remove** all Chinese temporary docs
4. **Test** that the project builds:
   ```bash
   npm install
   npx hardhat compile
   cd frontend && npm install && npm run build
   ```
5. **Review** all files with `git status`
6. **Create** `.env.example` with template values

### `.env.example` Template:

```bash
# .env.example - Template for environment variables
# Copy this file to .env and fill in your values

# Deployer wallet (NEVER commit your real private key!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC endpoints
SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
ALCHEMY_KEY=your_alchemy_key_here

# Contract addresses (fill after deployment)
FHE_CONTRACT_ADDRESS=
PLAINTEXT_CONTRACT_ADDRESS=

# Frontend config
VITE_FHE_CONTRACT_ADDRESS=
VITE_PLAINTEXT_CONTRACT_ADDRESS=
VITE_NETWORK_ID=11155111
```

---

## 🚀 Ready to Push?

Run this checklist:

- [ ] Sensitive files removed
- [ ] Temporary docs deleted
- [ ] `.gitignore` created
- [ ] `.env.example` created
- [ ] Project builds successfully
- [ ] README.md updated
- [ ] CONTRIBUTING.md added
- [ ] DEPLOYMENT.md added
- [ ] `git status` looks clean
- [ ] Committed with meaningful message

Then push to GitHub! 🎉

```bash
git add .
git commit -m "feat: initial release of FHE guessing game"
git push origin main
```

---

**Your project is now ready for the world! 🌍**


