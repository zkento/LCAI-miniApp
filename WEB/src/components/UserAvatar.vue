<template>
  <div class="user-avatar">
    <el-dropdown @command="handleCommand" v-if="userInfo" trigger="click">
      <div class="avatar-wrapper">
        <el-avatar :src="userInfo.avatar" :size="32" />
        <span class="username">{{ userInfo.username }}</span>
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="chat"><el-icon><ChatLineRound /></el-icon> Chat with AI</el-dropdown-item>
          <el-dropdown-item command="logout" class="centered-item">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 聊天组件 -->
    <ChatWithAI 
      v-model:visible="chatVisible" 
      @send-message="handleSendMessage"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { ArrowDown, ChatLineRound } from '@element-plus/icons-vue'
import ChatWithAI from '@/components/ChatWithAI.vue'

export default {
  name: 'UserAvatar',
  components: {
    ArrowDown,
    ChatLineRound,
    ChatWithAI
  },
  setup() {
    const store = useStore()
    const userInfo = computed(() => store.state.user.userInfo)
    const chatVisible = ref(false)

    const handleCommand = (command) => {
      if (command === 'logout') {
        store.dispatch('user/logout')
      } else if (command === 'chat') {
        toggleChatPanel()
      }
    }

    const toggleChatPanel = () => {
      chatVisible.value = !chatVisible.value
    }
    
    // 处理消息发送
    const handleSendMessage = (message) => {
      console.log('收到用户消息:', message)
      // 无需处理，ChatWithAI组件内部已经完成了API调用
    }

    return {
      userInfo,
      chatVisible,
      handleCommand,
      toggleChatPanel,
      handleSendMessage
    }
  }
}
</script>

<style scoped>
.user-avatar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.avatar-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.avatar-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  color: white;
  margin: 0 8px;
  font-size: 14px;
}

.el-icon--right {
  color: white;
  font-size: 12px;
  margin-left: 0px;
}

/* 为退出登录项添加居中样式 */
:deep(.centered-item) {
  justify-content: center;
}
</style> 