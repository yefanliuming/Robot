<template>
  <div class="main-content">
    <!-- 可见光视频区域 -->
    <div class="video-panel">
      <h3>可见光视频</h3>
      <div class="button-container">
        <button @click="startRgbStream">Start Rgb Stream</button>
        <button @click="killRgbProcess">Kill Rgb Process</button>
      </div>
      <div class="video-container">
        <div v-if="!rgbLoaded" class="loading-placeholder">
          <div class="loading-text">{{ rgbStatus }}</div>
        </div>
        <img
            v-show="rgbLoaded"
            :src="rgbVideoSrc"
            ref="rgbFrame"
            alt="RGB Video Stream"
            @error="handleImageError('rgb')"
            @load="handleImageLoad('rgb')"
            style="width: 100%; height: 100%; object-fit: contain;"
        >
      </div>
    </div>

    <!-- 热红外视频区域 -->
    <div class="video-panel">
      <h3>热红外视频</h3>
      <div class="button-container">
        <button @click="startIrStream">Start IR Stream</button>
        <button @click="killIrProcess">Kill IR Process</button>
      </div>
      <div class="video-container">
        <div v-if="!irLoaded" class="loading-placeholder">
          <div class="loading-text">{{ irStatus }}</div>
        </div>
        <img
            v-show="irLoaded"
            :src="irVideoSrc"
            ref="irFrame"
            alt="IR Video Stream"
            @error="handleImageError('ir')"
            @load="handleImageLoad('ir')"
            style="width: 100%; height: 100%; object-fit: contain;"
        >
      </div>
    </div>

    <!-- 地图区域 -->
    <div class="map-panel">
      <h3>地图</h3>
      <Map />
    </div>

    <!-- 实时控制区域 -->
    <div class="control-panel">
      <h3>实时控制</h3>
      <div class="control-buttons">
        <!-- 系统启动按钮，独立放置在顶部 -->
        <!--        <div class="system-btn-container">-->
        <!--          <button @click="startSystem" class="system-btn">启动系统</button>-->
        <!--        </div>-->

        <!-- 方向控制按钮组 -->
        <div class="direction-buttons">
          <!-- 上按钮 -->
          <div class="button-row top-row">
            <button @click="moveRobot('front')" class="direction-btn">↑</button>
          </div>
          <!-- 左右按钮 -->
          <div class="button-row middle-row">
            <button @click="moveRobot('left')" class="direction-btn">←</button>
            <button @click="moveRobot('stop')" class="direction-btn">停止</button>
            <button @click="moveRobot('right')" class="direction-btn">→</button>
          </div>
          <!-- 下按钮 -->
          <div class="button-row bottom-row">
            <button @click="moveRobot('back')" class="direction-btn">↓</button>
          </div>
        </div>
      </div>
    </div>


    <!-- Add this popup dialog -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-content">
        <p>{{ popupMessage }}</p>
        <div class="popup-buttons">
          <button @click="handleConfirm">确认</button>
          <button @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import * as http from "node:http";
import webSocketService from '@/services/websocket.service';
import Map from '@/components/map.vue';
import apiConfig from "@/config/api.config";

