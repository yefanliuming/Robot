<template>
  <div class="task-view-container">
    <button class="task-view-btn" @click="showRobotList">
      查看执行任务
    </button>

    <div v-if="showPopup" class="popup-overlay" @click.self="closePopup">
      <div class="popup-content">
        <h3>选择要查看的机器人</h3>
        <div v-if="activeRobots.length > 0" class="robot-list">
          <button
              v-for="robotId in activeRobots"
              :key="robotId"
              class="robot-item"
              @click="viewRobotTask(robotId)"
          >
            机器人 {{ robotId }}
          </button>
        </div>
        <div v-else class="no-robots">
          暂无执行任务的机器人
        </div>
        <button class="close-btn" @click="closePopup">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import apiConfig from '@/config/api.config'

export default {
  name: 'ViewTaskButton',
  data() {
    return {
      showPopup: false,
      activeRobots: [],
      refreshInterval: null
    }
  },
  methods: {

    startRefreshing() {
    this.refreshInterval = setInterval(async () => {
      if (this.showPopup) {
        await this.showRobotList();
      }
    }, 5000); // 每5秒刷新一次
  },
  stopRefreshing() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },

    async showRobotList() {
      try {
        const response = await fetch(apiConfig.getActiveRobotsUrl());
        if (response.ok) {
          this.activeRobots = await response.json();
          this.showPopup = true;
        }
      } catch (error) {
        console.error('Failed to fetch active robots:', error);
        alert('获取机器人列表失败');
      }
    },
    viewRobotTask(robotId) {
      this.$router.push({
        path: '/test_receive',
        query: { robotId }
      });
      this.closePopup();
    },
    closePopup() {
      this.showPopup = false;
    }
  },
  mounted() {
  this.startRefreshing();
  },
  beforeUnmount() {
    this.stopRefreshing();
  }
}
</script>

<style scoped>
.task-view-container {
  margin-bottom: 20px;
}

.task-view-btn {
  width: 100%;
  padding: 15px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.task-view-btn:hover {
  background-color: #1976D2;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  max-width: 90%;
}

.robot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.robot-item {
  padding: 10px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.robot-item:hover {
  background-color: #e0e0e0;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background-color: #666;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.no-robots {
  text-align: center;
  padding: 20px;
  color: #666;
}

h3 {
  margin: 0 0 20px 0;
  text-align: center;
}
</style>