# 🎈 幼儿园家校沟通系统

基于Vue.js + Node.js + MySQL的幼儿园家校沟通系统，支持照片分享、人脸识别、权限管理等功能。

## 📋 功能特性

### 教师端功能
- **照片管理**：批量上传照片，自动人脸识别匹配学生
- **班级管理**：管理班级学生信息，添加/删除学生
- **用户管理**：管理家长用户，关联家长与孩子
- **工作台**：查看班级统计信息和最新动态

### 家长端功能
- **私有照片**：查看自己孩子的专属照片
- **公共照片**：浏览班级公共照片墙
- **照片互动**：点赞、搜索照片功能
- **个人中心**：查看孩子信息和个人资料

### 系统特性
- **智能识别**：模拟人脸识别，自动匹配照片中的学生
- **权限控制**：严格的角色权限管理，保护隐私安全
- **响应式设计**：支持桌面端、平板端、手机端访问
- **现代化UI**：基于Element Plus的美观界面

## 🛠️ 技术栈

- **前端**：Vue 3 + Vue Router + Vuex + Element Plus
- **后端**：Node.js + Express + JWT认证
- **数据库**：MySQL + mysql2
- **文件处理**：Multer文件上传
- **安全**：bcryptjs密码加密 + Helmet安全头

## 📁 项目结构

```
kindergarten_pg/
├── frontend/                 # Vue.js前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── views/          # 页面组件
│   │   │   ├── teacher/    # 教师端页面
│   │   │   └── parent/     # 家长端页面
│   │   ├── router/         # 路由配置
│   │   ├── store/          # Vuex状态管理
│   │   └── main.js         # 应用入口
│   └── package.json
├── backend/                  # Node.js后端服务
│   ├── routes/              # API路由
│   │   ├── auth.js         # 认证路由
│   │   ├── photos.js       # 照片管理
│   │   ├── classes.js      # 班级管理
│   │   └── users.js        # 用户管理
│   ├── middleware/          # 中间件
│   ├── config/             # 配置文件
│   ├── uploads/            # 文件上传目录
│   └── server.js           # 服务器入口
├── database/                 # 数据库脚本
│   ├── schema.sql          # 数据库结构
│   └── init_data.sql       # 初始化数据
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/your-username/kindergarten_pg.git
cd kindergarten_pg
```

### 2. 安装依赖

```bash
# 安装所有依赖
npm run install-all

# 或者分别安装
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. 数据库配置

#### 方法一：自动配置（推荐）
```bash
# 使用一键启动脚本（Windows）
quick_start.cmd

# 该脚本会自动：
# 1. 检查MySQL环境
# 2. 创建数据库配置文件
# 3. 设置数据库和表结构
# 4. 导入测试数据
```

#### 方法二：手动配置
```bash
# 1. 创建环境配置文件
cd backend
copy config/env.template .env

# 2. 编辑 .env 文件，设置你的MySQL密码

# 3. 运行数据库设置脚本
mysql -u root -p < database/setup.sql

# 4. 测试数据库连接
node ../database/test_connection.js
```

### 4. 环境变量配置

在 `backend` 目录下创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kindergarten_system
DB_PORT=3306

# 服务器配置
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# JWT配置
JWT_SECRET=kindergarten_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

**重要提醒：**
- 将 `your_mysql_password` 替换为你的MySQL密码
- 详细配置说明请查看 `database/setup.md`

### 5. 启动服务

```bash
# 开发环境 - 同时启动前后端
npm run dev

