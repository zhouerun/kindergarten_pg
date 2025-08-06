<template>
<!-- 全屏图片展示页面 -->
<div v-if="visible" class="fullscreen-view" @click="closeFullscreen">
  <div class="fullscreen-container" @click.stop
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd">
    <img 
      v-if="currentPhoto"
      :src="getImageUrl(currentPhoto.path)" 
      class="fullscreen-image"
      :style="imageStyle"
      alt="全屏图片"
      @error="handleImageError"
    />
    
    <!-- 点赞按钮 -->
    <div class="fullscreen-like-button">
      <el-button 
        :type="currentPhoto && currentPhoto.liked ? 'danger' : 'primary'"
        @click="toggleLike(currentPhoto)"
        circle
        size="large"
      >
        <el-icon>
          <component :is="currentPhoto && currentPhoto.liked ? 'StarFilled' : 'Star'" />
        </el-icon>
      </el-button>
    </div>
    
    <!-- 关闭按钮 -->
    <div class="fullscreen-close-button">
      <el-button @click="closeFullscreen" circle size="large">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    
    <!-- 照片计数器 -->
    <div class="photo-counter">
      {{ currentIndex + 1 }} / {{ photos.length }}
    </div>
    
    <!-- 导航按钮 -->
    <div class="navigation-buttons"
      v-if="!isMobile"
    >
      <el-button 
        v-if="currentIndex > 0"
        @click.stop="prevPhoto" 
        circle 
        size="large"
        class="nav-button prev-button"
      >
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <el-button 
        v-if="currentIndex < photos.length - 1"
        @click.stop="nextPhoto" 
        circle 
        size="large"
        class="nav-button next-button"
      >
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</div>
</template>

