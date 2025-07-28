# 幼儿园照片管理系统 - 后端

## 项目概述

这是一个基于Node.js和Express的幼儿园照片管理系统后端服务。系统支持老师上传照片、家长查看孩子照片，以及集成远端人脸识别训练服务。

## 🆕 远端人脸识别训练API集成

### 功能特性

- **真实API调用**: 向远端Python服务发送训练数据
- **数据完整性**: 发送孩子ID、年龄和照片文件
- **文件限制**: 单次最多上传5张照片，每张最大5MB
- **重试机制**: 自动重试失败的请求，最多3次
- **状态管理**: 本地维护训练状态数据

### 核心接口

#### 1. 上传训练数据
```
POST /api/face-recognition/upload-training-data
Content-Type: multipart/form-data
Authorization: Bearer <token>

Parameters:
- childId: 孩子ID
- faceImages: 照片文件数组（1-5张）
```

#### 2. 查询训练状态
```
GET /api/face-recognition/training-status/:childId
Authorization: Bearer <token>
```

#### 3. 健康检查
```
GET /api/face-recognition/health
```

### 远端API数据格式

**发送到远端的数据**:
```
Content-Type: multipart/form-data

childId: "123"          // 孩子ID
age: "5"                // 孩子年龄  
photos: [File1]         // 照片文件1
photos: [File2]         // 照片文件2
photos: [File3]         // 照片文件3
photos: [File4]         // 照片文件4
photos: [File5]         // 照片文件5
```

**远端API预期响应**:
```json
{
  "success": true,
  "message": "训练数据接收成功",
  "childId": 123,
  "processedImages": 5,
  "trainingId": "train_abc123",
  "estimatedTime": "2-3分钟"
}
```

## 📦 安装和配置

### 1. 安装依赖
```bash
cd kindergarten_pg/backend
npm install
```

### 2. 环境配置
复制环境变量模板：
```bash
cp config/env.template .env
```

编辑`.env`文件，配置必要的参数：
```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kindergarten_system

# 远端API配置
buildRemoteTrainingData=http://your-python-server:8001/api/train
REMOTE_API_TIMEOUT=60000
REMOTE_API_MAX_RETRIES=3
```

### 3. 数据库准备
确保MySQL数据库中的`children`表包含`age`字段：
```sql
ALTER TABLE children ADD COLUMN age INT DEFAULT 5;
```

### 4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🔧 技术架构

### 数据流程
```
前端上传 → Node.js后端 → 数据库查询孩子信息 → 构建FormData → 远端Python API → 返回结果 → 更新本地状态
```

### 核心组件

#### 文件上传处理
- **Multer**: 内存存储，不保存到磁盘
- **文件验证**: JPG/PNG格式，5MB大小限制
- **数量限制**: 最多5张照片

#### 数据库交互
- **MySQL2**: Promise-based数据库连接
- **孩子信息查询**: 获取ID、姓名、年龄、学号
- **连接管理**: 每次查询创建新连接，使用后关闭

#### 远端API调用
- **Axios**: HTTP客户端
- **Form-data**: 构建multipart/form-data请求
- **重试机制**: 指数退避算法，最多重试3次
- **超时控制**: 60秒超时限制

#### 错误处理
- **参数验证**: 孩子ID、文件格式、数量限制
- **网络错误**: 连接超时、服务不可用
- **业务错误**: 孩子信息不存在、年龄异常

## 📊 状态管理

### 本地状态数据结构
```javascript
{
  childId: 123,
  childInfo: {
    id: 123,
    name: "小明",
    age: 5,
    student_number: "2024001"
  },
  totalImages: 5,
  uploadTime: "2024-01-15T10:30:00Z",
  remoteTrainingId: "train_abc123",
  status: "submitted", // not_started | submitted | completed
  lastUpdate: "2024-01-15T10:30:00Z"
}
```

### 状态流转
1. **not_started**: 尚未上传训练数据
2. **submitted**: 已提交到远端服务
3. **completed**: 远端处理完成（需要额外机制更新）

## 🔍 调试和监控

### 日志输出
系统提供详细的控制台日志：
- 请求参数和用户信息
- 孩子信息查询结果
- 远端API调用过程
- 错误信息和堆栈

### 健康检查
访问 `/api/face-recognition/health` 检查：
- 后端服务状态
- 远端API连接状态
- 响应时间

### 错误处理
- **400错误**: 参数验证失败
- **404错误**: 孩子信息不存在
- **500错误**: 远端服务异常、数据库错误

## 🚀 部署建议

### 生产环境配置
1. **环境变量**: 使用生产环境的远端API地址
2. **日志管理**: 配置日志轮转和持久化
3. **监控告警**: 监控远端API可用性
4. **负载均衡**: 考虑多实例部署

### 性能优化
1. **连接池**: 数据库连接池配置
2. **缓存**: Redis缓存训练状态
3. **异步处理**: 消息队列处理大批量请求
4. **文件压缩**: 图片压缩减少传输时间

## 🔒 安全考虑

### 数据安全
- **权限验证**: 仅家长角色可上传训练数据
- **文件验证**: 严格的文件类型和大小限制
- **SQL注入**: 使用参数化查询
- **跨域保护**: CORS配置

### 网络安全
- **HTTPS**: 生产环境使用HTTPS
- **API密钥**: 远端API访问认证
- **限流**: 防止恶意请求
- **输入验证**: 严格的参数验证

## 📝 开发指南

### 添加新功能
1. 在相应的路由文件中添加处理逻辑
2. 更新环境变量模板
3. 添加相应的错误处理
4. 更新文档和测试

### 测试建议
1. **单元测试**: 核心函数逻辑测试
2. **集成测试**: API接口测试
3. **压力测试**: 并发请求测试
4. **错误测试**: 各种异常场景测试

## 🐛 常见问题

### Q: 远端API连接失败
A: 检查网络连接和API地址配置，查看健康检查接口状态

### Q: 数据库连接错误
A: 验证数据库配置参数，确保MySQL服务正常运行

### Q: 文件上传失败
A: 检查文件格式和大小是否符合要求，确认multer配置

### Q: 孩子信息查询失败
A: 确认children表中存在对应记录且age字段不为空

## 📞 技术支持

如遇到问题，请检查：
1. 控制台日志输出
2. 网络连接状态
3. 环境变量配置
4. 数据库表结构

---

*本系统集成了真实的远端人脸识别训练服务，提供了完整的错误处理和监控机制，适用于生产环境部署。* 