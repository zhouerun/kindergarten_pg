@echo off
echo ========================================
echo 测试API修复
echo ========================================
echo.

echo 检查前端编译...
cd /d "%~dp0frontend"
npm run serve

echo.
echo 如果编译成功，请访问：
echo - 本地: http://localhost:8080
echo - 网络: http://192.168.5.59:8080
echo.
pause 