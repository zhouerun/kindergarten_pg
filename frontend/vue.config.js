const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发服务器配置
  devServer: {
    port: 8080,
    host: '0.0.0.0', // 允许外部IP访问
    open: true,
    // 完全禁用WebSocket和热重载
    webSocketServer: false,
    hot: false,
    liveReload: false,
    client: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    },
    // 允许外部访问
    allowedHosts: 'all',
    // 禁用主机检查
    historyApiFallback: true,
    // 添加CORS头
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  
  // 生产环境配置
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  
  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false,
    loaderOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  },
  
  // 打包优化
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          elementUI: {
            name: 'chunk-elementplus',
            priority: 20,
            test: /[\\/]node_modules[\\/]_?element-plus(.*)/
          }
        }
      }
    }
  },
  
  // Vue 3 特性标志配置
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0] = {
        ...args[0],
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_TIPS__: false
      };
      return args;
    });
  },
  
  // PWA配置
  pwa: {
    name: '幼儿园家校沟通系统',
    themeColor: '#409EFF',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'public/sw.js',
    }
  }
}); 