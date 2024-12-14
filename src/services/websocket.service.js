import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from "@/config/api.config";
/**
 * WebSocket服务类
 * 用于管理WebSocket连接和消息处理
 */
class WebSocketService {
    /**
     * 构造函数
     * 初始化WebSocket客户端和消息处理器集合
     */
    constructor() {
        this.messageHandlers = new Set();
        this.stompClient = null;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.connect();
    }



    /**
     * 建立WebSocket连接
     * 配置STOMP客户端并激活连接
     */
    connect() {


        const socket = new SockJS(apiConfig.getWebSocketUrl());
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        // Handle connection establishment
        this.stompClient.onConnect = (frame) => {
            console.log('Connected to WebSocket:', frame);
            this.connectionAttempts = 0; // Reset connection attempts on successful connection
            this.subscribe();
        };

        // Handle connection loss
        this.stompClient.onWebSocketClose = () => {
            console.log('WebSocket connection closed');
            this.handleConnectionLoss();
        };

        // Handle STOMP errors
        this.stompClient.onStompError = (frame) => {
            console.error('STOMP error:', frame);
            this.handleConnectionLoss();
        };

        try {
            this.stompClient.activate();
        } catch (error) {
            console.error('Connection activation error:', error);
            this.handleConnectionLoss();
        }
    }

    subscribe() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe('/topic/messages', (message) => {
                try {
                    const messageData = JSON.parse(message.body);
                    console.log('Received message:', messageData);
                    
                    this.messageHandlers.forEach(handler => {
                        try {
                            handler(messageData);
                        } catch (error) {
                            console.error('Error in message handler:', error);
                        }
                    });
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
        }
    }

    handleConnectionLoss() {
        this.connectionAttempts++;
        
        if (this.connectionAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect... (Attempt ${this.connectionAttempts})`);
            setTimeout(() => {
                this.connect();
            }, Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000)); // Exponential backoff with max 30s
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
            // Optionally notify the user through UI
        }
    }

    // Add connection status check method
    isConnected() {
        return this.stompClient && this.stompClient.connected;
    }

    // Add method to manually trigger reconnection
    reconnect() {
        this.disconnect();
        this.connectionAttempts = 0;
        this.connect();
    }

    /**
     * 断开WebSocket连接
     */
    disconnect() {
        if (this.stompClient) {
            if (this.stompClient.connected) {
                this.stompClient.deactivate();
            }
            this.stompClient = null;
        }
        console.log('Disconnected from WebSocket');
    }

    /**
     * 添加消息处理器
     * @param {Function} handler - 消息处理函数
     */
    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
    }

    /**
     * 移除消息处理器
     * @param {Function} handler - 要移除的消息处理函数
     */
    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }

    sendMessageResponse(message, confirmed) {
        const response = {
            id: message.id,
            confirmed: confirmed
        };

        fetch(apiConfig.getMessage_ResponseUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response)
        }).then(() => {
            console.log('Response sent:', response);
        }).catch(err => {
            console.error('Error sending response:', err);
        });
    }
}

// 创建WebSocketService的单例实例
const webSocketService = new WebSocketService();

// Add window focus/blur listeners to handle tab visibility
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !webSocketService.isConnected()) {
        webSocketService.reconnect();
    }
});

// Add online/offline listeners
window.addEventListener('online', () => {
    if (!webSocketService.isConnected()) {
        webSocketService.reconnect();
    }
});

// Add window close listener
window.addEventListener('beforeunload', () => {
    webSocketService.disconnect();
});

export default webSocketService; 