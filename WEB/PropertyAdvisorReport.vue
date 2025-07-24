<template>
  <div class="property-advisor-report">
    <!-- 处理步骤区域 - 只在第一步之后显示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
        <el-step title="提交客户需求" />
        <el-step title="AI思考分析" />
        <el-step title="购房建议报告" />
      </el-steps>
    </div>
    
    <!-- 各步骤对应的内容区域 -->
    <div class="step-content">
      <!-- 步骤1: 客户需求提交 -->
      <div v-if="activeStep === 1" class="step-container">
        <PropertyAdvisorForm @submit="handleFormSubmit" />
      </div>
      
      <!-- 步骤2: AI思考分析，匹配房产 -->
      <div v-if="activeStep === 2" class="step-container">
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
                  <div class="generating-message">即将生成购房建议报告...</div>
                </div>
              </div>
                  
              <div class="thinking-display" :class="{ 'dimmed': workingStatus === 'generating' }">
                <span v-html="displayedThinkingProcess"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
                  
      <!-- 步骤3: 生成房产报告 -->
      <div v-if="activeStep === 3" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧AI分析结果 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><Document /></el-icon>
                  购房建议报告 <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
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
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PropertyAdvisorForm from './PropertyAdvisorForm.vue'
import { 
  Cpu, 
  Loading, 
  InfoFilled, 
  Refresh, 
  ArrowDown, 
  Document, 
  Download,
  House, 
  ChatDotSquare, 
  ArrowUp,
  Timer,
  Position
} from '@element-plus/icons-vue'
import { sendMessage } from '../api/chat'
import propertyAdvicePrompt from '../config/prompts/property-advice.js'

