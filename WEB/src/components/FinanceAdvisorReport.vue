<template>
  <div class="finance-advisor-report">
    <!-- 处理步骤区域 - 只在第一步之后显示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
        <el-step title="提交客户需求" />
        <el-step v-if="hasCreditReport" title="AI分析征信报告" />
        <el-step title="匹配金融产品" />
        <el-step title="融资建议报告" />
      </el-steps>
    </div>
    
    <!-- 各步骤对应的内容区域 -->
    <div class="step-content">
      <!-- 步骤1: 客户需求提交 -->
      <div v-if="activeStep === 1" class="step-container">
        <FinanceAdvisorForm @submit="handleFormSubmit" />
      </div>
      
      <!-- 步骤2: AI分析征信报告 (仅在上传了征信报告时显示) -->
      <div v-if="hasCreditReport && activeStep === 2" class="step-container">
        <div class="placeholder-content">
          <el-icon><Loading /></el-icon>
          <p>AI正在分析客户征信报告，该功能正在开发中...</p>
        </div>
      </div>
      
      <!-- 步骤3: 匹配金融产品 -->
      <div v-if="(hasCreditReport && activeStep === 3) || (!hasCreditReport && activeStep === 2)" class="step-container">
        <div class="Ai-thinking-container">
          <!-- 匹配产品的蒙层，当AI未开始返回思考过程的内容前显示 -->
          <div v-if="workingStatus === 'working'" class="working-overlay">
            <div class="overlay-content">
              <div class="animation-container">
                <div class="loading-brain">
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <path class="brain-path" d="M25,50 Q35,30 50,30 Q65,30 75,50 T50,70 T25,50" stroke="#1b5dd3" fill="none" stroke-width="3" />
                    <circle class="pulse-circle" cx="50" cy="50" r="3" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="35" cy="40" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="65" cy="40" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="30" cy="50" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="70" cy="50" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="40" cy="60" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="60" cy="60" r="2" fill="#1b5dd3" />
                  </svg>
                </div>
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="wait-footer">
                  <div class="ai-tip">
                    正在等待AI响应，请稍等...
                  </div>  
                  <div class="ai-timer">
                    <div class="timer-icon">
                      <el-icon><Timer /></el-icon>
                    </div>
                    已耗时 {{ workingTimer }} 秒
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <!-- AI思考过程内容容器，当思考模式开始后显示 -->
          <div v-if="workingStatus === 'thinking' || workingStatus === 'generating'" class="thinking-container">
            <div class="panel-header">
              <h3>
                <el-icon class="header-icon"><Cpu /></el-icon>
                <span v-if="isThinking" class="thinking-status">AI正在深度思考中...</span>
                <span v-else-if="workingStatus === 'generating'" class="thinking-completed">AI思考已完成。</span>
              </h3>
            </div>
            <div class="panel-content">
              <!-- 报告生成过渡提示，不遮挡思考内容，而是以悬浮提示形式展示 -->
              <div v-if="workingStatus === 'generating'" class="generating-overlay">
                <div class="generating-content">
                  <div class="loading-spinner"></div>
                  <div class="generating-message">即将生成融资建议报告...</div>
                </div>
              </div>
              
              <div class="thinking-display" :class="{ 'dimmed': workingStatus === 'generating' }">
                <span v-html="displayedThinkingProcess"></span>
              </div>
            </div>
          </div>
          
          <!-- 这里是返回思考过程后的内容容器，当AI开始响应后会移除蒙层显示内容 -->
          <div v-if="workingStatus === 'complete'" class="product-working-content">
            <!-- 这里后面会添加内容 -->
          </div>
        </div>
      </div>
      
      <!-- 步骤4: 生成融资报告 -->
      <div v-if="(hasCreditReport && activeStep === 4) || (!hasCreditReport && activeStep === 3)" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧AI分析结果 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><Document /></el-icon>
                  融资顾问报告 <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
                </h3>
                <div class="header-actions">
                  <el-button 
                    v-show="reportContent" 
                    type="primary" 
                    size="small"
                    @click="downloadReport"
                    class="action-button"
                  >
                    <el-icon><Download /></el-icon>下载报告
                  </el-button>
                  <el-button 
                    v-show="reportContent" 
                    type="warning" 
                    size="small"
                    @click="restartAdvisor"
                    class="action-button"
                  >
                  <el-icon><House /></el-icon>新的任务
                  </el-button>
                </div>
              </div>
              <div class="panel-content">
                <div class="report-content markdown-content" v-html="renderMarkdown(reportContent)"></div>
              </div>
            </div>
            
            <!-- 右侧区域（AI思考过程和咨询）-->
            <div class="report-right">
              <!-- 上部分：AI匹配产品思考过程 -->
              <div class="report-right-top" :style="{ height: `var(--vertical-split, ${verticalSplit}%)` }">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><Cpu /></el-icon>
                    AI深度思考过程
                  </h3>
                </div>
                <div class="panel-content">
                  <div class="thinking-content">
                    <div v-if="aiThinkingProcess" class="work-thinking" v-html="workThinkingContent"></div>
                    <template v-for="(thinking, index) in consultationThinkingProcesses" :key="index">
                      <div class="thinking-separator" v-if="index > 0 || aiThinkingProcess">
                        <span class="separator-line"></span>
                        <span class="separator-text">新的咨询AI思考过程</span>
                        <span class="separator-line"></span>
                      </div>
                      <div class="consultation-thinking" v-html="thinking"></div>
                    </template>
                  </div>
                </div>
              </div>
              
              <!-- 可调整大小的垂直分隔线 -->
              <div class="resizer-vertical" @mousedown="startResizeVertical"></div>
              
              <!-- 下部分：继续向AI咨询 -->
              <div class="report-right-bottom" :style="{ height: `calc(100% - var(--vertical-split, ${verticalSplit}%) - 6px)` }">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><ChatDotSquare /></el-icon>
                    继续向AI咨询
                    <span v-if="consultationThinkingTimer > 0" class="thinking-status">
                      AI正在回复中 {{consultationThinkingTimer}}秒
                    </span>
                    <span v-else-if="consultationResponseStatus" class="response-status">
                      {{consultationResponseStatus}} 耗时{{consultationResponseTime}}秒
                    </span>
                  </h3>
                </div>
                
                <!-- 聊天内容区域 -->
                <div class="chat-messages" ref="messagesContainer">
                  <div v-for="(message, index) in consultationMessages" 
                       :key="index" 
                       :class="['message', message.role]">
                    <div class="message-avatar" v-if="message.role === 'assistant'">AI</div>
                    <div class="message-content">
                      <div class="message-text" v-if="message.role === 'user'" v-html="formatUserMessage(message.content)"></div>
                      <div class="message-text markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
                    </div>
                  </div>
                  
                  <!-- AI回复思考中动画 -->
                  <div v-if="consultationLoading" class="message assistant thinking">
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

                <!-- 聊天输入框 -->
                <div class="chat-input">
                  <div class="input-container">
                    <el-input
                      v-model="consultationInput"
                      type="textarea"
                      :rows="2"
                      placeholder="请输入你要咨询的内容... (Enter发送，Shift+Enter换行)"
                      resize="none"
                      @keydown.enter="handleEnterKey"
                      class="message-input"
                      ref="inputRef"
                    />
                    <el-button 
                      type="primary" 
                      circle
                      :disabled="!consultationInput.trim() || consultationLoading" 
                      @click="sendConsultationMessage"
                      class="send-button"
                    >
                      <el-icon><Position /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 可调整大小的分隔线 -->
            <div class="resizer-horizontal" @mousedown="startResizeHorizontal"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Loading, Download, InfoFilled, Refresh, ArrowDown, Document, Cpu, ChatDotSquare, Timer } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import FinanceAdvisorForm from './FinanceAdvisorForm.vue';
