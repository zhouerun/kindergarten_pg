@echo off
echo 正在重启后端服务以应用CORS修复...
echo.

cd /d "%~dp0backend"

echo 停止现有进程...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 启动后端服务...
npm start

echo.
echo 后端服务已重启，CORS配置已更新
echo 现在应该可以支持网络访问了
echo.
pause 