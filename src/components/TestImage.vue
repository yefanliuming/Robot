<template>
  <div class="test-container">
    <h2>Image Loading Test</h2>
    <div class="image-container">
      <div v-if="!imageLoaded" class="loading-placeholder">
        <div class="loading-text">{{ status }}</div>
      </div>
      <img 
        v-show="imageLoaded"
        :src="imageUrl" 
        alt="Test Image" 
        ref="image" 
        @load="onImageLoad"
        @error="onImageError" 
      />
    </div>
    <div class="status" :class="{ 'error': hasError }">
      Status: {{ status }}
    </div>
  </div>
</template>

<script>
import apiConfig from '@/config/api.config';

export default {
  data() {
    return {
      imageUrl: apiConfig.getImageUrl(),
      status: 'Waiting for server...',
      imageLoaded: false,
      hasError: false
    };
  },
  methods: {
    checkImageAvailability() {
      this.hasError = false;
      fetch(this.imageUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok && !this.imageLoaded) {
            this.imageUrl = `http://localhost:8082/api/images/new_map.jpg?t=${Date.now()}`;
            this.imageLoaded = true;
            this.status = 'Image available, loading...';
          }
        })
        .catch(() => {
          this.imageLoaded = false;
          this.hasError = true;
          this.status = 'Server not available. Retrying...';
          setTimeout(() => this.checkImageAvailability(), 2000);
        });
    },

    onImageLoad() {
      this.imageLoaded = true;
      this.hasError = false;
      this.status = 'Image loaded successfully';
      console.log('Image loaded');
    },

    onImageError(error) {
      this.imageLoaded = false;
      this.hasError = true;
      this.status = 'Error loading image';
      console.error('Error loading image:', error);
      setTimeout(() => this.checkImageAvailability(), 2000);
    }
  },
  mounted() {
    this.checkImageAvailability();
  }
};
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.image-container {
  width: 100%;
  height: 400px;
  border: 1px solid #ccc;
  margin: 20px 0;
  position: relative;
  background-color: #f5f5f5;
}

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

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.status {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 10px;
}

.status.error {
  background-color: #ffebee;
  color: #d32f2f;
}
</style> 