# 或者分别启动
npm run dev:backend    # 启动后端服务 (端口3000)
npm run dev:frontend   # 启动前端服务 (端口8080)
```

### 6. 访问应用

- 前端地址：http://localhost:8080
- 后端API：http://localhost:3000/api

## 👥 测试账号

### 教师账号
- 用户名：`teacher1`
- 密码：`123456`
- 班级：小一班

### 家长账号
- 用户名：`parent1`
- 密码：`123456`
- 孩子：陈小明（小一班）

## 🔧 数据库故障排除

### 常见问题

#### 1. 数据库连接失败
**错误信息：** `Access denied for user 'root'@'localhost'`
**解决方案：**
```bash
# 重置MySQL root密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### 2. 找不到数据库
**错误信息：** `Database 'kindergarten_system' doesn't exist`
**解决方案：**
```bash
# 重新运行数据库设置脚本
mysql -u root -p < database/setup.sql
```

#### 3. 表不存在
**错误信息：** `Table 'kindergarten_system.users' doesn't exist`
**解决方案：**
```bash
# 检查数据库表结构
mysql -u root -p
USE kindergarten_system;
SHOW TABLES;

# 如果表不存在，重新导入
source database/setup.sql;
```

#### 4. 端口冲突
**错误信息：** `ECONNREFUSED 127.0.0.1:3306`
**解决方案：**
```bash
# 检查MySQL服务状态
net start mysql

# 检查端口占用
netstat -an | findstr :3306
```

### 数据库工具推荐

- **MySQL Workbench**：官方图形化管理工具
- **Navicat**：专业数据库管理工具
- **phpMyAdmin**：Web界面管理工具
- **DBeaver**：免费通用数据库工具

### 详细配置指南

更多数据库配置详情请查看：`database/setup.md`

## 📚 API文档

### 认证接口

```bash
# 用户登录
POST /api/auth/login
{
  "username": "teacher1",
  "password": "123456"
}

# 用户注册
POST /api/auth/register
{
  "username": "newuser",
  "password": "123456",
  "role": "parent",
  "full_name": "张三"
}
```

### 照片接口

```bash
# 上传照片（教师）
POST /api/photos
Content-Type: multipart/form-data
{
  "images": [File],
  "classId": 1,
  "isPublic": true
}

# 获取公共照片
GET /api/photos/public?page=1&limit=20

# 获取私有照片（家长）
GET /api/photos/private?page=1&limit=20

# 照片点赞
POST /api/photos/like
{
  "photoId": 1
}

# 搜索照片
GET /api/photos/search?query=陈小明
```

### 班级接口

```bash
# 获取班级列表
GET /api/classes

# 获取班级详情
GET /api/classes/:id

# 获取班级学生
GET /api/classes/:id/children

# 添加学生（教师）
POST /api/classes/:id/children
{
  "name": "新学生"
}
```

## 🔧 开发说明

### 人脸识别模拟

当前版本使用模拟人脸识别功能：
- 照片上传后随机匹配1-3个班级学生
- 生成0.7-1.0之间的置信度分数
- 将识别结果存储在数据库的JSON字段中

### 权限控制

- **教师**：可以上传照片、管理班级、管理用户
- **家长**：只能查看自己孩子的照片和公共照片
- **JWT认证**：所有API接口都需要有效的JWT token

### 安全特性

- 密码使用bcryptjs加密存储
- JWT token有效期24小时
- 文件上传限制：仅支持图片格式，最大10MB
- API请求限流：每15分钟最多100次请求
- 使用Helmet设置安全HTTP头

## 📦 部署

### 生产环境部署

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 启动后端服务
cd ../backend
NODE_ENV=production npm start
```

### Docker部署（可选）

```dockerfile
# Dockerfile示例
FROM node:16-alpine

WORKDIR /app
COPY . .

RUN npm run install-all
RUN cd frontend && npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 常见问题

### Q: 无法连接数据库？
A: 请检查MySQL服务是否启动，数据库配置是否正确，确保.env文件中的数据库连接信息无误。

### Q: 照片上传失败？
A: 请确保uploads目录有写入权限，检查文件大小是否超过10MB限制。

### Q: 前端页面空白？
A: 请检查后端API是否正常运行，浏览器控制台是否有错误信息。

### Q: JWT token失效？
A: JWT token有效期为24小时，过期后需要重新登录。

