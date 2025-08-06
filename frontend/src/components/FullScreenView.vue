<template>
<!-- 全屏图片展示页面 -->
<div v-if="visible" class="fullscreen-view" @click.stop>
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
        @click.stop="toggleLike(currentPhoto)"
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
      <el-button @click.stop="closeFullscreen" circle size="large">
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
    
    const imageTransform = ref({ x: 0, y: 0, scale: 1 });
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const lastTouchDistance = ref(0);
    const isMultiTouch = ref(false);
    
    const touchStartTime = ref(0);
    const clickTimeThreshold = 300;
    
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
    
    const handleClick = () => {
      // 单击退出全屏
      closeFullscreen();
    };
    
    // 检查是否为按钮元素
    const isButtonElement = (target) => {
      return target.closest('.el-button') || 
             target.closest('.fullscreen-like-button') || 
             target.closest('.fullscreen-close-button') ||
             target.closest('.navigation-buttons') ||
             target.closest('.photo-counter');
    };

    // 处理触摸开始
    const handleTouchStart = (event) => {
      // 检查触摸目标是否为按钮或其子元素
      if (isButtonElement(event.target)) {
        event.stopPropagation();
        return;
      }
      
      event.preventDefault();
      const touches = event.touches;
      
      // 记录触摸开始时间和位置
      touchStartTime.value = Date.now();
      
      if (touches.length === 1) {
        // 单指触摸 - 开始拖拽
        touchMode.value = 'none';
        isDragging.value = true;
        isMultiTouch.value = false;
        dragStart.value = {
          x: touches[0].clientX,
          y: touches[0].clientY
        };
      } else if (touches.length === 2) {
        // 双指触摸 - 开始缩放
        isMultiTouch.value = true;
        isDragging.value = false;
        lastTouchDistance.value = getTouchDistance(touches);
        touchMode.value = 'scale';
      }
    };
    
    // 处理触摸移动
    const handleTouchMove = (event) => {
      // 检查触摸目标是否为按钮或其子元素
      if (isButtonElement(event.target)) {
        event.stopPropagation();
        return;
      }
      
      event.preventDefault();
      const touches = event.touches;
      
      if (isDragging.value && touches.length === 1) {
        // 单指拖拽
        const deltaX = touches[0].clientX - dragStart.value.x;
        const deltaY = touches[0].clientY - dragStart.value.y;
        const totalDistance = Math.abs(deltaX) + Math.abs(deltaY);
        
        // 如果移动距离足够大，确定拖拽模式
        if (touchMode.value === 'none' && totalDistance > 10) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            touchMode.value = 'horizontal';
          } else {
            touchMode.value = 'vertical';
          }
        }
        
        // 根据模式处理拖拽
        if (touchMode.value === 'horizontal') {
          // 水平拖拽 - 用于切换图片
          imageTransform.value.x = deltaX;
          imageTransform.value.y = 0;
        } else if (touchMode.value === 'vertical') {
          // 垂直拖拽 - 用于退出全屏
          imageTransform.value.x = deltaX * 0.3; // 轻微的水平跟随
          imageTransform.value.y = deltaY;
        }
      } else if (isMultiTouch.value && touches.length === 2) {
        // 双指缩放
        touchMode.value = 'scale';
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
      if (isButtonElement(event.target)) {
        event.stopPropagation();
        return;
      }
      
      event.preventDefault();
      
      const touchDuration = Date.now() - touchStartTime.value;
      const deltaX = imageTransform.value.x;
      const deltaY = imageTransform.value.y;
      
      // 如果时间短且移动距离小，则认为是单击
      if (touchDuration < clickTimeThreshold && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        handleClick();
        return;
      }
      
      // 根据拖拽模式和距离处理结果
      if (touchMode.value === 'horizontal') {
        // 水平拖拽 - 切换图片
        if (Math.abs(deltaX) >= 100) {
          if (deltaX > 0) {
            prevPhoto();
          } else {
            nextPhoto();
          }
        } else {
          // 距离不够，恢复原位
          resetImageTransform();
        }
      } else if (touchMode.value === 'vertical') {
        // 垂直拖拽 - 退出全屏
        if (Math.abs(deltaY) >= 100) {
          closeFullscreen();
        } else {
          // 距离不够，恢复原位
          resetImageTransform();
        }
      } else if (touchMode.value === 'scale') {
        // 缩放模式 - 检查是否需要重置缩放
        if (imageTransform.value.scale < 1) {
          imageTransform.value.scale = 1;
        }
      }
      
      // 重置状态
      isDragging.value = false;
      isMultiTouch.value = false;
      lastTouchDistance.value = 0;
      touchMode.value = 'none';
    };

    const handleImageError = (event) => {
      // 使用更合适的默认图片
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSI3NjgiIHZpZXdCb3g9IjAgMCAxMDI0IDc2OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMjQiIGhlaWdodD0iNzY4IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik01MTIgMzA4QzQ2OC4yIDMwOCA0MzIgMzQ0LjIgNDMyIDM4OEM0MzIgNDMxLjggNDY4LjIgNDY4IDUxMiA0NjhDNTU1LjggNDY4IDU5MiA0MzEuOCA1OTIgMzg4QzU5MiAzNDQuMiA1NTUuOCAzMDggNTEyIDMwOFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHBhdGggZD0iTTUxMiA1MjhDNDY4LjIgNTI4IDQzMiA1NjQuMiA0MzIgNjA4QzQzMiA2NTEuOCA0NjguMiA2ODggNTEyIDY4OEM1NTUuOCA2ODggNTkyIDY1MS44IDU5MiA2MDhDNTkyIDU2NC4yIDU1NS44IDUyOCA1MTIgNTI4WiIgZmlsbD0iI0NDQ0NDQyIvPgo8L3N2Zz4K';
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

    // 重置图片变换状态
    const resetImageTransform = () => {
      touchMode.value = 'none';
      imageTransform.value = { x: 0, y: 0, scale: 1 };
    };

    const closeFullscreen = () => {
      // 重置图片变换
      resetImageTransform();
      emit('update:visible', false);
      emit('close');
    }

    const prevPhoto = () => {
      resetImageTransform();
      if (currentIndex.value > 0) {
        currentIndex.value--;
        currentPhoto.value = props.photos[currentIndex.value];
      } else {
        ElMessage.info('已经是第一张照片了');
      }
    }

    const nextPhoto = () => {
      resetImageTransform();
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
      
      const keyActions = {
        'ArrowLeft': () => {
          event.preventDefault();
          prevPhoto();
        },
        'ArrowRight': () => {
          event.preventDefault();
          nextPhoto();
        },
        'Escape': () => {
          event.preventDefault();
          closeFullscreen();
        }
      };
      
      const action = keyActions[event.key];
      if (action) {
        action();
      }
    }

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        currentIndex.value = props.initialIndex;
        currentPhoto.value = props.photos[props.initialIndex];
        
        // 重置图片变换
        resetImageTransform();
        
        // 设置导航栏z-index为1
        setNavbarZIndex(1);
      } else {
        // 恢复导航栏z-index为1000
        setNavbarZIndex(1000);
      }
    });

    // 防抖函数
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // 监听窗口大小变化
    const handleResize = debounce(() => {
      checkIsMobile();
    }, 100);

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
  z-index: 2000; 
  cursor: pointer;
  overflow: hidden;
  touch-action: none; 
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
  will-change: transform; /* 优化拖拽性能 */
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
  background: transparent;
  border: 2px solid rgb(255, 255, 255);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.fullscreen-like-button .el-button:hover,
.fullscreen-close-button .el-button:hover{
  background: rgb(238, 255, 175);
  border-color: rgb(233, 255, 110);
  transform: scale(1.1);
  color: black;
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
  background: transparent;
  border: 2px solid rgb(255, 255, 255);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.nav-button:hover {
  background: rgb(238, 255, 175);
  border-color: rgb(233, 255, 110);
  transform: scale(1.1);
  color: black;
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