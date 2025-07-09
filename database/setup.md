# 🗄️ 数据库配置指南

## 1. MySQL安装与启动

### Windows系统
1. 下载MySQL安装包：https://dev.mysql.com/downloads/mysql/
2. 安装时记住设置的root密码
3. 启动MySQL服务：
   ```cmd
   net start mysql
   ```

### macOS系统
```bash
# 使用Homebrew安装
brew install mysql
brew services start mysql
```

### Linux系统
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
```

## 2. 连接MySQL数据库

### 方法一：命令行连接
```bash
# 连接到MySQL
mysql -u root -p

# 输入密码后进入MySQL命令行
```

### 方法二：使用图形化工具
推荐使用以下工具之一：
- **MySQL Workbench**（官方工具）
- **Navicat**
- **phpMyAdmin**
- **DBeaver**

## 3. 创建项目数据库

### 在MySQL命令行中执行：
```sql
-- 创建数据库
CREATE DATABASE kindergarten_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 查看数据库
SHOW DATABASES;

-- 使用数据库
USE kindergarten_system;
```

### 或者直接导入schema.sql：
```bash
# 方法1：直接导入完整脚本
mysql -u root -p < database/schema.sql

# 方法2：先连接再导入
mysql -u root -p
mysql> source /path/to/database/schema.sql
```

## 4. 导入初始化数据

```bash
# 导入测试数据
mysql -u root -p < database/init_data.sql

# 或在MySQL命令行中
mysql> source /path/to/database/init_data.sql
```

## 5. 验证数据库创建

```sql
-- 查看所有表
USE kindergarten_system;
SHOW TABLES;

-- 查看用户表数据
SELECT * FROM users;

-- 查看班级表数据
SELECT * FROM classes;

-- 查看学生表数据
SELECT * FROM children;
```

## 6. 配置后端连接

### 创建.env文件
在 `backend` 目录下创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kindergarten_system

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

### 重要提醒
- 将 `your_mysql_password` 替换为您的MySQL root密码
- 如果MySQL运行在不同端口，请添加 `DB_PORT=3306`
- 如果使用不同的用户名，请修改 `DB_USER`

## 7. 测试数据库连接

启动后端服务测试连接：
```bash
cd backend
npm install
npm run dev
```

如果看到 "数据库连接成功" 消息，说明配置正确。

## 🔧 常见问题解决

### 问题1：Access denied for user 'root'
**解决方案：**
```sql
-- 重置MySQL root密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 问题2：Can't connect to MySQL server
**解决方案：**
1. 检查MySQL服务是否启动
2. 检查端口3306是否被占用
3. 检查防火墙设置

### 问题3：Database doesn't exist
**解决方案：**
```sql
-- 手动创建数据库
CREATE DATABASE kindergarten_system;
```

### 问题4：Authentication plugin 'caching_sha2_password'
**解决方案：**
```sql
-- 更改认证方式
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## 📊 数据库表结构说明

创建成功后，您将看到以下6个表：

1. **users** - 用户表（教师/家长）
2. **classes** - 班级表
3. **children** - 学生表
4. **photos** - 照片表
5. **parent_child** - 家长-孩子关联表
6. **likes** - 点赞记录表

## 🧪 测试数据说明

初始化数据包含：
- 2个班级：小一班、小二班
- 3名教师：张老师、李老师、王老师
- 20名学生：每班10名
- 10位家长：对应前10名学生
- 30张模拟照片：每班15张
- 若干点赞记录

所有用户的默认密码都是：`123456` 