## 📞 支持

如有问题或建议，请提交Issue或联系开发团队。

## 🐛 最新问题修复

### 问题：favicon.ico 404错误 + 登录401错误 (2024-01-XX)

**问题描述：**
- 浏览器控制台显示：`favicon.ico:1 Failed to load resource: the server responded with a status of 404 (Not Found)`
- 登录时出现：`:3000/api/auth/login:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)`

**解决方案：**

1. **修复favicon.ico 404错误**：
   - 在 `frontend/public/` 目录下创建了 `favicon.ico` 文件
   - 解决浏览器控制台的404错误提示

2. **修复登录401错误**：
   - 后端认证系统已恢复为安全的bcrypt哈希验证
   - 需要更新数据库中的密码哈希值
   
   **执行步骤：**
   ```bash
   # 方法1：直接运行修复脚本
   双击：fix_login_issues.cmd
   
   # 方法2：在MySQL中执行SQL文件
   mysql -u root -p < database/update_bcrypt_passwords.sql
   
   # 方法3：手动执行SQL命令
   USE kindergarten_system;
   UPDATE users SET password = '$2a$10$ot0wF9chNf5LvL6DlPVHrOSBEGO1gd8zAYqSZEq1RkxvxonIvRcTm' 
   WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10');
   ```

3. **测试账号信息**：
   - 用户名: `teacher1`, 密码: `123456`
   - 用户名: `parent1`, 密码: `123456`
   - 所有测试账号密码统一为: `123456`

4. **相关文件**：
   - `database/update_bcrypt_passwords.sql` - 密码更新SQL脚本
   - `backend/generate_password_hash.js` - 密码哈希生成工具
   - `fix_login_issues.cmd` - 快速修复工具

**安全说明：**
- 已恢复使用bcrypt哈希加密存储密码
- 撤销了之前的明文密码存储方案
- 确保系统安全性和数据保护

### 问题：API路径双重前缀错误 (2024-01-XX)

**问题描述：**
- 浏览器控制台显示：`:3000/api/api/classes:1 Failed to load resource: the server responded with a status of 404 (Not Found)`
- 类似的错误还有：`:3000/api/api/classes/students:1 Failed to load resource: the server responded with a status of 404 (Not Found)`

**问题分析：**
- `axios.defaults.baseURL` 设置为 `'http://localhost:3000/api'`
- 但前端组件中使用 `/api/classes` 这样的路径
- 导致最终URL变成 `http://localhost:3000/api/api/classes`

**解决方案：**

1. **自动修复**：
   ```bash
   # 运行批量修复脚本
   双击：fix_api_paths.cmd
   ```

2. **手动修复**：
   - 将所有Vue组件中的 `/api/` 前缀改为 `/`
   - 例如：`/api/classes` → `/classes`
   - 例如：`/api/photos` → `/photos`

3. **影响的文件**：
   - `frontend/src/views/teacher/UserManagement.vue`
   - `frontend/src/views/teacher/PhotoUpload.vue`
   - `frontend/src/views/Register.vue`
   - `frontend/src/views/Profile.vue`
   - `frontend/src/views/parent/PublicPhotos.vue`
   - `frontend/src/views/parent/PrivatePhotos.vue`

4. **验证修复**：
   - 重启前端服务：`npm run serve`
   - 检查浏览器控制台是否还有 `/api/api/` 错误
   - 确保API请求路径正确：`http://localhost:3000/api/classes`

**相关文件：**
- `fix_api_paths.cmd` - 批量修复脚本
- `frontend/src/store/index.js` - axios配置文件

**技术说明：**
- 保持 `axios.defaults.baseURL = 'http://localhost:3000/api'` 不变
- 所有组件中的API调用使用相对路径（不带 `/api/` 前缀）
- 确保URL拼接正确，避免双重前缀问题

### 问题：缺失API端点404错误 (2024-01-XX)

