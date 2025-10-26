@echo off
chcp 65001 >nul
echo ============================================
echo FHE 猜数字游戏 - GitHub 发布工具
echo ============================================
echo.

:: 检查 Git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [成功] Git 已安装
echo.

:: 步骤 1: 清理项目
echo ============================================
echo 步骤 1/6: 清理不必要的文件
echo ============================================
echo.

echo 正在删除临时文档...
if exist "update_debug_log.md" del /f /q "update_debug_log.md"
if exist "自查日志.md" del /f /q "自查日志.md"

echo 正在删除开发文件...
if exist "启动前端.bat" del /f /q "启动前端.bat"
if exist "重启前端.bat" del /f /q "重启前端.bat"

echo 正在删除敏感文件...
if exist "deployment_*.json" del /f /q "deployment_*.json"
if exist ".env" del /f /q ".env"

echo 正在重命名环境变量模板...
if exist "env.example" (
    if not exist ".env.example" (
        ren "env.example" ".env.example"
    )
)

echo [成功] 清理完成!
echo.

:: 步骤 2: 检查 Git 状态
echo ============================================
echo 步骤 2/6: 检查 Git 状态
echo ============================================
echo.

if not exist ".git\" (
    echo 正在初始化 Git 仓库...
    git init
    echo [成功] Git 仓库已初始化
) else (
    echo [成功] Git 仓库已存在
)
echo.

:: 步骤 3: 用户信息确认
echo ============================================
echo 步骤 3/6: 配置信息
echo ============================================
echo.

echo 请输入您的 GitHub 信息（用于提交记录）:
echo.

set /p GIT_NAME="您的姓名（例如: Zhang San）: "
set /p GIT_EMAIL="您的邮箱（例如: zhangsan@example.com）: "

git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo [成功] Git 配置完成
echo.

:: 步骤 4: 添加文件
echo ============================================
echo 步骤 4/6: 准备提交文件
echo ============================================
echo.

echo 正在添加文件到 Git...
git add .

echo.
echo 将要提交的文件:
git status --short
echo.

set /p CONFIRM="确认要提交这些文件吗？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [取消] 用户取消操作
    pause
    exit /b 0
)

echo.

:: 步骤 5: 提交
echo ============================================
echo 步骤 5/6: 提交到本地仓库
echo ============================================
echo.

git commit -m "feat: initial release of FHE guessing game" -m "- Implement FHE and plaintext game contracts" -m "- Complete React frontend with dual-mode support" -m "- Add automatic Gateway fallback mechanism" -m "- Full internationalization (English)" -m "- Toast notification system" -m "- Performance optimizations (lazy loading)" -m "- Mobile responsive design" -m "- Comprehensive documentation"

if errorlevel 1 (
    echo [错误] 提交失败，请检查错误信息
    pause
    exit /b 1
)

echo [成功] 本地提交成功
echo.

:: 步骤 6: 创建 GitHub 仓库并推送
echo ============================================
echo 步骤 6/6: 创建 GitHub 仓库并推送
echo ============================================
echo.

echo ============================================
echo GitHub 身份验证
echo ============================================
echo.
echo 您需要 GitHub Personal Access Token 来创建仓库和推送代码
echo.
echo 如果您还没有 Token，请按照以下步骤创建：
echo.
echo 1. 访问: https://github.com/settings/tokens/new
echo 2. Note（备注）: FHE Guessing Game Release
echo 3. Expiration（过期时间）: 90 days （或您的偏好）
echo 4. Select scopes（选择权限）: 
echo    - [x] repo （勾选 repo - 完整权限）
echo    - [x] workflow （可选）
echo 5. 点击 "Generate token"（生成令牌）
echo 6. 复制 Token（只会显示一次，请妥善保存！）
echo.
echo 提示：Token 格式类似 ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo.

set /p GITHUB_TOKEN="请输入您的 GitHub Personal Access Token: "

if "%GITHUB_TOKEN%"=="" (
    echo [错误] Token 不能为空，需要 Token 来创建仓库
    pause
    exit /b 1
)

echo.
echo 请输入您的 GitHub 用户名和仓库名称：
echo.

