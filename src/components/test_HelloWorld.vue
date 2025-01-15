<template>
  <div class="page-container">
    <!-- Loading overlay with only spinning circle -->
    <div v-if="isLoading" class="popup-overlay">
      <div class="popup-content">
        <div class="progress-container">
          <div class="progress-circle"></div>
          <div class="progress-text">提交中</div>
        </div>
      </div>
    </div>

    <!-- Success/Error Popup -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-content">
        <p :class="{ 'success-message': isSuccess, 'error-message': !isSuccess }">
          {{ popupMessage }}
        </p>
        <div class="popup-buttons">
          <button class="popup-btn" @click="closePopup">确定</button>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 页面标题 -->
      <h2>巡检与操作选择</h2>

      <!-- 任务编辑按钮 -->
      <button class="task-edit-btn" @click="gototaskedit">任务编辑</button>

      <!-- 添加查看执行任务按钮 -->
      <check_robot :robot-id="robotId"/>

      <!-- 主表单容器 -->
      <div class="form-card">
        <form @submit.prevent="submitForm" class="form-container">
          <!-- 操作类型选择区域 -->
          <div class="form-group">
            <label>请选择操作类型:</label>
            <div class="select-wrapper">
              <select v-model="actionType" @change="toggleActionFields">
                <option value="">--请选择--</option>
                <option value="巡检">巡检</option>
                <option value="执行操作">执行操作</option>
              </select>
            </div>
          </div>

          <!-- 楼层号选择区域 -->
          <div class="form-group">
            <label>选择楼层号:</label>
            <div class="select-wrapper">
              <select v-model="floor">
                <option value="">--请选择--</option>
                <option value="1">1楼</option>
                <option value="2">2楼</option>
                <option value="3">3楼</option>
              </select>
            </div>
          </div>

          <!-- 房间号选择区域 -->
          <div class="form-group">
            <label>选择房间号:</label>
            <div class="select-wrapper">
              <select v-model="room">
                <option value="">--请选择--</option>
                <option value="101">101</option>
                <option value="102">102</option>
                <option value="201">201</option>
              </select>
            </div>
          </div>

          <!-- 机柜号选择区域 -->
          <div class="form-group">
            <label>选择机柜号:</label>
            <div class="select-wrapper">
              <select v-model="selectedTables">
                <option value="">--请选择--</option>
                <option value="1">1号柜</option>
                <option value="2">2号柜</option>
                <option value="3">3号柜</option>
                <option value="4">4号柜</option>
                <option value="5">5号柜</option>
              </select>
            </div>
          </div>

          <!-- 在机柜号选择区域后添加以下代码 -->
          <div class="form-group" v-if="actionType === '执行操作'">
            <label>选择操作类型:</label>
            <div class="select-wrapper">
              <select v-model="operationType" @change="toggleOperationDetails">
                <option value="">--请选择--</option>
                <option value="按按钮">按按钮</option>
                <option value="搬开关">搬开关</option>
              </select>
            </div>
          </div>

          <!-- 按按钮选项 -->
          <div class="form-group" v-if="actionType === '执行操作' && operationType === '按按钮'">
            <label>选择按钮操作:</label>
            <div class="select-wrapper">
              <select v-model="buttonAction">
                <option value="">--请选择--</option>
                <option value="合闸">合闸</option>
                <option value="分闸">分闸</option>
              </select>
            </div>
          </div>

          <!-- 搬开关选项 -->
          <div v-if="actionType === '执行操作' && operationType === '搬开关'">
            <!-- Switch Group Selection -->
            <div class="form-group">
              <label>选择开关组:</label>
              <div class="select-wrapper">
                <select v-model="switchGroup" @change="handleSwitchGroupChange">
                  <option value="">--请选择--</option>
                  <option value="A">A组</option>
                  <option value="B">B组</option>
                </select>
              </div>
            </div>

            <!-- Switch Number Selection -->
            <div class="form-group">
              <label>选择开关号:</label>
              <div class="select-wrapper">
                <select v-model="switchNumber">
                  <option value="">--请选择--</option>
                  <template v-if="switchGroup === 'A'">
                    <option v-for="n in 8" :key="`A${n}`" :value="`A${n.toString().padStart(2, '0')}`">
                      A{{ n.toString().padStart(2, '0') }}
                    </option>
                  </template>
                  <template v-if="switchGroup === 'B'">
                    <option v-for="n in 7" :key="`B${n}`" :value="`B${n.toString().padStart(2, '0')}`">
                      B{{ n.toString().padStart(2, '0') }}
                    </option>
                  </template>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>选择上抬或下按:</label>
              <div class="select-wrapper">
                <select v-model="actionDirection">
                  <option value="">--请选择--</option>
                  <option value="上抬">上抬</option>
                  <option value="下按">下按</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 机器人编号选择 -->
          <div class="form-group">
            <label>选择机器人编号:</label>
            <div class="select-wrapper">
              <select v-model="robotId">
                <option value="">--请选择--</option>
                <option value="R001">R001</option>
                <option value="R002">R002</option>
                <option value="R003">R003</option>
              </select>
            </div>
          </div>



          <!-- 提交按钮 -->
          <button type="submit" class="submit-btn" :disabled="!isFormComplete">
            执行
          </button>
        </form>
      </div>
    </div>


  </div>