export default {
  components: {
    Map
  },
  // name: 'VideoStreams',
  // computed: {
  //   http() {
  //     return http
  //   }
  // },
  data() {
    return {
      rgbVideoSrc: apiConfig.getrgbVideoSrc(),
      irVideoSrc: apiConfig.getirVideoSrc(),
      baseUrl: apiConfig.getRobotUrl(),
      showPopup: false,
      popupMessage: '',
      currentMessageId: null,
      currentMessage: null,
      retryCount: {
        rgb: 0,
        ir: 0
      },
      maxRetries: 5,
      retryInterval: 2000,
      retryTimeouts: {
        rgb: null,
        ir: null
      },
      rgbLoaded: false,
      irLoaded: false,
      rgbStatus: 'Waiting for RGB stream...',
      irStatus: 'Waiting for IR stream...',
    }
  },
  mounted() {
    // Check for message when component mounts
    const message = localStorage.getItem('robotMessage');
    if (message) {
      alert(message);
      localStorage.removeItem('robotMessage'); // Clear the message after showing
    }

    // Add error handlers for both video streams
    this.$refs.irFrame.onerror = () => this.handleImageError('ir');
    this.$refs.rgbFrame.onerror = () => this.handleImageError('rgb');

    // 如果 WebSocket 未连接，重新连接
    if (!webSocketService.stompClient || !webSocketService.stompClient.connected) {
      webSocketService.connect();
    }

    // 添加消息处理器
    this.messageHandler = (message) => {
      console.log('Component received message:', message);
      // 确保消息包含必要的字段
      if (message && message.message) {
        this.showPopupDialog(message);
      }
    };
    webSocketService.addMessageHandler(this.messageHandler);
  },
  beforeUnmount() {
    // Clear all timeouts
    Object.values(this.retryTimeouts).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    if (this.messageHandler) {
      webSocketService.removeMessageHandler(this.messageHandler);
    }
  },
  methods: {
    async startRgbStream() {
      this.showToast('视觉模块启动中...', 11000);
      this.retryCount.rgb = 0; // Reset retry counter
      try {
        await fetch('/start_rgb');
        setTimeout(() => {
          this.rgbVideoSrc = `${this.baseUrl}:5001/video_feed_rgb?t=${Date.now()}`;
        }, 11000);
      } catch (error) {
        console.error('Error starting RGB stream:', error);
        this.rgbStatus = 'Failed to start RGB stream';
      }
    },

    async startIrStream() {
      this.showToast('红外模块启动中...', 5000);
      try {
        const response = await fetch('/start_ir');
        if (response.ok) {
          setTimeout(() => {
            this.irVideoSrc = `${this.baseUrl}:5001/video_feed_ir?t=${Date.now()}`;
            this.checkStreamAvailability('ir'); // Start checking availability
          }, 5000);
        } else {
          throw new Error('Failed to start IR stream');
        }
      } catch (error) {
        console.error('Error starting IR stream:', error);
        this.irStatus = 'Failed to start IR stream';
        this.irVideoSrc = '../static/img/vision_close.png';
      }
    },

    async killRgbProcess() {
      try {
        const response = await fetch('/kill_camera_process', {method: 'POST'});
        if (response.ok) {
          alert("视觉模块已停止！");
          this.rgbVideoSrc = "../static/img/vision_close.png";
        }
      } catch (error) {
        alert("Error: " + error);
      }
    },

    async killIrProcess() {
      try {
        const response = await fetch('/kill_ir_process', {method: 'POST'});
        if (response.ok) {
          console.log('IR process killed successfully');
          alert("红外模块已停止！");
          this.irVideoSrc = "../static/img/vision_close.png";
        } else {
          throw new Error('Failed to kill IR process');
        }
      } catch (error) {
        console.error('Error killing IR process:', error);
        alert("Error: " + error);
      }
    },

    showToast(message, duration) {
      const toast = document.createElement('div');
      toast.innerText = message;
      toast.className = 'toast-message';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), duration);
    },

    startSystem() {
      // 实现启动系统的逻辑
      console.log('Starting system...');

    },

    async moveRobot(direction) {
      try {
        const formData = {
          direction: direction
        };

        const response = await fetch(apiConfig.getreceiveMoveUrl(), {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Robot movement response:', data);

        if (response.ok && data.status === 'success') {
          // Show success popup
          // this.showPopupDialog({
          //   message: '移动成功',
          //   id: 'move-success'
          // });
          // alert('移动成功')
        } else {
          // Show error popup
          // this.showPopupDialog({
          //   message: `移动失败: ${data.message || '未知错误'}`,
          //   id: 'move-error'
          // });
          // alert(`移动失败: ${data.message || '未知错误'}`)
        }
      } catch (error) {
        console.error('Error moving robot:', error);
        // Show error popup for network/system errors
        // this.showPopupDialog({
        //   message: `系统错误: ${error.message}`,
        //   id: 'system-error'
        // });
        // alert(`系统错误: ${error.message}`)
      }
    },

    // Add a method to check if the IR stream is accessible
    async checkIrStream() {
      try {
        const response = await fetch(`${this.baseUrl}:5001/video_feed_ir`, {
          method: 'HEAD',
          timeout: 5000
        });
        return response.ok;
      } catch (error) {
        console.error('Error checking IR stream:', error);
        return false;
      }
    },

    checkStreamAvailability(type) {
      const url = type === 'rgb' ? this.rgbVideoSrc : this.irVideoSrc;
      this[`${type}Status`] = `Checking ${type.toUpperCase()} stream availability...`;
      
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // Reset retry count on successful connection
            this.retryCount[type] = 0;
            
            if (type === 'rgb') {
              this.rgbStatus = 'RGB stream available, loading...';
              this.rgbVideoSrc = `${this.baseUrl}:5001/video_feed_rgb?t=${Date.now()}`;
            } else {
              this.irStatus = 'IR stream available, loading...';
              this.irVideoSrc = `${this.baseUrl}:5001/video_feed_ir?t=${Date.now()}`;
            }
          } else {
            throw new Error(`${type.toUpperCase()} stream not available`);
          }
        })
        .catch((error) => {
          console.error(`${type.toUpperCase()} stream error:`, error);
          this[`${type}Loaded`] = false;
          this[`${type}Status`] = `${type.toUpperCase()} stream not available. Retrying... (${this.retryCount[type]}/${this.maxRetries})`;

          if (this.retryCount[type] < this.maxRetries) {
            this.retryCount[type]++;
            // Clear existing timeout
            if (this.retryTimeouts[type]) {
              clearTimeout(this.retryTimeouts[type]);
            }
            // Set new timeout
            this.retryTimeouts[type] = setTimeout(() => {
              this.checkStreamAvailability(type);
            }, this.retryInterval);
          } else {
            this[`${type}Status`] = `${type.toUpperCase()} stream connection failed after ${this.maxRetries} attempts`;
            this[`${type}VideoSrc`] = '../static/img/vision_close.png';
            
            // Reset retry count after a longer delay and try again
            setTimeout(() => {
              this.retryCount[type] = 0;
              this.checkStreamAvailability(type);
            }, this.retryInterval * 2);
          }
        });
    },

    handleImageLoad(type) {
      this[`${type}Loaded`] = true;
      this.retryCount[type] = 0;
      this[`${type}Status`] = `${type.toUpperCase()} stream loaded successfully`;
      console.log(`${type.toUpperCase()} stream loaded successfully`);
      
      // Start periodic health check
      this.startHealthCheck(type);
    },

    startHealthCheck(type) {
      // Clear any existing health check
      if (this.retryTimeouts[type]) {
        clearTimeout(this.retryTimeouts[type]);
      }
      
      // Set up periodic health check
      this.retryTimeouts[type] = setInterval(() => {
        if (this[`${type}Loaded`]) {
          this.checkStreamHealth(type);
        }
      }, 5000); // Check every 5 seconds
    },

    checkStreamHealth(type) {
      const url = type === 'rgb' ? this.rgbVideoSrc : this.irVideoSrc;
      
      fetch(url, { method: 'HEAD' })
        .catch(() => {
          console.log(`${type.toUpperCase()} stream health check failed, attempting to reconnect`);
          this[`${type}Loaded`] = false;
          this.checkStreamAvailability(type);
        });
    },

    handleImageError(type) {
      console.error(`Failed to load ${type} stream`);
      this[`${type}Loaded`] = false;
      this[`${type}Status`] = `Error loading ${type.toUpperCase()} stream. Retrying...`;
      
      if (this.retryCount[type] < this.maxRetries) {
        this.checkStreamAvailability(type);
      } else {
        this[`${type}VideoSrc`] = '../static/img/vision_close.png';
        this[`${type}Status`] = 'Max retry attempts reached';
        
        // Reset and try again after delay
        setTimeout(() => {
          this.retryCount[type] = 0;
          this.checkStreamAvailability(type);
        }, this.retryInterval * 2);
      }
    },

    showPopupDialog(messageData) {
      this.$nextTick(() => {
        this.popupMessage = messageData.message;
        this.currentMessageId = messageData.id;
        this.currentMessage = messageData;
        this.showPopup = true;
        console.log('Popup shown:', this.showPopup, 'Message:', this.popupMessage);
      });
    },

    handleConfirm() {
      console.log('Confirm clicked');
      if (this.currentMessage && this.currentMessage.message === '任务完成！') {
        webSocketService.sendMessageResponse(this.currentMessage, true);
        // this.$router.push('/'); // Navigate to home page
        this.$router.push('/op');
      }
      else if(this.currentMessage && this.currentMessage.message === '本轮操作成功!'){
        webSocketService.sendMessageResponse(this.currentMessage, true);
        setTimeout(() => {
          window.location.reload();
        }, 8000);
      }
      else if (this.currentMessage && this.currentMessage.id) {
        webSocketService.sendMessageResponse(this.currentMessage, true);
        console.log('Sent confirmation response for message:', this.currentMessage.id);
      }
      this.showPopup = false;
      this.currentMessage = null;
    },

    handleCancel() {
      console.log('Cancel clicked');
      if (this.currentMessage && this.currentMessage.id) {
        webSocketService.sendMessageResponse(this.currentMessage, false);
        console.log('Sent cancellation response for message:', this.currentMessage.id);
      }
      this.showPopup = false;
      this.currentMessage = null;
    }
  }
}
</script>

