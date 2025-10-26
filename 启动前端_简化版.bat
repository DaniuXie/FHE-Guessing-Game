@echo off
chcp 65001
title 前端开发服务器
cd /d "%~dp0frontend"
echo ========================================
echo 正在启动前端服务器...
echo ========================================
echo.
npm run dev
pause


