const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',  // 允许通过局域网访问
    port: 8081,       // 保持与当前端口一致
    allowedHosts: 'all', // 允许所有主机访问
  },
})