<style scoped>
.main-content {
  display: flex;
  padding: 20px;
  gap: 20px;
  background-color: #f5f6fa;
  flex-wrap: wrap;
}

.video-panel {
  flex: 1;
  min-width: 300px;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.video-panel h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  text-align: center;
}

.button-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.button-container button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}

.video-container {
  flex: 1;
  min-height: 0;
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  overflow: hidden;
  background-color: #f5f6fa;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
}

.video-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: transparent;
}

.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
}

.control-panel {
  flex: 1;
  min-width: 300px;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.control-panel h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  text-align: center;
}

.control-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px; /* 增加系统按钮和方向按钮之间的间距 */
}

.system-btn-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.system-btn {
  width: 150px;
  height: 50px;
  font-size: 16px;
  background-color: white;
  color: black;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.system-btn:hover {
  background-color: #f5f5f5;
  transform: scale(1.05);
}

.system-btn:active {
  transform: scale(0.95);
}

.direction-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.button-row {
  display: flex;
  gap: 20px; /* 增加左右按钮之间的间距 */
  justify-content: center;
}

.direction-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  background-color: white;
  color: black;
  border: 1px solid #bdc3c7;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.direction-btn:hover {
  background-color: #f5f5f5;
  transform: scale(1.1);
}

.direction-btn:active {
  transform: scale(0.95);
}

