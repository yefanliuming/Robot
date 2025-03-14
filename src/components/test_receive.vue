<template>
  <div class="main-content">

    <!-- 电池电量区域 -->
    <Battery :robotId="robotId" />

    <!-- 可见光视频区域 -->
    <div class="video-panel">
      <h3>可见光视频</h3>
      <div class="button-container">
        <button @click="startRgbStream">开启</button>
        <button @click="killRgbProcess">关闭</button>
      </div>
      <div class="video-container">
        <img
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
    <div class="video-panel" v-if="showIrPanel">
      <h3>红外热成像</h3>
      <div class="button-container">
        <button @click="startIrStream">开启</button>
        <button @click="killIrProcess">关闭</button>
      </div>
      <div class="video-container">
        <img
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
      <Map :robotId="robotId" />
    </div>

    <!-- 实时控制区域 -->
    <div class="control-panel">
      <h3>实时控制</h3>

      <!-- Add speed control dropdown -->
      <div class="speed-control">
        <label for="speed-select">速度档位：</label>
        <select id="speed-select" v-model="moveSpeed" class="speed-select">
          <option value="1">1档</option>
          <option value="2">2档</option>
          <option value="3">3档</option>
        </select>
      </div>

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
            <!--            <button @click="moveRobot('left')" class="direction-btn">←</button>-->
            <button @click="moveRobot('left')" class="direction-btn">
              <img src="@/assets/left.svg" alt="Left" style="width: 20px; height: 20px;">
            </button>
            <button @click="moveRobot('stop')" class="direction-btn">停止</button>
            <!--            <button @click="moveRobot('right')" class="direction-btn">→</button>-->
            <button @click="moveRobot('right')" class="direction-btn">
              <img src="@/assets/right.svg" alt="Right" style="width: 20px; height: 20px;">
            </button>
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
import Battery from "@/components/battery.vue";

