# 幼儿园照片管理系统

## 最新更新 (2025年7月9日)

### 已修复的问题：
1. **Element UI ElOption null值问题**：修复了PublicPhotos.vue中ElOption组件不接受null值的问题，改为使用空字符串''
2. **500错误问题**：添加了详细的错误处理和日志记录，临时使用模拟数据解决API调用失败问题
3. **数据库连接问题**：创建了数据库初始化脚本，并添加了完整的错误处理机制
4. **前端ElSelect组件优化**：修复了所有与null值相关的类型检查错误

### 技术改进：
- 添加了详细的日志记录用于调试
- 优化了错误处理机制
- 创建了数据库初始化脚本
- 增强了API的健壮性

### 使用说明：
1. 确保MySQL服务正在运行
2. 复制`backend/config/env.template`为`backend/.env`并配置数据库连接
3. 运行`node backend/init_db.js`初始化数据库
4. 使用`start.cmd`或分别启动前后端服务

---

## 原始文档

一个基于Vue.js和Node.js的幼儿园照片管理系统，具有人脸识别、照片分类、权限管理等功能。

## 功能特性

### 核心功能
- **用户认证系统**：教师和家长分别登录
- **照片上传管理**：教师上传班级照片
- **人脸识别**：自动识别照片中的儿童
- **照片墙展示**：公共照片墙和私人照片查看
- **权限控制**：基于角色的访问控制

### 技术栈
- **前端**：Vue.js 3 + Element Plus + Pinia
- **后端**：Node.js + Express + MySQL
- **身份验证**：JWT
- **文件处理**：Multer
- **数据库**：MySQL 8.0

## 快速开始

### 环境要求
- Node.js 16+
- MySQL 8.0+
- 现代浏览器

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd kindergarten_pg
```

2. 安装依赖
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

3. 数据库配置
```bash
# 复制环境变量模板
cp backend/config/env.template backend/.env

# 编辑.env文件，配置数据库连接
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kindergarten_system
```

4. 初始化数据库
```bash
cd backend
node init_db.js
```

5. 启动应用
```bash
# 方式1：使用启动脚本
./start.cmd

# 方式2：分别启动
cd backend && npm start
cd frontend && npm run serve
```

### 访问地址
- 前端：http://localhost:8080
- 后端API：http://localhost:3000

### 测试账号
- 教师账号：teacher1 / 123456
- 家长账号：parent1 / 123456

## 项目结构

```
kindergarten_pg/
├── backend/              # 后端代码
│   ├── config/          # 配置文件
│   ├── middleware/      # 中间件
│   ├── routes/          # API路由
│   ├── uploads/         # 上传文件目录
│   └── server.js        # 服务器入口
├── frontend/            # 前端代码
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── views/       # 页面
│   │   ├── router/      # 路由
│   │   └── store/       # 状态管理
│   └── public/          # 静态资源
├── database/            # 数据库相关
│   ├── schema.sql       # 数据库结构
│   └── init_data.sql    # 初始数据
└── README.md
```

## API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### 照片接口
- `GET /api/photos/public` - 获取公共照片
- `GET /api/photos/private` - 获取私人照片
- `POST /api/photos` - 上传照片
- `POST /api/photos/like` - 点赞照片

### 用户管理
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息

### 班级管理
- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级
- `PUT /api/classes/:id` - 更新班级
- `DELETE /api/classes/:id` - 删除班级

## 功能说明

### 用户角色
1. **教师**：
   - 上传班级照片
   - 管理班级信息
   - 查看所有照片
   - 用户管理

2. **家长**：
   - 查看公共照片墙
   - 查看自己孩子的照片
   - 点赞和评论
   - 下载照片

### 人脸识别
- 使用模拟人脸识别算法
- 自动标记照片中的儿童
- 生成识别置信度
- 支持多人识别

### 权限控制
- JWT Token认证
- 基于角色的访问控制
- 路由守卫保护
- API接口权限验证

## 部署说明

### 开发环境
```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
npm run serve
```

### 生产环境
```bash
# 前端构建
cd frontend
npm run build

# 后端启动
cd backend
npm start
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您遇到问题或有建议，请：
1. 查看 [Issues](../../issues)
2. 创建新的 Issue
3. 联系项目维护者

---

**版本**: 1.0.0  
**最后更新**: 2025年7月9日 

### 最新修复日志

#### 2025-01-09 - 家长-孩子关联管理功能修复

**问题描述：**
- 教师端用户管理页面中，管理家长和孩子关联时出现404错误
- 前端发送 `PUT /users/:id/children` 请求，但后端缺少对应路由

**修复内容：**
1. **后端路由添加**：在 `routes/users.js` 中添加了 `PUT /users/:id/children` 路由
2. **批量关联处理**：支持批量更新家长和孩子的关联关系
3. **事务处理**：使用数据库事务确保数据一致性
4. **数据验证**：验证家长和孩子是否存在，确保数据完整性
5. **错误处理**：添加详细的错误日志和用户友好的错误提示

**功能特点：**
- 支持一次性更新一个家长关联的所有孩子
- 先删除现有关联，再添加新关联，确保数据准确
- 使用事务处理，发生错误时自动回滚
- 权限控制：只有教师可以管理家长-孩子关联

**使用方法：**
1. 教师登录后进入用户管理页面
2. 点击家长列表中的"管理孩子"按钮
3. 在弹出的对话框中选择要关联的孩子
4. 点击"保存"按钮完成关联

**API端点：**
- `PUT /api/users/:id/children` - 批量更新家长和孩子的关联关系
- 请求体：`{ "children": [childId1, childId2, ...] }` 