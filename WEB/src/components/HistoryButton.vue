<template>
  <div class="history-button">
    <el-button
      type="primary"
      @click="toggleHistoryPanel"
      class="history-btn"
    >
      <div class="icon-wrapper">
        <el-icon class="icon"><component :is="'Clock'" /></el-icon>
        <div class="badge" v-if="activeTaskCount > 0">{{ activeTaskCount }}</div>
      </div>
      <span>历史任务</span>
    </el-button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { Clock } from '@element-plus/icons-vue'

export default {
  name: 'HistoryButton',
  components: {
    Clock
  },
  setup() {
    const store = useStore()
    const isPanelVisible = computed(() => store.state.history.historyPanelVisible)
    
    // 计算活跃任务数量（排队中和进行中）
    const activeTaskCount = computed(() => {
      return store.getters['history/activeTaskCount']
    })
    
    const toggleHistoryPanel = () => {
      if (isPanelVisible.value) {
        store.dispatch('history/hideHistoryPanel')
      } else {
        store.dispatch('history/showHistoryPanel')
      }
    }
    
    return {
      toggleHistoryPanel,
      isPanelVisible,
      activeTaskCount
    }
  }
}
</script>

<style scoped>
.history-button {
  margin-right: 16px;
}

.history-btn {
  background-color: transparent !important;
  border: none !important;
  color: white;
  font-weight: 400;
  display: flex;
  align-items: center;
  padding: 20px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.history-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.icon-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 8px;
}

.icon {
  font-size: 16px;
  color: white;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background-color: #f56c6c;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid white;
}
</style> 