// 简单的密码哈希生成工具
const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = '123456';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('=================================');
    console.log('密码哈希生成工具');
    console.log('=================================');
    console.log(`原始密码: ${password}`);
    console.log(`生成的哈希: ${hash}`);
    console.log('=================================');
    console.log('');
    console.log('请复制以下SQL命令并在MySQL中执行:');
    console.log('');
    console.log('USE kindergarten_system;');
    console.log(`UPDATE users SET password = '${hash}' WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10');`);
    console.log('SELECT "密码更新完成!" as result;');
    console.log('');
    console.log('=================================');
    
    // 验证生成的哈希
    const isValid = await bcrypt.compare(password, hash);
    console.log(`验证结果: ${isValid ? '✅ 正确' : '❌ 错误'}`);
    console.log('=================================');
    
  } catch (error) {
    console.error('生成密码哈希失败:', error);
  }
}

generatePasswordHash(); 