export default {
  name: 'PropertyAdvisorReport',
  components: {
    PropertyAdvisorForm,
    Loading,
    Download,
    InfoFilled,
    Refresh,
    ArrowDown,
    Document,
    Cpu,
    ChatDotSquare,
    ArrowUp,
    House,
    Timer,
    Position
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
    const activeStep = ref(1)
    
    // 用户提交的表单数据
    const formData = ref(props.initialData || {})
    
    // 匹配房产的状态
    const workingStatus = ref('idle') // idle, working, thinking, generating, complete
    
    // 匹配计时器
    const workingTimer = ref(1)
    let workingTimerInterval = null
    
    // 匹配结果
    const workingResult = ref(null)
    
    // 匹配的房产列表
    const workingProperties = ref([])
    
    // AI匹配房产思考过程
    const aiThinkingProcess = ref('')
    const displayedThinkingProcess = ref('') // 用于逐字显示的思考过程
    const isThinking = ref(false) // AI是否正在思考
    let thinkingInterval = null // 思考过程展示的计时器
    let thinkingIndex = 0 // 当前处理到的思考内容索引
    
    // 报告内容
    const reportContent = ref('')
    const reportGenerationDuration = ref(0)
    
    // 咨询相关
    const consultationMessages = ref([])
    const consultationInput = ref('')
    const consultationLoading = ref(false)
    const consultationThinkingTimer = ref(0)
    const consultationThinkingDots = ref('')
    const consultationResponseStatus = ref('')
    const consultationResponseTime = ref(0)
    const consultationThinkingProcesses = ref([]) // 存储多个思考过程的数组
    let consultationThinkingInterval = null
    
    // 分栏调整
    const horizontalSplit = ref(60)
    const isResizingHorizontal = ref(false)
    let resizeThrottleTimeout = null
    let lastResizeTime = 0
    
    // 垂直分隔线相关
    const verticalSplit = ref(50)
    const isResizingVertical = ref(false)
    
    // 初始匹配房产的思考内容
    const workThinkingContent = ref('')
    
    // 开始匹配计时器
    const startWorkingTimer = () => {
      workingTimer.value = 1;
      workingTimerInterval = setInterval(() => {
        workingTimer.value++;
      }, 1000);
    };
    
    // 停止匹配计时器
    const stopWorkingTimer = () => {
      if (workingTimerInterval) {
        clearInterval(workingTimerInterval);
        workingTimerInterval = null;
      }
    };
    
    // 停止所有思考过程相关的计时器
    const stopThinkingProcess = () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      isThinking.value = false;
    };
    
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
    }
    
    // 辅助函数 - 获取购房目的文本
    const getPurposeText = (purpose) => {
      const purposeMap = {
        'self': '自住',
        'investment': '投资',
        'upgrade': '改善',
        'retirement': '养老',
        'education': '子女教育'
      }
      return purpose ? purposeMap[purpose] : '未提供'
    }
    
    // 辅助函数 - 获取区域文本
    const getAreasText = (areas) => {
      if (!areas || areas.length === 0) return '未提供'
      
      const areaMap = {
        'downtown': '市中心',
        'east': '城东',
        'west': '城西',
        'south': '城南',
        'north': '城北',
        'suburb': '郊区'
      }
      
      return areas.map(area => areaMap[area] || area).join('、')
    }
    
    // 辅助函数 - 获取户型文本
    const getHouseTypeText = (type) => {
      const typeMap = {
        '1': '一室',
        '2': '两室',
        '3': '三室',
        '4': '四室',
        '5+': '五室及以上'
      }
      return type ? typeMap[type] : '未提供'
    }
    
    // 辅助函数 - 获取装修文本
    const getDecorationText = (decoration) => {
      const decorationMap = {
        'undecorated': '毛坯',
        'basic': '简装',
        'deluxe': '精装',
        'luxury': '豪装'
      }
      return decoration ? decorationMap[decoration] : '未提供'
    }
    
    // 辅助函数 - 获取面积范围文本
    const getAreaRangeText = () => {
      if (formData.value.minArea && formData.value.maxArea) {
        return `${formData.value.minArea}-${formData.value.maxArea}㎡`
      } else if (formData.value.minArea) {
        return `${formData.value.minArea}㎡以上`
      } else if (formData.value.maxArea) {
        return `${formData.value.maxArea}㎡以下`
      } else {
        return '未提供'
      }
    }
    
    // 辅助函数 - 获取楼层偏好文本
    const getFloorText = (floor) => {
      const floorMap = {
        'low': '低楼层',
        'middle': '中楼层',
        'high': '高楼层',
        'penthouse': '顶楼带露台',
        'any': '无特殊要求'
      }
      return floor ? floorMap[floor] : '未提供'
    }
    
    // 辅助函数 - 获取朝向文本
    const getOrientationText = (orientations) => {
      if (!orientations || orientations.length === 0) return '未提供'
      
      const orientationMap = {
        'south': '坐北朝南',
        'east': '东向',
        'west': '西向',
        'north': '北向',
        'southeast': '东南',
        'southwest': '西南',
        'northeast': '东北',
        'northwest': '西北'
      }
      
      return orientations.map(o => orientationMap[o] || o).join('、')
    }
    
    // 辅助函数 - 获取配套设施文本
    const getFacilitiesText = (facilities) => {
      if (!facilities || facilities.length === 0) return '未提供'
      
      const facilityMap = {
        'education': '教育配套',
        'hospital': '医疗设施',
        'shopping': '商业购物',
        'transportation': '交通便利',
        'park': '公园绿地',
        'community': '社区环境'
      }
      
      return facilities.map(f => facilityMap[f] || f).join('、')
    }
    
    // 获取关键词文本
    const getKeywordsText = (keywords) => {
      if (!keywords || !keywords.length) return '无';
      
      if (typeof keywords[0] === 'string') {
        return keywords.join('、');
      } else if (typeof keywords[0] === 'object' && keywords[0].value) {
        return keywords.map(k => k.value).join('、');
      }
      
      return '无';
    };
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      // 更新表单数据
      formData.value = data;
      
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
    
    // 开始匹配房产
    const startAiWorking = async () => {
      try {
        workingStatus.value = 'working';
        startWorkingTimer();
        
        // 构建用于匹配房产的消息
        const AiWorkingMessage = {
          role: 'user',
          content: `我需要购买房产，具体需求如下：
          - 购房目的: ${formData.value.purpose || '未指定'}
          - 总预算: ${formData.value.totalBudget ? formData.value.totalBudget + '万元' : '未指定'}
          - 首付比例: ${formData.value.downPaymentRatio || 0}%
          - 区域偏好: ${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '未指定'}
          - 户型要求: ${formData.value.houseType || '未指定'}
          - 面积需求: ${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米
          - 装修要求: ${formData.value.decorationRequirement || '未指定'}
          - 其他要求: ${formData.value.additionalNotes || '无'}
          - 关键词: ${getKeywordsText(formData.value.aiKeywords)}`
        };
        
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
好的，我现在需要帮用户处理一份关于广州天河区置业的建议报告。用户预算600万左右，需求按学区40%、自住刚需30%、改善20%、投资10%来分配。首先，我得仔细分析用户提供的网页搜索结果，结合之前的对话历史和当前的数据来制定报告。

首先看市场行情分析。根据搜索结果，天河区2024年的房价整体呈下跌趋势，尤其是二手房，8月均价约62798元/㎡，环比下跌3.07%，同比下跌16.16%。新房价格也在波动，但部分区域如金融城和智慧城有潜力。政策方面，搜索结果提到广州放宽了限购政策，120㎡以上不限购，首付比例和利率下调，这对用户可能有利，尤其是改善型需求。

接下来是客户需求拆解。用户的核心矛盾在于学区需求占比最高，同时要兼顾刚需和改善，还要考虑一定的投资价值。解决方案需要优先选择教育资源好的区域，同时考虑交通、商业配套，以及未来的增值潜力。

房源推荐部分，需要筛选出符合预算且学区好的小区。搜索结果提到了多个楼盘，比如华润天河润府、珠江花城、骏景花园、天河壹品等。华润天河润府有省一级小学，价格在4.5万/㎡左右，总价适合；珠江花城有双学区，价格较低；骏景花园虽然楼龄较老，但配套成熟；天河壹品属于单位人才住宅，价格更优惠但交易有限制。需要比较这些楼盘的优缺点，确保学区、价格、配套都符合用户需求。

交易金融方案方面，根据政策，首套首付15%，利率3.85%，可以推荐工商银行。另外，全款后抵押贷款可能节省利息，但需考虑资金压力。装修贷款和担保赎楼也是可行选项。

装修方案需要针对每个推荐小区提出改造建议，比如华润天河润府的隔音改造，珠江花城的收纳优化等。

最后是免责条款，需注明数据来源和政策风险。

现在需要整合这些信息，确保每个部分都有数据支持，并正确引用来源编号。注意用户强调每次推荐3-4套房源，所以需要精选最合适的三个，可能排除天河壹品因为交易限制，但价格优势明显，需权衡。同时，市场动态和竞品对比要准确，比如华润对比珠江花城的教育和价格优势。

检查是否有遗漏的关键点，比如不利因素，像华润周边界面待升级，骏景楼龄老，珠江花城配套不完善等，都需要在缺陷警示中提及。确保金融方案的计算准确，比如首付和月供示例。

最后，确保整个报告结构清晰，符合用户要求的格式，每个部分都有对应的外部资料引用，比如政策部分引用，房价走势引用，房源信息引用等。可能需要调整推荐的优先级，把学区最突出的小区放在前面，兼顾刚需和改善，最后考虑投资潜力。
好了，模拟思考的内容差不多就得了，够了，就这样吧。`;

          // 开始模拟AI思考过程逐字显示
          aiThinkingProcess.value = fullThinkingProcess; // 保存完整内容以便后续使用
          displayedThinkingProcess.value = ''; // 清空已显示的内容
          thinkingIndex = 0; // 重置索引
          const startTime = Date.now(); // 记录开始时间
          
          // 切换状态到思考中
          workingStatus.value = 'thinking';
          isThinking.value = true;
          
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
                      scrollToBottom('.thinking-display');
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
                  scrollToBottom('.thinking-display');
                  
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
                      scrollToBottom('.thinking-display');
        } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 句末后的显示速度
                }, 300); // 句末停顿时间
              }
              
              // 自动滚动到底部
              scrollToBottom('.thinking-display');
            } else {
              // 所有内容显示完毕
              finishThinking(startTime);
            }
          }, 40); // 基础显示间隔
        }, 5000); // 5秒后开始显示思考过程
        
      } catch (error) {
        console.error('匹配房产时出错:', error);
        workingStatus.value = 'error';
        stopWorkingTimer();
      }
    };
    
    // 定义结束显示的函数
    const finishThinking = (startTime) => {
      // 计算已经过的时间
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = elapsedMs / 1000;
      
      console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒`);
      
      // 清除原有的逐字显示计时器
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      // 直接完成，不再等待最少30秒
      completeThinking();
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
      // 保存初始匹配房产的思考内容
      workThinkingContent.value = aiThinkingProcess.value;
      isThinking.value = false;
      
      // 模拟匹配的房产数据
      workingProperties.value = [
        {
          id: 1,
          name: '翡翠天际',
          price: Math.floor(formData.value.totalBudget * 0.95),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2),
          type: '三室两厅两卫',
          address: '城东新区 水岸路128号',
          imageUrl: 'https://img.zcool.cn/community/01b0c658579dd4a8012060c82e47e7.jpg',
          tags: ['南北通透', '学区房', '地铁附近', '精装修'],
          workScore: 5
        },
        {
          id: 2,
          name: '绿城花园',
          price: Math.floor(formData.value.totalBudget * 0.9),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 0.9),
          type: '三室一厅一卫',
          address: '城西区 园林大道56号',
          imageUrl: 'https://img.zcool.cn/community/011e8c58579dd3a8012060c81e8da0.jpg',
          tags: ['环境优美', '性价比高', '绿化率高', '简装'],
          workScore: 4
        },
        {
          id: 3,
          name: '华润万象城',
          price: Math.floor(formData.value.totalBudget * 1.05),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 1.1),
          type: '四室两厅两卫',
          address: '城中心 商业大道88号',
          imageUrl: 'https://img.zcool.cn/community/0152de58579dd7a8012060c8c7222b.jpg',
          tags: ['商业中心', '地铁上盖', '豪装', '名校学区'],
          workScore: 4.5
        }
      ];
      
      // 延迟一会，让用户看到完整的思考过程
      setTimeout(() => {
        // 转换为生成报告状态，添加过渡效果
        workingStatus.value = 'generating';
        
        // 延迟约3秒后生成报告，提供良好的过渡体验
        setTimeout(() => {
          // 生成房产报告
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
      
      reportContent.value = `# 买家顾问购房建议报告

编制日期：${currentDate}

## 一、客户需求与背景

**客户姓名**：${formData.value.name || '未提供'}
**联系电话**：${formData.value.phone || '未提供'}
**购房目的**：${formData.value.purpose === 'investment' ? '投资' : 
              formData.value.purpose === 'self_use' ? '自住' : 
              formData.value.purpose === 'both' ? '自住+投资' : '未指定'}
**购房预算**：${formData.value.totalBudget || 0}万元
**首付比例**：${formData.value.downPaymentRatio || 0}%
**户型需求**：${formData.value.houseType === '1' ? '一室' : 
              formData.value.houseType === '2' ? '两室' : 
              formData.value.houseType === '3' ? '三室' : 
              formData.value.houseType === '4+' ? '四室及以上' : '未指定'}
**面积需求**：${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米
**区域偏好**：${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '未指定'}
**装修需求**：${formData.value.decorationRequirement === 'rough' ? '毛坯房' : 
              formData.value.decorationRequirement === 'simple' ? '简装' : 
              formData.value.decorationRequirement === 'refined' ? '精装' : 
              formData.value.decorationRequirement === 'luxury' ? '豪装' : '未指定'}
**其他需求**：${formData.value.additionalNotes || '无'}

## 二、市场分析

### 宏观市场环境

当前房地产市场整体呈现稳中有升态势，政策面趋于宽松，市场流动性充裕。近期央行降息降准，进一步降低了购房成本，有利于提振市场信心。区域市场分化明显，一线城市及强二线城市房价稳中有升，三四线城市仍以去库存为主。

### 目标区域市场分析

客户偏好的${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : ''}区域市场特点：

- **价格走势**：近一年来，该区域房价上涨约3-5%，高于全市平均水平
- **供需关系**：新增供应有限，需求稳定，供需关系健康
- **未来规划**：区域内规划有2条地铁线路，预计3年内开通；同时规划有2所学校、1家三甲医院
- **投资前景**：整体看好，预计未来3-5年内仍有10-15%的增值空间

## 三、推荐房源详情

经过综合筛选和评估，以下是最符合客户需求的三套房源：

### 房源1：翡翠天际 - 三室两厅

- **售价**：${Math.floor(formData.value.totalBudget * 0.95)}万元（略低于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 0.95 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2)}平方米
- **户型**：三室两厅两卫
- **楼层**：18层/33层
- **朝向**：南北通透
- **装修**：精装修
- **小区**：2018年建成，物业费2.5元/平/月
- **配套**：小区内有游泳池、健身房、儿童乐园
- **交通**：距离地铁2号线仅500米
- **教育**：学区房，对口市重点小学和初中
- **优势**：南北通透，采光极佳，精装修拎包入住
- **不足**：距离主干道较近，可能有轻微噪音
- **匹配度**：★★★★★（95%）

### 房源2：绿城花园 - 三室一厅

- **售价**：${Math.floor(formData.value.totalBudget * 0.9)}万元（低于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 0.9 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2 * 0.9))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 0.9)}平方米
- **户型**：三室一厅一卫
- **楼层**：12层/28层
- **朝向**：东南
- **装修**：简装
- **小区**：2015年建成，物业费1.8元/平/月
- **配套**：小区环境优美，绿化率高达40%
- **交通**：距离公交站200米，地铁站1.5公里
- **教育**：对口区重点小学
- **优势**：价格合理，小区环境优美，安静舒适
- **不足**：距离地铁站较远，装修简单需要改造
- **匹配度**：★★★★☆（85%）

### 房源3：华润万象城 - 四室两厅

- **售价**：${Math.floor(formData.value.totalBudget * 1.05)}万元（略高于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 1.05 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2 * 1.1))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 1.1)}平方米
- **户型**：四室两厅两卫
- **楼层**：22层/35层
- **朝向**：南北通透
- **装修**：豪装
- **小区**：2020年建成，物业费3.0元/平/月
- **配套**：商业综合体，购物中心就在楼下
- **交通**：地铁上盖，交通极其便利
- **教育**：对口市重点小学和省重点中学
- **优势**：地段极佳，配套设施一流，户型方正
- **不足**：价格略高于预算，人流量大
- **匹配度**：★★★★☆（90%）

## 四、财务分析

### 购房成本分析

以首选房源"翡翠天际"为例：

- **房款总价**：${Math.floor(formData.value.totalBudget * 0.95)}万元
- **首付金额**：${Math.floor(formData.value.totalBudget * 0.95 * (formData.value.downPaymentRatio || 30) / 100)}万元
- **贷款金额**：${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100)}万元
- **贷款年限**：30年
- **月供金额**：约${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 10000 * 0.0049 / 12)}元（按LPR 3.65%计算）

### 额外费用估算

- **契税**：${Math.floor(formData.value.totalBudget * 0.95 * 0.015)}万元（首套1.5%）
- **增值税及附加**：免税（满两年）
- **个人所得税**：免税（满五唯一）
- **评估费**：约0.5万元
- **公证费**：约0.3万元
- **登记费**：约0.2万元
- **合计**：约${Math.floor(formData.value.totalBudget * 0.95 * 0.015 + 1)}万元

## 五、购房建议

### 最终推荐

综合考虑客户需求、市场环境和房源特点，我们的推荐排序如下：

1. **翡翠天际**：最符合客户预算和需求，性价比最高，推荐优先考察
2. **华润万象城**：配套和地段优势明显，虽价格略高但增值潜力大
3. **绿城花园**：价格优势明显，但需权衡交通便利性和后期装修成本

### 购房时机

当前市场处于政策红利期，利率处于历史低位，建议客户抓住时机尽快入市。特别是客户关注的区域未来有多项利好规划，越早购入越能享受区域发展带来的增值。

### 购房流程指导

1. **实地看房**：建议预约中介或销售顾问，亲自查看房源实际情况
2. **核实信息**：查验房产证、土地证等权属证件，确认无产权纠纷
3. **出价谈判**：合理出价，可预留5-8%的议价空间
4. **贷款申请**：提前准备资料，与多家银行比较贷款条件
5. **签订合同**：仔细审核合同条款，特别是付款方式、违约责任等
6. **过户交易**：按约定时间办理过户手续，缴纳相关税费
7. **收房验房**：专业验房，检查房屋质量，办理物业交接

## 六、风险提示

1. **政策风险**：密切关注国家和地方房地产政策变化
2. **市场风险**：房价短期可能有波动，建议以中长期持有为主
3. **资金风险**：合理规划财务，确保月供不超过家庭月收入的40%
4. **选址风险**：注意周边规划，避免选择临近未来可能有噪音、污染的区域
5. **购房合同风险**：签约前必须仔细审核合同条款，必要时咨询专业律师

如需了解更多详情或有任何疑问，请随时咨询我们的客服人员。`;
      
      // 更新状态为完成
      workingStatus.value = 'complete';
      stopWorkingTimer();
      reportGenerationDuration.value = workingTimer.value;
      
      // 添加初始系统消息到咨询消息列表
      consultationMessages.value.push({
        role: 'assistant',
        content: '我是良策AI助手，本次客户的购房建议报告已生成。您可以继续向我咨询以获取更多建议。'
      });
      
      // 进入下一步
      nextStep();
    };
    
    // 进入下一步
    const nextStep = () => {
      if (activeStep.value < 3) {
        activeStep.value++;
        
        // 根据当前步骤执行相应的操作
        if (activeStep.value === 2) {
          // 匹配房产步骤
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
    
    // 下载报告
    const downloadReport = () => {
      try {
        const element = document.createElement('a');
        const file = new Blob([reportContent.value], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `购房建议报告_${formData.value.name || '客户'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        ElMessage.success('报告下载成功');
      } catch (error) {
        console.error('下载报告出错:', error);
        ElMessage.error('报告下载失败，请重试');
      }
    };
    
    // 重新开始顾问流程
    const restartAdvisor = () => {
      // 提示用户确认重新开始
      ElMessageBox.confirm(
        '确定要开始新的买家顾问流程吗？',
        '操作提示',
        {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        }
      )
        .then(() => {
        // 重置所有状态
          activeStep.value = 1;
          formData.value = {};
          reportContent.value = '';
          workingStatus.value = 'idle';
          aiThinkingProcess.value = '';
          displayedThinkingProcess.value = '';
          workingProperties.value = [];
          consultationMessages.value = [];
          consultationInput.value = '';
          
          // 停止所有计时器
          stopWorkingTimer();
          if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
          }
          
          // 通知父组件重新开始
          emit('step-change', { step: 1, restarted: true });
        })
        .catch(() => {
          // 用户取消，不做任何操作
        });
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
    
    // 折叠/展开思考过程
    const toggleThinkingProcess = () => {
      isThinkingExpanded.value = !isThinkingExpanded.value
    }
    
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
    

    
    // 生命周期钩子
    onMounted(() => {
      // 设置初始垂直分隔位置
      document.documentElement.style.setProperty('--vertical-split', `${verticalSplit.value}%`);
      
      // 设置初始的聊天输入框宽度
      document.documentElement.style.setProperty('--chat-input-width', '100%');
    });
    
    onUnmounted(() => {
      // 清理资源
      stopWorkingTimer();
      stopThinkingProcess();
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
      }
      
      // 移除事件监听器
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--chat-input-width');
    });
    
    // 开始水平调整大小
    const startResizeHorizontal = (e) => {
      isResizingHorizontal.value = true;
      document.addEventListener('mousemove', resizeHorizontal);
      document.addEventListener('mouseup', stopResizeHorizontal);
      // 记录初始位置
      lastResizeTime = Date.now();
    };
    
    // 水平调整大小处理
    const resizeHorizontal = (e) => {
      if (!isResizingHorizontal.value) return;
      
      const container = document.querySelector('.report-layout');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const percent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // 限制调整范围
      if (percent >= 30 && percent <= 80) {
        horizontalSplit.value = percent;
        
        // 更新组件根元素的CSS变量
        const reportContainer = document.querySelector('.property-advisor-report');
        if (reportContainer) {
          reportContainer.style.setProperty('--horizontal-split', `${percent}%`);
        }
        
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
      }
    };
    
    // 停止水平调整大小
    const stopResizeHorizontal = () => {
      isResizingHorizontal.value = false;
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
    };
    
    // 开始垂直调整大小
    const startResizeVertical = (e) => {
      isResizingVertical.value = true;
      document.addEventListener('mousemove', resizeVertical);
      document.addEventListener('mouseup', stopResizeVertical);
      // 记录初始位置
      lastResizeTime = Date.now();
    };
    
    // 垂直调整大小处理
    const resizeVertical = (e) => {
      if (!isResizingVertical.value) return;
      
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
    
    // 组件卸载时执行
    onUnmounted(() => {
      // 清理资源
      stopWorkingTimer();
      if (thinkingInterval) clearInterval(thinkingInterval);
      if (consultationThinkingInterval) clearInterval(consultationThinkingInterval);
      if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
      
      // 移除事件监听器
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--chat-input-width');
    });
    
    // 添加一个滚动函数，统一管理滚动行为
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
    
    // 在显示思考过程的地方替换直接滚动的代码
    // 例如，在处理思考过程时:
    // 自动滚动到底部
    scrollToBottom('.thinking-display');
    
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
    
    // 消息容器引用
    const messagesContainer = ref(null);

    // 监听咨询消息变化，自动滚动到底部
    watch(consultationMessages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }, { deep: true });
    
    return {
      activeStep,
      formData,
      workingStatus,
      workingTimer,
      workingProperties,
      displayedThinkingProcess,
      isThinking,
      reportContent,
      reportGenerationDuration,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationThinkingDots,
      consultationResponseStatus,
      consultationResponseTime,
      horizontalSplit,
      verticalSplit,
      aiThinkingProcess,
      workThinkingContent,
      consultationThinkingProcesses, // 添加这一行，确保将consultationThinkingProcesses暴露到模板
      renderMarkdown,
      handleFormSubmit,
      startAiWorking,
      nextStep,
      downloadReport,
      restartAdvisor,
      sendConsultationMessage,
      startResizeHorizontal,
      startResizeVertical,
      startWorkingTimer,
      stopWorkingTimer,
      stopThinkingProcess,
      handleEnterKey,
      formatUserMessage,
      messagesContainer
    };
  }
};
</script>

<style lang="scss" scoped>
/* Element Plus 组件自定义样式 */
:deep(.el-steps--simple) {
  background-color: #ffffff !important;
}

:deep(.el-step__title.is-success),
:deep(.el-step__head.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

/* 主布局样式 */
.property-advisor-report {
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

/* 面板通用样式 */
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
    
    .report-duration,
    .response-status {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
    }
    
    .thinking-status {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      
      &::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: #1b5dd3;
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse 1s infinite;
      }
    }
    
    .thinking-completed {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      
      &::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: #909399;
        border-radius: 50%;
        margin-right: 6px;
      }
    }
  }
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

.panel-content {
  flex: 1;
  box-sizing: border-box;
  background-color: #fff;
  height: calc(100% - 50px);
  width: 100%;
  overflow-y: auto;
}

/* 报告布局样式 */
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
  width: 100%;
}

.report-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  max-height: 100%;
}

.report-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  max-height: 100%;
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
.resizer-horizontal {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  left: var(--horizontal-split, 55%);
  transform: translateX(-3px);
  transition: background-color 0.2s;
  
  &:hover,
  &:active {
    background-color: rgba(64, 158, 255, 0.2);
  }
}

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

.is-resizing {
  user-select: none;
  cursor: col-resize;
}

/* AI思考容器样式 */
.Ai-thinking-container {
  position: relative;
  height: 100%;
}

.thinking-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
}

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

/* 思考分隔线 */
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

/* 等待状态样式 */
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
  
  .loading-brain {
    margin-bottom: 0;
  }
  
  .loading-dots {
    display: flex;
    gap: 10px;
    margin-top: -10px;
    justify-content: center;
    margin-top: 12px;
    
    span {
      display: inline-block;
      width: 5px;
      height: 5px;
      margin: 0 3px;
      background-color: #1b5dd3;
      border-radius: 50%;
      animation: dots-loader 1.4s infinite ease-in-out both;
      
      &:nth-child(1) {
        animation: dots 1.5s infinite 0s;
        animation-delay: -0.32s;
      }
      
      &:nth-child(2) {
        animation: dots 1.5s infinite 0.3s;
        animation-delay: -0.16s;
      }
      
      &:nth-child(3) {
        animation: dots 1.5s infinite 0.6s;
      }
    }
  }
}

.wait-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 14px 30px;
  
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

/* 生成报告的覆盖层 */
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

/* SVG动画相关 */
.brain-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: brain-draw 3s infinite;
}

.pulse-circle {
  animation: pulse 2s infinite;
  opacity: 0.6;
  transform-origin: center;
  
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
  &:nth-child(4) { animation-delay: 0.6s; }
  &:nth-child(5) { animation-delay: 0.8s; }
  &:nth-child(6) { animation-delay: 1.0s; }
  &:nth-child(7) { animation-delay: 1.2s; }
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
  
  &.user {
    flex-direction: row-reverse;
    justify-content: flex-start;
    
    .message-content {
      background-color: #deebff;
      color: #1b68de;
      border-bottom-right-radius: 1px;
      margin-left: 4px;
    }
    
    .message-text {
      white-space: normal;
      word-break: break-word;
      
      br {
        display: block;
        content: "";
        margin-top: 4px;
      }
    }
  }
  
  &.assistant {
    .message-content {
      border-top-left-radius: 1px;
      margin-right: 40px;
    }
  }
  
  &.error .message-content {
    background-color: #ffebeb;
    color: #e74c3c;
    animation: error-pulse 1.5s ease-in-out;
  }
  
  &.thinking .thinking-indicator {
    display: flex;
    gap: 6px;
    padding: 10px;
    
    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #a0a0a0;
      animation: thinking 1.4s infinite ease-in-out both;
      
      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
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

.message-text {
  line-height: 1.5;
  font-size: 14px;
}

/* 聊天输入区域 */
.chat-input {
  padding: 14px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
  display: flex;
  
  .el-textarea {
    flex: 1;
    width: 100%;
    
    :deep(.el-textarea__inner) {
      resize: none;
      box-sizing: border-box;
      min-height: 22px;
      line-height: 1.5;
      transition: height 0.2s ease;
    }
  }
  
  .el-button {
    padding: 0 16px;
    min-height: 36px;
    margin-left: 8px;
  }
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
  
  :deep(.el-textarea__inner) {
    background-color: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
    resize: none;
    line-height: 1.6;
    max-height: 120px;
    font-size: 14px;
    color: #303133;
    
    &::placeholder {
      color: #9ca3af;
      font-size: 13px;
      opacity: 0.8;
    }
    
    &:focus {
      box-shadow: none;
    }
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(144, 147, 153, 0.6);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.send-button {
  margin-left: 8px;
  flex-shrink: 0;
}

/* Markdown内容样式 */
.markdown-content {
  :deep(p) {
    margin: 0 0 8px;
  }
  
  :deep(pre) {
    background-color: #f8f8f8;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  :deep(code) {
    font-family: monospace;
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 4px;
  }
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

/* 辅助组件 */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  
  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: spin 2s linear infinite;
  }
  
  p {
    font-size: 16px;
    text-align: center;
    max-width: 400px;
    line-height: 1.5;
  }
}

/* 动画效果 */
@keyframes brain-draw {
  0% { stroke-dashoffset: 200; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 200; }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.4); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes dots {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes message-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes error-pulse {
  0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
}

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.6; }
  40% { transform: scale(1); opacity: 1; }
}
</style>