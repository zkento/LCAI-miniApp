<!-- 最后修改记录时间 -> 2025-04-30 12:00:00 -->
<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="localVisible" class="chat-with-ai-panel" :style="panelStyle" :class="{ 'dragging': isDragging, 'error-state': hasError }">
        <!-- 面板头部 - 可以拖动 -->
        <div class="panel-header" @mousedown="startDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
          <h3>
            <el-icon><ChatLineRound /></el-icon> Chat with AI
          </h3>
          <div class="panel-actions">
            <el-button 
              type="text" 
              icon="Refresh" 
              @click="showResetConfirm"
              class="action-btn reset-btn"
              title="重新开始对话"
            />
            <el-button 
              type="text" 
              icon="Close" 
              @click="close"
              class="action-btn close-btn"
              title="关闭"
            />
          </div>
        </div>

        <!-- 重置确认UI - 移至标题栏下方 -->
        <transition name="slide-down">
          <div v-if="confirmReset" class="reset-confirm">
            <span class="reset-confirm-message">重新开始对话将清空已有的对话内容，确认么？</span>
            <div class="reset-confirm-buttons">
              <el-button size="small" text @click="cancelReset">取消</el-button>
              <el-button size="small" type="primary" text @click="performReset">确认</el-button>
            </div>
          </div>
        </transition>

        <!-- 聊天内容区域 -->
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(message, index) in messages" 
               :key="index" 
               :class="['message', message.role, {'error': hasError && index === messages.length - 1 && message.role === 'assistant'}]">
            <div class="message-avatar" v-if="message.role === 'assistant'">AI</div>
            <div class="message-content">
              <div class="message-text" v-if="message.role === 'user'" v-html="formatUserMessage(message.content)"></div>
              <div class="message-text markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
          
          <!-- AI回复思考中动画 -->
          <div v-if="thinking" class="message assistant thinking">
            <div class="message-avatar">AI</div>
            <div class="message-content">
              <div class="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-container">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="请输入你的对话内容... (Enter发送，Shift+Enter换行)"
              resize="none"
              @keydown.enter="handleEnterKey"
              class="message-input"
              ref="inputRef"
            />
            <el-button 
              type="primary" 
              circle
              :disabled="!inputMessage.trim() || thinking" 
              @click="sendMessage"
              class="send-button"
            >
              <el-icon><Position /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineRound, Position } from '@element-plus/icons-vue'
import markdownit from 'markdown-it'
// 导入API函数并重命名以避免冲突
import { sendMessage as sendMessageToAPI } from '@/api/chat'

