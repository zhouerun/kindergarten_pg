@echo off
echo 正在为children表添加age字段...

cd /d "%~dp0"

REM 检查MySQL是否可用
mysql --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到MySQL客户端，请确保MySQL已安装并添加到PATH环境变量
    pause
    exit /b 1
)

REM 执行SQL脚本
echo 执行数据库迁移...
mysql -u root -p < database/add_age_column.sql

if errorlevel 1 (
    echo 错误: 数据库迁移失败
    pause
    exit /b 1
) else (
    echo 成功: age字段已添加到children表
)

pause 