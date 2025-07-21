@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 修复远端API配置
echo ========================================
echo.

echo 📋 问题分析:
echo    系统仍在使用旧地址: http://localhost:8001/api/train
echo    应该使用新地址: http://192.168.5.25:5000/database/add_child
echo.

if not exist "kindergarten_pg\backend" (
    echo ❌ 错误: 请在项目根目录下运行此脚本
    pause
    exit /b 1
)

cd kindergarten_pg\backend

echo 🔍 检查配置...
node ..\check_config.js

echo.
echo 🔧 执行修复...

echo 1. 确保 .env 文件存在...
if not exist ".env" (
    if exist "config\env.template" (
        copy "config\env.template" ".env" >nul
        echo ✅ 已创建 .env 文件
    ) else (
        echo ❌ 未找到模板文件
        pause
        exit /b 1
    )
)

echo 2. 更新远端API地址...
powershell -Command "(gc .env) -replace 'REMOTE_TRAINING_API=.*', 'REMOTE_TRAINING_API=http://192.168.5.25:5000/database/add_child' | Out-File -encoding UTF8 .env"

echo 3. 验证配置...
findstr "REMOTE_TRAINING_API" .env

echo.
echo ✅ 配置已更新！
echo.

echo 🚀 是否重启后端服务? (Y/N)
set /p choice=请选择: 
if /i "%choice%"=="Y" (
    echo.
    echo 正在重启后端服务...
    
    rem 尝试杀死现有的 node 进程（谨慎使用）
    echo 提示: 如果服务正在运行，请手动按 Ctrl+C 停止
    echo 然后重新运行: npm start
    
    echo.
    echo 启动新的服务...
    start cmd /k "echo 后端服务重启中... && npm start"
    
    echo ✅ 服务已在新窗口中启动
) else (
    echo.
    echo 💡 请手动重启后端服务:
    echo    1. 按 Ctrl+C 停止当前服务
    echo    2. 运行: npm start
)

echo.
echo ========================================
echo ✅ 修复完成！
echo ========================================
echo.
echo 📝 验证步骤:
echo 1. 检查后端日志，确认使用正确的API地址
echo 2. 访问: http://localhost:3000/test_new_api_format.html
echo 3. 测试上传训练数据功能
echo.
echo 按任意键退出...
pause >nul 