export default {
  name: 'ChatWithAI',
  components: {
    ChatLineRound,
    Position
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'send-message'],
  setup(props, { emit }) {
    // 本地可见性状态，用于v-model绑定
    const localVisible = ref(props.visible)
    
    // 监听props变化，更新本地状态
    watch(() => props.visible, (newValue) => {
      localVisible.value = newValue
      // 当面板变为可见时，等待DOM更新后聚焦输入框
      if (newValue) {
        nextTick(() => {
          // 自动滚动到底部显示最后的聊天内容
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
          }
          
          // 聚焦输入框
          if (inputRef.value) {
            inputRef.value.focus()
          }
        })
      }
    })
    
    // 聊天消息列表
    const messages = ref([
      {
        role: 'assistant',
        content: '我是良策AI助手，有什么可以帮到您的吗？'
      }
    ])
    
    // 当前输入的消息
    const inputMessage = ref('')
    
    // 思考中状态
    const thinking = ref(false)
    
    // 错误状态
    const hasError = ref(false)
    
    // 消息容器引用
    const messagesContainer = ref(null)
    
    // 输入框引用
    const inputRef = ref(null)
    
    // 拖动相关状态
    const isDragging = ref(false)
    const dragStartX = ref(0)
    const dragStartY = ref(0)
    
    // 面板位置 - 更新为左下角
    const panelPosition = reactive({
      x: 30, // 左侧间距
      y: window.innerHeight - 650 // 底部间距，考虑窗口高度
    })
    
    // 计算面板样式 - 更新宽高
    const panelStyle = reactive({
      left: panelPosition.x + 'px',
      top: panelPosition.y + 'px',
      width: '420px',
      height: '620px'
    })
    
    // 添加变量控制是否忽略返回的结果
    const shouldIgnoreResult = ref(false)
    
    // 重置确认状态
    const confirmReset = ref(false)
    
    // 显示重置确认UI
    const showResetConfirm = () => {
      // 如果只有初始欢迎消息，无需确认直接重置
      if (messages.value.length > 1) {
        confirmReset.value = true
      } else {
        // 没有对话内容，直接重置
        performReset()
      }
    }
    
    // 取消重置
    const cancelReset = () => {
      confirmReset.value = false
      // 取消后聚焦输入框
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
        }
      })
    }
    
    // 执行实际的重置操作
    const performReset = () => {
      // 如果正在等待AI响应，标记应该忽略结果
      if (thinking.value) {
        shouldIgnoreResult.value = true
      }
      
      // 重置状态
      thinking.value = false
      confirmReset.value = false
      
      ElMessage({
        message: '已重置为新的聊天',
        type: 'info'
      })
      
      messages.value = [
        {
          role: 'assistant',
          content: '我是良策AI助手，有什么可以帮到您的吗？'
        }
      ]
      
      hasError.value = false
      
      // 滚动到底部
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
        
        // 重置后聚焦输入框
        if (inputRef.value) {
          inputRef.value.focus()
        }
      })
    }
    
    // 处理拖动开始
    const startDrag = (event) => {
      isDragging.value = true
      dragStartX.value = event.clientX - panelPosition.x
      dragStartY.value = event.clientY - panelPosition.y
      
      document.addEventListener('mousemove', handleDrag)
    }
    
    // 处理拖动中
    const handleDrag = (event) => {
      if (!isDragging.value) return
      
      // 计算新位置，并限制在视窗内
      const newX = Math.max(0, Math.min(window.innerWidth - 400, event.clientX - dragStartX.value))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, event.clientY - dragStartY.value))
      
      // 更新位置
      panelPosition.x = newX
      panelPosition.y = newY
      
      // 更新样式
      panelStyle.left = panelPosition.x + 'px'
      panelStyle.top = panelPosition.y + 'px'
    }
    
    // 处理拖动结束
    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', handleDrag)
    }
    
    // 发送消息
    const sendMessage = async () => {
      const message = inputMessage.value.trim()
      if (!message || thinking.value) return
      
      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: message
      })
      
      // 清空输入框
      inputMessage.value = ''
      
      // 滚动到底部
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
      
      // 发送后重新聚焦输入框
      if (inputRef.value) {
        inputRef.value.focus()
      }
      
      // 设置思考中状态
      thinking.value = true
      hasError.value = false
      
      // 发出事件，通知父组件处理消息发送（保留此行以保持兼容性）
      emit('send-message', message)
      
      try {
        // 准备API请求所需的消息，去除初始欢迎消息
        const apiMessages = messages.value.length > 2 
          ? messages.value
          : messages.value.slice(1)
        
        // 发送消息到API
        const response = await sendMessageToAPI(apiMessages, 'chat')
        
        // 如果在等待返回结果过程中用户重置了聊天，则忽略这个结果
        if (shouldIgnoreResult.value) {
          shouldIgnoreResult.value = false
          return
        }
        
        // 将AI回复添加到消息列表
        messages.value.push(response)
      } catch (error) {
        console.error('发送消息失败:', error)
        
        // 如果在等待返回结果过程中用户重置了聊天，则不显示错误
        if (shouldIgnoreResult.value) {
          shouldIgnoreResult.value = false
          return
        }
        
        // 显示错误消息
        ElMessage.error(error.message || '发送消息失败，请重试')
        
        // 设置错误状态
        hasError.value = true
        
        // 添加错误提示到聊天列表
        messages.value.push({
          role: 'assistant',
          content: `抱歉，我遇到了一些问题：${error.message || '服务连接失败，请稍后重试'}`
        })
      } finally {
        // 如果没有被忽略，则更新状态
        if (!shouldIgnoreResult.value) {
          thinking.value = false
          
          // 滚动到底部
          nextTick(() => {
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
            
            // 响应后再次聚焦输入框
            if (inputRef.value) {
              inputRef.value.focus()
            }
          })
        }
      }
    }
    
    // 处理回车键事件
    const handleEnterKey = (event) => {
      // 如果按下Shift+Enter，允许换行
      if (event.shiftKey) {
        return
      }
      
      // 如果按下Enter但没有Shift，阻止默认行为并发送消息
      event.preventDefault()
      
      // 检查是否可以发送消息（输入框不为空且不在思考中）
      if (inputMessage.value.trim() && !thinking.value) {
        sendMessage()
      }
    }
    
    // 渲染Markdown
    const md = new markdownit({
      linkify: true,
      breaks: true
    })
    
    // 配置链接在新标签页打开
    const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }
    
    md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
      // 给所有链接添加target="_blank"和rel="noopener noreferrer"属性
      const aIndex = tokens[idx].attrIndex('target')
      
      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank'])
      } else {
        tokens[idx].attrs[aIndex][1] = '_blank'
      }
      
      const relIndex = tokens[idx].attrIndex('rel')
      
      if (relIndex < 0) {
        tokens[idx].attrPush(['rel', 'noopener noreferrer'])
      } else {
        tokens[idx].attrs[relIndex][1] = 'noopener noreferrer'
      }
      
      return defaultRender(tokens, idx, options, env, self)
    }
    
    // 处理自动检测到的链接
    const autoLinkDefaultRender = md.renderer.rules.linkify_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }
    
    md.renderer.rules.linkify_open = function(tokens, idx, options, env, self) {
      // 给所有自动检测的URL链接添加target="_blank"和rel属性
      tokens[idx].attrPush(['target', '_blank'])
      tokens[idx].attrPush(['rel', 'noopener noreferrer'])
      
      return autoLinkDefaultRender(tokens, idx, options, env, self)
    }
    
    const renderMarkdown = (text) => {
      return md.render(text)
    }
    
    // 处理用户消息中的换行符
    const formatUserMessage = (text) => {
      if (!text) return ''
      // 将换行符转换为<br>标签，同时进行HTML转义防止XSS
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
    }
    
    // 关闭面板
    const close = () => {
      localVisible.value = false
      emit('update:visible', false)
    }
    
    // 监听消息变化，自动滚动到底部
    watch(messages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }, { deep: true })
    
    // 监听窗口大小变化，调整面板位置
    const handleResize = () => {
      // 确保面板不会超出窗口边界
      const maxX = window.innerWidth - 450
      const maxY = window.innerHeight - 600
      
      if (panelPosition.x > maxX) {
        panelPosition.x = maxX
        panelStyle.left = panelPosition.x + 'px'
      }
      
      if (panelPosition.y > maxY) {
        panelPosition.y = maxY
        panelStyle.top = panelPosition.y + 'px'
      }
    }
    
    // 初始化时添加事件监听
    onMounted(() => {
      window.addEventListener('mouseup', stopDrag)
      window.addEventListener('resize', handleResize)
    })
    
    // 清理事件监听
    onUnmounted(() => {
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', handleDrag)
    })
    
    return {
      localVisible,
      messages,
      inputMessage,
      thinking,
      hasError,
      messagesContainer,
      inputRef,
      isDragging,
      panelStyle,
      startDrag,
      stopDrag,
      showResetConfirm,
      cancelReset,
      performReset,
      confirmReset,
      sendMessage,
      renderMarkdown,
      close,
      handleEnterKey,
      formatUserMessage
    }
  }
}
</script>

