<template>
  <div class="app">
    <el-container>
      <el-header v-if="!isStandaloneView">
        <div class="header-content">
          <div class="left-section">
            <router-link to="/" class="logo-container">
              <img src="@/assets/logo.png" alt="良策网络 Logo" class="logo-image" />
              <div class="separator"></div>
              <div class="site-title">
                <span class="title-text">良策AI</span>
                <span class="subtitle">智能分析平台<span class="beta-tag"> Beta</span></span>
              </div>
            </router-link>
          </div>
          <div class="right-section">
            <HistoryButton />
            <UserAvatar />
          </div>
        </div>
      </el-header>
      <el-main :class="{ 'standalone-view-main': isStandaloneView }">
        <router-view></router-view>
      </el-main>
    </el-container>
    
    <!-- 历史记录弹层 -->
    <HistoryPanel v-if="!isStandaloneView" />
  </div>
</template>

<script>
import { onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import UserAvatar from '@/components/UserAvatar.vue'
import HistoryButton from '@/components/HistoryButton.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  components: {
    UserAvatar,
    HistoryButton,
    HistoryPanel
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    
    // 判断当前路由是否为独立视图（贷款计算器或任务结果查看器）
    const isStandaloneView = computed(() => {
      return route.path === '/loan-calculator' || route.path === '/task-result'
    })
    
    onMounted(() => {
      store.dispatch('user/initUserInfo')
      store.dispatch('history/fetchHistoryList')
    })
    
    return {
      isStandaloneView
    }
  }
}
</script>

<style>
.app {
  min-height: 100vh;
}

.el-header {
  background-color: #1b68de;
  padding: 0 5%;
  height: 64px !important;
  line-height: 64px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
}

.left-section {
  display: flex;
  align-items: center;
}

.right-section {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  text-decoration: none;
  height: 64px;
}

.logo-image {
  height: 32px;
}

.separator {
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.4);
  margin: 0 20px;
}

.site-title {
  display: flex;
  align-items: center;
  line-height: normal;
}

.title-text {
  color: white;
  font-size: 22px;
  font-weight: 600;
}

.subtitle {
  color: white;
  font-size: 16px;
  font-weight: normal;
  opacity: 0.9;
  margin-left: 8px;
}

.beta-tag {
  color: var(--el-text-color-placeholder);
}

.el-main {
  padding: 0;
  background-color: #f5f7fa;
}

.standalone-view-main {
  padding: 0;
  background-color: #f5f7fa;
  height: 100vh;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

:root {
  --primary-color: #1b68de;
}

.el-button--primary {
  --el-button-bg-color: var(--primary-color) !important;
  --el-button-border-color: var(--primary-color) !important;
  --el-button-hover-bg-color: #4285f4 !important;
  --el-button-hover-border-color: #4285f4 !important;
}

/* 添加响应式布局样式 */
@media (max-width: 768px) {
  .el-header {
    padding: 0 4%;
  }
  
  .separator {
    margin: 0 15px;
  }
  
  .title-text {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 13px;
    margin-left: 6px;
  }
  
  .logo-image {
    height: 32px;
  }
}

@media (max-width: 480px) {
  .el-header {
    padding: 0 3%;
  }
  
  .separator {
    margin: 0 10px;
  }
  
  .title-text {
    font-size: 18px;
  }
  
  .subtitle {
    font-size: 12px;
    margin-left: 4px;
  }
  
  .logo-image {
    height: 28px;
  }
}
</style> 