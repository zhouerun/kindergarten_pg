<template>
  <div class="honor-board">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="title">
        <span class="star-icon">⭐</span>
        荣誉墙
        <span class="star-icon">⭐</span>
      </h1>
      <p class="subtitle">让我们一起为孩子们的成长喝彩！</p>
    </div>

    <!-- 今日之星 -->
    <div class="award-section today-star">
      <div class="section-header">
        <h2>🌟 今日之星 🌟</h2>
        <div class="date">{{ today }}</div>
      </div>
      <div class="award-card featured">
        <div class="crown">👑</div>
        <div class="avatar-container">
          <div class="avatar">
            <img src="/resource/1.png" alt="今日之星" />
          </div>
        </div>
        <div class="info">
          <h3>小明</h3>
          <p class="class">小班 · 向日葵班</p>
          <p class="reason">今天帮助小朋友整理玩具，表现很棒！</p>
        </div>
        <div class="medal">🥇</div>
      </div>
    </div>

    <!-- 本周之星 -->
    <div class="award-section weekly-star">
      <div class="section-header">
        <h2>🏆 本周之星 🏆</h2>
        <div class="date">{{ weekRange }}</div>
      </div>
      <div class="award-grid">
        <div class="award-card" v-for="(star, index) in weeklyStars" :key="index">
          <div class="rank">{{ index + 1 }}</div>
          <div class="avatar-container">
            <div class="avatar">
              <img :src="star.avatar" :alt="star.name" />
            </div>
          </div>
          <div class="info">
            <h4>{{ star.name }}</h4>
            <p class="class">{{ star.class }}</p>
            <p class="achievement">{{ star.achievement }}</p>
          </div>
          <div class="medal">{{ star.medal }}</div>
        </div>
      </div>
    </div>

    <!-- 阅读打卡颁奖 -->
    <div class="award-section reading-awards">
      <div class="section-header">
        <h2>📚 阅读小达人 📚</h2>
        <div class="date">本月阅读排行榜</div>
      </div>
      <div class="reading-grid">
        <div class="reading-card" v-for="(reader, index) in readingChampions" :key="index">
          <div class="book-icon">📖</div>
          <div class="avatar-container">
            <div class="avatar">
              <img :src="reader.avatar" :alt="reader.name" />
            </div>
          </div>
          <div class="info">
            <h4>{{ reader.name }}</h4>
            <p class="class">{{ reader.class }}</p>
            <div class="stats">
              <span class="books">📚 {{ reader.books }} 本</span>
              <span class="days">📅 {{ reader.days }} 天</span>
            </div>
          </div>
          <div class="badge">{{ reader.badge }}</div>
        </div>
      </div>
    </div>

    <!-- 其他奖项 -->
    <div class="award-section other-awards">
      <div class="section-header">
        <h2>🎉 其他荣誉 🎉</h2>
      </div>
      <div class="awards-grid">
        <div class="award-item" v-for="award in otherAwards" :key="award.id">
          <div class="award-icon">{{ award.icon }}</div>
          <h4>{{ award.title }}</h4>
          <p>{{ award.description }}</p>
          <div class="winners">
            <span v-for="winner in award.winners" :key="winner" class="winner">
              {{ winner }}
            </span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 今日日期
const today = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// 本周日期范围
const weekRange = computed(() => {
  const now = new Date()
  const start = new Date(now.setDate(now.getDate() - now.getDay()))
  const end = new Date(now.setDate(now.getDate() - now.getDay() + 6))
  
  return `${start.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`
})

// 本周之星数据
const weeklyStars = ref([
  {
    name: '小红',
    class: '中班 · 彩虹班',
    achievement: '连续一周按时到校，表现优秀！',
    avatar: '/resource/2.png',
    medal: '🥇'
  },
  {
    name: '小华',
    class: '大班 · 星星班',
    achievement: '帮助老师整理教室，很有责任心！',
    avatar: '/resource/1.png',
    medal: '🥈'
  },
  {
    name: '小丽',
    class: '小班 · 向日葵班',
    achievement: '主动分享玩具，友爱同学！',
    avatar: '/resource/3.png',
    medal: '🥉'
  }
])

