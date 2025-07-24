@echo off
echo ========================================
echo 手机端登录修复 - 重启服务
echo ========================================
echo.

echo 停止所有现有进程...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo 1. 启动后端服务...
cd /d "%~dp0backend"
start "后端服务" cmd /k "npm start"

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo.
echo 2. 启动前端服务...
cd /d "%~dp0frontend"
start "前端服务" cmd /k "npm run serve"

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo.
echo 访问地址：
echo - 本地访问: http://localhost:8080
echo - 网络访问: http://192.168.5.59:8080
echo.
echo 后端API: http://192.168.5.59:3000
echo.
echo 现在手机端应该可以正常登录了！
echo ========================================
echo.
echo 调试信息：
echo 1. 手机浏览器打开开发者工具
echo 2. 查看控制台输出
echo 3. 应该看到：API基础URL: http://192.168.5.59:3000/api
echo.
pause 