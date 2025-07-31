const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './', // 使用相对路径，便于部署
  outputDir: 'dist',
  assetsDir: 'static',
  productionSourceMap: false, // 生产环境不生成source map
  devServer: {
    port: 25021,
    host: '0.0.0.0'
  }
}) 