<script>
import { StarFilled, Star, Close, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import api from '@/utils/axios'
import { ElMessage } from 'element-plus'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

export default {
  name: 'FullScreenView',
  components: {
    StarFilled, Star, Close, ArrowLeft, ArrowRight
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    photos: {
      type: Array,
      default: () => []
    },
    initialIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['close', 'update:visible'],
  setup(props, { emit }) {
    const currentPhoto = ref(null);
    const currentIndex = ref(0);
    
    // 图片拖拽相关状态
    const imageTransform = ref({ x: 0, y: 0, scale: 1 });
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const lastTouchDistance = ref(0);
    const isMultiTouch = ref(false);
    
    const isMobile = ref(false);
    const touchMode = ref('none');

    const checkIsMobile = () => {
      isMobile.value = window.innerWidth < 1500;
    }
    
    const getImageUrl = (path) => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      return path;
    }
    
    // 计算图片样式
    const imageStyle = computed(() => ({
      transform: `translate(${imageTransform.value.x}px, ${imageTransform.value.y}px) scale(${imageTransform.value.scale})`,
      transition: isDragging.value ? 'none' : 'transform 0.1s ease'
    }));
    
    // 计算两点之间的距离
    const getTouchDistance = (touches) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // 处理触摸开始
    const handleTouchStart = (event) => {
      // 检查触摸目标是否为按钮或其子元素
      const target = event.target;
      const isButton = target.closest('.el-button') || 
                      target.closest('.fullscreen-like-button') || 
                      target.closest('.fullscreen-close-button') ||
                      target.closest('.navigation-buttons') ||
                      target.closest('.photo-counter');
      
      if (isButton) {
        // 如果是按钮，不处理拖拽逻辑
        return;
      }
      
      event.preventDefault();
      const touches = event.touches;
      
      if (touches.length === 1) {
        // 单指触摸 - 开始拖拽
        isDragging.value = true;
        isMultiTouch.value = false;
        dragStart.value = {
          x: touches[0].clientX - imageTransform.value.x,
          y: touches[0].clientY - imageTransform.value.y
        };
      } else if (touches.length === 2) {
        // 双指触摸 - 开始缩放
        isMultiTouch.value = true;
        isDragging.value = false;
        lastTouchDistance.value = getTouchDistance(touches);
      }
    };
    
    // 处理触摸移动
    const handleTouchMove = (event) => {
      // 检查触摸目标是否为按钮或其子元素
      const target = event.target;
      const isButton = target.closest('.el-button') || 
                      target.closest('.fullscreen-like-button') || 
                      target.closest('.fullscreen-close-button') ||
                      target.closest('.navigation-buttons') ||
                      target.closest('.photo-counter');
      
      if (isButton) {
        // 如果是按钮，不处理拖拽逻辑
        return;
      }
      
      event.preventDefault();
      const touches = event.touches;
      
      if (isDragging.value && touches.length === 1) {
        // 单指拖拽
        const newX = touches[0].clientX - dragStart.value.x;
        const newY = touches[0].clientY - dragStart.value.y;
        if (Math.abs(newX) + Math.abs(newY) < 50) {
          if (Math.abs(newX) > Math.abs(newY)) {
            touchMode.value = 'horizontal';
          } else {
            touchMode.value = 'vertical';
          }
        }

        if (touchMode.value === 'horizontal') {
          imageTransform.value.x = newX;
          imageTransform.value.y = 0;
        } else {
          imageTransform.value.x = newX;
          imageTransform.value.y = newY;
        }
      } else if (isMultiTouch.value && touches.length === 2) {
        // 双指缩放
        const currentDistance = getTouchDistance(touches);
        if (lastTouchDistance.value > 0) {
          const scale = currentDistance / lastTouchDistance.value;
          const newScale = imageTransform.value.scale * scale;
          
          imageTransform.value.scale = Math.max(0.5, Math.min(3, newScale));
        }
        lastTouchDistance.value = currentDistance;
      }
    };
    
    // 处理触摸结束
    const handleTouchEnd = (event) => {
      // 检查触摸目标是否为按钮或其子元素
      const target = event.target;
      const isButton = target.closest('.el-button') || 
                      target.closest('.fullscreen-like-button') || 
                      target.closest('.fullscreen-close-button') ||
                      target.closest('.navigation-buttons') ||
                      target.closest('.photo-counter');
      
      if (isButton) {
        // 如果是按钮，不处理拖拽逻辑
        return;
      }
      
      event.preventDefault();
      isDragging.value = false;
      isMultiTouch.value = false;
      lastTouchDistance.value = 0;
      
      if (imageTransform.value.scale < 1) {
        imageTransform.value.scale = 1;
      }
      
      if (touchMode.value === 'none' || (Math.abs(imageTransform.value.x) <= 100 && Math.abs(imageTransform.value.y) <= 100)) {
          imageTransform.value = { x: 0, y: 0, scale: 1 };
          touchMode.value = 'none';
        } else if (touchMode.value === 'vertical') {
          if (Math.abs(imageTransform.value.y) >= 100) {
          closeFullscreen();
          } else {
            imageTransform.value = { x: 0, y: 0, scale: 1 };
            touchMode.value = 'none';
          }
        } else if (touchMode.value === 'horizontal') {
          if (Math.abs(imageTransform.value.x) >= 100) {
            if (imageTransform.value.x > 0) {
              prevPhoto();
            } else {
              nextPhoto();
            }
          } else {
            imageTransform.value = { x: 0, y: 0, scale: 1 };
            touchMode.value = 'none';
          }
        }
      };

    const handleImageError = (event) => {
      event.target.src = 'https://placehold.co/1024x768'
    }

    const toggleLike = async (photo) => {
      try {
        await api.post('/photos/like', {
          photoId: photo.id
        });
        photo.liked = !photo.liked;
        photo.like_count = photo.liked ? 
          (photo.like_count || 0) + 1 : 
          (photo.like_count || 1) - 1;
        ElMessage.success(photo.liked ? '点赞成功' : '取消点赞');
      } catch (error) {
        ElMessage.error('操作失败');
      } 
    }

    const closeFullscreen = () => {
      // 重置图片变换
      touchMode.value = 'none';
      imageTransform.value = { x: 0, y: 0, scale: 1 };
      emit('update:visible', false);
      emit('close');
    }

    const prevPhoto = () => {
      touchMode.value = 'none';
      imageTransform.value = { x: 0, y: 0, scale: 1 };
      if (currentIndex.value > 0) {
        currentIndex.value--;
        currentPhoto.value = props.photos[currentIndex.value];
      } else {
        ElMessage.info('已经是第一张照片了');
      }
    }

    const nextPhoto = () => {
      touchMode.value = 'none';
      imageTransform.value = { x: 0, y: 0, scale: 1 };
      if (currentIndex.value < props.photos.length - 1) {
        currentIndex.value++;
        currentPhoto.value = props.photos[currentIndex.value];
      } else {
        ElMessage.info('已经是最后一张照片了');
      }
    }

    const handleKeyboardEvent = (event) => {
      if (!props.visible) return;
      
      // 防止在输入框中触发
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevPhoto();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextPhoto();
          break;
        case 'Escape':
          event.preventDefault();
          closeFullscreen();
          break;
      }
    }

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        currentIndex.value = props.initialIndex;
        currentPhoto.value = props.photos[props.initialIndex];
        
        // 重置图片变换
        imageTransform.value = { x: 0, y: 0, scale: 1 };
        
        // 设置导航栏z-index为1
        setNavbarZIndex(1);
      } else {
        // 恢复导航栏z-index为1000
        setNavbarZIndex(1000);
      }
    });

    // 监听窗口大小变化
    const handleResize = () => {
      checkIsMobile();
    };

    // 设置导航栏z-index的函数
    const setNavbarZIndex = (zIndex) => {
      const navbar = document.querySelector('.mobile-bottom-nav');
      if (navbar) {
        navbar.style.zIndex = zIndex;
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeyboardEvent);
      window.addEventListener('resize', handleResize);
      checkIsMobile();
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardEvent);
      window.removeEventListener('resize', handleResize);
    });

    return {
      currentPhoto,
      currentIndex,
      imageStyle,
      imageTransform,
      isMobile,
      getImageUrl,
      handleImageError,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      toggleLike,
      closeFullscreen,
      prevPhoto,
      nextPhoto
    };
  }
}
</script>