import { sendMessage } from '../api/chat';
import financingAdvicePrompt from '../config/prompts/financing-advice.js';

export default {
  name: 'FinanceAdvisorReport',
  components: {
    FinanceAdvisorForm,
    Loading,
    Download,
    InfoFilled,
    Refresh,
    ArrowDown,
    Document,
    Cpu,
    ChatDotSquare,
    Timer
  },
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['step-change', 'report-complete'],
  setup(props, { emit }) {
    // 当前活动步骤
    const activeStep = ref(1);
    
    // 是否上传了征信报告
    const hasCreditReport = ref(false);
    
    // 用户提交的表单数据
    const formData = ref(props.initialData || {});
    
    // 匹配产品的状态
    const workingStatus = ref('idle'); // idle, working, thinking, generating, complete
    
    // 匹配计时器
    const workingTimer = ref(0);
    let workingTimerInterval = null;
    
    // 匹配结果
    const workingResult = ref(null);
    
    // AI匹配产品思考过程
    const aiThinkingProcess = ref('');
    const displayedThinkingProcess = ref(''); // 用于逐字显示的思考过程
    const isThinking = ref(false); // AI是否正在思考
    let thinkingInterval = null; // 思考过程展示的计时器
    let thinkingIndex = 0; // 当前处理到的思考内容索引
    
    // 报告内容
    const reportContent = ref('');
    const reportGenerationDuration = ref(0);
    
    // 咨询相关
    const consultationMessages = ref([]);
    const consultationInput = ref('');
    const consultationLoading = ref(false);
    const consultationThinkingTimer = ref(0);
    const consultationThinkingDots = ref('');
    const consultationResponseStatus = ref('');
    const consultationResponseTime = ref(0);
    const consultationThinkingProcesses = ref([]); // 存储多个思考过程的数组
    let consultationThinkingInterval = null;
    let mutationObserver = null; // 用于监听输入框高度变化
    
    
    
    // 分栏调整
    const horizontalSplit = ref(60);
    const isResizingHorizontal = ref(false);
    let resizeThrottleTimeout = null;
    let lastResizeTime = 0;
    
    // 垂直分隔线相关
    const verticalSplit = ref(50);
    const isResizingVertical = ref(false);
    
    // 计算实际的步骤数量
    const totalSteps = computed(() => hasCreditReport.value ? 4 : 3);
    
    // 初始匹配产品的思考内容
    const workThinkingContent = ref('');
    
    // 消息容器引用
    const messagesContainer = ref(null);
    
    // 渲染Markdown内容
    const renderMarkdown = (text) => {
      if (!text) return '';
      
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
      
      const rawHtml = marked(text);
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      
      return cleanHtml;
    };
    
    // 处理用户消息中的换行符
    const formatUserMessage = (text) => {
      if (!text) return '';
      // 将换行符转换为<br>标签，同时进行HTML转义防止XSS
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
    }
    
    // 开始匹配产品的计时器
    const startWorkingTimer = () => {
      workingTimer.value = 0;
      workingTimerInterval = setInterval(() => {
        workingTimer.value++;
      }, 1000);
    };
    
    // 停止匹配产品的计时器
    const stopWorkingTimer = () => {
      if (workingTimerInterval) {
        clearInterval(workingTimerInterval);
        workingTimerInterval = null;
      }
    };
    
    // 开始咨询思考状态计时
    const startConsultationThinking = () => {
      consultationThinkingTimer.value = 0;
      consultationThinkingDots.value = '';
      consultationResponseStatus.value = '';
      consultationResponseTime.value = 0;
      
      // 启动计时器
      consultationThinkingInterval = setInterval(() => {
        consultationThinkingTimer.value++;
        // 动态更新省略号
        consultationThinkingDots.value = '.'.repeat((consultationThinkingTimer.value % 3) + 1);
      }, 1000);
    };
    
    // 停止咨询思考状态计时
    const stopConsultationThinking = (status = 'success', error = '') => {
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
        consultationThinkingInterval = null;
        consultationResponseTime.value = consultationThinkingTimer.value;
        consultationThinkingTimer.value = 0;
        consultationThinkingDots.value = '';
        
        // 设置响应状态
        if (status === 'success') {
          consultationResponseStatus.value = 'AI已回复';
        } else {
          consultationResponseStatus.value = error || '请求失败';
        }
      }
    };
    
    // 添加 handleEnterKey 函数
    const handleEnterKey = (event) => {
      // 如果按下Shift+Enter，允许换行
      if (event.shiftKey) {
        return
      }
      
      // 如果按下Enter但没有Shift，阻止默认行为并发送消息
      event.preventDefault()
      
      // 检查是否可以发送消息（输入框不为空且不在思考中）
      if (consultationInput.value.trim() && !consultationLoading.value) {
        sendConsultationMessage()
      }
    }
    
    // 开始匹配产品
    const startAiWorking = async () => {
      try {
        workingStatus.value = 'working';
        startWorkingTimer();
        
        // 构建用于匹配产品的消息
        const AiWorkingMessage = {
          role: 'user',
          content: `我需要融资，具体需求如下：
          - 贷款类型: ${formData.value.loanType || '未指定'}
          - 贷款金额: ${formData.value.loanAmount ? formData.value.loanAmount + '万元' : '未指定'}
          - 贷款期限: ${formData.value.loanTerm || 0}月
          - 贷款利率: ${formData.value.interestRate || 0}%
          - 还款方式: ${formData.value.repaymentMethod?.join(', ') || '未指定'}
          - 其他需求: ${formData.value.requirements || '无'}
          - 关键词: ${getKeywordsText(formData.value.aiKeywords)}`
        };
        
        // 添加征信报告信息（如果有）
        if (hasCreditReport.value) {
          AiWorkingMessage.content += `\n\n我有征信报告，报告显示我的信用情况良好。`;
        }
        
        // 设置固定等待时间为5秒后再模拟AI思考过程
        // 在实际接入AI时，移除此代码，使用真实的等待时间
        setTimeout(() => {
          // 强制设置workingTimer为5秒，模拟固定的等待时间
          workingTimer.value = 5;
          
          // 模拟AI思考过程
          // 设置完整的AI思考过程数据
          const fullThinkingProcess = `正在分析客户需求：
"${formData.value.requirements}"

思考过程：
嗯，客户需要融资2000万，用来维持日常经营，每月还款不超过2万。这看起来有点挑战性，因为金额大，还款压力小。首先，我得先搞清楚客户的实际情况。比如，他们是什么行业？经营状况如何？有没有抵押物或者担保？这些都会影响融资渠道的选择。

首先，常规的银行贷款可能不太行，因为2000万的贷款，每月还款2万的话，利息可能都不够。假设年利率5%，一年的利息就要100万，分摊到每月就是8万多，远远超过客户的预算。所以银行贷款可能需要更长的还款期限或者更低的利率，但客户资质可能达不到。

然后考虑股权融资，客户愿意出让股权吗？如果企业有增长潜力，吸引投资者的话，可能可以融到资，但需要时间，而且客户可能不想失去控制权。不过股权融资不需要每月还款，可能符合客户的现金流需求。

政府补贴或低息贷款也是一个方向，特别是如果客户属于高新技术、绿色能源等扶持行业。这类贷款可能利息低，还款期限长，甚至有无息的可能。需要了解客户是否符合条件，以及申请流程和竞争情况。

供应链融资可能适用，如果客户有稳定的上下游合作伙伴，可以利用应收账款或库存融资。比如保理或者存货抵押，这样可能减少现金流压力，但需要看客户的供应链情况是否支持。

融资租赁的话，如果客户有固定资产需要购买，可以通过租赁方式分摊成本，但需要已有设备或计划购置新设备，可能不太适合日常经营资金。

P2P或者民间借贷利率太高，每月还款压力大，风险也高，不太推荐，除非其他渠道都不行。

还有发行债券，但需要企业资质较好，可能达不到要求，且利息可能还是高过客户的还款能力。

另外，可以考虑组合不同的融资方式，比如一部分股权融资，一部分政府补贴贷款，再加上供应链融资，分散来源，降低还款压力。或者寻找长期低息的贷款产品，延长还款期限，比如十年期以上的贷款，这样每月还款额会降低。

可能需要客户提供更多信息，比如企业规模、行业、财务状况、现有资产等，才能更准确地推荐合适的方案。同时，客户的信用评级、是否有抵押物也很关键。如果客户有房产或其他资产抵押，可能更容易获得低息贷款。

还要注意，客户说"所有渠道都可以"，但有些渠道风险较高，比如民间借贷，可能会带来法律问题或更高的成本，需要权衡利弊。此外，融资成本除了利息，可能还有手续费、股权稀释等隐形成本，需要全面评估。

最后，可能需要专业的财务顾问或金融机构来定制方案，根据客户的具体情况，综合各种融资工具，设计出既能满足资金需求，又符合还款能力的方案。

我现在要解决的问题是：总贷款30万，年利率2.2%，期限5年，从2022年7月19日放款，到2027年8月还清。采用等额本息方式，每月还款5550元，2022年8月首次还款。现在需要计算到2025年3月20日为止，已还的本金和剩余未还的本金分别是多少。

首先，我需要理清楚时间线。贷款是在2022年7月19日放款的，首次还款是在2022年8月，应该是每个月的某个固定日期还款，比如每月1日或者每月19日？不过问题中没有说明具体还款日，但一般可能在放款日的对应日，比如每月19日，或者可能每月1日。不过这里可能需要做一些假设，或者根据常规情况来处理。

不过可能更简单的是，既然已经知道每月还款额是5550元，总期限是5年，也就是60个月。放款日期是2022年7月19日，到2027年8月还清，所以总共有60个月，最后一期可能在2027年8月还完。因此，还款周期是从2022年8月到2027年8月，共60个月。

现在要计算到2025年3月20日为止，已经还了多少期，还剩多少期。然后根据等额本息的计算方法，计算已还本金和剩余本金。

首先，确定从2022年8月到2025年3月之间有多少个月。2022年8月到2025年3月，这段时间是：

从2022年8月到2023年7月是12个月，然后2023年8月到2024年7月又是12个月，2024年8月到2025年3月是8个月。所以总共有12+12+8=32个月？不过需要更准确的计算。

好了，模拟思考的内容差不多就得了，够了，就这样吧。`;

          // 开始模拟AI思考过程逐字显示
          aiThinkingProcess.value = fullThinkingProcess; // 保存完整内容以便后续使用
          displayedThinkingProcess.value = ''; // 清空已显示的内容
          thinkingIndex = 0; // 重置索引
          const startTime = Date.now(); // 记录开始时间
          
          // 切换状态到思考中
          workingStatus.value = 'thinking';
          isThinking.value = true;
          
          // 移除光标闪烁代码，不再需要
          
          // 计算文本总长度和每秒应该显示的字符数，以确保在30-50秒内完成
          const totalLength = fullThinkingProcess.length;
          // 每秒应该处理的字符数，按40秒计算（为了保证在30-50秒的区间内）
          const charsPerSecond = totalLength / 40;
          
          // 启动逐字显示
          if (thinkingInterval) clearInterval(thinkingInterval);
          thinkingInterval = setInterval(() => {
            if (thinkingIndex < fullThinkingProcess.length) {
              // 计算当前已经过的时间(秒)
              const elapsedTime = (Date.now() - startTime) / 1000;
              
              // 计算按当前速度应该显示到的索引位置
              const targetIndex = Math.floor(elapsedTime * charsPerSecond);
              
              // 计算本次应该显示多少字符
              let chunkSize = 1;
              
              // 如果落后于目标进度，则加速
              if (thinkingIndex < targetIndex - 20) {
                chunkSize = 3; // 严重落后，快速追赶
              } else if (thinkingIndex < targetIndex - 5) {
                chunkSize = 2; // 略有落后，稍微加速
              } else if (thinkingIndex > targetIndex + 10) {
                // 如果超前太多，则减速或暂停
                clearInterval(thinkingInterval);
                setTimeout(() => {
                  // 一段时间后再继续
                  thinkingInterval = setInterval(() => {
                    // 继续逐字显示的代码会在这里重新启动
                    if (thinkingIndex < fullThinkingProcess.length) {
                      displayedThinkingProcess.value += fullThinkingProcess[thinkingIndex];
                      thinkingIndex++;
                      
                      // 自动滚动到底部
                      const thinkingContent = document.querySelector('.thinking-display');
                      if (thinkingContent) {
                        thinkingContent.scrollTop = thinkingContent.scrollHeight;
                      }
                    } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 慢速显示
                }, 400); // 长时间暂停
                return;
              }
              
              // 保证不会越界
              const remainingChars = fullThinkingProcess.length - thinkingIndex;
              const actualChunkSize = Math.min(chunkSize, remainingChars);
              
              // 添加字符块到显示内容
              const nextChunk = fullThinkingProcess.substring(thinkingIndex, thinkingIndex + actualChunkSize);
              displayedThinkingProcess.value += nextChunk;
              thinkingIndex += actualChunkSize;
              
              // 检查是否遇到特殊字符需要停顿
              const lastChar = nextChunk[nextChunk.length - 1];
              if (lastChar === '。' || lastChar === '\n' || lastChar === '：') {
                // 句子结束后稍微暂停
                clearInterval(thinkingInterval);
                setTimeout(() => {
                  // 自动滚动到底部
                  const thinkingContent = document.querySelector('.thinking-display');
                  if (thinkingContent) {
                    thinkingContent.scrollTop = thinkingContent.scrollHeight;
                  }
                  
                  // 继续逐字显示
                  thinkingInterval = setInterval(() => {
                    // 重新检查当前时间和进度
                    const currentElapsedTime = (Date.now() - startTime) / 1000;
                    const currentTargetIndex = Math.floor(currentElapsedTime * charsPerSecond);
                    
                    if (thinkingIndex < fullThinkingProcess.length) {
                      // 在暂停后，根据当前进度决定速度
                      let chunkSize = 1;
                      if (thinkingIndex < currentTargetIndex - 10) {
                        chunkSize = 2; // 如果落后，稍微加速
                      }
                      
                      const remainingChars = fullThinkingProcess.length - thinkingIndex;
                      const actualChunkSize = Math.min(2, remainingChars);
                      
                      const nextChunk = fullThinkingProcess.substring(thinkingIndex, thinkingIndex + actualChunkSize);
                      displayedThinkingProcess.value += nextChunk;
                      thinkingIndex += actualChunkSize;
                      
                      // 自动滚动到底部
                      const thinkingContent = document.querySelector('.thinking-display');
                      if (thinkingContent) {
                        thinkingContent.scrollTop = thinkingContent.scrollHeight;
                      }
                    } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 句末后的显示速度
                }, 300); // 句末停顿时间
              }
              
              // 自动滚动到底部
              const thinkingContent = document.querySelector('.thinking-display');
              if (thinkingContent) {
                thinkingContent.scrollTop = thinkingContent.scrollHeight;
              }
            } else {
              // 所有内容显示完毕
              finishThinking(startTime);
            }
          }, 40); // 基础显示间隔
        }, 5000); // 5秒后开始显示思考过程
        
      } catch (error) {
        console.error('匹配产品时出错:', error);
        workingStatus.value = 'error';
        stopWorkingTimer();
      }
    };
    
    // 定义结束显示的函数
    const finishThinking = (startTime) => {
      // 计算已经过的时间
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = elapsedMs / 1000;
      
      // 如果显示完成时间少于30秒，则延迟一段时间再完成
      if (elapsedSec < 30) {
        const remainingTime = (30 - elapsedSec) * 1000;
        console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒，将等待${(remainingTime/1000).toFixed(1)}秒后结束`);
        
        // 清除原有的逐字显示计时器
        if (thinkingInterval) {
          clearInterval(thinkingInterval);
          thinkingInterval = null;
        }
        
        // 设置延迟，确保总时间不少于30秒
        setTimeout(() => {
          completeThinking();
        }, remainingTime);
      } else {
        // 如果已经超过30秒，直接完成
        console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒，直接结束`);
        completeThinking();
      }
    };
    
    // 完成思考过程
    const completeThinking = () => {
      // 清除计时器
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }

      
      // 显示完整思考内容
      displayedThinkingProcess.value = aiThinkingProcess.value;
      // 保存初始匹配产品的思考内容
      workThinkingContent.value = aiThinkingProcess.value;
      isThinking.value = false;
      
      // 延迟一会，让用户看到完整的思考过程
      setTimeout(() => {
        // 转换为生成报告状态，添加过渡效果
        workingStatus.value = 'generating';
        
        // 延迟约3秒后生成报告，提供良好的过渡体验
        setTimeout(() => {
          // 生成融资报告
          generateReport();
        }, 3000);
      }, 1000);
    };
    
    // 生成报告
    const generateReport = () => {
      const currentDate = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-');
      
      reportContent.value = `# 融资顾问融资建议报告

编制日期：${currentDate}

## 一、客户需求与征信概况

**客户姓名**：${formData.value.name || '未提供'}
**联系电话**：${formData.value.phone || '未提供'}
**业务地区**：${formData.value.businessArea?.length >= 2 ? formData.value.businessArea.join('-') : '未提供'}
**融资金额**：${formData.value.loanAmount ? formData.value.loanAmount + '万元' : '未提供'}
**融资方式**：${formData.value.loanType === 'mortgage' ? '按揭贷款' : 
           formData.value.loanType === 'secured' ? '抵押贷款' : 
           formData.value.loanType === 'credit' ? '信用贷款' : '未指定'}
**详细需求描述**：${formData.value.requirements || '用户未提供详细描述'}
**需求关键词**：${getKeywordsText(formData.value.aiKeywords)}
**征信情况**：${hasCreditReport.value ? '已提供征信报告，总体良好' : '未提供征信报告'}



## 二、推荐的产品方案

### 方案1：优质客户信用贷
- **贷款额度**：最高50万元
- **贷款期限**：1-3年
- **贷款利率**：3.8%
- **产品特点**：免抵押、利率低、放款快
- **申请条件**：征信良好、稳定工作、年收入10万以上

### 方案2：小微企业经营贷
- **贷款额度**：最高200万元
- **贷款期限**：1-5年
- **贷款利率**：4.5%
- **产品特点**：支持企业经营、手续简便、额度高
- **申请条件**：营业执照满1年、月均流水5万以上

### 方案3：房产抵押贷款
- **贷款额度**：最高500万元
- **贷款期限**：1-10年
- **贷款利率**：3.0%
- **产品特点**：利率超低、额度高、还款方式灵活
- **申请条件**：有房产、征信良好

## 三、还款计划对比

| 方案 | 月供(元) | 总利息(元) | 总还款额(元) |
| --- | --- | --- | --- |
| 优质客户信用贷(3年) | 14,689 | 28,804 | 528,804 |
| 小微企业经营贷(5年) | 9,326 | 59,560 | 559,560 |
| 房产抵押贷款(10年) | 4,828 | 79,360 | 579,360 |

## 四、风险提示与优化建议

1. 优化建议
   - 提供完整的收入证明，有助于提高贷款额度
   - 保持良好的信用记录，避免逾期还款
   - 整理近6个月的银行流水，证明稳定的收入来源

2. 风险提示
   - 务必在还款能力范围内申请贷款
   - 贷款期限越长，总利息支出越高
   - 提前还款可能涉及违约金，请详细了解产品条款

## 五、最终建议

根据您的需求和情况，我们推荐您选择"优质客户信用贷"，该产品无需抵押，审批速度快，适合您的需求。如果您希望获得更大额度且有房产，可以考虑"房产抵押贷款"方案。

## 六、融资方案审批材料清单

1. 基础材料
   - **身份证**原件及复印件
   - **近6个月银行流水**
   - **收入证明**或纳税证明

2. 根据贷款方案需额外提供
   - 优质客户信用贷：**工作证明**、**劳动合同**
   - 小微企业经营贷：**营业执照**、**经营场所证明**
   - 房产抵押贷款：**房产证明**、**房屋估值报告**

如需了解更多详情或有任何疑问，请随时咨询我们的客服人员。`;
      
      // 更新状态为完成
      workingStatus.value = 'complete';
      stopWorkingTimer();
      reportGenerationDuration.value = workingTimer.value;
      
      // 添加初始系统消息到咨询消息列表
      consultationMessages.value.push({
        role: 'assistant',
        content: '我是良策AI助手，本次客户的融资建议报告已生成。您可以继续向我咨询以获取更多建议。'
      });
      
      // 进入下一步
      nextStep();
    };
    
    // 停止所有思考过程相关的计时器
    const stopThinkingProcess = () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      // 移除光标闪烁相关代码，不再需要
      
      isThinking.value = false;
    };
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      // 更新表单数据
      formData.value = data;
      
      // 检查是否上传了征信报告，直接使用表单数据中的hasCreditReport属性
      hasCreditReport.value = data.hasCreditReport || false;
      
      // 打印AI关键词以便调试
      console.log('AI提取的关键词：', data.aiKeywords);
      
      // 确保aiKeywords是可用的格式
      if (data.aiKeywords && Array.isArray(data.aiKeywords)) {
        // 检查关键词格式并处理
        if (data.aiKeywords.length > 0 && typeof data.aiKeywords[0] === 'object') {
          // 已经是对象格式，确保每个对象有value属性
          console.log('关键词是对象格式:', data.aiKeywords[0]);
        } else {
          // 是简单字符串数组，转换为对象格式
          console.log('关键词是字符串格式，转换为对象格式');
          formData.value.aiKeywords = data.aiKeywords.map((keyword, index) => ({
            key: `keyword_${index}`,
            value: keyword,
            type: 'black'
          }));
        }
      }
      
      // 移动到下一步
      nextStep();
      
      // 通知父组件步骤已变化
      emit('step-change', { step: activeStep.value, data: formData.value });
    };
    
    // 进入下一步
    const nextStep = () => {
      if (activeStep.value < totalSteps.value) {
        activeStep.value++;
        
        // 根据当前步骤执行相应的操作
        if ((hasCreditReport.value && activeStep.value === 3) || 
            (!hasCreditReport.value && activeStep.value === 2)) {
          // 匹配金融产品步骤
          startAiWorking();
        }
      } else {
        // 所有步骤完成，通知父组件
        emit('report-complete', { 
          ...formData.value, 
          report: reportContent.value 
        });
      }
    };
    
    // 发送咨询消息
    const sendConsultationMessage = async () => {
      if (!consultationInput.value.trim() || consultationLoading.value) return;
      
      // 创建用户消息对象
      const userMessage = {
        role: 'user',
        content: consultationInput.value.trim()
      };
      consultationMessages.value.push(userMessage);
      consultationInput.value = '';
      consultationLoading.value = true;
      
      // 滚动到底部
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
      
      // 启动思考状态显示
      startConsultationThinking();
      
      try {
        // 模拟AI思考过程
        const question = userMessage.content;
        const thinkingProcessContent = `用户的咨询内容："${question}"
思考过程：
我现在需要帮用户生成一段模拟AI深度思考过程的文字和一段简短的回复。用户之前已经收到了一份正式的融资建议报告，现在他们继续咨询，要求生成模拟的AI思考过程和回复。用户特别指出，希望内容不要那么正式，要明确说明这是模拟生成的。
好了，模拟思考的内容差不多就得了，够了，就这样吧。`;

        // 将思考过程存储为完整内容以备后用
        const fullThinkingContent = thinkingProcessContent;
        
        // 先添加一个空字符串到思考过程数组
        consultationThinkingProcesses.value.push('');
        
        // 获取当前思考过程的索引
        const currentThinkingIndex = consultationThinkingProcesses.value.length - 1;
        
        // 准备逐字显示
        let typingIndex = 0;
        const startTime = Date.now();
        const totalLength = fullThinkingContent.length;
        
        // 计算每秒应该显示的字符数，控制在10秒左右完成
        const charsPerSecond = totalLength / 10;
        
        // 完成咨询思考过程的显示函数
        const completeConsultationThinking = () => {
          // 确保显示完整内容
          consultationThinkingProcesses.value[currentThinkingIndex] = fullThinkingContent;
          
          // 生成回复内容
          const reply = `
回复部分要简短，50字左右，同样要非正式，用轻松的语气，确认可行性，并鼓励用户进一步提问。让用户清楚这是模拟内容，保持轻松语气，覆盖所有关键点，同时确保信息准确无误。`;
          
          // 延迟一定时间后模拟AI回复
          setTimeout(() => {
            // 添加回复到消息列表
            consultationMessages.value.push({
              role: 'assistant',
              content: reply
            });
            
            // 更新状态
            consultationLoading.value = false;
            stopConsultationThinking('success');
            
            // 自动滚动到底部通过watch实现，不需要在这里手动执行
          }, 1000);
        };
        
        // 创建逐字显示的计时器
        const typingInterval = setInterval(() => {
          if (typingIndex < fullThinkingContent.length) {
            // 计算当前已经过的时间(秒)
            const elapsedTime = (Date.now() - startTime) / 1000;
            
            // 计算按当前速度应该显示到的索引位置
            const targetIndex = Math.floor(elapsedTime * charsPerSecond);
            
            // 计算本次应该显示多少字符
            let chunkSize = 1;
            
            // 如果落后于目标进度，则加速
            if (typingIndex < targetIndex - 10) {
              chunkSize = 3; // 严重落后，快速追赶
            } else if (typingIndex < targetIndex - 5) {
              chunkSize = 2; // 略有落后，稍微加速
            }
            
            // 保证不会越界
            const remainingChars = fullThinkingContent.length - typingIndex;
            const actualChunkSize = Math.min(chunkSize, remainingChars);
            
            // 添加字符块到显示内容
            const nextChunk = fullThinkingContent.substring(typingIndex, typingIndex + actualChunkSize);
            
            // 更新数组中对应索引的内容
            consultationThinkingProcesses.value[currentThinkingIndex] += nextChunk;
            typingIndex += actualChunkSize;
            
            // 检查是否遇到特殊字符需要停顿
            const lastChar = nextChunk[nextChunk.length - 1];
            if (lastChar === '。' || lastChar === '\n' || lastChar === '：') {
              // 句子结束后稍微暂停
              clearInterval(typingInterval);
              setTimeout(() => {
                // 自动滚动到底部
                const thinkingContent = document.querySelector('.thinking-content');
                if (thinkingContent) {
                  thinkingContent.scrollTop = thinkingContent.scrollHeight;
                }
                
                // 继续逐字显示
                const continuedInterval = setInterval(() => {
                  if (typingIndex < fullThinkingContent.length) {
                    // 添加下一个字符
                    const nextChar = fullThinkingContent[typingIndex];
                    consultationThinkingProcesses.value[currentThinkingIndex] += nextChar;
                    typingIndex++;
                    
                    // 自动滚动到底部
                    const thinkingContent = document.querySelector('.thinking-content');
                    if (thinkingContent) {
                      thinkingContent.scrollTop = thinkingContent.scrollHeight;
                    }
                  } else {
                    // 所有内容显示完毕
                    clearInterval(continuedInterval);
                    completeConsultationThinking();
                  }
                }, 40); // 较慢速度继续显示
              }, 200); // 短暂停顿
              return;
            }
            
            // 自动滚动到底部
            const thinkingContent = document.querySelector('.thinking-content');
            if (thinkingContent) {
              thinkingContent.scrollTop = thinkingContent.scrollHeight;
            }
          } else {
            // 所有内容显示完毕
            clearInterval(typingInterval);
            completeConsultationThinking();
          }
        }, 30); // 基础显示间隔
      } catch (error) {
        console.error('发送咨询消息出错:', error);
        consultationLoading.value = false;
        stopConsultationThinking('error', '请求失败，请重试');
        ElMessage.error('发送失败，请重试');
      }
    };
    
    // 滚动聊天消息到底部
    const scrollToBottom = (selector, forceScroll = true) => {
      const element = document.querySelector(selector);
      if (element) {
        // 只有当内容接近底部或强制滚动时才滚动到底部
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 30;
        if (forceScroll || isNearBottom) {
          // 使用requestAnimationFrame确保DOM已更新
          requestAnimationFrame(() => {
            element.scrollTop = element.scrollHeight;
          });
        }
      }
    };
    
    // 下载报告
    const downloadReport = () => {
      try {
        if (!reportContent.value) {
          throw new Error('未找到报告内容');
        }

        // 创建Blob对象
        const blob = new Blob([reportContent.value], { type: 'text/markdown;charset=utf-8' });

        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `融资顾问报告_${new Date().toISOString().slice(0, 10)}.md`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理URL对象
        URL.revokeObjectURL(link.href);

        ElMessage.success('报告已下载');
      } catch (error) {
        console.error('下载报告时出错:', error);
        ElMessage.error('下载失败，请重试');
      }
    };
    
    // 水平调整分隔线相关方法
    const startResizeHorizontal = (e) => {
      isResizingHorizontal.value = true;
      document.addEventListener('mousemove', resizeHorizontal);
      document.addEventListener('mouseup', stopResizeHorizontal);
      e.preventDefault();
    };
    
    const resizeHorizontal = (e) => {
      if (!isResizingHorizontal.value) return;
      
      const now = Date.now();
      if (now - lastResizeTime < 16) { // 约60fps
        return;
      }
      lastResizeTime = now;
      
      if (resizeThrottleTimeout) {
        clearTimeout(resizeThrottleTimeout);
      }
      
      resizeThrottleTimeout = setTimeout(() => {
        const container = e.target.closest('.report-layout') || document.querySelector('.report-layout');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        
        // 计算分隔比例，限制在20%-80%之间
        let percentage = Math.max(20, Math.min(80, (mouseX / containerRect.width) * 100));
        horizontalSplit.value = percentage;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--horizontal-split', `${percentage}%`);
        
        // 实时更新输入框容器的样式，确保它总是占据右侧部分的全宽
        requestAnimationFrame(() => {
          // 强制刷新布局并更新输入区域样式
          const chatInput = document.querySelector('.chat-input');
          const chatRightSection = document.querySelector('.report-right-bottom');
          
          if (chatInput && chatRightSection) {
            // 确保输入区域宽度与右侧底部区域匹配
            chatInput.style.width = '100%';
            chatInput.style.left = '0';
            chatInput.style.right = '0';
          }
        });
      }, 10);
    };
    
    const stopResizeHorizontal = () => {
      isResizingHorizontal.value = false;
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
    };
    
    // 添加一个辅助函数，用于安全地从关键词数组中提取文本
    const getKeywordsText = (keywords) => {
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return '无';
      }
      
      return keywords.map(keyword => {
        if (typeof keyword === 'string') {
          return keyword;
        } else if (typeof keyword === 'object') {
          // 尝试获取value或text属性
          return keyword.value || keyword.text || JSON.stringify(keyword);
        } else {
          return String(keyword);
        }
      }).join('、');
    };
    
    // 添加一个辅助函数来随机选择一个关键词
    const getRandomKeyword = (keywords) => {
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return '快速融资';
      }
      
      const randomIndex = Math.floor(Math.random() * keywords.length);
      const keyword = keywords[randomIndex];
      
      if (typeof keyword === 'string') {
        return keyword;
      } else if (typeof keyword === 'object') {
        return keyword.value || keyword.text || '快速审批';
      } else {
        return String(keyword);
      }
    };
    
    // 垂直调整大小处理
    const resizeVertical = (e) => {
      if (!isResizingVertical.value) return;
      
      const now = Date.now();
      if (now - lastResizeTime < 16) { // 约60fps
        return;
      }
      lastResizeTime = now;
      
      if (resizeThrottleTimeout) {
        clearTimeout(resizeThrottleTimeout);
      }
      
      resizeThrottleTimeout = setTimeout(() => {
        const container = e.target.closest('.report-right') || document.querySelector('.report-right');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const mouseY = e.clientY - containerRect.top;
        
        // 计算分隔比例，限制在20%-80%之间
        let percentage = Math.max(20, Math.min(80, (mouseY / containerRect.height) * 100));
        verticalSplit.value = percentage;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--vertical-split', `${percentage}%`);
        
        // 防止滚动内容自动弹跳
        // 延迟一会儿后刷新布局
        setTimeout(() => {
          // 触发一次布局刷新，但不强制滚动
          scrollToBottom('.thinking-content', false);
          scrollToBottom('.chat-messages', false);
        }, 100);
      }, 10);
    };
    
    // 停止垂直调整大小
    const stopResizeVertical = () => {
      isResizingVertical.value = false;
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
    };
    

    
    // 初始化CSS变量
    onMounted(() => {
      // 设置初始的水平分隔比例
      document.documentElement.style.setProperty('--horizontal-split', '55%');
      // 设置初始的聊天输入框宽度
      document.documentElement.style.setProperty('--chat-input-width', '40%');
      // 设置初始的垂直分隔比例
      document.documentElement.style.setProperty('--vertical-split', '50%');
      
      // 设置MutationObserver监听输入区域高度变化
      // 监听DOM变化的观察者
      const setupObservers = () => {
        // 确保先断开之前的连接
        if (mutationObserver) {
          mutationObserver.disconnect();
          mutationObserver = null;
        }
        
        try {
          const textarea = document.querySelector('.chat-input textarea');
          const textareaContainer = document.querySelector('.chat-input');
          
          if (!textarea || !textareaContainer) return;
          
          const observer = new MutationObserver((mutations) => {
            try {
              // 处理DOM变化
            } catch (e) {
              console.warn('MutationObserver回调错误:', e);
            }
          });
          
          // 使用try-catch包裹observe调用
          try {
            observer.observe(textarea, {
              attributes: true,
              attributeFilter: ['style', 'class']
            });
            
            observer.observe(textareaContainer, {
              attributes: true,
              attributeFilter: ['style', 'class']
            });
            
            // 保存observer引用以便在组件卸载时清理
            mutationObserver = observer;
          } catch (e) {
            console.warn('设置MutationObserver失败:', e);
          }
        } catch (e) {
          console.warn('创建MutationObserver失败:', e);
        }
      };
      
      // 初始调用设置
      setupObservers();

    });
    
    // 清理计时器和事件监听
    onUnmounted(() => {
      stopWorkingTimer();
      stopThinkingProcess();
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
      }
      
      // 清理MutationObserver
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      

      
      // 移除事件监听器
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--chat-input-width');
    });
    
    // 重新开始顾问流程
    const restartAdvisor = () => {
      ElMessageBox.confirm('确定要开始新的融资顾问流程吗？', '操作提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置所有状态
        activeStep.value = 1; // 设置为第一步，显示需求提交表单
        formData.value = {};
        reportContent.value = '';
        aiThinkingProcess.value = '';
        consultationMessages.value = [];
        workingStatus.value = 'idle';
        consultationInput.value = '';
        
        // 触发步骤变更
        emit('step-change', { step: activeStep.value, data: formData.value });
        
        // ElMessage({
        //   type: 'success',
        //   message: '已重置顾问报告流程'
        // });
      }).catch(() => {
        // 用户取消操作
      });
    };
    
    // 监听咨询消息变化，自动滚动到底部
    watch(consultationMessages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }, { deep: true });
    
    // 开始垂直调整大小
    const startResizeVertical = (e) => {
      isResizingVertical.value = true;
      document.addEventListener('mousemove', resizeVertical);
      document.addEventListener('mouseup', stopResizeVertical);
      // 记录初始位置
      lastResizeTime = Date.now();
    };
    
    return {
      activeStep,
      hasCreditReport,
      formData,
      workingStatus,
      workingTimer,
      workingResult,
      reportContent,
      reportGenerationDuration,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationThinkingDots,
      consultationResponseStatus,
      consultationResponseTime,
      handleFormSubmit,
      renderMarkdown,
      formatUserMessage,
      sendConsultationMessage,
      downloadReport,
      startResizeHorizontal,
      aiThinkingProcess,
      displayedThinkingProcess,
      workThinkingContent,
      consultationThinkingProcesses,
      isThinking,
      verticalSplit,
      isResizingVertical,
      startResizeVertical,
      restartAdvisor,
      messagesContainer,
      handleEnterKey
    };
  }
};
</script>