<style scoped>
.chat-with-ai-panel {
  position: fixed;
  z-index: 5000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  transform: translateZ(0);
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-with-ai-panel.dragging {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  opacity: 0.95;
}

.chat-with-ai-panel.error-state .panel-header {
  background-color: #f56c6c;
}

.panel-header {
  padding: 12px 16px;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
  transition: background-color 0.3s ease;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  color: white;
  margin-left: 8px;
}

/* 重新添加按钮悬停效果并增强可见度 */
.reset-btn:hover {
  color: #ffffff99;
  transform: translateY(-1px);
  transform: rotate(45deg);
  transition-duration: 0.5s;
}

.close-btn:hover {
  color: #ffffff99;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #fafafa;
  scrollbar-width: thin; /* 添加Firefox滚动条细化支持 */
}

/* 添加聊天区域的细滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px; /* 与HistoryPanel一致的宽度 */
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.message {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
  animation: message-fade-in 0.3s ease-out;
}

@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  background-color: #fff;
  padding: 10px 12px;
  border-radius: 16px;
  max-width: calc(100% - 50px);
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.message.assistant .message-content {
  border-top-left-radius: 1px;
  margin-right: 40px;
}

.message.user .message-content {
  background-color: #deebff;
  color: #1b68de;
  border-bottom-right-radius: 1px;
  margin-left: 4px;
}

.message.error .message-content {
  background-color: #ffebeb;
  color: #e74c3c;
  animation: error-pulse 1.5s ease-in-out;
}

@keyframes error-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
}

.message-text {
  line-height: 1.5;
  font-size: 14px;
}

/* 保证用户消息中的换行正确显示 */
.message.user .message-text {
  white-space: normal;
  word-break: break-word;
}

.message.user .message-text br {
  display: block;
  content: "";
  margin-top: 4px;
}

.markdown-content :deep(p) {
  margin: 0 0 8px;
}

.markdown-content :deep(pre) {
  background-color: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
}

.thinking .thinking-indicator {
  display: flex;
  gap: 6px;
  padding: 10px;
}

.thinking .thinking-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #a0a0a0;
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking .thinking-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.thinking .thinking-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking .thinking-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  padding: 16px;
  /* border-top: 1px solid #e9e9e9; */
}

/* 重置确认UI样式 - 重新设计为轻量简洁风格 */
.reset-confirm {
  background-color: #f0f7ff;
  border-bottom: 1px solid #e0eafc;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.reset-confirm-message {
  flex: 1;
}

.reset-confirm-buttons {
  display: flex;
  gap: 4px;
}

/* 轻量过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.input-container {
  display: flex;
  align-items: center;
  background-color: #f2f3f5;
  border-radius: 24px;
  padding: 8px 8px 8px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  background-color: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
  resize: none;
  line-height: 1.6;
  max-height: 120px;
  font-size: 14px;
  color: #303133;
}

.message-input :deep(.el-textarea__inner::placeholder) {
  color: #9ca3af;
  font-size: 13px;
  opacity: 0.8;
}

.message-input :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

/* 优化输入框滚动条样式 */
.message-input :deep(.el-textarea__inner::-webkit-scrollbar) {
  width: 5px;
}

.message-input :deep(.el-textarea__inner::-webkit-scrollbar-thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

.message-input :deep(.el-textarea__inner::-webkit-scrollbar-track) {
  background: transparent;
}

.send-button {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

<style>
/* 确保确认弹窗显示在最上层 */
.reset-confirm-dialog {
  z-index: 9999 !important;
}
</style> 