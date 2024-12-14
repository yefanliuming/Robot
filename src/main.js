import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import webSocketService from './services/websocket.service'

// 创建Vue应用实例
const app = createApp(App)

// 使用Vue路由
app.use(router)

/**
 * 在Vue应用挂载之前初始化WebSocket连接
 * 确保WebSocket服务在应用启动时就建立连接
 */
webSocketService.connect()

/**
 * 添加全局消息处理器
 * 用于在控制台输出所有接收到的WebSocket消息
 * 这对于调试和监控消息非常有用
 * @param {Object} message - 接收到的消息对象
 */
webSocketService.addMessageHandler((message) => {
    console.log('Received message:', message)
    
    // 这里可以添加全局的消息处理逻辑
    // 例如：错误处理、全局状态更新等
})

// 将Vue应用挂载到DOM元素上
app.mount('#app')

/**
 * 应用生命周期管理
 * 在应用关闭时清理WebSocket连接
 */
window.addEventListener('beforeunload', () => {
    webSocketService.disconnect()
})
