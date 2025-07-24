# CORS 跨域问题修复说明

## 问题描述
当您使用网络IP地址（如 `http://192.168.5.59:8080`）访问前端时，会遇到CORS错误：
```
Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' from origin 'http://192.168.5.59:8080' has been blocked by CORS policy
```

## 解决方案
已修改后端服务器的CORS配置，现在支持：

### 1. 本地访问
- `http://localhost:8080`
- `http://127.0.0.1:8080`

### 2. 本地网络访问
- `http://192.168.x.x:8080` (所有192.168网段)
- `http://10.x.x.x:8080` (所有10网段)
- `http://172.16-31.x.x:8080` (172.16-31网段)

### 3. 环境变量配置
- 通过 `FRONTEND_URL` 环境变量配置的地址

## 修改内容

### 后端服务器配置 (server.js)
1. **添加了本地网络检测函数**
   ```javascript
   function isLocalNetwork(origin) {
     const localNetworkPatterns = [
       /^http:\/\/192\.168\.\d+\.\d+:8080$/,
       /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,
       /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:8080$/
     ];
     return localNetworkPatterns.some(pattern => pattern.test(origin));
   }
   ```

2. **更新CORS配置**
   ```javascript
   app.use(cors({
     origin: function (origin, callback) {
       if (!origin) return callback(null, true);
       
       if (allowedOrigins.indexOf(origin) !== -1) {
         return callback(null, true);
       }
       
       if (isLocalNetwork(origin)) {
         console.log('允许本地网络访问:', origin);
         return callback(null, true);
       }
       
       console.log('CORS blocked origin:', origin);
       callback(new Error('Not allowed by CORS'));
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
     optionsSuccessStatus: 200
   }));
   ```

## 应用修复

### 方法1: 使用重启脚本
```bash
# 双击运行
restart_backend_cors_fix.cmd
```

### 方法2: 手动重启
```bash
# 1. 停止后端服务
# 2. 进入backend目录
cd backend

# 3. 重新启动
npm start
```

## 验证修复

1. **重启后端服务后**，在控制台应该看到：
   ```
   服务器运行在端口 3000
   环境: development
   允许的CORS源: 2 个 + 本地网络
   ```

2. **测试网络访问**：
   - 使用 `http://192.168.5.59:8080` 访问前端
   - 尝试登录，应该不再出现CORS错误

3. **检查控制台日志**：
   - 成功访问时会显示：`允许本地网络访问: http://192.168.5.59:8080`
   - 被阻止的访问会显示：`CORS blocked origin: [被阻止的地址]`

## 安全说明

- 此配置仅允许本地网络访问，不会影响生产环境安全
- 支持的网络范围：
  - 192.168.0.0/16 (192.168.x.x)
  - 10.0.0.0/8 (10.x.x.x)
  - 172.16.0.0/12 (172.16-31.x.x)

## 故障排除

### 如果仍然出现CORS错误：

1. **确认后端服务已重启**
   - 检查控制台是否显示新的CORS配置信息

2. **检查IP地址格式**
   - 确保前端URL格式为：`http://IP地址:8080`
   - 端口必须是8080

3. **检查网络连接**
   - 确保前端和后端在同一网络
   - 确保防火墙没有阻止连接

4. **查看后端日志**
   - 检查是否有CORS相关的错误信息
   - 确认请求来源是否被正确识别

### 如果需要添加其他IP段：

修改 `server.js` 中的 `localNetworkPatterns` 数组，添加相应的正则表达式。

## 生产环境配置

在生产环境中，建议：

1. **明确指定允许的域名**
   ```javascript
   const allowedOrigins = [
     'https://yourdomain.com',
     'https://www.yourdomain.com'
   ];
   ```

2. **移除本地网络支持**
   - 删除 `isLocalNetwork` 函数
   - 只允许明确的域名列表

3. **使用环境变量**
   ```bash
   FRONTEND_URL=https://yourdomain.com
   ``` 