<style lang="scss" scoped>
/* 步骤条自定义样式 */
:deep(.el-steps--simple) {
  background-color: #ffffff !important;
}

:deep(.el-step__title.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

:deep(.el-step__head.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

.finance-advisor-report {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  --horizontal-split: 55%;
}

.steps-header {
  border-bottom: 1px solid #ebeef5;
  background-color: white;
}

.step-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  position: relative;
}

.step-container {
  height: 100%;
  overflow: auto;
}

/* AI思考容器 */
.Ai-thinking-container {
  position: relative;
  height: 100%;
}

/* 等待加载遮罩 */
.working-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.overlay-content {
  width: 90%;
  max-width: 900px;  
  overflow: hidden;
}

.animation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-brain {
  margin-bottom: 0;
}

.loading-dots {
  display: flex;
  gap: 10px;
  margin-top: -10px;
  
  span {
    width: 5px;
    height: 5px;
    background-color: #1b5dd3;
    border-radius: 50%;
    display: inline-block;
    animation: dots-loader 1.4s infinite ease-in-out both;
    
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

.wait-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  
  .ai-timer {
    display: flex;
    align-items: center;
    color: #909399;
    font-size: 14px;
    margin-right: 30px;
    
    .timer-icon {
      margin-right: 2px;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .ai-tip {
    color: #000000;
    font-size: 14px;
  }
}

/* 大脑动画 */
.brain-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: brain-draw 3s infinite;
}

.pulse-circle {
  animation: pulse 2s infinite;
  opacity: 0.6;
  transform-origin: center;
}

.pulse-circle:nth-child(2) { animation-delay: 0.2s; }
.pulse-circle:nth-child(3) { animation-delay: 0.4s; }
.pulse-circle:nth-child(4) { animation-delay: 0.6s; }
.pulse-circle:nth-child(5) { animation-delay: 0.8s; }
.pulse-circle:nth-child(6) { animation-delay: 1.0s; }
.pulse-circle:nth-child(7) { animation-delay: 1.2s; }

/* 思考容器 */
.thinking-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
}

.thinking-display {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 14px;
  line-height: 1.6;
  height: 100%;
  width: 100%;
  max-width: 100%;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  padding: 16px;
  text-align: left;
  box-sizing: border-box;
  transition: opacity 0.3s ease;
  
  &.dimmed {
    opacity: 0.5;
  }
}

/* 生成报告遮罩 */
.generating-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
  
  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #c3c3c3;
    border-top: 3px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
  
  .generating-message {
    font-size: 14px;
    font-weight: 400;
    color: #ffffff;
    white-space: nowrap;
  }
}

/* 报告布局 */
.report-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.report-layout {
  display: grid;
  grid-template-columns: var(--horizontal-split, 55%) calc(100% - var(--horizontal-split, 55%));
  height: 100%;
  position: relative;
  overflow: hidden;
}

.report-left, .report-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100%;
}

