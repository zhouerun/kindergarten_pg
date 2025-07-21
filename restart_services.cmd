@echo off
echo 🔄 重启服务以测试API路径修正...
echo.

echo 正在重启前端服务...
cd frontend
start /min cmd /c "npm run serve"
cd..

echo 正在重启后端服务...  
cd backend
start /min cmd /c "npm start"
cd..

echo.
echo ✅ 服务已重启
echo 📋 测试步骤:
echo 1. 打开浏览器访问: http://localhost:8080
echo 2. 登录家长账号
echo 3. 进入孩子绑定页面
echo 4. 上传训练数据
echo 5. 观察网络请求是否发送到正确的远端API
echo.
echo 🌐 期望的网络请求:
echo   前端 -> http://localhost:3000/api/mock-face-recognition/database/add_child
echo   后端 -> http://192.168.5.25:5000/database/add_child
echo.
pause 