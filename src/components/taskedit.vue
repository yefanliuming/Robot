<template>
  <!-- 整体容器 -->
  <div class="container">
    <!-- Add loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- 表单容器，使用prevent修饰符阻止默认提交行为 -->
    <form @submit.prevent="submitForm" class="form-container">

<!--      <select id="actionType" v-if="false">-->
<!--&lt;!&ndash;        <option value="">&#45;&#45;请选择&#45;&#45;</option>&ndash;&gt;-->
<!--&lt;!&ndash;        <option value="巡检">巡检</option>&ndash;&gt;-->
<!--&lt;!&ndash;        <option value="执行操作">执行操作</option>&ndash;&gt;-->
<!--      </select>-->

      <!-- 多选下拉列表区域 -->
      <div class="form-group">
        <label>选择机箱区域:</label>
        <!-- 自定义下拉选择器容器，ref用于在JavaScript中获取DOM元素 -->
        <div class="custom-select" ref="selectContainer">
          <!-- 显示已选项的区域，点击时触发toggleDropdown方法 -->
          <div class="select-display" @click="toggleDropdown">
            <div class="selected-items">
              <div v-for="value in selectedOptions" 
                   :key="value" 
                   class="selected-item"
                   @click.stop="toggleOption(tableOptions.find(opt => opt.value === value))">
                {{ tableOptions.find(opt => opt.value === value)?.label }}
                <span class="remove-icon">×</span>
              </div>
              <span v-if="selectedOptions.length === 0">请选择机箱区域</span>
            </div>
            <span class="arrow" :class="{ 'arrow-up': isOpen }">▼</span>
          </div>
          
          <!-- 下拉列表，使用v-show控制显示/隐藏，支持过渡动画 -->
          <div class="dropdown-list" v-show="isOpen">
            <!-- 使用v-for循环渲染选项列表，key用于优化渲染性能 -->
            <div v-for="option in tableOptions" 
                 :key="option.value" 
                 class="dropdown-item"
                 :class="{ 'selected': isSelected(option.value) }"
                 @click="toggleOption(option)">
              <!-- 自定义复选框标签 -->
              <label class="checkbox-container">
                <!-- 原生复选框，根据选中状态动态更新 -->
                <input type="checkbox" 
                       :checked="isSelected(option.value)"
                       @click.stop>  <!-- Prevent double-triggering -->
                <!-- 自定义复选框样式的span元素 -->
                <span class="checkmark">
                  <span class="checkmark-icon" :style="{ opacity: isSelected(option.value) ? 1 : 0 }">✓</span>
                </span>
                <!-- 选项文本 -->
                {{ option.label }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行操作区域 -->
      <div class="operation-fields">
        <!-- 操作类型选择 -->
        <div class="form-group">
          <label for="operationType">选择操作类型:</label>
          <!-- 操作类型下拉，change事件触发toggleOperationDetails方法 -->
          <select id="operationType" v-model="operationType" @change="toggleOperationDetails">
            <option value="">--请选择--</option>
            <option value="按按钮">按按钮</option>
            <option value="搬开关">搬开关</option>
          </select>
        </div>

        <!-- 按按钮操作选择，仅在选择"按按钮"时显示 -->
        <div class="form-group" v-if="operationType === '按按钮'">
          <label for="buttonAction">选择按钮操作:</label>
          <select id="buttonAction" v-model="buttonAction">
            <option value="">--请选择--</option>
            <option value="合闸">合闸</option>
            <option value="分闸">分闸</option>
          </select>
        </div>

        <!-- 搬开关操作选择，仅在选择"搬开关"时显示 -->
        <div class="form-group" v-if="operationType === '搬开关'">

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

<!--          <label for="switchNumber">选择开关号:</label>-->
<!--          &lt;!&ndash; 开关号选择，change事件触发toggleSwitchAction方法 &ndash;&gt;-->
<!--          <select id="switchNumber" v-model="switchNumber" @change="toggleSwitchAction">-->
<!--            <option value="">&#45;&#45;请选择&#45;&#45;</option>-->
<!--            <option value="A01">A01</option>-->
<!--            <option value="A02">A02</option>-->
<!--            <option value="A03">A03</option>-->
<!--            <option value="A04">A04</option>-->
<!--            <option value="A05">A05</option>-->
<!--            <option value="A06">A06</option>-->
<!--            <option value="A07">A07</option>-->
<!--            <option value="A08">A08</option>-->
<!--          </select>-->
        </div>

        <!-- 动作方向选择，仅在选择"搬开关"时显示 -->
        <div class="form-group" v-if="operationType === '搬开关'">
          <label for="actionDirection">选择上抬或下按:</label>
          <select id="actionDirection" v-model="actionDirection">
            <option value="">--请选择--</option>
            <option value="上抬">上抬</option>
            <option value="下按">下按</option>
          </select>
        </div>
      </div>

      <!-- 机器人编号选择 -->
      <div class="form-group">
        <label for="robotId">选择机器人编号:</label>
        <select id="robotId" v-model="robotId">
          <option value="">--请选择--</option>
          <option value="R001">R001</option>
          <option value="R002">R002</option>
          <option value="R003">R003</option>
        </select>
      </div>

      <!-- 提交按钮，根据isFormComplete计算属性控制禁用状态 -->
      <div class="form-group">
        <button type="submit" :disabled="!isFormComplete">发布任务</button>
      </div>
    </form>
  </div>
</template>

<script>
import apiConfig from "@/config/api.config";
export default {
  // 组件数据
  data() {
    return {
      // 操作相关的数据属性
      operationType: '',      // 存储操作类型选择
      buttonAction: '',       // 存储按钮操作选择
      switchNumber: '',       // 存储开关号选择
      actionDirection: '',    // 存储动作方向选择
      robotId: '',           // 存储机器人编号选择

      switchGroup: '',

      // 多选下拉列表相关的数据属性
      isOpen: false,         // 控制下拉列表的显示状态
      selectedOptions: [],    // 存储已选择的选项值数组
      // 下拉列表选项数据
      tableOptions: [
        { value: 1, label: '1号柜' },
        { value: 2, label: '2号柜' },
        { value: 3, label: '3号柜' },
        { value: 4, label: '4号柜' },
        { value: 5, label: '5号柜' }
      ],

      // Add new properties
      isLoading: false,
      loadingMessage: '正在提交任务...',
    }
  },

  // 计算属性
  computed: {
    // 判断表单是否填写完整，用于控制提交按钮的禁用状态
    isFormComplete() {
      const hasSelectedTables = this.selectedOptions.length > 0;
      
      if (this.operationType === '按按钮') {
        return this.operationType && this.buttonAction && this.robotId && hasSelectedTables;
      } else if (this.operationType === '搬开关') {
        return this.operationType && this.switchNumber && this.actionDirection && this.robotId && hasSelectedTables;
      }
      return this.operationType && this.robotId && hasSelectedTables;
    },

    // 生成下拉列表显示文本
    displayText() {
      if (this.selectedOptions.length === 0) {
        return '请选择机箱区域'
      }
      // 将选中的值映射为对应的标签文本并用逗号连接
      return this.selectedOptions
        .map(value => this.tableOptions.find(opt => opt.value === value)?.label)
        .join(', ')
    }
  },

  // 方法
  methods: {
    handleSwitchGroupChange() {
      // Reset switch number when group changes
      this.switchNumber = '';
    },

    // 切换操作类型时重置相关字段
    toggleOperationDetails() {
      this.buttonAction = '';
      this.switchNumber = '';
      this.actionDirection = '';
    },

    // 切换开关选择时重置动作方向
    toggleSwitchAction() {
      this.actionDirection = '';
    },
    
    // 切换下拉列表的显示状态
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },

    // 切换选项的选中状态
    toggleOption(option) {
      const index = this.selectedOptions.indexOf(option.value);
      if (index === -1) {
        // 如果选项未被选中，添加到已选列表
        this.selectedOptions.push(option.value);
      } else {
        // 如果选项已被选中，从已选列表中移除
        this.selectedOptions.splice(index, 1);
      }
    },

    // 检查选项是否被选中
    isSelected(value) {
      return this.selectedOptions.includes(value);
    },

    // 处理点击外部区域事件
    handleClickOutside(event) {
      const selectContainer = this.$refs.selectContainer;
      // 如果点击的区域不在选择器内部，则关闭下拉列表
      if (selectContainer && !selectContainer.contains(event.target)) {
        this.isOpen = false;
      }
    },

    // 提交表单
    async submitForm() {
      if (this.selectedOptions.length === 0) {
        alert('请选择至少一个机箱区域！');
        return;
      }

      const formData = {
        operationType: this.operationType,
        buttonAction: this.buttonAction,
        switchNumber: this.switchNumber,
        actionDirection: this.actionDirection,
        robotId: this.robotId,
        selectedTables: this.selectedOptions,
        actionType: '执行操作',
      };

      // var serverUrl = "192.168.1.104";

      try {
        console.log(formData)
        // 显示加载遮罩
        this.isLoading = true;
        this.loadingMessage = '正在提交任务...';

        // var targetUrl = `http://${serverUrl}:8082/api/receiveMessage2`;

        // 'http://192.168.1.101:8082/api/receiveMessage2'

        const response = await fetch(apiConfig.getreceiveMessage2Url(), {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          this.loadingMessage = '正在提交任务...';
          
          // 等待12秒
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          this.loadingMessage = '任务提交完成！';
          await new Promise(resolve => setTimeout(resolve, 500));
          
          this.isLoading = false;
          alert('任务已提交');
          this.$router.push('/receive');
        } else {
          throw new Error('Server responded with error');
        }
      } catch (error) {
        console.error('Request error:', error);
        this.loadingMessage = '提交失败，请重试！';
        await new Promise(resolve => setTimeout(resolve, 5000));
        alert('提交失败，请重试！');
        this.isLoading = false;
      }
    }
  },
  // 组件挂载时添加点击事件监听
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  // 组件销毁前移除事件监听，防止内存泄漏
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #f4f4f4;
}

.form-container {
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 1.5em;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  font-size: 16px;
  color: #2c3e50;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

button {
  width: 100%;
  padding: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.operation-fields {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* Loading overlay styles */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 80%;
  width: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-content p {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile optimization */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .form-container {
    padding: 15px;
    margin: 0 auto;
    border-radius: 8px;
  }

  h2 {
    font-size: 1.3em;
    margin-bottom: 20px;
  }

  select, button {
    padding: 10px;
    font-size: 14px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  label {
    font-size: 14px;
  }
}

/* Select focus and hover states */
select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

select:hover {
  border-color: #4CAF50;
}

/* Transition effects */
.form-group {
  transition: all 0.3s ease;
}

.operation-fields {
  transition: all 0.3s ease;
}

/* Error state styles */
select.error {
  border-color: #ff4444;
}

.error-message {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Success state styles */
.success-message {
  color: #4CAF50;
  font-size: 12px;
  margin-top: 4px;
}

/* Add these new styles for the multi-select dropdown */
.custom-select {
  position: relative;
  width: 100%;
}

.select-display {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.arrow-up {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.selected {
  background-color: #e8f0fe;
}

.dropdown-item.selected:hover {
  background-color: #d0e0fd;
}

.checkbox-container {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  padding-left: 25px;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  height: 16px;
  width: 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #2196F3;
  border-color: #2196F3;
}

.checkmark-icon {
  color: white;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: opacity 0.2s ease;
}

/* Hide the default checkbox */
.checkbox-container input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
}

.dropdown-item.selected .checkmark {
  background-color: #2196F3;
  border-color: #2196F3;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-item {
  background-color: #e8f0fe;
  border-radius: 4px;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.selected-item:hover {
  background-color: #d0e0fd;
}

.remove-icon {
  font-size: 14px;
  color: #666;
}

.select-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
</style>