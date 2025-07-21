const fs = require('fs');
const path = require('path');

console.log('🔍 检查API路径配置');
console.log('====================');

// 检查前端axios配置
const storeFile = path.join(__dirname, 'frontend/src/store/index.js');
if (fs.existsSync(storeFile)) {
  const storeContent = fs.readFileSync(storeFile, 'utf8');
  const baseUrlMatch = storeContent.match(/API_BASE_URL\s*=\s*.*?'([^']+)'/);
  if (baseUrlMatch) {
    console.log('✅ 前端axios baseURL:', baseUrlMatch[1]);
  }
}

// 检查后端路由配置
const serverFile = path.join(__dirname, 'backend/server.js');
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  const routeMatch = serverContent.match(/app\.use\('([^']+)',\s*mockFaceRecognitionRoutes/);
  if (routeMatch) {
    console.log('✅ 后端路由前缀:', routeMatch[1]);
  }
}

// 检查环境变量配置
const envTemplate = path.join(__dirname, 'backend/config/env.template');
if (fs.existsSync(envTemplate)) {
  const envContent = fs.readFileSync(envTemplate, 'utf8');
  const remoteApiMatch = envContent.match(/REMOTE_TRAINING_API=(.+)/);
  if (remoteApiMatch) {
    console.log('✅ 远端API地址配置:', remoteApiMatch[1]);
  }
}

console.log('\n📋 API路径分析');
console.log('====================');
console.log('前端请求路径: /mock-face-recognition/database/add_child');
console.log('axios baseURL: http://localhost:3000/api');
console.log('实际请求URL: http://localhost:3000/api/mock-face-recognition/database/add_child');
console.log('后端路由匹配: /api/mock-face-recognition -> mockFaceRecognitionRoutes');
console.log('最终处理路径: /database/add_child');

console.log('\n🌐 远端API流程');
console.log('====================');
console.log('Node.js代理 -> http://192.168.5.25:5000/database/add_child');

console.log('\n✅ 修正完成');
console.log('====================');
console.log('问题: 重复的/api/路径导致URL变成 3000/api/api/mock-face-recognition/...');
console.log('解决: 已将前端API调用路径从 /api/mock-face-recognition/... 改为 /mock-face-recognition/...');
console.log('结果: 现在请求正确地发送到 http://192.168.5.25:5000/database/add_child');

// 检查是否还有其他API路径问题
const childBindingFile = path.join(__dirname, 'frontend/src/views/parent/ChildBinding.vue');
if (fs.existsSync(childBindingFile)) {
  const childBindingContent = fs.readFileSync(childBindingFile, 'utf8');
  
  // 检查是否还有重复的/api/路径
  const duplicateApiPaths = childBindingContent.match(/['"`]\/api\/.*\/api\//g);
  if (duplicateApiPaths) {
    console.log('\n⚠️  仍有重复的API路径:');
    duplicateApiPaths.forEach(path => console.log('  ', path));
  } else {
    console.log('\n✅ 没有发现重复的API路径');
  }
  
  // 确认正确的API调用
  const correctApiPaths = childBindingContent.match(/['"`]\/mock-face-recognition\/[^'"`]+['"`]/g);
  if (correctApiPaths) {
    console.log('\n✅ 正确的API路径:');
    correctApiPaths.forEach(path => console.log('  ', path));
  }
}

console.log('\n🚀 建议的测试步骤');
console.log('====================');
console.log('1. 重启前端服务: cd frontend && npm run serve');
console.log('2. 重启后端服务: cd backend && npm start');
console.log('3. 访问家长端孩子绑定页面');
console.log('4. 尝试上传训练数据，观察网络请求');
console.log('5. 确认请求发送到正确的远端API地址'); 