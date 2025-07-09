const { pool } = require('./config/database');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 创建数据库
    await pool.execute('CREATE DATABASE IF NOT EXISTS kindergarten_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await pool.execute('USE kindergarten_system');
    
    // 创建班级表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        teacher_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role ENUM('teacher', 'parent') NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        child_id INT DEFAULT NULL,
        class_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建孩子档案表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS children (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        class_id INT NOT NULL,
        features JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);
    
    // 创建照片表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        path VARCHAR(255) NOT NULL,
        uploader_id INT NOT NULL,
        class_id INT NOT NULL,
        is_public BOOLEAN DEFAULT true,
        recognition_data JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);
    
    // 创建家长-孩子关联表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS parent_child (
        parent_id INT NOT NULL,
        child_id INT NOT NULL,
        PRIMARY KEY (parent_id, child_id),
        FOREIGN KEY (parent_id) REFERENCES users(id),
        FOREIGN KEY (child_id) REFERENCES children(id)
      )
    `);
    
    // 创建点赞记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id INT NOT NULL,
        photo_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, photo_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (photo_id) REFERENCES photos(id)
      )
    `);
    
    // 插入一些测试数据
    const [existingClasses] = await pool.execute('SELECT COUNT(*) as count FROM classes');
    if (existingClasses[0].count === 0) {
      console.log('插入测试数据...');
      
      // 插入班级
      await pool.execute("INSERT INTO classes (name) VALUES ('大班A'), ('中班B'), ('小班C')");
      
      // 插入用户（使用简单密码用于测试）
      await pool.execute(`
        INSERT INTO users (username, password, role, full_name, class_id) VALUES 
        ('teacher1', '$2b$10$rKo7LcEQXgJ.4RK8KZpPROyTQfGaOmVuYHZfVy/9H.SgJBBH3lMHG', 'teacher', '张老师', 1),
        ('parent1', '$2b$10$rKo7LcEQXgJ.4RK8KZpPROyTQfGaOmVuYHZfVy/9H.SgJBBH3lMHG', 'parent', '李家长', NULL)
      `);
      
      // 插入孩子
      await pool.execute(`
        INSERT INTO children (name, class_id) VALUES 
        ('小明', 1),
        ('小红', 1),
        ('小刚', 2)
      `);
      
      // 插入家长-孩子关联
      await pool.execute(`
        INSERT INTO parent_child (parent_id, child_id) VALUES 
        (2, 1)
      `);
      
      console.log('测试数据插入完成');
    }
    
    console.log('数据库初始化完成!');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('数据库初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = initDatabase; 