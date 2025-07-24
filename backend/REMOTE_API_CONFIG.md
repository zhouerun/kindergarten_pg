# 远端API配置说明

## 🌐 远端服务器配置

根据您提供的信息，远端人脸识别服务器配置如下：

### 服务器信息
- **IP地址**: 192.168.5.25
- **端口**: 5000
- **完整API地址**: http://192.168.5.61:5000/database/add_child

### 配置步骤

1. **创建环境配置文件**
```bash
cd kindergarten_pg/backend
cp config/env.template .env
```

2. **编辑 .env 文件，设置远端API地址**
```bash
# 远端人脸识别训练API配置
REMOTE_TRAINING_API=http://192.168.5.61:5000/database/add_child
REMOTE_API_TIMEOUT=60000
REMOTE_API_MAX_RETRIES=3
```

3. **重启后端服务**
```bash
npm restart
# 或者
npm start
```

## 🔄 数据流程

```
前端 (Vue) 
    ↓ POST /api/mock-face-recognition/database/add_child
Node.js 后端 (代理层)
    ↓ 处理认证、验证、格式转换
    ↓ POST http://192.168.5.61:5000/database/add_child
远端Python服务器 (start_system.py)
```

## 📋 发送数据格式

### 前端发送给Node.js后端
```json
{
  "name": "张三",
  "images": ["data:image/jpeg;base64,/9j/4AAQ..."],
  "profile": {"age": 5}
}
```

### Node.js后端发送给远端服务器
```json
{
  "name": "张三", 
  "images": ["data:image/jpeg;base64,/9j/4AAQ..."],
  "profile": {"age": 5}
}
```

## ✅ 优势

通过Node.js后端代理的好处：

1. **CORS处理**: 避免前端跨域问题
2. **统一认证**: 使用JWT token验证用户身份
3. **错误处理**: 统一的错误处理和重试机制
4. **日志记录**: 完整的请求日志和调试信息
5. **数据验证**: 后端验证数据完整性
6. **安全性**: 隐藏远端API地址，增加安全层

## 🧪 测试方法

### 1. 检查后端健康状态
```bash
curl http://localhost:3000/api/mock-face-recognition/health
```

### 2. 检查远端服务连接
访问测试页面：http://localhost:3000/test_new_api_format.html

### 3. 手动测试API
```bash
# 获取JWT Token (先登录)
TOKEN="your_jwt_token_here"

# 测试新格式API
curl -X POST http://localhost:3000/api/mock-face-recognition/database/add_child \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "张三",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."],
    "profile": {"age": 5}
  }'
```

## 🚨 故障排除

### 连接问题
- 确保192.168.5.25:5000可以访问
- 检查防火墙设置
- 验证远端服务是否运行

### 认证问题
- 确保JWT token有效
- 检查用户角色权限(需要parent角色)

### 数据格式问题
- 确保base64图片格式正确
- 检查孩子姓名和年龄是否在数据库中存在

---

**配置时间**: 2024年当前日期  
**远端服务器**: 192.168.5.25:5000  
**API端点**: /database/add_child 