.report-left {
  border-right: 1px solid #dcdfe6;
}

.report-right-top {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #dcdfe6;
  height: var(--vertical-split, 50%);
  max-height: var(--vertical-split, 50%);
}

.report-right-bottom {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100% - var(--vertical-split, 50%) - 6px);
  max-height: calc(100% - var(--vertical-split, 50%) - 6px);
  position: relative;
}

.report-right-bottom .panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: auto;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

.report-right-top .panel-content,
.report-right-bottom .panel-content,
.report-left .panel-content {
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  word-wrap: break-word;
  word-break: break-all;
}

.report-left .panel-content {
  padding-right: 0;
}

/* 思考内容区 */
.thinking-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 14px;
  line-height: 1.6;
  height: 100%;
  width: 100%;
  max-width: 100%;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 16px;
  text-align: left;
  box-sizing: border-box;
}

.report-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  line-height: 1.6;
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;
}

/* 分隔线样式 */
.resizer-vertical {
  position: absolute;
  left: auto; /* 移除左侧锚定 */
  width: calc(100% - var(--horizontal-split, 55%)); /* 仅占据右侧区域宽度 */
  right: 0; /* 从右侧锚定 */
  height: 6px;
  background-color: transparent;
  cursor: row-resize;
  z-index: 10;
  top: var(--vertical-split, 50%);
  transform: translateY(-3px);
  
  &:hover, 
  &:active {
    background-color: rgba(64, 158, 255, 0.2);
  }
}