export default {
  components: {
    Map,
    Battery
  },
  data() {
    return {

      // rgbVideoSrc: apiConfig.getrgbVideoSrc(),
      // irVideoSrc: apiConfig.getirVideoSrc(),
      rgbVideoSrc: require("@/assets/no.png"),
      irVideoSrc: require("@/assets/no.png"),
      baseUrl: apiConfig.getRobotUrl(),
      showPopup: false,
      popupMessage: '',
      currentMessageId: null,
      currentMessage: null,
      rgbRetryCount: 0,
      irRetryCount: 0,
      maxRetries: 5,
      retryInterval: 3000, // 2 seconds
      moveSpeed: "2", // Default speed setting

      showIrPanel: false,
      showIrVideo: false,

      robotId: this.$route.query.robotId,
    }
  },

  created() {
    // 在组件创建时检查路由参数
    
    this.showIrPanel = this.robotId === 'R001';
    
  },

  computed: {

  },
  mounted() {

    // 确保在元素挂载后再进行操作
    this.$nextTick(() => {
      if (this.$refs.irFrame) {
        this.setupVideoStream();
      }
    });

    // Check for message when component mounts
    const message = localStorage.getItem('robotMessage');
    if (message) {
      alert(message);
      localStorage.removeItem('robotMessage'); // Clear the message after showing
    }

    // Add error handlers for both video streams
    if( this.showIrPanel){
      this.$refs.irFrame.onerror = () => this.handleImageError('ir');
    }

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
    // 移除消息处理器
    if (this.messageHandler) {
      webSocketService.removeMessageHandler(this.messageHandler);
    }
  },
  methods: {

    setupVideoStream() {
      // 只有当元素存在时才设置属性
      if (this.$refs.irFrame) {
        this.showIrVideo = true;
        // 其他视频流设置逻辑...
      }
    },

    async startRgbStream() {
      // this.showToast('视觉模块启动中...', 11000);
      // this.rgbRetryCount = 0; // Reset retry counter
      // try {
      //   await fetch('/start_rgb');
      //   setTimeout(() => {
      //     this.rgbVideoSrc = `${this.baseUrl}:5001/video_feed_rgb?t=${Date.now()}`;
      //   }, 11000);
      // } catch (error) {
      //   console.error('Error starting RGB stream:', error);
      // }
      this.rgbStreamActive = true;
      this.rgbAutoReload = true;
      if(this.robotId === 'R001'){
        this.rgbVideoSrc = apiConfig.getrgbVideoSrc();
      }
      else if(this.robotId === 'R002'){
        this.rgbVideoSrc = apiConfig.getrgbVideoSrc2();
      }

      // this.rgbVideoSrc = apiConfig.getrgbVideoSrc()
      console.log('RGB video source updated to:', apiConfig.getrgbVideoSrc());
    },

    async startIrStream() {
      
      this.showIrVideo = true;

      this.irStreamActive = true;
      this.irAutoReload = true;
      this.irVideoSrc = apiConfig.getirVideoSrc();
      console.log('IR video source updated to:', apiConfig.getirVideoSrc());
    },

    async killRgbProcess() {
      // try {
      //   const response = await fetch('/kill_camera_process', {method: 'POST'});
      //   if (response.ok) {
      //     alert("视觉模块已停止！");
      //     this.rgbVideoSrc = "../static/img/vision_close.png";
      //   }
      // } catch (error) {
      //   alert("Error: " + error);
      // }
      this.rgbStreamActive = false;
      this.rgbAutoReload = false;
      this.rgbVideoSrc = require("@/assets/no.png");
      console.log('kill rgb');
    },

    async killIrProcess() {
      
      this.showIrVideo = false;

      this.irStreamActive = false;
      this.irAutoReload = false;
      this.irVideoSrc = require("@/assets/no.png");
      console.log('kill ir');
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
          direction: direction,
          speed: parseInt(this.moveSpeed), // Add speed to the request
          robotId: this.robotId
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

    // Add error handling for image loading
    handleImageError(type) {
      console.error(`Failed to load ${type} stream`);
      if (type === 'rgb') {
        if (this.rgbRetryCount < this.maxRetries) {
          this.rgbRetryCount++;
          console.log(`Retrying RGB stream (attempt ${this.rgbRetryCount})`);
          setTimeout(() => {
            // Force reload by adding timestamp
            if(this.robotId === 'R001'){
              this.rgbVideoSrc = `${this.baseUrl}:5001/video_feed_rgb?t=${Date.now()}`;
            }
            else{
              this.rgbVideoSrc = `http://192.168.1.107:5001/video_feed_rgb?t=${Date.now()}`;
            }

          }, this.retryInterval);
        } else {
          // this.rgbVideoSrc = '../static/img/vision_close.png';
          if(this.robotId === 'R001'){
            this.rgbVideoSrc = `${this.baseUrl}:5001/video_feed_rgb?t=${Date.now()}`;
          }
          else{
            this.rgbVideoSrc = `http://192.168.1.107:5001/video_feed_rgb?t=${Date.now()}`;
          }
          console.log('Max retry attempts reached for RGB stream');
        }
      }
      if (type === 'ir' && this.$refs.irFrame) {
        if (this.irRetryCount < this.maxRetries) {
          this.irRetryCount++;
          console.log(`Retrying IR stream (attempt ${this.irRetryCount})`);
          setTimeout(() => {
            // Force reload by adding timestamp
            this.irVideoSrc = `${this.baseUrl}:5001/video_feed_ir?t=${Date.now()}`;
          }, this.retryInterval);
        } else {
          // this.irVideoSrc = '../static/img/vision_close.png';
          this.irVideoSrc = `${this.baseUrl}:5001/video_feed_ir?t=${Date.now()}`;
          console.log('Max retry attempts reached for IR stream');
        }
      }
    },

    handleImageLoad(type) {
      if (type === 'rgb') {
        this.rgbRetryCount = 0; // Reset retry counter on successful load
        console.log('RGB stream loaded successfully');
      }
      if (type === 'ir' && this.$refs.irFrame) {
        this.irRetryCount = 0; // Reset retry counter on successful load
        console.log('IR stream loaded successfully');
      }
    },

    showPopupDialog(messageData) {
      this.$nextTick(() => {

        // this.popupMessage = messageData.message;
        // this.currentMessageId = messageData.id;
        // this.currentMessage = messageData;
        // this.showPopup = true;
        // console.log('Popup shown:', this.showPopup, 'Message:', this.popupMessage);

        if (this.robotId === 'R001'){
          this.popupMessage = messageData.message;
        this.currentMessageId = messageData.id;
        this.currentMessage = messageData;
        this.showPopup = true;
        console.log('Popup shown:', this.showPopup, 'Message:', this.popupMessage);
        } else {
        console.log('Popup suppressed for R002:', messageData);
        }
      });
    },

    handleConfirm() {
      console.log('Confirm clicked');
      if (this.currentMessage && this.currentMessage.message === '任务完成！') {
        webSocketService.sendMessageResponse(this.currentMessage, true);
        // this.$router.push('/'); // Navigate to home page
        this.$router.push('/test_hello');
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

.speed-control {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  min-width: 80px;
}

.speed-select:hover {
  border-color: #95a5a6;
}

.speed-select:focus {
  outline: none;
  border-color: #3498db;
}

</style>