<style scoped>
/* 全屏预览样式 */
.fullscreen-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* 全屏组件层级 */
  cursor: pointer;
  overflow: hidden;
  touch-action: pan-x; /* 只允许水平滑动 */
}

.fullscreen-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  overflow: hidden;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.fullscreen-image:active {
  cursor: grabbing;
}

.fullscreen-like-button,
.fullscreen-close-button {
  position: absolute;
  top: 30px;
  z-index: 10;
}

.fullscreen-like-button {
  left: 30px;
}

.fullscreen-close-button {
  right: 30px;
}

.fullscreen-like-button .el-button,
.fullscreen-close-button .el-button {
  background: rgba(87, 185, 255, 0.8);
  border: 2px solid rgba(87, 185, 255, 0.9);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.fullscreen-like-button .el-button:hover,
.fullscreen-close-button .el-button:hover {
  background: rgba(87, 185, 255, 1);
  border-color: rgba(87, 185, 255, 1);
  transform: scale(1.1);
}

/* 照片计数器样式 */
.photo-counter {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
  backdrop-filter: blur(10px);
}

/* 导航按钮样式 */
.navigation-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  pointer-events: none;
  z-index: 10;
}

.nav-button {
  pointer-events: auto;
  background: rgba(87, 185, 255, 0.8);
  border: 2px solid rgba(87, 185, 255, 0.9);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.nav-button:hover {
  background: rgba(87, 185, 255, 1);
  border-color: rgba(87, 185, 255, 1);
  transform: scale(1.1);
}

.prev-button {
  margin-right: auto;
}

.next-button {
  margin-left: auto;
}

/* 手机端优化 */
@media (max-width: 768px) {
  .fullscreen-like-button,
  .fullscreen-close-button{
    top: 20px;
  }
  
  .fullscreen-like-button {
    left: 20px;
  }
  
  .fullscreen-close-button {
    right: 20px;
  }
  
  .photo-counter {
    top: 20px;
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .navigation-buttons {
    padding: 0 20px;
  }
  
  .nav-button {
    transform: scale(0.9);
  }
  
  .nav-button:hover {
    transform: scale(1);
  }
}
</style>