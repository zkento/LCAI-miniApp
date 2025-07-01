<!-- 最后修改记录时间 -> 2025-04-29 10:30:00 -->
<template>
  <div class="home">
    <div class="hero-section">
      <h1>AI驱动的智能分析工具</h1>
      <p>选择您需要的工具，开始AI辅助分析</p>
    </div>
    
    <div class="features-grid">
      <div 
        v-for="feature in features" 
        :key="feature.path" 
        class="feature-card"
        @click="navigateTo(feature.path)"
      >
        <div class="feature-content">
          <div class="feature-icon">
            <el-icon><component :is="feature.icon" /></el-icon>
          </div>
          <h2>{{ feature.title }}</h2>
          <p>{{ feature.description }}</p>
          <div class="hover-button">开始使用</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <!-- 暂时停用底部Chat with AI入口
      <div class="ai-chat-entry" @click="toggleChatPanel">
        <el-icon><ChatLineRound /></el-icon>
        <span>Chat with AI</span>
      </div>
      -->
      <p>© 2025 良策网络 - 智能分析平台，保留所有权利.</p>
    </div>

    <!-- 聊天组件 -->
    <ChatWithAI 
      v-model:visible="chatVisible" 
      @send-message="handleSendMessage"
    />
  </div>
</template>

<script>
import { Document, OfficeBuilding, House, Money, ChatLineRound } from '@element-plus/icons-vue'
import ChatWithAI from '@/components/ChatWithAI.vue'
import { ref } from 'vue'
// 导入API函数
import { sendMessage } from '@/api/chat'

export default {
  name: 'Home',
  components: {
    Document,
    OfficeBuilding,
    House,
    Money,
    ChatLineRound,
    ChatWithAI
  },
  setup() {
    // 聊天面板显示状态
    const chatVisible = ref(false)
    
    // 切换聊天面板
    const toggleChatPanel = () => {
      chatVisible.value = !chatVisible.value
    }
    
    // 处理消息发送 - 注意这个函数已不再需要执行实际的API调用，
    // 因为ChatWithAI组件已经内置了API调用功能
    const handleSendMessage = (message) => {
      console.log('收到用户消息:', message)
      // 无需处理，ChatWithAI组件内部已经完成了API调用
    }
    
    return {
      chatVisible,
      toggleChatPanel,
      handleSendMessage
    }
  },
  data() {
    return {
      features: [
        {
          title: '个人征信分析',
          description: '上传个人征信报告，获取专业分析和建议',
          path: '/personal-credit',
          icon: 'Document'
        },
        {
          title: '企业征信分析',
          description: '上传企业征信报告，获取专业分析和建议',
          path: '/business-credit',
          icon: 'OfficeBuilding'
        },
        {
          title: '融资顾问报告',
          description: '描述客户融资相关需求，获取专业分析结果和融资报告',
          path: '/finance-advice',
          icon: 'Money'
        },
        {
          title: '买家顾问报告',
          description: '描述客户置业相关需求，获取专业分析结果和置业报告',
          path: '/property-advice',
          icon: 'House'
        }
      ]
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path)
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  padding: 32px 20px 24px;
}

.hero-section {
  text-align: center;
  margin-bottom: 32px;
}

.hero-section h1 {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 12px;
  font-weight: 600;
}

.hero-section p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 240px));
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
  margin-bottom: auto;
}

.feature-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  position: relative;
  aspect-ratio: 1;
}

.feature-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background-color: #e3f2fd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.feature-icon :deep(.el-icon) {
  font-size: 20px;
  color: var(--primary-color);
}

.feature-card h2 {
  font-size: 18px;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.feature-card p {
  color: #666;
  line-height: 1.5;
  margin: 0;
  font-size: 13px;
}

.hover-button {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  padding: 12px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card:hover .hover-button {
  transform: translateY(0);
}

.footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.footer p {
  margin: 0;
}

.ai-chat-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: white;
  color: #1b68de;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.ai-chat-entry:hover {
  background-color: #1b68de;
  color: white;
  border: 1px solid #1b68de;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ai-chat-entry :deep(.el-icon) {
  font-size: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style> 