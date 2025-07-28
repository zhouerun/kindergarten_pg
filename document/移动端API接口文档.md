# 幼儿园管理系统 - 移动端API接口文档

## 基础信息

- **基础URL**: `http://your-server-domain:3000/api`
- **认证方式**: JWT Token (Bearer Token)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证相关

### 1. 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "string",     // 用户名
  "password": "string"      // 密码（至少6位）
}
```

**响应示例**:
```json
{
  "message": "登录成功",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "teacher001",
    "role": "teacher",
    "full_name": "张老师",
    "class_id": 1
  }
}
```

### 2. 用户注册

**接口地址**: `POST /auth/register`

**请求参数**:
```json
{
  "username": "string",           // 用户名（至少3位）
  "password": "string",           // 密码（至少6位）
  "role": "teacher|parent",       // 角色
  "full_name": "string",          // 姓名
  "telephone_number": "string",   // 手机号码
  "class_id": "number"            // 班级ID（可选）
}
```

**响应示例**:
```json
{
  "message": "注册成功",
  "user": {
    "id": 2,
    "username": "parent001",
    "role": "parent",
    "full_name": "李家长",
    "telephone_number": "13800138000",
    "class_id": null
  }
}
```

### 3. 修改密码

**接口地址**: `POST /auth/change-password`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "currentPassword": "string",  // 当前密码
  "newPassword": "string"       // 新密码（至少6位）
}
```

**响应示例**:
```json
{
  "message": "密码修改成功"
}
```

### 4. 刷新访问令牌

**接口地址**: `POST /auth/refresh`

**请求参数**:
```json
{
  "refreshToken": "string"  // 刷新令牌
}
```

**响应示例**:
```json
{
  "message": "令牌刷新成功",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "teacher001",
    "role": "teacher",
    "full_name": "张老师",
    "class_id": 1
  }
}
```

## 用户管理

### 1. 获取当前用户信息

**接口地址**: `GET /users/profile`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "id": 1,
  "username": "teacher001",
  "role": "teacher",
  "full_name": "张老师",
  "class_id": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "class": {
    "id": 1,
    "name": "小一班"
  }
}
```

### 2. 更新用户信息

**接口地址**: `PUT /users/profile`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "full_name": "string"  // 姓名
}
```

**响应示例**:
```json
{
  "message": "用户信息更新成功"
}
```

### 3. 获取所有用户（仅教师）

**接口地址**: `GET /users?role=teacher|parent`

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `role`: 可选，筛选特定角色用户

**响应示例**:
```json
[
  {
    "id": 1,
    "username": "teacher001",
    "role": "teacher",
    "full_name": "张老师",
    "class_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "class_name": "小一班"
  }
]
```

### 4. 获取所有家长（仅教师）

**接口地址**: `GET /users/parents`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
[
  {
    "id": 2,
    "username": "parent001",
    "full_name": "李家长",
    "class_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "class_name": "小一班",
    "children": [
      {
        "id": 1,
        "name": "小明",
        "class_name": "小一班"
      }
    ]
  }
]
```

### 5. 获取当前用户关联的孩子（家长专用）

**接口地址**: `GET /users/children`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "小明",
    "age": 5,
    "class_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "class_name": "小一班"
  }
]
```

### 6. 家长绑定孩子

**接口地址**: `POST /users/bind-child`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "studentNumber": "string"  // 学号
}
```

**响应示例**:
```json
{
  "message": "绑定成功",
  "child": {
    "id": 1,
    "name": "小明",
    "student_number": "2024001",
    "age": 5
  }
}
```

### 7. 家长解绑孩子

**接口地址**: `DELETE /users/bind-child`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "childId": "number"  // 孩子ID
}
```

**响应示例**:
```json
{
  "message": "解绑成功"
}
```

## 班级管理

### 1. 获取所有班级

**接口地址**: `GET /classes`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "小一班",
    "created_at": "2024-01-01T00:00:00.000Z",
    "teacher_name": "张老师",
    "student_count": 20
  }
]
```

### 2. 获取所有学生

**接口地址**: `GET /classes/students`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "小明",
    "student_number": "2024001",
    "age": 5,
    "class_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "class_name": "小一班"
  }
]
```

### 3. 添加学生（仅教师）

