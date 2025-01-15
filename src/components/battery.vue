<script>
import apiConfig from "@/config/api.config";
export default {
  props: {
    robotId: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      batteryLevel: 0,
    };
  },
  computed: {
    batteryPercentage() {
      return ((this.batteryLevel - 20) / 5) * 100;
    },
    batteryColor() {
      if (this.batteryLevel <= 20.5) return '#ff4444'; //Red: ≤ 20.5V (Critical)
      if (this.batteryLevel <= 21.5) return '#ffaa00'; //Yellow: ≤ 21.5V (Warning)
      return '#44ff44'; //Green: > 21.5V (Normal)
    }
  },
  mounted() {

    this.getBatteryLevel();
  },
  methods: {

    async getBatteryLevel() {

      console.log('robotId:', this.robotId);

      try {

        //测试代码

        const formData = {
          robotId: this.robotId,
        };
        const response = await fetch(apiConfig.getreceiveBatteryUrl(),{
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        this.batteryLevel = data.x;
        console.log('test Battery level:', this.batteryLevel);

        //测试代码

        
        // const response = await fetch(apiConfig.getreceiveBatteryUrl());
        // const data = await response.json();
        // this.batteryLevel = data.x;
        // console.log('Battery level:', this.batteryLevel);
      } catch (error) {
        console.error('Error fetching battery level:', error);
      }
    },
  }
}
</script>

<template>
  <!-- 电池电量区域 -->
  <div class="battery-panel">
    <h3>电池电量</h3>
    <div class="battery-container">
      <div class="battery-level" :style="{ width: batteryPercentage + '%', backgroundColor: batteryColor }"></div>
      <span class="battery-text">{{ batteryLevel }}V</span>
    </div>
  </div>
</template>

<style scoped>

.battery-panel {
  background-color: #f5f5f5;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
}

.battery-container {
  width: 200px;
  height: 30px;
  border: 2px solid #333333;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
  margin: 10px auto;
}

.battery-level {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 12px;
}

.battery-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.5);
}

</style>