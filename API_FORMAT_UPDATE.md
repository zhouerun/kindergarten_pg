# 训练数据API格式更新说明

## 📋 更新概览

根据 `start_system.py` 中提供的示例格式，我们已经更新了家长端上传训练照片的接口，从原来的 multipart/form-data 格式改为 JSON 格式。

## 🔄 API格式对比

### 原格式 (FormData)
```javascript
// 旧的上传方式
const formData = new FormData();
formData.append('childId', childId);
formData.append('age', age);
files.forEach(file => {
  formData.append('faceImages', file);
});

await axios.post('/mock-face-recognition/upload-training-data', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 新格式 (JSON) - 按照start_system.py示例
```javascript
// 新的上传方式
const requestData = {
  name: "张三",
  images: ["data:image/jpeg;base64,/9j/4AAQ..."], // base64格式
  profile: {
    age: 5
  }
};

await axios.post('/mock-face-recognition/database/add_child', requestData, {
  headers: { 'Content-Type': 'application/json' }
});
```

## 🛠️ 技术修改详情

### 1. 后端修改 (`mockFaceRecognition.js`)

#### 新增路由
- **新增**: `POST /database/add_child` - 按照start_system.py格式
- **保留**: `POST /upload-training-data` - 原有格式（向后兼容）

#### 数据处理变化
```javascript
// 原来：处理FormData
const formData = new FormData();
formData.append('photos', file.buffer);

// 现在：构建JSON格式
const jsonData = {
  name: childInfo.name,
  images: files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`),
  profile: { age: childInfo.age }
};
```

#### 远端API调用更新
```javascript
// 原来：发送FormData
await axios.post(REMOTE_TRAINING_API, formData, {
  headers: { ...formData.getHeaders() }
});

// 现在：发送JSON
await axios.post(REMOTE_TRAINING_API, jsonData, {
  headers: { 'Content-Type': 'application/json' }
});
```

### 2. 前端修改 (`ChildBinding.vue`)

#### 图片处理更新
```javascript
// 新增：文件转base64函数
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// 转换所有图片为base64
const images = [];
for (const file of faceFileList.value) {
  const base64 = await fileToBase64(file.raw);
  images.push(base64);
}
```

#### 请求数据结构
```javascript
const requestData = {
  name: currentChild.value.name,        // 孩子姓名
  images: images,                       // base64图片数组
  profile: {
    age: currentChild.value.age         // 年龄信息
  }
};
```

### 3. 环境配置更新 (`env.template`)

```bash
# 修正远端API配置
REMOTE_TRAINING_API=http://192.168.5.61:5000/database/add_child  # 实际远端服务器地址
REMOTE_API_TIMEOUT=60000
REMOTE_API_MAX_RETRIES=3
```

## 🧪 测试方法

### 1. 使用测试页面
打开 `test_new_api_format.html` 进行测试：
```bash
# 启动后端服务
cd kindergarten_pg/backend
npm start

# 在浏览器中访问
http://localhost:3000/test_new_api_format.html
```

### 2. 手动测试步骤
1. 登录获取JWT Token
2. 输入孩子姓名和年龄
3. 选择1-5张照片
4. 点击"上传训练数据"测试新格式
5. 点击"测试旧格式"对比验证

### 3. API直接测试
```bash
# 使用curl测试新格式
curl -X POST http://localhost:3000/api/mock-face-recognition/database/add_child \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "张三",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."],
    "profile": {"age": 5}
  }'
```

## 📊 关键特性

### ✅ 新格式优势
- **标准化**: 符合start_system.py规范
- **JSON格式**: 更易于调试和集成
- **Base64编码**: 无需文件上传处理
- **结构化数据**: 清晰的数据组织

### 🔄 兼容性保证
- **向后兼容**: 保留原有接口
- **渐进迁移**: 新旧格式并存
- **无缝切换**: 前端可选择使用格式

### 🔒 数据验证
- **图片数量**: 最多5张
- **Base64格式**: 自动检测和转换
- **年龄验证**: 1-10岁范围检查
- **姓名匹配**: 数据库查找验证

## 🚀 部署注意事项

1. **环境变量**: 确保 `.env` 文件包含正确的 `REMOTE_TRAINING_API` 配置
2. **依赖安装**: 运行 `npm install axios form-data`
3. **数据库**: 确保children表包含name和age字段
4. **网络配置**: 确保可以访问远端训练服务

## 📝 后续优化建议

1. **图片压缩**: 上传前压缩大图片减少传输量
2. **进度显示**: 添加base64转换进度提示
3. **错误重试**: 增加网络错误自动重试机制
4. **批量处理**: 支持批量上传多个孩子数据

---

**更新时间**: 2024年当前日期  
**更新人员**: AI助手  
**版本**: v2.0 - JSON格式支持 