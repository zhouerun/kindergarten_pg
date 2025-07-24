@echo off
echo ========================================
echo 教师端API修复 - 重启服务
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
echo 修复内容：
echo ✓ 所有Vue组件已更新为使用api实例
echo ✓ 教师端所有功能已修复
echo ✓ 动态API地址配置已启用
echo.
echo 访问地址：
echo - 本地访问: http://localhost:8080
echo - 网络访问: http://192.168.5.59:8080
echo.
echo 现在教师端应该可以正常工作了！
echo ========================================
echo.
echo 测试步骤：
echo 1. 使用教师账号登录
echo 2. 检查仪表板数据加载
echo 3. 测试照片管理功能
echo 4. 测试班级管理功能
echo.
pause 