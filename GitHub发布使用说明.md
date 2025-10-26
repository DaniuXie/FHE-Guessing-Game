# GitHub 自动发布使用说明

## ✨ 新功能：全自动创建仓库

**无需手动在 GitHub 网站上创建仓库！**脚本会自动帮您完成一切。

## 🚀 使用步骤

### 第一步：获取 GitHub Token

1. 访问：https://github.com/settings/tokens/new
2. 填写信息：
   - **Note（备注）**：`FHE Guessing Game Release`
   - **Expiration（过期时间）**：`90 days`（或您的偏好）
   - **Select scopes（权限）**：勾选 ✅ **repo**（完整权限）
3. 点击 **"Generate token"** 按钮
4. **复制生成的 Token**（格式：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
   - ⚠️ **重要**：Token 只显示一次，请妥善保存！

### 第二步：运行脚本

双击运行：**`发布到GitHub.bat`**（中文版）或 **`publish_to_github.bat`**（英文版）

### 第三步：按提示操作

脚本会依次提示您输入：

1. ✅ **您的姓名和邮箱**（用于 Git 提交记录）
   ```
   例如：
   姓名：Zhang San
   邮箱：zhangsan@example.com
   ```

2. ✅ **确认要提交的文件**（输入 Y 确认）

3. ✅ **GitHub Personal Access Token**（粘贴第一步获取的 Token）

4. ✅ **GitHub 用户名**
   ```
   例如：yourname
   ```

5. ✅ **仓库名称**（默认：fhe-guessing-game，可自定义）
   ```
   直接回车使用默认名称，或输入自定义名称
   ```

6. ✅ **确认创建仓库**（输入 Y 确认）

### 完成！

脚本会自动：
- 🔨 创建 GitHub 仓库
- 📤 推送所有代码
- ✨ 配置仓库设置

## 📋 脚本功能

### 自动处理：
- ✅ 清理临时文件和敏感信息
- ✅ 初始化 Git 仓库（如果需要）
- ✅ 添加并提交所有文件
- ✅ **通过 GitHub API 自动创建仓库**
- ✅ 推送代码到 GitHub
- ✅ 自动移除 Token（安全性）

### 安全特性：
- 🔒 Token 仅临时使用，不会保存在 Git 配置中
- 🔒 自动从远程 URL 中移除 Token
- 🔒 自动删除敏感文件（.env, deployment_*.json）

## ❓ 常见问题

### Q1: 提示"仓库名已存在"？
**解决方案**：
- 输入不同的仓库名称，或
- 删除 GitHub 上的同名仓库后重试

### Q2: 提示"Token 无效"？
**解决方案**：
- 检查 Token 是否完整复制（注意空格）
- 确认 Token 有 `repo` 权限
- 访问 https://github.com/settings/tokens 检查 Token 状态

### Q3: 推送失败？
**可能原因**：
1. 网络连接问题
2. Token 权限不足
3. 仓库权限设置问题

**解决方案**：
- 检查网络连接
- 重新生成具有完整 `repo` 权限的 Token
- 手动运行：`git push -u origin main`

### Q4: 需要推送到现有仓库？
如果您已经有仓库，可以手动运行：
```bash
git remote add origin https://github.com/yourusername/yourrepo.git
git branch -M main
git push -u origin main
```

## 📚 后续步骤

成功发布后，建议：

1. 🏷️ **添加 Topics 标签**
   - 访问仓库设置
   - 添加：`fhe`, `zama`, `blockchain`, `privacy`, `encryption`

2. 📝 **完善仓库描述**
   - 点击仓库页面的 "About" 设置

3. 🎉 **创建第一个 Release**
   - 访问：`Releases` → `Create a new release`
   - Tag：`v1.0.0`
   - Title：`Initial Release`

4. 🌟 **分享到社区**
   - Zama 社区论坛
   - Twitter/X
   - Reddit

## 🆘 需要帮助？

如果遇到问题：
1. 查看脚本输出的错误信息
2. 检查 GitHub Token 权限
3. 访问：https://github.com/settings/tokens

---

**提示**：Token 只会显示一次，建议保存到密码管理器中！

