@echo off
chcp 65001 >nul
title 服务状态检查器

echo ====================================
echo    🔍 服务状态检查器
echo ====================================
echo.

echo 正在检查服务状态...
echo.

REM 检查后端服务 (端口3000)
echo 📍 检查后端服务 (端口3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ 后端服务运行正常' -ForegroundColor Green } else { Write-Host '❌ 后端服务响应异常' -ForegroundColor Red } } catch { Write-Host '❌ 后端服务未运行' -ForegroundColor Red }"

echo.

REM 检查前端服务 (端口8080)
echo 📍 检查前端服务 (端口8080)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ 前端服务运行正常' -ForegroundColor Green } else { Write-Host '❌ 前端服务响应异常' -ForegroundColor Red } } catch { Write-Host '❌ 前端服务未运行' -ForegroundColor Red }"

echo.

REM 检查MySQL服务
echo 📍 检查MySQL服务...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL客户端未安装或未添加到PATH
) else (
    echo ✅ MySQL客户端可用
)

echo.
echo ====================================
echo 检查完成！
echo.
echo 如果后端服务未运行，请运行: start_backend.cmd
echo 如果前端服务未运行，请运行: start_frontend.cmd
echo ====================================

pause 