.resizer-horizontal {
  position: absolute;
  top: 0;
  left: var(--horizontal-split, 55%);
  width: 6px;
  height: 100%;
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  transform: translateX(-3px);
}

.resizer-horizontal:hover, .resizer-horizontal:active {
  background-color: rgba(64, 158, 255, 0.2);
}

/* 分隔线样式 */
.thinking-separator {
  margin: 30px 0 20px 0;
  display: flex;
  align-items: center;
}

.separator-line {
  flex: 1;
  height: 3px;
  background: radial-gradient(circle at 0 1px, #6595dd 30%, transparent 30%);
  background-size: 5px 2px;
  background-repeat: repeat-x;
  opacity: 0.6;
}

.separator-text {
  padding: 0 16px;
  font-size: 14px;
  color: #1b68de;
  font-weight: 400;
}

/* 聊天区域样式 */
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #fafafa;
}

.message {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
  animation: message-fade-in 0.3s ease-out;
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

.message-text {
  line-height: 1.5;
  font-size: 14px;
}

.message.user .message-text {
  white-space: normal;
  word-break: break-word;
}

.message.user .message-text br {
  display: block;
  content: "";
  margin-top: 4px;
}

/* 思考指示器 */
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

/* 聊天输入区域 */
.chat-input {
  padding: 14px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
  display: flex;
}

.input-container {
  display: flex;
  align-items: center;
  background-color: #f2f3f5;
  border-radius: 24px;
  padding: 8px 8px 8px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  width: 100%;
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
  width: 6px;
}

.message-input :deep(.el-textarea__inner::-webkit-scrollbar-thumb) {
  background-color: rgba(144, 147, 153, 0.6);
  border-radius: 4px;
}

.message-input :deep(.el-textarea__inner::-webkit-scrollbar-track) {
  background: transparent;
}

.send-button {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 面板样式 */
.panel-header {
  padding: 0 16px;
  height: 50px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f7fa;
  z-index: 1;
  
  h3 {
    display: flex;
    align-items: center;
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    
    .header-icon {
      margin-right: 6px;
      font-size: 22px;
      color: #1b5dd3;
      vertical-align: middle;
    }
    
    .thinking-status {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
    }
    
    .thinking-status::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #1b5dd3;
      border-radius: 50%;
      margin-right: 6px;
      animation: pulse 1s infinite;
    }
    
    .thinking-completed {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
    }
    
    .thinking-completed::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #909399;
      border-radius: 50%;
      margin-right: 6px;
    }
  }
  
  .report-duration, .response-status {
    font-size: 14px;
    color: #909399;
    font-weight: normal;
    margin-left: 8px;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    height: 30px;
    font-size: 12px;
    
    .el-icon {
      margin-right: 6px;
    }
  }
}

.panel-content {
  flex: 1;
  box-sizing: border-box;
  background-color: #fff;
  height: calc(100% - 50px);
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Markdown内容样式 */
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

.report-right-bottom :deep(.markdown-content) {
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  word-wrap: break-word;
  word-break: break-word;
  box-sizing: border-box;
  
  table {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  table th, table td {
    padding: 4px 8px;
    min-width: 50px;
  }
  
  pre {
    padding: 10px;
    font-size: 13px;
    margin-bottom: 10px;
    max-width: 100%;
  }
  
  ul, ol {
    padding-left: 1.5em;
    margin-top: 0;
    margin-bottom: 10px;
  }
}

/* 动画 */
@keyframes brain-draw {
  0% {
    stroke-dashoffset: 200;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 200;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.3;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
}

@keyframes dots {
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-8px);
  }
}

@keyframes dots-loader {
  0%, 80%, 100% { 
    transform: scale(0);
  }
  40% { 
    transform: scale(1.0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes message-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
</style> 