**问题描述：**
- `:3000/api/users/parents:1 Failed to load resource: the server responded with a status of 404 (Not Found)`
- `:3000/api/classes/students:1 Failed to load resource: the server responded with a status of 404 (Not Found)`

**问题分析：**
- 前端代码调用了后端未实现的API端点
- 需要在后端添加相应的路由处理这些请求

**解决方案：**

1. **添加缺失的API端点**：
   ```javascript
   // 在 backend/routes/users.js 中添加
   GET /users/parents - 获取所有家长用户
   
   // 在 backend/routes/classes.js 中添加
   GET /classes/students - 获取所有学生
   POST /classes/students - 添加学生
   PUT /classes/students/:id - 更新学生信息
   DELETE /classes/students/:id - 删除学生
   ```

2. **新增的API端点功能**：
   - **`GET /users/parents`**: 获取所有家长用户列表，包含关联的孩子信息
   - **`GET /classes/students`**: 获取所有学生列表，包含班级信息
   - **学生管理CRUD操作**: 完整的学生增删改查功能

3. **权限控制**：
   - 所有新端点都需要JWT认证
   - 家长相关操作仅教师可用（`authorizeRole(['teacher'])`）
   - 学生管理操作仅教师可用

4. **验证修复**：
   ```bash
   # 重启后端服务器
   cd backend
   npm start
   
   # 使用测试页面验证
   双击打开：test_missing_apis.html
   ```

**相关文件：**
- `backend/routes/users.js` - 添加家长用户相关路由
- `backend/routes/classes.js` - 添加学生管理相关路由
- `test_missing_apis.html` - API端点测试页面

**API端点列表：**
```
GET /api/users/parents          - 获取家长列表（教师）
GET /api/classes/students       - 获取学生列表
POST /api/classes/students      - 添加学生（教师）
PUT /api/classes/students/:id   - 更新学生（教师）
DELETE /api/classes/students/:id - 删除学生（教师）
```

---

**开发团队** | **更新时间：2024年1月**

## 新增修复（第二轮）- 500错误和缺失API端点

### 问题4：500内部服务器错误和照片获取失败

**问题现象**：
- `500 (Internal Server Error)` 在获取照片时发生
- `Dashboard.vue:239 加载数据失败: Error: 获取照片失败`
- `fetchPublicPhotos`方法返回500错误
- `:3000/api/users/children:1 Failed to load resource: 404 (Not Found)`

**修复方案**：
1. **优化/photos/public路由**：
   - 改进SQL查询，使用`COALESCE`处理空值
   - 将布尔值`true`改为`1`以兼容MySQL
   - 添加JSON解析异常处理
   - 增加数据库连接检查

2. **添加/users/children端点**：
   - 为家长用户提供获取关联孩子信息的API
   - 实现JWT认证和角色权限控制
   - 返回孩子ID、姓名、班级等信息

3. **创建测试数据**：
   - 添加`database/insert_test_data.sql`插入示例数据
   - 包含班级、孩子、家长关联、照片数据
   - 确保API有数据可返回

### 修复文件

1. **backend/routes/users.js**：添加`GET /users/children`端点
2. **backend/routes/photos.js**：优化`GET /photos/public`路由
3. **database/insert_test_data.sql**：插入测试数据
4. **fix_500_errors.cmd**：完整修复脚本

### 测试验证

使用`fix_500_errors.cmd`脚本：
- 检查数据库连接
- 插入测试数据
- 启动后端和前端服务
- 验证API端点正常工作

**最终状态**：
- ✅ favicon.ico 404 resolved
- ✅ API double prefix (/api/api/) resolved
- ✅ Missing backend endpoints added
- ✅ ESLint compilation errors fixed
- ✅ Login 401 resolved with bcrypt password hashing
- ✅ 500 Internal Server Error resolved
- ✅ Missing /users/children endpoint added

**全部问题已解决**：所有404和500错误都已通过后端路由添加和数据库优化系统性地识别和解决。 