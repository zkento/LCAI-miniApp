<template>
  <div class="credit-analyse-report">
    <!-- 处理步骤区域 - 只在第一步之后显示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
        <el-step title="上传征信文件" />
        <el-step title="处理征信内容" />
        <el-step title="AI思考分析" />
        <el-step title="征信分析报告" />
      </el-steps>
    </div>
   
    <!-- 各步骤对应的内容区域 -->
    <div class="step-content">
      <!-- 步骤1: 表单提交 -->
      <div v-if="activeStep === 1" class="step-container">
        <creditAnalyseForm
          :chatType="chatType"
          @submit="handleFormSubmit"
        />
      </div>
     
      <!-- 步骤2: 提取文本内容 -->
      <div v-if="activeStep === 2" class="step-container">
        <div class="extraction-layout">
          <!-- 左侧显示原文件 -->
          <div class="original-file">
            <div class="panel-header">
              <h3>
                <el-icon class="header-icon"><Document /></el-icon>
                原始文件
              </h3>
              <span class="file-name">
                {{ fileList?.length ? (fileList[0]?.name + (fileList.length > 1 ? '等' + fileList.length + '个文件' : '')) : '未知文件' }}
              </span>
            </div>
            <div class="panel-content">
              <div v-if="filePreviewUrl" class="file-preview">
                <img v-if="isImageFile" :src="filePreviewUrl" alt="文件预览" />
                <iframe v-else :src="filePreviewUrl" frameborder="0" style="overflow: hidden; width: 100%; height: 100%; display: block; border: none;"></iframe>
              </div>
              <div v-else class="file-placeholder">
                <el-icon><Document /></el-icon>
                <p>文件加载中...</p>
              </div>
            </div>
          </div>
         
          <!-- 右侧显示提取的文字 -->
          <div class="extracted-text">
            <div class="panel-header">
              <h3>
                <el-icon class="header-icon"><Reading /></el-icon>
                提取内容
                <el-progress class="mini-progress" :percentage="extractionProgress" :stroke-width="4" />
              </h3>              
            </div>
            <div class="panel-content">
              <div v-if="extractedText" class="text-content" style="overflow-x: hidden; word-break: break-word;">
                {{ extractedText }}
              </div>
              <div v-else class="text-placeholder">
                <p>正在提取文字，请稍候...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 匹配产品的蒙层，当AI未开始返回思考过程的内容前显示 -->
        <div v-if="workingStatus === 'working'" class="working-overlay">          
          <div class="ai-tip">
            <div class="loading-spinner"></div>
            AI正在处理征信内容...已耗时 {{ workingTimer }} 秒
          </div>
        </div>
      </div>

      <!-- 步骤3: AI思考分析 -->
      <div v-if="activeStep === 3" class="step-container">
        <div class="Ai-thinking-container">          
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
                  <div class="generating-message">即将生成{{ chatType === 'personal-credit' ? '个人' : '企业' }}征信分析报告...</div>
                </div>
              </div>
                  
              <div class="thinking-display" :class="{ 'dimmed': workingStatus === 'generating' }">
                <span v-html="displayedThinkingProcess"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
     
      <!-- 步骤4: 生成分析报告 -->
      <div v-if="activeStep === 4" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧AI分析结果 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><Document /></el-icon>
                  征信分析报告 <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
                </h3>
                <div class="header-actions">
                  <el-button 
                    v-show="reportContent" 
                    type="primary"                     
                    size="small"
                    @click="viewCreditFile"
                    class="action-button"
                  >
                    <el-icon><Files /></el-icon>查看征信文件
                  </el-button>
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
import { 
  Cpu, 
  Document, 
  Reading, 
  Download,
  House, 
  ChatDotSquare, 
  Timer,
  Upload,
  Check,
  ChatLineRound,
  Position,
  Files
} from '@element-plus/icons-vue'
import { extractTextFromPDF } from '../api/pdfParseX'
import creditAnalyseForm from './creditAnalyseForm.vue'