**接口地址**: `POST /classes/students`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string",           // 学生姓名
  "student_number": "string", // 学号
  "age": "number",            // 年龄
  "class_id": "number"        // 班级ID
}
```

**响应示例**:
```json
{
  "message": "学生添加成功",
  "child": {
    "id": 1,
    "name": "小明",
    "student_number": "2024001",
    "age": 5,
    "class_id": 1
  }
}
```

### 4. 更新学生信息（仅教师）

**接口地址**: `PUT /classes/students/{id}`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string",           // 学生姓名
  "student_number": "string", // 学号
  "age": "number",            // 年龄
  "class_id": "number"        // 班级ID
}
```

**响应示例**:
```json
{
  "message": "学生信息更新成功"
}
```

### 5. 删除学生（仅教师）

**接口地址**: `DELETE /classes/students/{id}`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "message": "学生删除成功"
}
```

### 6. 获取班级详情

**接口地址**: `GET /classes/{id}`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "id": 1,
  "name": "小一班",
  "created_at": "2024-01-01T00:00:00.000Z",
  "teacher_name": "张老师",
  "teacher_id": 1,
  "students": [
    {
      "id": 1,
      "name": "小明",
      "student_number": "2024001",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "photo_count": 50
}
```

### 7. 获取班级学生

**接口地址**: `GET /classes/{id}/children`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "小明",
    "student_number": "2024001",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 8. 创建班级（仅教师）

**接口地址**: `POST /classes`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string"  // 班级名称
}
```

**响应示例**:
```json
{
  "message": "班级创建成功",
  "class": {
    "id": 1,
    "name": "小一班",
    "teacher_id": 1
  }
}
```

### 9. 添加学生到班级（仅教师）

**接口地址**: `POST /classes/{id}/children`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string",           // 学生姓名
  "student_number": "string"  // 学号
}
```

**响应示例**:
```json
{
  "message": "学生添加成功",
  "child": {
    "id": 1,
    "name": "小明",
    "student_number": "2024001",
    "class_id": 1
  }
}
```

### 10. 删除班级学生（仅教师）

