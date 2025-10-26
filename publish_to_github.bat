@echo off
chcp 65001 >nul
echo ============================================
echo FHE Guessing Game - GitHub Release Tool
echo ============================================
echo.

:: Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed, please install Git first
    echo Download: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

:: Step 1: Clean project
echo ============================================
echo Step 1/6: Cleaning unnecessary files
echo ============================================
echo.

echo Deleting temporary documents...
if exist "update_debug_log.md" del /f /q "update_debug_log.md"
if exist "自查日志.md" del /f /q "自查日志.md"

echo Deleting development files...
if exist "启动前端.bat" del /f /q "启动前端.bat"
if exist "重启前端.bat" del /f /q "重启前端.bat"

echo Deleting sensitive files...
if exist "deployment_*.json" del /f /q "deployment_*.json"
if exist ".env" del /f /q ".env"

echo Renaming environment template...
if exist "env.example" (
    if not exist ".env.example" (
        ren "env.example" ".env.example"
    )
)

echo [OK] Cleanup complete!
echo.

:: Step 2: Check Git status
echo ============================================
echo Step 2/6: Checking Git status
echo ============================================
echo.

if not exist ".git\" (
    echo Initializing Git repository...
    git init
    echo [OK] Git repository initialized
) else (
    echo [OK] Git repository exists
)
echo.

:: Step 3: User information confirmation
echo ============================================
echo Step 3/6: Configuration
echo ============================================
echo.

echo Please enter your GitHub information (for commit records):
echo.

set /p GIT_NAME="Your name (e.g., Zhang San): "
set /p GIT_EMAIL="Your email (e.g., zhangsan@example.com): "

git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo [OK] Git configuration complete
echo.

:: Step 4: Add files
echo ============================================
echo Step 4/6: Preparing files for commit
echo ============================================
echo.

echo Adding files to Git...
git add .

echo.
echo Files to be committed:
git status --short
echo.

set /p CONFIRM="Confirm to commit these files? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [CANCEL] User cancelled operation
    pause
    exit /b 0
)

echo.

:: Step 5: Commit
echo ============================================
echo Step 5/6: Commit to local repository
echo ============================================
echo.

git commit -m "feat: initial release of FHE guessing game" -m "- Implement FHE and plaintext game contracts" -m "- Complete React frontend with dual-mode support" -m "- Add automatic Gateway fallback mechanism" -m "- Full internationalization (English)" -m "- Toast notification system" -m "- Performance optimizations (lazy loading)" -m "- Mobile responsive design" -m "- Comprehensive documentation"

if errorlevel 1 (
    echo [ERROR] Commit failed, please check error messages
    pause
    exit /b 1
)

echo [OK] Local commit successful
echo.

:: Step 6: Create GitHub repository and push
echo ============================================
echo Step 6/6: Create GitHub Repository and Push
echo ============================================
echo.

echo ============================================
echo GitHub Authentication
echo ============================================
echo.
echo You need a GitHub Personal Access Token to create repository and push code
echo.
echo If you don't have a token yet, please:
echo.
echo 1. Visit: https://github.com/settings/tokens/new
echo 2. Note: FHE Guessing Game Release
echo 3. Expiration: 90 days (or your preference)
echo 4. Select scopes: 
echo    - [x] repo (full control of private repositories)
echo    - [x] workflow (optional)
echo 5. Click "Generate token"
echo 6. Copy the token (you won't see it again!)
echo.
echo Tip: Token format looks like ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo.

set /p GITHUB_TOKEN="Enter your GitHub Personal Access Token: "

if "%GITHUB_TOKEN%"=="" (
    echo [ERROR] Token cannot be empty, needed to create repository
    pause
    exit /b 1
)

echo.
echo Please enter your GitHub username and repository name:
echo.

set /p GITHUB_USER="GitHub username: "
if "%GITHUB_USER%"=="" (
    echo [ERROR] Username cannot be empty
    pause
    exit /b 1
)

set /p REPO_NAME="Repository name (default: fhe-guessing-game): "
if "%REPO_NAME%"=="" set REPO_NAME=fhe-guessing-game

echo.
echo Repository settings:
echo    Username: %GITHUB_USER%
echo    Repo name: %REPO_NAME%
echo    Visibility: Public
echo.

set /p CONFIRM_CREATE="Confirm to create repository? (Y/N): "
if /i not "%CONFIRM_CREATE%"=="Y" (
    echo [CANCEL] User cancelled operation
    pause
    exit /b 0
)

echo.
echo Creating repository via GitHub API...
echo.

:: Create temporary JSON file
set TEMP_JSON=%TEMP%\github_repo.json
echo {"name":"%REPO_NAME%","description":"Confidential Number Guessing Game powered by Zama FHEVM - A blockchain game with Fully Homomorphic Encryption","private":false,"auto_init":false}> "%TEMP_JSON%"

:: Call GitHub API to create repository
curl -s -X POST ^
  -H "Accept: application/vnd.github+json" ^
  -H "Authorization: Bearer %GITHUB_TOKEN%" ^
  -H "X-GitHub-Api-Version: 2022-11-28" ^
  -d @"%TEMP_JSON%" ^
  https://api.github.com/user/repos > "%TEMP%\github_response.json"

:: Delete temporary file
del "%TEMP_JSON%"

:: Check if creation was successful
findstr /C:"\"name\":\"%REPO_NAME%\"" "%TEMP%\github_response.json" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Repository creation failed
    echo.
    echo Possible reasons:
    echo    1. Repository name already exists
    echo    2. Invalid token or insufficient permissions
    echo    3. Network connection issue
    echo.
    echo API Response:
    type "%TEMP%\github_response.json"
    echo.
    del "%TEMP%\github_response.json"
    echo.
    echo You can:
    echo    1. Try a different repository name
    echo    2. Create manually: https://github.com/new
    echo    3. Check token permissions: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

del "%TEMP%\github_response.json"

echo [OK] Repository created successfully!
echo    Repository URL: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.

:: Set remote repository
set "REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git"

echo Configuring remote repository...
git remote remove origin >nul 2>&1
set "AUTH_URL=https://%GITHUB_TOKEN%@github.com/%GITHUB_USER%/%REPO_NAME%.git"
git remote add origin "%AUTH_URL%"

echo Setting main branch...
git branch -M main

echo.
echo Pushing code to GitHub...
git push -u origin main

:: After successful push, reset URL (remove token)
git remote set-url origin "%REPO_URL%"

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed, possible reasons:
    echo    1. Authentication failed - check your GitHub credentials
    echo    2. Network issue - check network connection
    echo    3. Repository permission - ensure you have write access
    echo    4. Token may be invalid or expired
    echo.
    echo Manual push command:
    echo    git push -u origin main
    echo.
    echo If authentication fails, try:
    echo    1. Use GitHub Desktop app
    echo    2. Use SSH URL instead of HTTPS
    echo    3. Check token permissions at: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo SUCCESS! Published to GitHub!
echo ============================================
echo.
echo [OK] Your project has been uploaded to: 
echo    %REPO_URL%
echo.
echo Next steps:
echo    1. Visit your GitHub repository to view the code
echo    2. Add Topics tags: fhe, zama, blockchain, privacy
echo    3. Edit repository description
echo    4. Consider creating first Release (v1.0.0)
echo    5. Share with Zama community!
echo.
echo Documentation:
echo    - README.md
echo    - CONTRIBUTING.md
echo    - DEPLOYMENT.md
echo.

pause

