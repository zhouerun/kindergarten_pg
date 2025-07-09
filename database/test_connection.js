// 数据库连接测试脚本
try {
    var mysql = require('mysql2');
    var dotenv = require('dotenv');
} catch (error) {
    console.error('❌ 缺少必要的依赖包');
    console.log('💡 请先运行以下命令安装依赖：');
    console.log('   cd backend && npm install');
    process.exit(1);
}

const fs = require('fs');
const path = require('path');

// 检查环境变量文件
const envPath = path.join(__dirname, '../backend/.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ 未找到 .env 配置文件');
    console.log('💡 请先运行 quick_start.cmd 或手动创建 backend/.env 文件');
    console.log('💡 或者复制 backend/config/env.template 到 backend/.env');
    process.exit(1);
}

// 加载环境变量
dotenv.config({ path: envPath });

// 数据库连接配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kindergarten_system',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
};

console.log('🔍 数据库连接测试');
console.log('==================');
console.log(`主机: ${dbConfig.host}:${dbConfig.port}`);
console.log(`用户: ${dbConfig.user}`);
console.log(`数据库: ${dbConfig.database}`);
console.log('==================');

// 创建连接
const connection = mysql.createConnection(dbConfig);

// 测试连接
connection.connect((err) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        console.log('\n🛠️  常见问题解决方案:');
        console.log('1. 检查MySQL服务是否启动');
        console.log('2. 检查用户名和密码是否正确');
        console.log('3. 检查数据库是否存在');
        console.log('4. 检查网络连接');
        process.exit(1);
    }

    console.log('✅ 数据库连接成功!');
    
    // 测试数据库表
    const testQueries = [
        'SHOW TABLES',
        'SELECT COUNT(*) as user_count FROM users',
        'SELECT COUNT(*) as class_count FROM classes',
        'SELECT COUNT(*) as student_count FROM children',
        'SELECT COUNT(*) as photo_count FROM photos'
    ];

    let queryIndex = 0;
    
    function runNextQuery() {
        if (queryIndex >= testQueries.length) {
            console.log('\n🎉 所有测试通过！数据库配置正确！');
            connection.end();
            return;
        }

        const query = testQueries[queryIndex];
        queryIndex++;

        connection.query(query, (err, results) => {
            if (err) {
                console.error(`❌ 查询失败: ${query}`);
                console.error('   错误:', err.message);
                connection.end();
                return;
            }

            if (query === 'SHOW TABLES') {
                console.log(`✅ 数据库表: ${results.length} 个表`);
                const tables = results.map(row => Object.values(row)[0]).join(', ');
                console.log(`   表名: ${tables}`);
            } else {
                const result = results[0];
                const key = Object.keys(result)[0];
                const value = result[key];
                console.log(`✅ ${key}: ${value}`);
            }

            runNextQuery();
        });
    }

    runNextQuery();
});

// 处理连接错误
connection.on('error', (err) => {
    console.error('❌ 连接错误:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 尝试重新连接...');
    } else {
        throw err;
    }
}); 