</template>

<script>
import apiConfig from '@/config/api.config';
import check_robot from '@/components/check_robot.vue';


export default {

  components: {
    check_robot
  },
  data() {
    return {
      actionType: '',
      floor: '',
      room: '',
      selectedTables: '',
      operationType: '',
      buttonAction: '',
      // switchNumber: '',
      actionDirection: '',
      robotId: '',
      isLoading: false,
      showPopup: false,
      popupMessage: '',
      isSuccess: false,
      switchGroup: '',
      switchNumber: '',
    }
  },

  computed: {
    isFormComplete() {
      const basicFieldsFilled = this.actionType && this.floor && this.room && this.robotId && this.selectedTables;

      if (this.actionType === '执行操作') {
        if (this.operationType === '按按钮') {
          return basicFieldsFilled && this.buttonAction;
        }
        else if (this.operationType === '搬开关') {
          return basicFieldsFilled && this.switchNumber && this.actionDirection;
        }
        return basicFieldsFilled && this.operationType;
      }

      return basicFieldsFilled;
    }
  },

  methods: {

    handleSwitchGroupChange() {
      // Reset switch number when group changes
      this.switchNumber = '';
    },
    gototaskedit() {
      this.$router.push('/taskedit');
    },

    toggleActionFields() {
      this.operationType = '';
      this.buttonAction = '';
      this.switchNumber = '';
      this.actionDirection = '';
    },

    toggleOperationDetails() {
      this.buttonAction = '';
      this.switchNumber = '';
      this.actionDirection = '';
    },

    toggleSwitchAction() {
      this.actionDirection = '';
    },

    async submitForm() {
      this.isLoading = true;

      const formData = {
        actionType: this.actionType,
        floor: this.floor,
        room: this.room,
        selectedTables: [this.selectedTables],
        operationType: this.operationType,
        buttonAction: this.buttonAction,
        switchNumber: this.switchNumber,
        actionDirection: this.actionDirection,
        robotId: this.robotId,
        switchGroup: this.switchGroup
      };



      try {
        const response = await fetch(apiConfig.getreceiveMessageUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {

          alert('任务提交失败')
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            console.log('Received text:', text);

            const messages = text.split('\n\n');
            for (const message of messages) {
              if (message.startsWith('data: ')) {
                const content = message.slice(6).trim();
                if (content) {
                  if (content === '连接已建立') {
                    setTimeout(() => {
                      console.log('三秒后执行');
                      this.isLoading = false;
                      alert('任务提交成功')
                    }, 5000);
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    this.$router.push({
                      path: '/test_receive',
                      query: { robotId: this.robotId }
                    });

                    return;
                  } else if (content === '无法连接到Python服务器') {
                    setTimeout(() => {
                      console.log('三秒后执行');
                      this.isLoading = false;
                      alert('任务提交失败')
                    }, 5000);
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    return;
                  }
                }
              }
            }
          }
        }
        catch (error) {
          console.error('Stream reading error:', error);
          setTimeout(() => {
            console.log('三秒后执行');
            this.isLoading = false;
          }, 5000);

          await new Promise(resolve => setTimeout(resolve, 5000));
          setTimeout(() => {
            console.log('三秒后执行');
            this.isLoading = false;
            alert("任务提交失败")
          }, 5000);
          // alert("任务提交失败")
        }
        finally {
          reader.releaseLock();
        }
      }
      catch (error) {
        console.error('Request error:', error);

        setTimeout(() => {
          console.log('三秒后执行');
          this.isLoading = false;
        }, 5000);

        await new Promise(resolve => setTimeout(resolve, 5000));
        setTimeout(() => {
          console.log('三秒后执行');
          this.isLoading = false;
          alert('任务提交失败')
        }, 5000);

      }
    },

    showSuccessPopup(message) {
      this.isSuccess = true;
      this.popupMessage = message;
      this.showPopup = true;
    },

    showErrorPopup(message) {
      this.isSuccess = false;
      this.popupMessage = message;
      this.showPopup = true;
    },

    closePopup() {
      this.showPopup = false;
      if (this.isSuccess) {
        this.$router.push('/receive');
      }
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.content-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #333;
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: normal;
}

.task-edit-btn {
  width: 100%;
  padding: 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  cursor: pointer;
}

.form-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper::after {
  content: '';
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #666;
  pointer-events: none;
}

select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  font-size: 16px;
  color: #333;
  appearance: none;
  -webkit-appearance: none;
}

select:focus {
  outline: none;
  border-color: #4CAF50;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background-color: #cccccc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
}

.submit-btn:not(:disabled) {
  background-color: #4CAF50;
}

.submit-btn:disabled {
  cursor: not-allowed;
}

/* Simplified progress styles */
.progress-container {
  text-align: center;
  padding: 20px;
}

.progress-circle {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.progress-text {
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive styles */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
  }

  .form-card {
    padding: 20px;
  }

  select {
    font-size: 14px;
  }
}
</style>

