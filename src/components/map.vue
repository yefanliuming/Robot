<template>
  <div class="image-container">
    <img 
      :src="imageUrl" 
      alt="Labeled Image" 
      ref="image" 
      @load="onImageLoad"
      @error="onImageError" 
    />
    <div 
      v-for="(label, index) in labels" 
      :key="index" 
      class="label" 
      :style="getLabelStyle(label)"
    >
      <img 
        src="@/assets/rebot.svg" 
        alt="Robot" 
        width="40"
        height="40"
        style="width: 40px !important; height: 40px !important;"
      />
    </div>
  </div>
</template>

<script>
import apiConfig from '@/config/api.config';
export default {
  data() {
    return {
      imageUrl: apiConfig.getImageUrl(),
      labels: [
        { text: 'L', x: 0, y: 0 }
      ],
      imageWidth: 0,
      imageHeight: 0,
      maxCoordinate: 6 // Maximum coordinate value
    };
  },
  methods: {
    onImageLoad() {
      const img = this.$refs.image;
      this.imageWidth = img.offsetWidth;
      this.imageHeight = img.offsetHeight;
      console.log('Image loaded:', this.imageWidth, this.imageHeight);
    },

    async fetchLocation() {
      try {
        const response = await fetch(apiConfig.getLocationUrl());
        const data = await response.json();
        console.log(data.x, data.y)
        // Convert from the new coordinate system (0-6) to pixel positions
        const normalizedX = ((data.x + 0.4) / this.maxCoordinate); // Normalize to 0-1
        const normalizedY = ((data.y + 0.9)/ this.maxCoordinate); // Normalize to 0-1

        console.log(normalizedX,normalizedY)

        // Convert to pixel coordinates with origin at bottom right
        const pixelX = this.imageWidth * (1 - normalizedY); // Y axis becomes horizontal (from right to left)
        const pixelY = this.imageHeight * (1 - normalizedX); // X axis becomes vertical (from bottom to top)
        
        this.labels = [
          { text: 'L', x: pixelX, y: pixelY }
        ];
      } catch (error) {
        console.error('Error fetching location data:', error);
      }
    },

    getLabelStyle(label) {
      return {
        position: 'absolute',
        left: `${label.x - 20}px`,  // 75 is half of icon width (150/2)
        top: `${label.y - 20}px`,   // 75 is half of icon height (150/2)
        transform: 'translate(-50%, -50%)', // Center the icon
      };
    },

    onImageError(error) {
      console.error('Error loading image:', error);
    }
  },
  mounted() {
    this.fetchLocation();
    
    this.updateInterval = setInterval(() => {
      this.fetchLocation();
    }, 300);

    window.addEventListener('resize', this.onImageLoad);
  },
  beforeUnmount() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    window.removeEventListener('resize', this.onImageLoad);
  }
};
</script>

<style scoped>
.image-container {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.label {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

.label img {
  transition: all 0.3s ease-out;
  width: 40px !important;
  height: 40px !important;
  object-fit: contain;
}
</style>