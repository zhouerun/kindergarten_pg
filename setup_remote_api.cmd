@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 幼儿园照片管理系统 - 远端API配置
echo ========================================
echo.

echo 📋 配置信息:
echo    远端服务器: 192.168.5.25:5000
echo    本地后端:   localhost:3000
echo    本地前端:   localhost:8080
echo.

echo 📁 当前目录: %CD%
echo.

rem 检查是否在正确的目录
if not exist "kindergarten_pg" (
    echo ❌ 错误: 未找到 kindergarten_pg 目录
    echo    请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

cd kindergarten_pg\backend

echo 📄 创建环境配置文件...
if not exist ".env" (
    if exist "config\env.template" (
        copy "config\env.template" ".env" >nul
        echo ✅ 已创建 .env 文件
    ) else (
        echo ❌ 错误: 未找到 env.template 文件
        pause
        exit /b 1
    )
) else (
    echo ℹ️  .env 文件已存在，跳过创建
)

echo.
echo 🔧 更新远端API配置...

rem 更新.env文件中的远端API地址
powershell -Command "(gc .env) -replace 'REMOTE_TRAINING_API=.*', 'REMOTE_TRAINING_API=http://192.168.5.61:5000/database/add_child' | Out-File -encoding UTF8 .env"

if %ERRORLEVEL% EQU 0 (
    echo ✅ 远端API地址已更新为: http://192.168.5.61:5000/database/add_child
) else (
    echo ⚠️  手动更新失败，请手动编辑 .env 文件
)

echo.
echo 📦 检查依赖安装...

rem 检查node_modules是否存在
if not exist "node_modules" (
    echo 🔄 安装后端依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 后端依赖安装完成
) else (
    echo ✅ 后端依赖已安装
)

cd ..\frontend

if not exist "node_modules" (
    echo 🔄 安装前端依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
) else (
    echo ✅ 前端依赖已安装
)

cd ..

echo.
echo ========================================
echo ✅ 配置完成！
echo ========================================
echo.
echo 📝 接下来的步骤:
echo.
echo 1. 启动后端服务:
echo    cd kindergarten_pg\backend
echo    npm start
echo.
echo 2. 启动前端服务:
echo    cd kindergarten_pg\frontend  
echo    npm run serve
echo.
echo 3. 测试连接:
echo    访问: http://localhost:3000/test_new_api_format.html
echo.
echo 4. 使用系统:
echo    访问: http://localhost:8080
echo.
echo 🔧 故障排除:
echo    - 查看 QUICK_START_REMOTE.md 获取详细指南
echo    - 查看 REMOTE_API_CONFIG.md 获取配置说明
echo.

echo 是否现在启动后端服务? (Y/N)
set /p choice=请选择: 
if /i "%choice%"=="Y" (
    echo.
    echo 🚀 启动后端服务...
    cd kindergarten_pg\backend
    start cmd /k "echo 后端服务启动中... && npm start"
    
    echo.
    echo 💡 提示: 
    echo    - 后端服务将在新窗口中启动
    echo    - 请等待服务启动完成后再启动前端
    echo    - 前端启动命令: cd kindergarten_pg\frontend && npm run serve
)

echo.
echo 按任意键退出...
pause >nul 