.top-row, .bottom-row {
  margin: 10px 0;
}

.middle-row {
  gap: 120px; /* 增加左右按钮之间的间距 */
}

.map-panel {
  flex: 1;
  min-width: 300px;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .video-panel,
  .control-panel {
    width: 100%;
  }

  .control-buttons {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .video-container {
    padding-bottom: 75%;
  }

  .control-panel {
    padding: 15px;
  }

  .system-btn {
    width: 120px;
    height: 45px;
    font-size: 14px;
  }

  .direction-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .middle-row {
    gap: 30px;
  }
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  width: 100vw;
  height: 100vh;
  position: fixed;
  touch-action: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: opacity;
}

.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
  margin: auto;
  position: relative;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: transform;
}

.popup-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.popup-buttons button {
  min-width: 80px;
  min-height: 44px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #ecf0f1;
  transition: background-color 0.3s;
  -webkit-user-select: none;
  user-select: none;
}

.popup-buttons button:hover {
  background-color: #bdc3c7;
}

@media (max-width: 768px) {
  .popup-content {
    width: 85%;
    margin: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .popup-buttons {
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 0;
  }

  .popup-buttons button {
    flex: 1;
    margin: 0 5px;
    font-size: 16px;
  }
}

/* Add touch-specific styles */
@media (hover: none) and (pointer: coarse) {
  .popup-overlay {
    position: fixed !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .popup-content {
    transform: none !important;
    -webkit-transform: none !important;
  }

  .popup-buttons button {
    padding: 12px 20px;
    margin: 5px;
    min-height: 48px;
  }
}

/* Add these new styles */
.loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.loading-text {
  font-size: 1.2em;
  color: #666;
}
</style>