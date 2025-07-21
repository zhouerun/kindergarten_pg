const fs = require('fs');
const path = require('path');

console.log('🔍 幼儿园照片管理系统 - 配置检查');
console.log('=====================================');
console.log();

// 检查当前目录
const currentDir = process.cwd();
console.log(`📁 当前目录: ${currentDir}`);

// 检查是否在backend目录
const isInBackend = currentDir.includes('backend') || fs.existsSync('./routes');
if (!isInBackend) {
    console.log('⚠️  警告: 请在 kindergarten_pg/backend 目录下运行此脚本');
    console.log('正确命令: cd kindergarten_pg/backend && node ../check_config.js');
    process.exit(1);
}

console.log('✅ 在正确的目录下');
console.log();

// 检查 .env 文件
const envPath = './.env';
const envTemplatePath = './config/env.template';

console.log('📄 检查环境配置文件:');

if (fs.existsSync(envPath)) {
    console.log('✅ .env 文件存在');
    
    // 读取 .env 文件内容
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log();
        console.log('📋 .env 文件内容 (REMOTE_TRAINING_API):');
        
        const lines = envContent.split('\n');
        const remoteApiLine = lines.find(line => line.startsWith('REMOTE_TRAINING_API='));
        
        if (remoteApiLine) {
            console.log(`   ${remoteApiLine}`);
            
            if (remoteApiLine.includes('192.168.5.25:5000')) {
                console.log('✅ 远端API地址配置正确');
            } else {
                console.log('❌ 远端API地址配置错误');
                console.log('   应该是: REMOTE_TRAINING_API=http://192.168.5.25:5000/database/add_child');
            }
        } else {
            console.log('❌ 未找到 REMOTE_TRAINING_API 配置');
        }
    } catch (error) {
        console.log(`❌ 读取 .env 文件失败: ${error.message}`);
    }
} else {
    console.log('❌ .env 文件不存在');
    
    if (fs.existsSync(envTemplatePath)) {
        console.log('💡 正在创建 .env 文件...');
        try {
            fs.copyFileSync(envTemplatePath, envPath);
            console.log('✅ .env 文件已创建');
        } catch (error) {
            console.log(`❌ 创建 .env 文件失败: ${error.message}`);
        }
    } else {
        console.log('❌ config/env.template 文件也不存在');
    }
}

console.log();

// 加载环境变量
require('dotenv').config();

console.log('🔧 检查环境变量:');
console.log(`   REMOTE_TRAINING_API: ${process.env.REMOTE_TRAINING_API || '未设置'}`);
console.log(`   REMOTE_API_TIMEOUT: ${process.env.REMOTE_API_TIMEOUT || '未设置'}`);
console.log(`   REMOTE_API_MAX_RETRIES: ${process.env.REMOTE_API_MAX_RETRIES || '未设置'}`);

const expectedApi = 'http://192.168.5.25:5000/database/add_child';
if (process.env.REMOTE_TRAINING_API === expectedApi) {
    console.log('✅ 环境变量配置正确');
} else {
    console.log('❌ 环境变量配置错误或未生效');
    console.log(`   期望值: ${expectedApi}`);
    console.log(`   实际值: ${process.env.REMOTE_TRAINING_API || '未设置'}`);
}

console.log();

// 检查网络连接
console.log('🌐 检查网络连接:');

const axios = require('axios').catch(() => {
    console.log('❌ axios 依赖未安装，跳过网络检查');
    console.log('   请运行: npm install axios');
    return null;
});

if (axios) {
    axios.then(axiosLib => {
        // 检查远端服务器连接
        console.log('🔗 测试远端服务器连接...');
        return axiosLib.get('http://192.168.5.25:5000/health', { timeout: 5000 });
    }).then(response => {
        console.log('✅ 远端服务器连接正常');
        console.log(`   状态码: ${response.status}`);
    }).catch(error => {
        console.log('❌ 远端服务器连接失败');
        console.log(`   错误: ${error.message}`);
        console.log('   可能原因:');
        console.log('   1. 远端服务器未运行');
        console.log('   2. 网络连接问题');
        console.log('   3. 防火墙阻止访问');
        console.log('   4. IP地址或端口错误');
    }).finally(() => {
        printSummary();
    });
} else {
    printSummary();
}

function printSummary() {
    console.log();
    console.log('📋 配置摘要:');
    console.log('=====================================');
    console.log('1. 远端API地址: http://192.168.5.25:5000/database/add_child');
    console.log('2. 代码默认值已更新');
    console.log('3. 请确保 .env 文件配置正确');
    console.log('4. 重启后端服务以加载新配置');
    console.log();
    console.log('🚀 重启命令:');
    console.log('   npm restart');
    console.log('   或者: 先按 Ctrl+C 停止服务，然后 npm start');
    console.log();
} 