set /p GITHUB_USER="GitHub 用户名: "
if "%GITHUB_USER%"=="" (
    echo [错误] 用户名不能为空
    pause
    exit /b 1
)

set /p REPO_NAME="仓库名称（默认: fhe-guessing-game）: "
if "%REPO_NAME%"=="" set REPO_NAME=fhe-guessing-game

echo.
echo 仓库设置：
echo    用户名: %GITHUB_USER%
echo    仓库名: %REPO_NAME%
echo    可见性: Public（公开）
echo.

set /p CONFIRM_CREATE="确认创建仓库？(Y/N): "
if /i not "%CONFIRM_CREATE%"=="Y" (
    echo [取消] 用户取消操作
    pause
    exit /b 0
)

echo.
echo 正在通过 GitHub API 创建仓库...
echo.

:: 创建临时 JSON 文件
set TEMP_JSON=%TEMP%\github_repo.json
echo {"name":"%REPO_NAME%","description":"Confidential Number Guessing Game powered by Zama FHEVM - A blockchain game with Fully Homomorphic Encryption","private":false,"auto_init":false}> "%TEMP_JSON%"

:: 调用 GitHub API 创建仓库
curl -s -X POST ^
  -H "Accept: application/vnd.github+json" ^
  -H "Authorization: Bearer %GITHUB_TOKEN%" ^
  -H "X-GitHub-Api-Version: 2022-11-28" ^
  -d @"%TEMP_JSON%" ^
  https://api.github.com/user/repos > "%TEMP%\github_response.json"

:: 删除临时文件
del "%TEMP_JSON%"

:: 检查是否创建成功
findstr /C:"\"name\":\"%REPO_NAME%\"" "%TEMP%\github_response.json" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 仓库创建失败
    echo.
    echo 可能的原因：
    echo    1. 仓库名已存在
    echo    2. Token 无效或权限不足
    echo    3. 网络连接问题
    echo.
    echo API 响应：
    type "%TEMP%\github_response.json"
    echo.
    del "%TEMP%\github_response.json"
    echo.
    echo 您可以：
    echo    1. 更换仓库名称重试
    echo    2. 手动创建仓库: https://github.com/new
    echo    3. 检查 Token 权限: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

del "%TEMP%\github_response.json"

echo [成功] 仓库创建成功！
echo    仓库地址: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.

:: 设置远程仓库
set "REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git"

echo 正在配置远程仓库...
git remote remove origin >nul 2>&1
set "AUTH_URL=https://%GITHUB_TOKEN%@github.com/%GITHUB_USER%/%REPO_NAME%.git"
git remote add origin "%AUTH_URL%"

echo 正在设置主分支...
git branch -M main

echo.
echo 正在推送代码到 GitHub...
git push -u origin main

:: 推送成功后，重置 URL（移除 Token）
git remote set-url origin "%REPO_URL%"

if errorlevel 1 (
    echo.
    echo ============================================
    echo [错误] 推送失败
    echo ============================================
    echo.
    echo 可能的原因：
    echo    1. Token 无效或已过期
    echo    2. Token 权限不足（需要 repo 权限）
    echo    3. 网络连接问题
    echo    4. 仓库不存在或无写入权限
    echo.
    echo 解决方案：
    echo    1. 检查 Token 是否正确复制（注意不要有多余空格）
    echo    2. 确认 Token 有 repo 权限
    echo    3. 检查仓库 URL 是否正确
    echo    4. 尝试重新生成 Token
    echo.
    echo 手动推送命令（如果需要）:
    echo    git push -u origin main
    echo.
    echo 查看您的 Token: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo 发布成功！
echo ============================================
echo.
echo [成功] 您的项目已成功上传到: 
echo    %REPO_URL%
echo.
echo 后续步骤:
echo    1. 访问您的 GitHub 仓库查看代码
echo    2. 添加 Topics 标签: fhe, zama, blockchain, privacy
echo    3. 编辑仓库描述
echo    4. 考虑创建第一个 Release (v1.0.0)
echo    5. 分享到 Zama 社区！
echo.
echo 相关文档:
echo    - README.md
echo    - CONTRIBUTING.md
echo    - DEPLOYMENT.md
echo.
echo 感谢使用！
echo.

pause