**接口地址**: `DELETE /classes/{id}/children/{childId}`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "message": "学生删除成功"
}
```

## 照片管理

### 1. 获取公共照片墙

**接口地址**: `GET /photos/public?page=1&limit=20`

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应示例**:
```json
{
  "photos": [
    {
      "id": 1,
      "path": "/uploads/photo1.jpg",
      "created_at": "2024-01-01T00:00:00.000Z",
      "activity": "户外活动",
      "uploader_name": "张老师",
      "class_name": "小一班",
      "recognition_data": "{\"child_ids\":[1,2]}",
      "like_count": 5,
      "children": [
        {
          "id": 1,
          "name": "小明"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 2. 照片点赞

**接口地址**: `POST /photos/like`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "photoId": "number"  // 照片ID
}
```

**响应示例**:
```json
{
  "message": "点赞成功",
  "liked": true
}
```

### 3. 获取照片集（家长专用）

**接口地址**: `GET /photos/albums?groupBy=month`

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `groupBy`: 分组方式（day/week/month，默认month）

**响应示例**:
```json
{
  "albums": [
    {
      "child": {
        "id": 1,
        "name": "小明",
        "class_name": "小一班"
      },
      "totalPhotos": 50,
      "timeGroups": [
        {
          "period": "2024-01",
          "formattedPeriod": "2024年1月",
          "photoCount": 20,
          "photos": [
            {
              "id": 1,
              "path": "/uploads/photo1.jpg",
              "created_at": "2024-01-01T00:00:00.000Z",
              "activity": "户外活动",
              "uploader_name": "张老师",
              "class_name": "小一班",
              "like_count": 5,
              "liked": true
            }
          ]
        }
      ]
    }
  ],
  "groupBy": "month"
}
```

### 4. 获取教师照片集（教师专用）

**接口地址**: `GET /photos/teacher-albums?groupBy=month`

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `groupBy`: 分组方式（day/week/month，默认month）

**响应示例**:
```json
{
  "albums": [
    {
      "class": {
        "id": 1,
        "name": "小一班",
        "student_count": 20
      },
      "totalPhotos": 100,
      "timeGroups": [
        {
          "period": "2024-01",
          "formattedPeriod": "2024年1月",
          "photoCount": 50,
          "photos": [
            {
              "id": 1,
              "path": "/uploads/photo1.jpg",
              "created_at": "2024-01-01T00:00:00.000Z",
              "activity": "户外活动",
              "uploader_name": "张老师",
              "recognition_data": "{\"child_ids\":[1,2]}",
              "like_count": 5,
              "children": [
                {
                  "id": 1,
                  "name": "小明"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "groupBy": "month"
}
```

### 5. 获取公共照片集（家长专用）

**接口地址**: `GET /photos/public-albums?groupBy=month`

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `groupBy`: 分组方式（day/week/month，默认month）

**响应示例**:
```json
{
  "albums": [
    {
      "class": {
        "id": 1,
        "name": "小一班",
        "student_count": 20,
        "isParentClass": true
      },
      "totalPhotos": 50,
      "activityGroups": [
        {
          "activity": "户外活动",
          "totalPhotos": 30,
          "timeGroups": [
            {
              "period": "2024-01",
              "formattedPeriod": "2024年1月",
              "photoCount": 20,
              "photos": [
                {
                  "id": 1,
                  "path": "/uploads/photo1.jpg",
                  "created_at": "2024-01-01T00:00:00.000Z",
                  "activity": "户外活动",
                  "uploader_name": "张老师",
                  "like_count": 5,
                  "liked": true
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "groupBy": "month"
}
```

## 人脸识别

### 1. 上传训练数据

**接口地址**: `POST /face-recognition/database/add_child`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string",           // 孩子姓名
  "images": ["string"],       // base64格式的图片数组
  "profile": {
    "age": "number",          // 年龄
    "student_id": "number",   // 学生ID
    "class_id": "number"      // 班级ID
  }
}
```

**响应示例**:
```json
{
  "message": "人脸识别训练数据已发送到训练服务",
  "success": true,
  "childInfo": {
    "id": 1,
    "name": "小明",
    "age": 5
  },
  "results": [
    {
      "filename": "image_1.jpg",
      "status": "sent_to_remote",
      "fileSize": 1024,
      "imageIndex": 1
    }
  ],
  "summary": {
    "totalUploaded": 1,
    "successCount": 1,
    "recommendation": {
      "status": "submitted",
      "message": "训练数据已提交到远端服务进行处理"
    }
  },
  "uploadedFiles": 1
}
```

### 2. 批量识别

**接口地址**: `POST /face-recognition/batch-recognize`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "image": "string",          // base64格式的图片
  "class_id": "number"        // 班级ID
}
```

**响应示例**:
```json
{
  "recognized_children": [
    {
      "name": "小明",
      "confidence": 0.95,
      "student_id": 1
    }
  ],
  "total_faces": 3,
  "recognition_time": 1.2
}
```

### 3. 健康检查

**接口地址**: `GET /face-recognition/health`

**响应示例**:
```json
{
  "status": "healthy",
  "dependencies": "installed",
  "remote_service": "connected",
  "remote_response": {
    "status": "ok"
  }
}
```

## 系统健康检查

### 1. 系统健康状态

**接口地址**: `GET /health`

**响应示例**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

## 常见错误响应

### 认证错误
```json
{
  "error": "访问令牌缺失"
}
```

### 权限错误
```json
{
  "error": "权限不足"
}
```

### 参数错误
```json
{
  "error": "用户名不能为空"
}
```

### 数据库错误
```json
{
  "error": "数据库连接暂时不可用，请稍后重试",
  "retryAfter": 5
}
```

## 移动端集成建议

### 1. Token管理
- 登录成功后保存 `accessToken` 和 `refreshToken`
- 在请求头中添加 `Authorization: Bearer {accessToken}`
- 当 `accessToken` 过期时，使用 `refreshToken` 刷新

### 2. 错误处理
- 401错误：重新登录
- 403错误：提示权限不足
- 500错误：提示服务器错误，稍后重试
- 503错误：提示服务维护中

### 3. 图片处理
- 上传图片前进行压缩
- 使用base64格式传输图片数据
- 注意图片大小限制

### 4. 网络请求
- 设置合理的超时时间
- 实现请求重试机制
- 添加网络状态检测

### 5. 数据缓存
- 缓存用户信息、班级列表等静态数据
- 实现离线模式支持
- 定期同步数据

## 安全注意事项

1. **Token安全**：不要在本地存储中明文保存token
2. **HTTPS**：生产环境必须使用HTTPS
3. **输入验证**：客户端也要进行基本的输入验证
4. **敏感信息**：不要在日志中记录敏感信息
5. **版本控制**：API版本更新时保持向后兼容

## 部署配置
