<!-- Login.vue -->
<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input
              type="text"
              id="username"
              v-model="formData.username"
              required
              placeholder="Enter username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
              type="password"
              id="password"
              v-model="formData.password"
              required
              placeholder="Enter password"
          />
        </div>

        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        <div class="success-message" v-if="successMessage">
          {{ successMessage }}
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>

        <div class="additional-options">
          <label>
            <input type="checkbox" v-model="formData.rememberMe" />
            Remember me
          </label>
          <a href="#" @click="forgotPassword">Forgot Password?</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      formData: {
        username: '',
        password: '',
        rememberMe: false
      },
      isLoading: false,
      errorMessage: '',
      successMessage: ''
    }
  },
  methods: {
    async handleLogin() {
      try {
        this.isLoading = true
        this.errorMessage = ''
        this.successMessage = ''
        

        // Make API call to login endpoint using fetch
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: this.formData.username,
            password: this.formData.password
          })
        })

        const data = await response.json()

        // Handle successful login
        if (response.ok && data.success) {
          this.successMessage = 'Login successful!'
          
          // Store token based on remember me preference
          const token = data.token
          if (this.formData.rememberMe) {
            localStorage.setItem('token', token)
          } else {
            sessionStorage.setItem('token', token)
          }

          // Wait briefly to show success message
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Redirect to dashboard
          this.$router.push('/dashboard')
        } else {
          throw new Error(data.message || 'Login failed')
        }
      } catch (error) {
        this.errorMessage = error.message || 'An error occurred during login'
      } finally {
        this.isLoading = false
      }
    },
    forgotPassword() {
      // Implement forgot password functionality
      alert('Forgot password functionality to be implemented')
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

input[type="text"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.2);
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.success-message {
  color: #4CAF50;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.additional-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.additional-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.additional-options a {
  color: #4CAF50;
  text-decoration: none;
}

.additional-options a:hover {
  text-decoration: underline;
}
</style>