// 阅读小达人数据
const readingChampions = ref([
  {
    name: '小明',
    class: '大班 · 星星班',
    books: 15,
    days: 28,
    avatar: '/resource/1.png',
    badge: '🏆'
  },
  {
    name: '小红',
    class: '中班 · 彩虹班',
    books: 12,
    days: 25,
    avatar: '/resource/2.png',
    badge: '🥈'
  },
  {
    name: '小华',
    class: '小班 · 向日葵班',
    books: 10,
    days: 22,
    avatar: '/resource/3.png',
    badge: '🥉'
  }
])

// 其他奖项数据
const otherAwards = ref([
  {
    id: 1,
    icon: '🎨',
    title: '创意小画家',
    description: '绘画作品最有创意',
    winners: ['小明', '小红', '小华']
  },
  {
    id: 2,
    icon: '🎵',
    title: '音乐小天使',
    description: '唱歌跳舞最棒',
    winners: ['小丽', '小强', '小美']
  },
  {
    id: 3,
    icon: '🏃',
    title: '运动小健将',
    description: '体育表现最优秀',
    winners: ['小刚', '小芳', '小杰']
  },
  {
    id: 4,
    icon: '🤝',
    title: '友爱小天使',
    description: '最乐于助人',
    winners: ['小敏', '小伟', '小燕']
  }
])
</script>

<style scoped>
.honor-board {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.star-icon {
  animation: twinkle 2s infinite;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* 奖项区域 */
.award-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.section-header {
  text-align: center;
  margin-bottom: 25px;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 5px;
}

.date {
  color: #666;
  font-size: 0.9rem;
}

/* 今日之星 */
.today-star .award-card.featured {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  background-size: cover;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  position: relative;
  box-shadow: 0 15px 35px rgba(255, 215, 0, 0.3);
}

.crown {
  font-size: 3rem;
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  animation: bounce 2s infinite;
}

.avatar-container {
  position: relative;
  width: 80px;
  margin: 0 auto 15px;
}

.avatar {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  border: 4px solid white;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 旋转虚线边框 */
.avatar-container::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
  border: 4px dashed #fff0a3;
  animation: rotate 8s linear infinite;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 5px;
}

.class {
  color: #666;
  margin-bottom: 10px;
}

.reason {
  color: #555;
  font-style: italic;
}

.medal {
  font-size: 2rem;
  position: absolute;
  top: 20px;
  right: 20px;
}

/* 本周之星网格 */
.award-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.award-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 15px;
  padding: 20px;
  position: relative;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.award-card:hover {
  transform: translateY(-5px);
}

.rank {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.award-card .avatar-container {
  position: relative;
  width: 150px;
  margin: 0 auto 15px;
}

.award-card .avatar {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

/* 本周之星旋转边框 */
.award-card .avatar-container::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  border: 4px dashed #fce4ff;
  animation: rotate 10s linear infinite;
}

.award-card .info h4 {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.achievement {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 阅读小达人 */
.reading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.reading-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  color: white;
  position: relative;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.book-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.reading-card .avatar-container {
  position: relative;
  width: 150px;
  margin: 0 auto 10px;
}

.reading-card .avatar {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

/* 阅读小达人旋转边框 */
.reading-card .avatar-container::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  border: 4px dashed #b1dbff;
  animation: rotate 12s linear infinite reverse;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.stats span {
  font-size: 0.9rem;
  opacity: 0.9;
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
}

/* 其他奖项 */
.awards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.award-item {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.award-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.award-item h4 {
  color: #333;
  margin-bottom: 10px;
}

.award-item p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.winners {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.winner {
  background: rgba(255, 255, 255, 0.7);
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #333;
}



/* 动画 */
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-10px); }
  60% { transform: translateX(-50%) translateY(-5px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}


/* 响应式设计 */
@media (max-width: 768px) {
  .honor-board {
    padding: 15px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .award-section {
    padding: 20px;
  }
  
  .award-grid,
  .reading-grid,
  .awards-grid {
    grid-template-columns: 1fr;
  }
}
</style>