export default {
  name: 'creditAnalyseReport',
  components: {
    Document,
    Reading,
    creditAnalyseForm,
    Cpu,
    Download,
    House,
    ChatDotSquare,
    Timer,
    Upload,
    Check,
    ChatLineRound,
    Position,
    Files
  },
  props: {
    chatType: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // 当前步骤状态（1表示表单填写, 2表示提取内容）
    const activeStep = ref(1)
    // 存储表单数据
    const formData = ref(null)
   
    // 分析步骤状态
    const extractionProgress = ref(0)
    const extractedText = ref('')
    const filePreviewUrl = ref(null)
    const isImageFile = ref(false)
    const fileList = ref([])

    // 匹配房产的状态
    const workingStatus = ref('idle') // idle, working, thinking, generating, complete
    
    // 匹配计时器
    const workingTimer = ref(1)
    let workingTimerInterval = null
    
    // AI匹配思考过程
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
    const consultationResponseStatus = ref('')
    const consultationResponseTime = ref(0)
    const consultationThinkingProcesses = ref([]) // 存储多个思考过程的数组
    let consultationThinkingInterval = null
    let mutationObserver = null // 用于监听输入框高度变化
    let autoHeightCheckInterval = null // 用于定期检查高度变化
    
    // 分栏调整
    const horizontalSplit = ref(60)
    const isResizingHorizontal = ref(false)
    let resizeThrottleTimeout = null
    let lastResizeTime = 0
    
    // 垂直分隔线相关
    const verticalSplit = ref(50)
    const isResizingVertical = ref(false)
    
    // 初始匹配思考内容
    const workThinkingContent = ref('')
    
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
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      // 验证数据
      if (!data) {
        console.error('接收到的表单数据为空');
        ElMessage.error('上传失败，请重试');
        return;
      }
     
      if (!data.file) {
        console.error('表单数据中没有文件');
        ElMessage.error('没有找到上传的文件，请重试');
        return;
      }
     
      // 保存表单数据
      formData.value = data;
     
      // 如果上传的是PDF文件，且客户姓名为空或未知客户，则自动使用PDF文件名作为客户姓名
      if (data.file.type === 'application/pdf') {
        // 获取文件名（去除.pdf后缀）
        const fileName = data.file.name.replace(/\.pdf$/i, '');
       
        // 如果客户姓名为空或为默认值，则使用文件名
        if (!data.customerName || data.customerName === '未知客户') {
          console.log('从PDF文件名提取客户姓名:', fileName);
          formData.value.customerName = fileName;
        }
      }
     
      // 进入内容提取步骤（第2步）
      activeStep.value = 2;
     
      // 初始化文件信息
      fileList.value = data.fileList || [];
      createFilePreview(data.file);
     
      // 启动分析流程
      startAnalysis();
     
      console.log('开始分析流程，当前步骤:', activeStep.value);
    }
   
    // 模拟分析过程
    const startAnalysis = () => {
      // 确保处于第2步（提取内容）
      activeStep.value = 2;
     
      // 提取PDF文本内容（前面表单部分已确保所有提交的文件都是PDF格式）
      if (formData.value && formData.value.file) {
        console.log('开始提取PDF内容');
        extractPDFContent(formData.value.file);
      } else {
        console.error('缺少文件数据，无法开始分析');
        ElMessage.error('缺少文件数据，无法开始分析');
      }
    }
   
    // 提取PDF内容的真实实现
    const extractPDFContent = async (pdfFile) => {
      try {
        // 初始化提取状态
        extractedText.value = '正在提取PDF内容...';
       
        // 创建文件预览
        createFilePreview(pdfFile);
       
        console.log('开始提取PDF内容');
       
        // 定义简化的进度回调函数，直接显示API返回的进度
        const updateProgress = (progress) => {
          extractionProgress.value = progress;
          console.log(`上传进度: ${progress}%`);
        };
       
        // 调用真实的API提取PDF内容
        const result = await extractTextFromPDF(pdfFile, updateProgress);
       
        // 检查提取结果
        if (result.success) {
          // 提取成功，显示提取的文本
          extractedText.value = result.text;
          extractionProgress.value = 100;
 
          const actualCharCount = result.text.length;
          console.log('实际文本长度:', actualCharCount);
          
          // 判断文本字符数量，如果过少则可能不是有效的征信报告
          if (actualCharCount < 500) {            
            // 弹窗提示用户
            ElMessageBox.confirm(
              '上传文件不是有效的征信报告，请检查后重试。',
              '无效的征信报告',
              {
                confirmButtonText: '重试',
                cancelButtonText: '返回上传',
                type: 'warning'
              }
            ).then(() => {
              // 用户选择重试，保持在当前步骤
              extractedText.value = '请重新上传有效的征信报告...';
              extractPDFContent(pdfFile);
            }).catch(() => {
              // 用户选择返回上传，重置分析状态
              resetAnalysis();
            });
            
            return;
          }
         
          // 确保UI先更新完提取出的文本内容
          await nextTick();
          
          // 开始匹配计时器并显示匹配蒙层
          workingStatus.value = 'working';
          startWorkingTimer();
          
          // PDF提取完成后模拟等待AI服务器响应时间3秒，之后进入AI思考分析步骤（第3步）
          // 在实际接入AI时，移除此代码，使用真实的等待时间
          setTimeout(() => {
            // 进入下一步
            nextStep();
          }, 3000);
          
        } else {
          // 提取失败
          console.error('PDF内容提取失败:', result.error);
          extractedText.value = `提取失败: ${result.error}`;
          // 保持进度为最后的值，而不是重置为0，避免进度条跳变
          ElMessage.error('PDF内容提取失败: ' + result.error);
         
          // 允许重试
          retryExtraction();
        }
      } catch (error) {
        console.error('提取PDF内容时出错:', error);
        ElMessage.error('提取PDF内容失败，请重试');
       
        // 在提取失败时，回到上一步并允许重新选择文件
        retryExtraction();
      }
    };
   
    // 重置分析，返回表单步骤
    const resetAnalysis = () => {
      // 重置步骤状态
      activeStep.value = 1;
     
      // 重置表单数据
      formData.value = null;
     
      // 重置分析状态
      extractionProgress.value = 0;
      extractedText.value = '';
      filePreviewUrl.value = null;
      isImageFile.value = false;
     
      // 重置文件列表
      fileList.value = [];
     
      console.log('已重置所有状态，当前步骤:', activeStep.value);
    }
   
    // 创建文件预览URL
    const createFilePreview = (file) => {
      if (!file) return;
     
      // 如果已有预览URL，先释放
      if (filePreviewUrl.value && filePreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl.value);
      }
     
      // 检查文件类型
      isImageFile.value = file.type.startsWith('image/');
     
      // 创建新的预览URL
      filePreviewUrl.value = URL.createObjectURL(file);
     
      console.log('创建了文件预览:', file.name, file.type);
    };
   
    // 重试提取过程
    const retryExtraction = () => {
      // 询问用户是否要重试
      ElMessageBox.confirm(
        '提取PDF内容失败，是否要重新尝试？',
        '操作提示',
        {
          confirmButtonText: '重试',
          cancelButtonText: '返回上传',
          type: 'warning'
        }
      ).then(() => {
        // 用户选择重试，重新启动提取过程
        if (formData.value && formData.value.file) {
          // 重置提取文本，但保留进度
          extractedText.value = '正在重新提取PDF内容...';
          extractPDFContent(formData.value.file);
        } else {
          ElMessage.error('没有找到文件，请重新上传');
          resetAnalysis();
        }
      }).catch(() => {
        // 用户选择返回上传，重置分析状态
        resetAnalysis();
      });
    };
   
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

    // 开始征信分析
    const startAiWorking = async () => {
      try {
        // 使用已经在步骤2中设置的workingStatus，不再重新设置
        // 构建用于匹配房产的消息
        const AiWorkingMessage = {
          role: 'user',
          content: `我需要分析征信报告，具体内容如下：
          - 客户姓名: ${formData.value.customerName || '未知客户'}
          - 征信内容: ${extractedText.value.substring(0, 1000)}... (内容较长)`
        };
        
        // 模拟AI思考过程
        // 设置完整的AI思考过程数据
        const fullThinkingProcess = `正在分析征信报告...

思考过程：
嗯，用户给了一个PDF文件，看起来是个人信用报告。我需要仔细分析里面的内容，然后给出专业的建议。首先，我要理解各个表格和数据的含义。

首先，看到有准贷记卡的信息，不过合计显示51，可能是指账户数量或者其他指标。接下来是非循环贷账户的信息汇总，账户数是6，授信总额236,644，余额214,750，最近6个月平均应还款2,987。这说明用户有较多的非循环贷款，且余额较高，需要关注其还款能力。

然后是循环贷账户的信息，管理机构数2，账户数也是2，授信总额176,000，余额20,940，最近6个月平均应还款3,239。循环贷款的余额相对较低，但授信额度较高，可能意味着用户有较高的信用额度但使用较少，需要注意是否有过度授信的风险。

接下来是贷记卡账户信息，发卡机构数3，账户数6，授信总额82,000，单家最高授信额47,000，已用额度53,878，最近6个月平均使用额度13,701。这说明用户的信用卡使用率较高（已用额度占授信总额的约65.7%），可能影响信用评分，建议降低使用率到30%以下。

查询记录显示最近1个月内有1次贷款审批查询，最近2年内有53次贷后管理查询和11次担保资格审查。频繁的查询记录可能会影响信用评分，尤其是贷后管理查询较多，需要确认是否存在频繁的信用检查。

在非循环贷账户的详细信息中，账户1是个人住房商业贷款，余额183,013，剩余还款期数287，每月应还款923，当前无逾期。账户2是其他个人消费贷款，余额16,183，剩余还款期数10，每月应还款1,724，同样无逾期。账户3的开立日期是2025.01.03，金额3,000，显示正常。这些贷款均按时还款，信用记录良好。

循环贷账户1余额6,731，剩余3期，每月应还款2,276；账户2余额14,209，剩余10期，每月应还款1,445，均无逾期。用户在这些循环贷款中表现良好，按时还款。

贷记卡账户显示有6个账户，已用额度53,878，最近6个月平均使用额度13,701，需要注意信用卡的使用率较高，可能影响信用评分。

职业信息显示用户在职，但工作单位频繁变更，可能影响稳定性评估。居住信息有多个地址，但均在广州市，可能是同一地址的不同表述。

异议信息提示显示没有正在处理的异议，信用报告内容无争议。

查询记录中，贷后管理查询次数较多（53次），可能反映出金融机构对用户的信用状况进行频繁监控，需确认是否存在异常。

综合分析，用户的信用状况总体良好，所有贷款和信用卡账户均按时还款，无逾期记录。但需要注意以下几点：

信用卡使用率较高，建议降低使用率至30%以下，以提升信用评分。
频繁的贷后管理查询可能对信用评分有负面影响，建议减少不必要的信用查询。
尽管当前无逾期，但较高的贷款余额和信用卡额度使用需关注还款能力，确保未来持续按时还款。
工作单位和居住地址的频繁变更可能影响信用评估的稳定性，建议保持稳定的职业和居住信息。
建议用户继续保持良好的还款习惯，合理规划财务，避免过度依赖信用产品，同时关注信用报告中的查询记录，减少不必要的信用检查。

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
      } catch (error) {
        console.error('征信分析时出错:', error);
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
      // 保存初始匹配思考内容
      workThinkingContent.value = aiThinkingProcess.value;
      isThinking.value = false;
      
      // 延迟一会，让用户看到完整的思考过程
      setTimeout(() => {
        // 转换为生成报告状态，添加过渡效果
        workingStatus.value = 'generating';
        
        // 延迟约3秒后生成报告，提供良好的过渡体验
        setTimeout(() => {
          // 生成征信分析报告
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
      
      reportContent.value = `# 个人征信分析报告

编制日期：${currentDate}

## 一、个人基本信息

**姓名**：${formData.value.customerName || '未知客户'}
**报告类型**：个人征信报告
**报告期限**：截至 ${currentDate}
**报告用途**：${formData.value.purpose || '购房贷款审批参考'}

## 二、征信数据分析

### 信用评分与风险等级

- **信用评分**：良好
- **风险等级**：低风险
- **总体情况**：征信状况健康，无重大不良记录

### 贷款情况概述

- **现有贷款**：1笔住房贷款
- **贷款总额**：约45万元
- **剩余金额**：约32万元
- **贷款期限**：20年（已还款5年）
- **月供金额**：约5,000元
- **还款状态**：正常还款中，无逾期

### 信用卡使用情况

- **持有信用卡**：3张
- **总授信额度**：15万元
- **已使用额度**：3.2万元（使用率21.3%）
- **近6个月平均使用率**：25%
- **近6个月最高使用率**：35%
- **当前状态**：正常使用，无逾期

### 其他相关负债

- **个人消费贷款**：无
- **汽车贷款**：无
- **互联网小额贷款**：无
- **助学贷款**：无

### 征信查询记录

- **近1个月查询次数**：1次（本人查询）
- **近3个月查询次数**：3次（银行查询2次，本人查询1次）
- **近6个月查询次数**：4次（银行查询3次，本人查询1次）
- **查询目的**：主要为贷款审批，属正常查询范围

## 三、风险评估

### 还款能力分析

- **月收入估算**：约20,000元
- **月债务支出**：约5,000元
- **债务收入比**：约25%
- **评估结果**：债务收入比处于合理范围（低于40%），还款能力良好

### 信用历史评估

- **信用历史长度**：8年
- **历史逾期情况**：无明显逾期记录
- **评估结果**：信用历史稳定，为良好信用等级

### 特殊记录分析

- **司法记录**：无
- **行政处罚**：无
- **执行记录**：无
- **不良信用记录**：无
- **评估结果**：无任何特殊不良记录，信用状况良好

## 四、贷款申请可行性分析

### 购房贷款申请评估

- **贷款申请类型**：个人住房贷款
- **申请可行性**：高
- **建议贷款额度**：约100-150万元
- **建议贷款期限**：25-30年
- **预计月供**：约5,500-8,500元（基于当前利率）

### 可能影响申请的因素

- **正面因素**：
  - 信用历史良好，无逾期记录
  - 现有贷款按时还款，信用卡使用正常
  - 债务收入比合理，还款能力充足
  - 无不良征信记录，各项指标健康

- **需要关注的因素**：
  - 近期征信查询次数较多，可能略微降低授信评分
  - 现有住房贷款尚未结清，会影响总债务水平评估

## 五、优化建议

1. **短期建议（1-3个月）**
   - 近期避免再次申请其他贷款或新办信用卡
   - 维持信用卡低使用率（建议控制在30%以下）
   - 确保所有账单按时足额还款
   - 减少非必要的征信查询

2. **中期建议（3-6个月）**
   - 稳定当前收入和就业状况
   - 避免频繁变换工作或收入来源
   - 保持良好的还款记录
   - 适当增加信用卡使用多样性，但控制总体负债水平

3. **长期建议（6个月以上）**
   - 建立多元化的信用记录（适当增加不同类型的贷款经历）
   - 维持长期稳定的还款历史
   - 适时提高收入水平，改善债务收入比
   - 建立完善的个人资产负债结构

## 六、贷款申请策略

### 最佳申请时机

基于当前征信状况，建议在1-2个月后申请住房贷款，以便：
- 使近期征信查询记录自然减少
- 进一步降低信用卡使用率
- 持续积累良好的还款记录

### 贷款申请准备

申请贷款时建议准备的材料：
1. 个人身份证件、户口本
2. 近6个月银行流水（体现稳定收入）
3. 工作收入证明（至少6个月以上）
4. 现有房产和负债清单
5. 税单或社保缴纳记录
6. 本征信分析报告作为参考

### 贷款沟通策略

与银行沟通时可强调以下有利因素：
- 良好的信用历史和还款记录
- 稳定的工作和收入来源
- 合理的债务收入比
- 无任何不良征信记录
- 明确的购房计划和资金规划

## 七、结论

基于对征信报告的全面分析，申请人目前具备良好的信用状况和还款能力，是银行贷款的优质客户。从征信角度看，申请住房贷款获批的可能性较高，建议申请人可以在短期内完成征信优化后，按推荐策略申请贷款。

如需了解更多详情或有任何疑问，请随时咨询我们的客服人员。`;
      
      // 更新状态为完成
      workingStatus.value = 'complete';
      stopWorkingTimer();
      reportGenerationDuration.value = workingTimer.value;
      
      // 添加初始系统消息到咨询消息列表
      consultationMessages.value.push({
        role: 'assistant',
        content: '我是良策AI助手，本次客户的征信分析报告已生成。您可以继续向我咨询以获取更多建议。'
      });
      
      // 进入下一步
      nextStep();
    };
    
    // 进入下一步
    const nextStep = () => {
      if (activeStep.value < 4) {
        activeStep.value++;
        
        // 根据当前步骤执行相应的操作
        if (activeStep.value === 3) {
          // 征信分析步骤
          startAiWorking();
        }
      }
    };
   
    // 清理
    onUnmounted(() => {
      // 清理URL对象
      if (filePreviewUrl.value && filePreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl.value);
      }
    });
   
    // 下载报告
    const downloadReport = () => {
      try {
        const element = document.createElement('a');
        const file = new Blob([reportContent.value], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `征信分析报告_${formData.value.customerName || '客户'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
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
        '确定要开始新的征信分析流程吗？',
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
          consultationMessages.value = [];
          consultationInput.value = '';
          extractionProgress.value = 0;
          extractedText.value = '';
          filePreviewUrl.value = null;
          isImageFile.value = false;
          fileList.value = [];
          
          // 停止所有计时器
          stopWorkingTimer();
          if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
          }
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
    
    // 开始咨询思考状态计时
    const startConsultationThinking = () => {
      consultationThinkingTimer.value = 0;
      consultationResponseStatus.value = '';
      consultationResponseTime.value = 0;
      
      // 启动计时器
      consultationThinkingInterval = setInterval(() => {
        consultationThinkingTimer.value++;
      }, 1000);
    };
    
    // 停止咨询思考状态计时
    const stopConsultationThinking = (status = 'success', error = '') => {
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
        consultationThinkingInterval = null;
        consultationResponseTime.value = consultationThinkingTimer.value;
        consultationThinkingTimer.value = 0;
        
        // 设置响应状态
        if (status === 'success') {
          consultationResponseStatus.value = 'AI已回复';
        } else {
          consultationResponseStatus.value = error || '请求失败';
        }
      }
    };
    
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
        const reportContainer = document.querySelector('.credit-analyse-report');
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
    
    // 组件挂载时执行
    onMounted(() => {
      // 设置初始垂直分隔位置
      document.documentElement.style.setProperty('--vertical-split', `${verticalSplit.value}%`);
      
      // 设置初始的聊天输入框宽度
      document.documentElement.style.setProperty('--chat-input-width', '100%');
      
      // 注册窗口大小变化事件
      window.addEventListener('resize', () => {
        // 延迟执行，避免频繁触发
        if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
        resizeThrottleTimeout = setTimeout(() => {
          // 无需再调整输入框高度
        }, 100);
      });
      
      // 创建MutationObserver来监听输入框高度变化
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            // 无需定期检查高度变化
          }
        });
      });
      
      // 启动定期检查高度变化
      autoHeightCheckInterval = setInterval(() => {
        // 无需定期检查高度变化
      }, 2000); // 每2秒检查一次
    });
    
    // 组件卸载时执行
    onUnmounted(() => {
      // 清理URL对象
      if (filePreviewUrl.value && filePreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl.value);
      }
      
      // 清除定时器
      stopWorkingTimer();
      if (thinkingInterval) clearInterval(thinkingInterval);
      if (consultationThinkingInterval) clearInterval(consultationThinkingInterval);
      if (autoHeightCheckInterval) clearInterval(autoHeightCheckInterval);
      if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
      
      // 移除事件监听器
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--chat-input-width');
      
      // 断开MutationObserver
      if (mutationObserver) mutationObserver.disconnect();
    });
   
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
   
    // 查看征信文件
    const viewCreditFile = () => {
      // 计算窗口尺寸（宽度80%，高度95%）
      const width = Math.floor(window.screen.width * 0.7);
      const height = Math.floor(window.screen.height * 0.85);
      const left = Math.floor((window.screen.width - width) / 2);
      const top = Math.floor((window.screen.height - height) / 2);
      
      // 获取文件名
      const fileName = fileList.value?.length > 0 ? fileList.value[0].name : '征信文件.pdf';
      
      // 打开新窗口
      const newWindow = window.open(
        '', 
        '_blank', 
        `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no,resizable=yes`
      );
      
      if (newWindow) {
        // 构建HTML内容
        let html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>客户“${formData.value.customerName}”的征信文件内容：${fileName}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  font-family: Arial, sans-serif;
                  overflow: hidden;
                }
                .container {
                  display: flex;
                  height: 100%;
                  background-color: #f5f7fa;
                }
                .file-preview {
                  width: 50%;
                  height: 100%;
                  border-right: 1px solid #dcdfe6;
                  background-color: #fff;
                  position: relative;
                  overflow: hidden;
                }
                .extracted-text {
                  width: 50%;
                  height: 100%;
                  background-color: #fff;
                  position: relative;
                  display: flex;
                  flex-direction: column;
                }
                .header {
                  height: 50px;
                  padding: 0 16px;
                  border-bottom: 1px solid #ebeef5;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  background-color: #f5f7fa;
                  font-size: 16px;
                  font-weight: 500;
                  color: #303133;
                }
                .content {
                  flex: 1;
                  padding: 16px;
                  overflow: auto;
                  white-space: pre-wrap;
                  line-height: 1.6;
                  color: #606266;
                  font-size: 14px;
                }
                iframe {
                  width: 100%;
                  height: calc(100% - 50px);
                  border: none;
                }
                .close-btn {
                  cursor: pointer;
                  color: #909399;
                  font-size: 24px;
                  margin-left: auto;
                }
                .close-btn:hover {
                  color: #1b68de;
                }
                #pdf-container {
                  width: 100%;
                  height: calc(100% - 50px);
                  overflow: hidden;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="file-preview">
                  <div class="header">
                    <div>上传的征信文件</div>
                  </div>
                  <div id="pdf-container">
                    ${filePreviewUrl.value ? `<iframe src="${filePreviewUrl.value}" frameborder="0"></iframe>` : '<div class="content">文件加载中...</div>'}
                  </div>
                </div>
                <div class="extracted-text">
                  <div class="header">
                    <div>提取的文本内容</div>
                    <div class="close-btn" onclick="window.close()">×</div>
                  </div>
                  <div class="content">${extractedText.value || '无提取内容'}</div>
                </div>
              </div>
            </body>
          </html>
        `;
        
        // 写入HTML内容到窗口
        newWindow.document.write(html);
        newWindow.document.close();
      }
    };
    
    return {
      activeStep,
      formData,
      extractionProgress,
      extractedText,
      isImageFile,
      filePreviewUrl,
      fileList,
      workingStatus,
      workingTimer,
      displayedThinkingProcess,
      isThinking,
      reportContent,
      reportGenerationDuration,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationResponseStatus,
      consultationResponseTime,
      horizontalSplit,
      verticalSplit,
      aiThinkingProcess,
      workThinkingContent,
      consultationThinkingProcesses,
      renderMarkdown,
      formatUserMessage,
      messagesContainer,
      
      // 方法
      handleFormSubmit,
      startAnalysis,
      extractPDFContent,
      resetAnalysis,
      retryExtraction,
      startAiWorking,
      nextStep,
      downloadReport,
      restartAdvisor,
      sendConsultationMessage,
      handleEnterKey,
      startResizeHorizontal,
      startResizeVertical,
      startWorkingTimer,
      stopWorkingTimer,
      stopThinkingProcess,
      viewCreditFile
    }
  }
}
</script>

<style lang="scss" scoped>
/* 
* 征信分析报告组件样式
* 最后修改时间: 2023-07-24 15:23:17
*/

/* --------- 1. 基础布局样式 --------- */
.credit-analyse-report {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
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

/* --------- 2. Element Plus组件自定义样式 --------- */
.steps-header {
  border-bottom: 1px solid #ebeef5;
  background-color: white;
}

:deep(.el-steps--simple) {
  background-color: #ffffff !important;
}

:deep(.el-step__title.is-success),
:deep(.el-step__head.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

/* --------- 3. 面板通用样式 --------- */
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
  
  .report-duration, 
  .response-status {
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

/* --------- 4. 文件提取和预览样式 --------- */
.file-name {
  font-size: 14px;
  margin-left: 10px;
  color: #909399;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.extraction-layout {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 400px;
  overflow: hidden;
}

.original-file,
.extracted-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  overflow: hidden;
}

.file-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
 
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    overflow: hidden;
  }
 
  img {
    max-width: 100%;
    display: block;
  }
}

.file-placeholder,
.text-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
 
  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
 
  p {
    font-size: 14px;
  }
}

.text-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-all;
  word-wrap: break-word;
  box-sizing: border-box;
  color: #606266;
  font-size: 14px;
}

/* 进度条样式 */
.mini-progress {
  margin-left: 12px;
  width: 120px;
  display: inline-flex;
  vertical-align: middle;
 
  :deep(.el-progress-bar__outer) {
    background-color: #e9ecef;
    border-radius: 4px;
  }
 
  :deep(.el-progress-bar__inner) {
    background-color: #1b68de;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}

/* --------- 5. AI思考和处理相关样式 --------- */
/* AI处理中的蒙层 */
.working-overlay {
  position: absolute;
  top: 5px;
  right: 10px;
  width: 280px;
  border-radius: 8px;
  z-index: 100;
  padding: 10px 16px;
  background-color: rgba(0, 0, 0, 0.65);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ai-tip {
  color: #ffffff;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* 思考容器样式 */
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

.Ai-thinking-container {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  position: relative;
  overflow: auto;
}

/* 生成报告过程中的悬浮提示 */
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
  background-color: rgba(0, 0, 0, 0.5);
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

/* --------- 6. 报告布局样式 --------- */
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

.report-left, 
.report-right {
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

/* --------- 7. 分隔线调整样式 --------- */
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

.is-resizing {
  user-select: none;
  cursor: col-resize;
}

/* --------- 8. 聊天区域样式 --------- */
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
  }
  
  &.assistant .message-content {
    border-top-left-radius: 1px;
    margin-right: 40px;
  }
  
  &.user .message-content {
    background-color: #deebff;
    color: #1b68de;
    border-bottom-right-radius: 1px;
    margin-left: 4px;
  }
  
  &.error .message-content {
    background-color: #ffebeb;
    color: #e74c3c;
    animation: error-pulse 1.5s ease-in-out;
  }
  
  &.user .message-text {
    white-space: normal;
    word-break: break-word;
    
    br {
      display: block;
      content: "";
      margin-top: 4px;
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

/* 思考指示器 */
.thinking .thinking-indicator {
  display: flex;
  gap: 6px;
  padding: 10px;
  
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #a0a0a0;
    animation: thinking 1.4s infinite ease-in-out both;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
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

/* --------- 9. 思考分隔线 --------- */
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

/* --------- 10. Markdown内容样式 --------- */
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
    
    th, td {
      padding: 4px 8px;
      min-width: 50px;
    }
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

/* --------- 11. 响应式样式 --------- */
@media (max-width: 768px) {
  .extraction-layout {
    flex-direction: column;
  }
 
  .original-file,
  .extracted-text {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }
}

/* --------- 12. 动画效果 --------- */
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
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
</style>