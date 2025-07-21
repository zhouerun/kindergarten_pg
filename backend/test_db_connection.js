const { executeWithRetry, testConnection, startHealthCheck } = require('./config/database');

async function testDatabaseStability() {
  console.log('=== 数据库连接稳定性测试开始 ===');
  
  // 测试初始连接
  const initialTest = await testConnection();
  if (!initialTest) {
    console.error('初始连接测试失败');
    return;
  }
  
  console.log('初始连接测试成功');
  
  // 启动健康检查
  startHealthCheck();
  
  // 模拟连续查询测试
  console.log('开始连续查询测试...');
  
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`执行第 ${i} 次查询...`);
      
      // 测试不同类型的查询
      const users = await executeWithRetry('SELECT COUNT(*) as count FROM users');
      console.log(`用户数量: ${users[0].count}`);
      
      const photos = await executeWithRetry('SELECT COUNT(*) as count FROM photos');
      console.log(`照片数量: ${photos[0].count}`);
      
      const classes = await executeWithRetry('SELECT COUNT(*) as count FROM classes');
      console.log(`班级数量: ${classes[0].count}`);
      
      // 模拟一些延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`第 ${i} 次查询失败:`, error.message);
    }
  }
  
  console.log('=== 数据库连接稳定性测试完成 ===');
}

// 运行测试
testDatabaseStability().catch(console.error); 