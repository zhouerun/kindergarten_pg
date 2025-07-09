const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kindergarten_system'
};

async function fixPasswords() {
  try {
    // 生成123456的哈希值
    const password = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('生成的密码哈希值:', hashedPassword);
    
    // 连接数据库
    const connection = mysql.createConnection(dbConfig);
    
    // 更新所有用户的密码
    const updateQuery = `
      UPDATE users 
      SET password = ? 
      WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10')
    `;
    
    connection.query(updateQuery, [hashedPassword], (error, results) => {
      if (error) {
        console.error('❌ 更新密码失败:', error);
        return;
      }
      
      console.log('✅ 密码更新成功！影响行数:', results.affectedRows);
      console.log('📝 所有测试账号密码已更新为: 123456');
      console.log('🔑 测试账号：');
      console.log('   教师: teacher1/123456');
      console.log('   家长: parent1/123456');
      
      // 验证更新
      const verifyQuery = 'SELECT username, role, full_name FROM users WHERE username IN ("teacher1", "parent1")';
      connection.query(verifyQuery, (error, results) => {
        if (error) {
          console.error('❌ 验证查询失败:', error);
          return;
        }
        
        console.log('🔍 验证结果:');
        results.forEach(user => {
          console.log(`   ${user.username} (${user.role}): ${user.full_name}`);
        });
        
        connection.end();
      });
    });
    
  } catch (error) {
    console.error('❌ 生成密码哈希失败:', error);
  }
}

// 运行修复
fixPasswords(); 