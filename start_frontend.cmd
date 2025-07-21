@echo off
chcp 65001 >nul
title 幼儿园系统前端服务启动器

echo ====================================
echo    🌐 幼儿园系统前端服务启动器
echo ====================================
echo.

echo 正在检查环境...

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查是否在正确的目录
if not exist "frontend\package.json" (
    echo ❌ 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo ✅ Node.js环境检查通过
echo.

REM 进入前端目录
cd frontend

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

echo 🚀 正在启动前端服务...
echo 📍 服务地址: http://localhost:8080
echo.

REM 启动开发服务器
call npm run serve

pause 