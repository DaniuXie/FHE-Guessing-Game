@echo off
chcp 65001 >nul
echo ============================================
echo 🚀 FHE Guessing Game - GitHub 发布工具
echo ============================================
echo.

:: 检查 Git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git 已安装
echo.

:: 步骤 1: 清理项目
echo ============================================
echo 📋 步骤 1/6: 清理不必要的文件
echo ============================================
echo.

echo 正在删除临时文档...
if exist "update_debug_log.md" del /f /q "update_debug_log.md"
if exist "⚠️临时方案说明.md" del /f /q "⚠️临时方案说明.md"
if exist "临时隐藏目标数字.md" del /f /q "临时隐藏目标数字.md"
if exist "自查日志.md" del /f /q "自查日志.md"

echo 正在删除开发文件...
if exist "启动前端.bat" del /f /q "启动前端.bat"
if exist "重启前端.bat" del /f /q "重启前端.bat"
if exist "🎯快速批量翻译脚本.sh" del /f /q "🎯快速批量翻译脚本.sh"

echo 正在删除参考文件夹...
if exist "参考\" rmdir /s /q "参考\"

echo 正在删除敏感文件...
if exist "deployment_*.json" del /f /q "deployment_*.json"
if exist ".env" del /f /q ".env"

echo 正在重命名环境变量模板...
if exist "env.example" (
    if not exist ".env.example" (
        ren "env.example" ".env.example"
    )
)

echo ✅ 清理完成!
echo.

:: 步骤 2: 检查 Git 状态
echo ============================================
echo 📋 步骤 2/6: 检查 Git 状态
echo ============================================
echo.

if not exist ".git\" (
    echo 📝 初始化 Git 仓库...
    git init
    echo ✅ Git 仓库已初始化
) else (
    echo ✅ Git 仓库已存在
)
echo.

:: 步骤 3: 用户信息确认
echo ============================================
echo 📋 步骤 3/6: 配置信息
echo ============================================
echo.

echo 请输入您的 GitHub 信息（用于提交记录）:
echo.

set /p GIT_NAME="👤 您的姓名（例如: Zhang San）: "
set /p GIT_EMAIL="📧 您的邮箱（例如: zhangsan@example.com）: "

git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo ✅ Git 配置完成
echo.

:: 步骤 4: 添加文件
echo ============================================
echo 📋 步骤 4/6: 准备提交文件
echo ============================================
echo.

echo 正在添加文件到 Git...
git add .

echo.
echo 📊 将要提交的文件:
git status --short
echo.

set /p CONFIRM="确认要提交这些文件吗？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo ❌ 用户取消操作
    pause
    exit /b 0
)

echo.

:: 步骤 5: 提交
echo ============================================
echo 📋 步骤 5/6: 提交到本地仓库
echo ============================================
echo.

git commit -m "feat: initial release of FHE guessing game

- Implement FHE and plaintext game contracts
- Complete React frontend with dual-mode support
- Add automatic Gateway fallback mechanism
- Full internationalization (English)
- Toast notification system
- Performance optimizations (lazy loading)
- Mobile responsive design
- Comprehensive documentation"

if errorlevel 1 (
    echo ❌ 提交失败，请检查错误信息
    pause
    exit /b 1
)

echo ✅ 本地提交成功
echo.

:: 步骤 6: 推送到 GitHub
echo ============================================
echo 📋 步骤 6/6: 推送到 GitHub
echo ============================================
echo.

echo 📌 请按照以下步骤操作：
echo.
echo 1. 在 GitHub 上创建新仓库
echo    网址: https://github.com/new
echo.
echo 2. 仓库设置：
echo    - 名称: fhe-guessing-game
echo    - 描述: Confidential Number Guessing Game powered by Zama FHEVM
echo    - 公开（Public）
echo    - ❌ 不要勾选 "Add a README file"
echo.
echo 3. 创建后，复制仓库 URL（例如: https://github.com/yourusername/fhe-guessing-game.git）
echo.

set /p REPO_URL="请粘贴您的仓库 URL: "

if "%REPO_URL%"=="" (
    echo ❌ 错误: 仓库 URL 不能为空
    pause
    exit /b 1
)

echo.
echo 正在添加远程仓库...
git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"

echo 正在设置主分支...
git branch -M main

echo.
echo 📤 现在需要您的 GitHub 凭证来推送代码
echo.
echo 🔐 安全提示: 
echo    1. 如果使用 HTTPS URL，会弹出登录窗口
echo    2. 建议使用 Personal Access Token 而不是密码
echo    3. Token 权限需要: repo (完全控制私有仓库)
echo    4. 创建 Token: https://github.com/settings/tokens
echo.

set /p PUSH_CONFIRM="准备好推送了吗？(Y/N): "
if /i not "%PUSH_CONFIRM%"=="Y" (
    echo ℹ️ 您可以稍后手动运行: git push -u origin main
    pause
    exit /b 0
)

echo.
echo 正在推送到 GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败，可能的原因:
    echo    1. 认证失败 - 请检查您的 GitHub 凭证
    echo    2. 网络问题 - 请检查网络连接
    echo    3. 仓库权限 - 请确保您有写入权限
    echo.
    echo 💡 手动推送命令:
    echo    git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo 🎉 成功发布到 GitHub!
echo ============================================
echo.
echo ✅ 您的项目已成功上传到: 
echo    %REPO_URL%
echo.
echo 🌟 后续步骤:
echo    1. 访问您的 GitHub 仓库查看代码
echo    2. 添加 Topics 标签: fhe, zama, blockchain, privacy
echo    3. 编辑仓库描述
echo    4. 考虑创建第一个 Release (v1.0.0)
echo    5. 分享到 Zama 社区!
echo.
echo 📚 详细文档请查看:
echo    - README.md
echo    - CONTRIBUTING.md
echo    - DEPLOYMENT.md
echo.

pause


