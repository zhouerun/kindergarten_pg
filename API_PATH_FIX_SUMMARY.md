# API路径修正总结

## 🐛 原始问题

**症状：** API请求发送到错误的URL
```
❌ 错误URL: http://localhost:3000/api/api/mock-face-recognition/database/add_child:1
```

**根本原因：** 重复的`/api/`路径前缀
- 前端axios配置: `baseURL = "http://localhost:3000/api"`
- 代码中使用: `/api/mock-face-recognition/database/add_child`
- 结果: 自动拼接成 `api/api/...`

## ✅ 修正方案

### 修改文件：
`kindergarten_pg/frontend/src/views/parent/ChildBinding.vue`

### 修改内容：
```javascript
// 修正前：
const response = await axios.post('/api/mock-face-recognition/database/add_child', requestData, {

// 修正后：
const response = await axios.post('/mock-face-recognition/database/add_child', requestData, {
```

## 🔄 正确的API流程

### 1. 前端请求
```
请求路径: /mock-face-recognition/database/add_child
axios baseURL: http://localhost:3000/api
实际URL: http://localhost:3000/api/mock-face-recognition/database/add_child
```

### 2. 后端路由处理
```javascript
// server.js
app.use('/api/mock-face-recognition', mockFaceRecognitionRoutes);

// 匹配: /api/mock-face-recognition/database/add_child
// 处理: mockFaceRecognitionRoutes 中的 /database/add_child
```

### 3. 远端API调用
```
Node.js后端 → http://192.168.5.25:5000/database/add_child
```

## 🧪 验证方法

### 运行测试脚本：
```bash
cd kindergarten_pg
restart_services.cmd
```

### 手动验证步骤：
1. 重启前端和后端服务
2. 访问 http://localhost:8080
3. 登录家长账号
4. 进入孩子绑定页面
5. 上传训练数据
6. 使用浏览器开发者工具观察网络请求

### 期望结果：
- ✅ 网络请求显示: `POST http://localhost:3000/api/mock-face-recognition/database/add_child`
- ✅ 后端日志显示: 向 `http://192.168.5.25:5000/database/add_child` 发送请求
- ✅ 没有404错误或路径not found错误

## 📊 配置确认

### 环境变量（backend/.env）:
```bash
REMOTE_TRAINING_API=http://192.168.5.25:5000/database/add_child
```

### 前端axios配置（frontend/src/store/index.js）:
```javascript
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
axios.defaults.baseURL = API_BASE_URL;
```

### 后端路由配置（backend/server.js）:
```javascript
app.use('/api/mock-face-recognition', mockFaceRecognitionRoutes);
```

## 🛡️ 防止类似问题

1. **代码规范：** 前端API调用应省略`/api/`前缀，由axios自动添加
2. **路径一致性：** 确保前端路径与后端路由定义一致
3. **环境变量：** 使用环境变量管理远端API地址
4. **调试工具：** 使用浏览器开发者工具监控网络请求

---

**修正时间：** 2024年当前日期
**状态：** ✅ 已修正
**测试状态：** ⏳ 待验证 