<!-- 最后修改记录时间 -> 2025-04-28 18:45:00 -->
<template>
  <div class="task-result-viewer">
    <div class="report-layout">
      <!-- 左侧AI分析结果 -->
      <div class="report-left">
        <div class="panel-header">
          <h3>
            <el-icon class="header-icon"><Document /></el-icon>
            {{ taskTitle }} <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
          </h3>
          <div class="header-actions">
            <!-- 征信报告类型专用按钮 - 查看征信文件 -->
            <el-button 
              v-if="isCreditReport && reportContent" 
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
            <!-- <el-button 
              v-show="reportContent" 
              type="primary" 
              size="small"
              @click="handlePrint"
              class="action-button"
            >
              <el-icon><Printer /></el-icon>打印
            </el-button> -->
            <!-- <el-button 
              v-show="reportContent" 
              type="default" 
              size="small"
              @click="handleClose"
              class="action-button"
            >
              <el-icon><Close /></el-icon>关闭
            </el-button> -->
          </div>
          </div>
        <div class="panel-content">
    <!-- 提示加载中 -->
    <div v-if="loading" class="loading-container">
            <el-skeleton :rows="15" animated />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="error-container">
      <el-empty description="加载结果失败">
        <template #description>
          <p>{{ loadError }}</p>
        </template>
        <el-button type="primary" @click="loadTaskResult">重试</el-button>
      </el-empty>
    </div>

          <!-- 结果内容 -->
          <div v-else class="report-content markdown-content" v-html="renderMarkdown(reportContent)"></div>
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
            <!-- 思考过程加载中 -->
            <div v-if="loading && !aiThinkingProcess" class="loading-container">
              <el-skeleton :rows="6" animated />
      </div>

            <div v-else class="thinking-content">
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
            <!-- 消息加载中 -->
            <div v-if="loading && !consultationMessages.length" class="loading-container">
              <el-skeleton :rows="4" animated />
      </div>

            <template v-else>
              <div v-for="(message, index) in consultationMessages" 
                   :key="index" 
                   :class="['message-container', message.role]">
                <div class="message">
                  <div class="message-avatar" v-if="message.role === 'assistant'">AI</div>
                  <div class="message-content">
                    <div class="message-text" v-if="message.role === 'user'" v-html="formatUserMessage(message.content)"></div>
                    <div class="message-text markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
                  </div>
                </div>
                <div class="message-time" v-if="message.timestamp">
                  {{ formatMessageTime(message.timestamp) }}
                </div>
              </div>
              
              <!-- AI回复思考中动画 -->
              <div v-if="consultationLoading" class="message-container assistant thinking">
                <div class="message">
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
          </template>
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
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useRoute } from 'vue-router'
import { 
  Cpu, 
  Document, 
  Download,
  Printer,
  Close,
  ChatDotSquare,
  Position,
  Files
} from '@element-plus/icons-vue'

export default {
  name: 'TaskResultViewer',
  components: {
    Document,
    Cpu,
    Download,
    Printer,
    Close,
    ChatDotSquare,
    Position,
    Files
  },
  props: {
    // 任务ID（可选，也可以从URL参数获取）
    taskId: {
      type: String,
      default: ''
    },
    // 任务类型（可选，也可以从URL参数获取）
    taskType: {
      type: String,
      default: ''
    },
    // 任务数据（可选，如果提供则不需要从API获取）
    taskData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    // 从URL参数获取任务ID和类型
    const route = useRoute();
    const urlTaskId = route.query.id;
    const urlTaskType = route.query.type;
    
    // 使用URL参数或props中的值
    const finalTaskId = ref(urlTaskId || props.taskId);
    const finalTaskType = ref(urlTaskType || props.taskType);
    
    // 状态管理
    const loading = ref(true)
    const loadError = ref('')
    const taskResult = ref(null)
    const reportContent = ref('')
    const reportGenerationDuration = ref(0)

    // 计算任务标题
    const taskTitle = computed(() => {
      return finalTaskType.value || '任务结果'
    })

    // 右侧区域相关变量
    const aiThinkingProcess = ref('')
    const workThinkingContent = ref('')
    const consultationThinkingProcesses = ref([])
    const consultationMessages = ref([])
    const consultationInput = ref('')
    const consultationLoading = ref(false)
    const consultationThinkingTimer = ref(0)
    const consultationResponseStatus = ref('')
    const consultationResponseTime = ref(0)
    let consultationThinkingInterval = null
    
    // 分栏调整
    const horizontalSplit = ref(60)
    const verticalSplit = ref(50)
    const isResizingHorizontal = ref(false)
    const isResizingVertical = ref(false)
    let resizeThrottleTimeout = null
    let lastResizeTime = 0
    
    // 消息容器引用
    const messagesContainer = ref(null)
    
    // 判断是否为征信报告类型
    const isCreditReport = computed(() => {
      return finalTaskType.value?.includes('征信') || 
             finalTaskType.value?.includes('个人征信报告分析') || 
             finalTaskType.value?.includes('企业征信报告分析');
    });
    
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

    // 设置页面标题
    const updatePageTitle = () => {
      const customerName = taskResult.value?.customerName || '未知客户';
      const taskTypeText = finalTaskType.value || '未知任务';
      document.title = `客户"${customerName}"的"${taskTypeText}"的 AI 分析结果`;
    };

    // 加载任务结果数据
    const loadTaskResult = async () => {
      // 如果没有任务ID，无法加载结果
      if (!finalTaskId.value) {
        loadError.value = '无效的任务ID'
        loading.value = false
        return
      }

      // 重置状态
      loading.value = true
      loadError.value = ''

      try {
        // 如果已经有任务数据，则直接使用
        if (props.taskData && Object.keys(props.taskData).length > 0) {
          taskResult.value = props.taskData
          generateReportContent()
          loading.value = false
          
          // 设置页面标题
          updatePageTitle();
          
          // 加载历史咨询记录
          loadConsultationHistory();
          return
        }

        // 模拟API请求获取任务结果
        // 实际项目中应该调用真实的API
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟获取结果成功
        taskResult.value = {
          // 示例结果数据
          id: finalTaskId.value,
          type: finalTaskType.value,
          submitTime: new Date(Date.now() - 3600000).toLocaleString(), // 1小时前
          endTime: new Date().toLocaleString(),
          customerName: '示例客户',
          content: `这是${finalTaskType.value}的结果内容示例`,
          // 根据不同任务类型设置不同的示例数据
        }

        // 生成报告内容
        generateReportContent()
        
        // 初始化AI思考过程和咨询消息
        initAiThinkingProcess()
        
        // 设置页面标题
        updatePageTitle();
        
        // 加载历史咨询记录
        loadConsultationHistory();

        loading.value = false
      } catch (error) {
        console.error('加载任务结果失败:', error)
        loadError.value = '加载结果数据失败，请稍后重试'
        loading.value = false
      }
    }

    // 根据任务类型生成不同的报告内容
    const generateReportContent = () => {
      const currentDate = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
      
      // 设置一个默认的报告生成时间（模拟）
      reportGenerationDuration.value = Math.floor(Math.random() * 10) + 5

      // 根据任务类型生成不同的报告内容
      switch(finalTaskType.value) {
        case '个人征信报告分析':
          generatePersonalCreditReport()
          break
        case '企业征信报告分析':
          generateBusinessCreditReport()
          break
        case '买家顾问报告':
          generateBuyerAdvisorReport()
          break
        case '融资顾问报告':
          generateFinanceAdvisorReport()
          break
        default:
          reportContent.value = `# ${finalTaskType.value || '未知类型任务'}\n\n生成时间：${currentDate}\n\n暂不支持显示该类型任务的详细结果。`
      }
    }

    // 生成个人征信报告分析
    const generatePersonalCreditReport = () => {
      const customerName = taskResult.value?.customerName || '未知客户'
      const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
      
      reportContent.value = `# 个人征信分析报告

编制日期：${currentDate}

## 一、个人基本信息

**姓名**：${customerName}
**报告类型**：个人征信报告
**报告期限**：截至 ${currentDate}
**报告用途**：购房贷款审批参考

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
- **预计月供**：约5,500-8,500元（基于当前利率）`
    }

    // 生成企业征信报告分析
    const generateBusinessCreditReport = () => {
      const customerName = taskResult.value?.customerName || '未知企业'
      const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
      
      reportContent.value = `# 企业征信分析报告

编制日期：${currentDate}

## 一、企业基本信息

**企业名称**：${customerName}
**统一社会信用代码**：91XXXXXXXXXXXXXXXXXX
**企业类型**：有限责任公司
**注册资本**：1000万元人民币
**成立日期**：2015-06-12
**报告期限**：截至 ${currentDate}

## 二、征信数据分析

### 信用评级与风险等级

- **信用评级**：AA-
- **风险等级**：低风险
- **总体情况**：企业信用状况良好，经营稳定

### 贷款情况概述

- **贷款总笔数**：3笔
- **贷款总额**：2,500万元
- **已还款总额**：1,200万元
- **未结清余额**：1,300万元
- **还款状态**：所有贷款均正常还款，无逾期

### 企业负债结构

- **短期贷款**：800万元（占比61.5%）
- **中长期贷款**：500万元（占比38.5%）
- **银行承兑汇票**：300万元
- **企业债券**：无
- **融资租赁**：无

### 对外担保情况

- **担保总额**：500万元
- **担保笔数**：1笔
- **担保状态**：被担保方正常还款中

### 信用记录查询情况

- **最近1个月查询次数**：2次
- **最近6个月查询次数**：8次
- **最近12个月查询次数**：15次
- **查询主体类型**：主要为银行金融机构

## 三、风险评估

### 偿债能力分析

- **流动比率**：1.8
- **速动比率**：1.2
- **资产负债率**：42%
- **评估结果**：企业短期和长期偿债能力均处于良好水平

### 信用历史评估

- **信用历史长度**：8年
- **历史逾期情况**：无逾期记录
- **不良信用记录**：无
- **评估结果**：企业信用历史稳定，信用表现良好

### 特殊记录分析

- **法律诉讼**：无重大诉讼
- **执行记录**：无被执行记录
- **行政处罚**：无重大行政处罚
- **经营异常**：无经营异常记录
- **评估结果**：企业经营合规，无重大法律风险`
    }
    
    // 生成买家顾问报告
    const generateBuyerAdvisorReport = () => {
      const customerName = taskResult.value?.customerName || '未知客户'
      const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
      
      reportContent.value = `# 买家顾问报告

编制日期：${currentDate}

## 一、客户需求分析

**客户姓名**：${customerName}
**购房目的**：自住
**预算范围**：300-500万元
**区域偏好**：城市中心区、学区房
**户型需求**：3房2厅，面积约100-140平方米
**特殊要求**：地铁沿线，小区环境好，物业服务优质

## 二、市场行情分析

### 目标区域市场概况

- **平均房价**：35,000-45,000元/平方米
- **近6个月价格走势**：稳中有升，涨幅约3%
- **成交量分析**：较去年同期增长12%
- **新房供应情况**：新增楼盘4个，新增房源约2000套
- **二手房挂牌量**：约3500套，较上季度增加5%

### 学区房市场分析

- **重点学区房价**：45,000-55,000元/平方米
- **溢价情况**：比普通住宅高约20-30%
- **供需情况**：供不应求，成交周期短
- **投资价值**：保值增值能力强，流动性好

## 三、房源推荐

### 推荐房源一：城心花园小区

- **位置**：市中心区域，地铁2号线旁
- **户型**：3房2厅2卫，建筑面积125平方米
- **楼层**：18层/共33层，南北通透
- **价格**：480万元（38,400元/平方米）
- **建筑年代**：2015年
- **学区情况**：对口市重点小学和初中
- **配套设施**：小区内有游泳池、健身房、儿童乐园
- **推荐理由**：位置优越，对口优质学校，小区环境佳，物业服务好

### 推荐房源二：翡翠湾小区

- **位置**：城东新区，地铁1号线和4号线交汇处
- **户型**：3房2厅1卫，建筑面积110平方米
- **楼层**：12层/共28层，东南朝向
- **价格**：420万元（38,180元/平方米）
- **建筑年代**：2018年
- **学区情况**：对口区重点小学
- **配套设施**：小区绿化率高，周边商业配套成熟
- **推荐理由**：性价比高，小区较新，周边配套完善`
    }
    
    // 生成融资顾问报告
    const generateFinanceAdvisorReport = () => {
      const customerName = taskResult.value?.customerName || '未知客户'
      const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
      
      reportContent.value = `# 融资顾问报告

编制日期：${currentDate}

## 一、客户基本情况

**客户姓名**：${customerName}
**融资需求**：购房按揭贷款
**贷款金额**：300万元
**期望贷款期限**：30年
**客户信用状况**：良好，无不良征信记录
**月收入情况**：税前月收入3.5万元，家庭月收入6万元

## 二、客户资质分析

### 还款能力评估

- **月收入**：个人税前月收入3.5万元
- **家庭月收入**：6万元
- **月固定支出**：约1.5万元（不含房贷）
- **理财资产**：约50万元（包括存款、基金等）
- **评估结果**：客户收入稳定，具备较强还款能力

### 信用状况评估

- **个人信用评分**：良好
- **信用卡使用**：3张信用卡，使用率低于30%
- **现有贷款**：无其他贷款
- **逾期记录**：无
- **评估结果**：信用记录良好，符合银行放贷要求

## 三、贷款方案建议

### 方案一：商业银行普通按揭贷款

- **建议银行**：建设银行、工商银行
- **贷款金额**：300万元
- **贷款期限**：30年
- **贷款利率**：LPR+55BP（约4.75%）
- **月供金额**：约15,670元
- **首付比例**：30%
- **审批周期**：约15-20个工作日
- **所需材料**：身份证、收入证明、银行流水、购房合同等
- **优势**：利率相对稳定，手续简单

### 方案二：公积金贷款

- **贷款金额**：120万元（公积金贷款上限）
- **贷款期限**：30年
- **贷款利率**：3.1%
- **月供金额**：约5,130元
- **审批周期**：约20-30个工作日
- **所需材料**：身份证、公积金缴存证明、购房合同等
- **优势**：利率低，总利息少

### 方案三：公积金+商业贷款组合

- **公积金贷款**：120万元，利率3.1%，月供约5,130元
- **商业贷款**：180万元，利率约4.75%，月供约9,400元
- **总月供**：约14,530元
- **优势**：降低总体利息支出，月供相对较低`
    }

    // 初始化AI思考过程
    const initAiThinkingProcess = () => {
      // 根据任务类型生成不同的思考过程
      const thinkingPrefix = `正在分析${finalTaskType.value}...\n\n思考过程：\n`;
      
      // 设置一个示例思考过程
      aiThinkingProcess.value = thinkingPrefix + 
        `嗯，我需要仔细分析这份${finalTaskType.value}的内容，提取关键信息并给出专业建议。\n\n` +
        `首先，我注意到这是一份关于${taskResult.value?.customerName || '客户'}的${finalTaskType.value}。\n` +
        `让我逐项分析内容，确保不遗漏任何重要信息...\n\n` +
        `看起来总体情况良好，没有发现明显的风险点。\n` +
        `基于分析结果，我可以提供以下几点建议...\n\n` +
        `综合评估，客户的状况适合...\n` +
        `需要特别注意的是...\n\n` +
        `我认为这份报告的结论是合理的，可以作为决策参考。`;
      
      // 设置工作思考内容
      workThinkingContent.value = aiThinkingProcess.value;
    }
    
    // 初始化咨询消息
    const initConsultationMessages = () => {
      // 清空现有消息
      consultationMessages.value = [];
      
      // 添加初始系统消息
      addSystemMessage();
    }

    // 添加系统消息
    const addSystemMessage = () => {
      consultationMessages.value.push({
        role: 'assistant',
        content: `我是良策AI助手，您正在查看${taskResult.value?.customerName || '客户'}的${finalTaskType.value}的结果。您可以继续向我咨询关于此报告的任何问题。`,
        // timestamp: new Date().toISOString(),
        isSystemMessage: true // 标记为系统消息
      });
    };

    // 处理下载结果
    const downloadReport = () => {
      try {
        const element = document.createElement('a');
        const file = new Blob([reportContent.value], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `${finalTaskType.value}_${taskResult.value?.customerName || '客户'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        ElMessage.success('报告下载成功');
      } catch (error) {
        console.error('下载报告出错:', error);
        ElMessage.error('报告下载失败，请重试');
      }
    }

    // 处理打印
    const handlePrint = () => {
      window.print();
    }

    // 处理关闭
    const handleClose = () => {
      window.close();
    }

    // 加载历史咨询记录
    const loadConsultationHistory = () => {
      try {
        // 尝试从localStorage获取历史咨询记录
        const storageKey = `task_consultation_${finalTaskId.value}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // 恢复历史思考过程
          if (parsedData.thinkingProcesses && parsedData.thinkingProcesses.length > 0) {
            consultationThinkingProcesses.value = parsedData.thinkingProcesses;
          }
          
          // 恢复历史消息，但过滤掉系统消息
          if (parsedData.messages && parsedData.messages.length > 0) {
            // 过滤掉之前的系统消息
            consultationMessages.value = parsedData.messages.filter(msg => !msg.isSystemMessage);
            
            // 在最后添加新的系统消息
            addSystemMessage();
          } else {
            // 如果没有历史消息，初始化消息
            initConsultationMessages();
          }
        } else {
          // 如果没有历史记录，初始化消息
          initConsultationMessages();
        }
      } catch (error) {
        console.error('加载历史咨询记录失败:', error);
        // 出错时初始化消息
        initConsultationMessages();
      }
    };
    
    // 保存咨询历史记录
    const saveConsultationHistory = () => {
      try {
        if (!finalTaskId.value) return;
        
        // 过滤掉系统消息再保存
        const messagesWithoutSystem = consultationMessages.value.filter(msg => !msg.isSystemMessage);
        
        const storageKey = `task_consultation_${finalTaskId.value}`;
        const dataToSave = {
          taskId: finalTaskId.value,
          taskType: finalTaskType.value,
          thinkingProcesses: consultationThinkingProcesses.value,
          messages: messagesWithoutSystem,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('保存咨询历史记录失败:', error);
      }
    };

    // 发送咨询消息
    const sendConsultationMessage = async () => {
      if (!consultationInput.value.trim() || consultationLoading.value) return;
      
      // 创建用户消息对象
      const userMessage = {
        role: 'user',
        content: consultationInput.value.trim(),
        timestamp: new Date().toISOString()
      };
      consultationMessages.value.push(userMessage);
      consultationInput.value = '';
      consultationLoading.value = true;
      
      // 保存咨询历史
      saveConsultationHistory();
      
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
我需要为用户提供关于${finalTaskType.value}的专业解答。基于报告内容和专业知识，我将分析用户的问题并给出合适的建议。

首先理解用户的问题，看起来用户想了解关于${finalTaskType.value}的具体内容...
根据我对报告的分析，我可以提供以下几点建议...

考虑到用户的关注点，我应该强调...
同时也需要说明...

我需要确保回答准确、专业，同时易于理解...`;

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
        
        // 计算每秒应该显示的字符数，控制在5秒左右完成
        const charsPerSecond = totalLength / 5;
        
        // 创建逐字显示的计时器
        const typingInterval = setInterval(() => {
          if (typingIndex < fullThinkingContent.length) {
            // 添加下一个字符
            consultationThinkingProcesses.value[currentThinkingIndex] += fullThinkingContent[typingIndex];
            typingIndex++;
            
            // 自动滚动到底部
            const thinkingContent = document.querySelector('.thinking-content');
            if (thinkingContent) {
              thinkingContent.scrollTop = thinkingContent.scrollHeight;
            }
            
            // 保存咨询历史（每20个字符保存一次，避免频繁保存）
            if (typingIndex % 20 === 0) {
              saveConsultationHistory();
            }
          } else {
            // 所有内容显示完毕
            clearInterval(typingInterval);
            
            // 保存思考过程
            saveConsultationHistory();
            
            // 生成回复内容
            setTimeout(() => {
              // 创建模拟回复
              let reply = '';
              
              // 根据问题生成不同的回复
              if (question.includes('贷款') || question.includes('融资')) {
                reply = `根据您的咨询，关于${finalTaskType.value}中的贷款问题，我建议您关注以下几点：

1. 当前的贷款利率和条件是市场上较为优惠的
2. 建议您考虑固定利率与浮动利率的差异和适用性
3. 提前还款策略可以帮助您节省利息支出

如果您有更具体的贷款问题，可以继续咨询我。`;
              } else if (question.includes('风险') || question.includes('安全')) {
                reply = `关于您咨询的风险问题，${finalTaskType.value}中已进行了全面评估：

1. 报告显示目前风险等级为低风险，整体状况良好
2. 无重大不良记录，信用历史稳定
3. 建议您仍需定期检查信用报告，保持良好的信用记录

风险控制是一个持续的过程，如需更详细的风险管理建议，请随时咨询。`;
              } else {
                reply = `感谢您的咨询。基于${finalTaskType.value}的分析结果，我可以提供以下建议：

1. 报告显示整体状况良好，符合大多数金融机构的要求
2. 建议您关注报告中提到的几个优化点，这将进一步提升评估结果
3. 如果您有具体的决策需求，可以结合报告中的详细数据进行考量

如有更多问题，请继续咨询，我很乐意为您提供更详细的解答。`;
              }
              
              // 添加回复到消息列表
              consultationMessages.value.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
              });
              
              // 保存咨询历史
              saveConsultationHistory();
              
              // 更新状态
              consultationLoading.value = false;
              stopConsultationThinking('success');
              
              // 滚动到底部
              nextTick(() => {
                if (messagesContainer.value) {
                  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
              });
            }, 500);
          }
        }, 10);
      } catch (error) {
        console.error('发送咨询消息出错:', error);
        consultationLoading.value = false;
        stopConsultationThinking('error', '请求失败，请重试');
        ElMessage.error('发送失败，请重试');
      }
    };
    
    // 处理Enter键发送消息
    const handleEnterKey = (event) => {
      // 如果按下Shift+Enter，允许换行
      if (event.shiftKey) {
        return;
      }
      
      // 如果按下Enter但没有Shift，阻止默认行为并发送消息
      event.preventDefault();
      
      // 检查是否可以发送消息（输入框不为空且不在思考中）
      if (consultationInput.value.trim() && !consultationLoading.value) {
        sendConsultationMessage();
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
        const reportContainer = document.querySelector('.task-result-viewer');
        if (reportContainer) {
          reportContainer.style.setProperty('--horizontal-split', `${percent}%`);
        }
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
      }, 10);
    };
    
    // 停止垂直调整大小
    const stopResizeVertical = () => {
      isResizingVertical.value = false;
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
    };

    // 查看征信文件
    const viewCreditFile = () => {
      // 计算窗口尺寸（宽度80%，高度95%）
      const width = Math.floor(window.screen.width * 0.7);
      const height = Math.floor(window.screen.height * 0.85);
      const left = Math.floor((window.screen.width - width) / 2);
      const top = Math.floor((window.screen.height - height) / 2);
      
      // 获取文件名
      const fileName = taskResult.value?.fileName || '征信文件.pdf';
      
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
              <title>客户"${taskResult.value?.customerName || '未知客户'}"的征信文件内容：${fileName}</title>
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
                    <div class="content">文件预览需要后端API支持</div>
                  </div>
                </div>
                <div class="extracted-text">
                  <div class="header">
                    <div>提取的文本内容</div>
                    <div class="close-btn" onclick="window.close()">×</div>
                  </div>
                  <div class="content">
                    <p>客户名称：${taskResult.value?.customerName || '未知客户'}</p>
                    <p>任务类型：${finalTaskType.value}</p>
                    <p>任务ID：${finalTaskId.value}</p>
                    <p>提交时间：${taskResult.value?.submitTime || '未知'}</p>
                    <hr>
                    <p>征信文件内容在实际应用中将从后端API获取。</p>
                  </div>
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

    // 格式化消息时间
    const formatMessageTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/\//g, '-');
      } catch (error) {
        console.error('格式化时间出错:', error);
        return '';
      }
    };

    // 组件挂载后自动加载结果
    onMounted(() => {
      // 设置初始垂直分隔位置
      document.documentElement.style.setProperty('--vertical-split', `${verticalSplit.value}%`);
      
      // 设置初始水平分隔位置
      document.documentElement.style.setProperty('--horizontal-split', `${horizontalSplit.value}%`);
      
      // 注册窗口大小变化事件
      window.addEventListener('resize', () => {
        // 延迟执行，避免频繁触发
        if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
        resizeThrottleTimeout = setTimeout(() => {
          // 根据需要调整布局
        }, 100);
      });
      
      // 加载任务结果
      loadTaskResult();
    });
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      // 清除定时器
      if (consultationThinkingInterval) clearInterval(consultationThinkingInterval);
      if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
      
      // 移除事件监听器
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      // 移除CSS变量
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--horizontal-split');
    });
    
    // 监听咨询消息变化，自动滚动到底部
    watch(consultationMessages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }, { deep: true });

    return {
      loading,
      loadError,
      taskResult,
      taskTitle,
      reportContent,
      reportGenerationDuration,
      
      aiThinkingProcess,
      workThinkingContent,
      consultationThinkingProcesses,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationResponseStatus,
      consultationResponseTime,
      
      horizontalSplit,
      verticalSplit,
      
      messagesContainer,
      
      // 方法
      loadTaskResult,
      renderMarkdown,
      formatUserMessage,
      downloadReport,
      handlePrint,
      handleClose,
      sendConsultationMessage,
      handleEnterKey,
      startResizeHorizontal,
      startResizeVertical,
      isCreditReport,
      viewCreditFile,
      loadConsultationHistory,
      saveConsultationHistory,
      formatMessageTime
    }
  }
}
</script>

<style lang="scss" scoped>
/* --------- 1. 基础布局样式 --------- */
.task-result-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;
}

.report-layout {
  display: grid;
  grid-template-columns: var(--horizontal-split, 55%) calc(100% - var(--horizontal-split, 55%));
  height: 100%;
  position: relative;
  overflow: hidden;
  width: 100%;
}

/* --------- 2. 面板通用样式 --------- */
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
    
    .response-status {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
    }
  }
  
  .report-duration {
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

/* --------- 3. 报告左侧区域样式 --------- */
.report-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100%;
  border-right: 1px solid #dcdfe6;
}

.loading-container {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}

.report-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  line-height: 1.6;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* --------- 4. 报告右侧区域样式 --------- */
.report-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

/* --------- 5. 思考内容区域样式 --------- */
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

/* --------- 6. 分隔线调整样式 --------- */
.resizer-vertical {
  position: absolute;
  left: auto;
  width: calc(100% - var(--horizontal-split, 60%));
  right: 0;
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
  left: var(--horizontal-split, 60%);
  transform: translateX(-3px);
  transition: background-color 0.2s;
  
  &:hover,
  &:active {
    background-color: rgba(64, 158, 255, 0.2);
  }
}

/* --------- 7. 聊天区域样式 --------- */
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #fafafa;
  
  .loading-container {
    padding: 0;
  }
}

.message-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  padding: 0 4px;
  width: 100%;
  box-sizing: border-box;
  
  &.user {
    align-items: flex-end;
  }
  
  &.assistant {
    align-items: flex-start;
  }
}

.message {
  display: flex;
  gap: 8px;
  width: fit-content;
  max-width: 90%;
  animation: message-fade-in 0.3s ease-out;
  
  .message-content {
    background-color: #fff;
    padding: 10px 12px;
    border-radius: 16px;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s ease;
  }
  
  .assistant & .message-content {
    border-top-left-radius: 1px;
    margin-right: 40px;
  }
  
  .user & .message-content {
    background-color: #deebff;
    color: #1b68de;
    border-bottom-right-radius: 1px;
    margin-left: 4px;
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1b68de;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.5;
  font-size: 14px;
  
  &.markdown-content {
    width: 100%;
  }
}

.message-time {
  font-size: 12px;
  color: #90939970;
  margin-top: 4px;
  width: fit-content;
}

.assistant .message-time {
  margin-left: 44px;
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

/* 消息动画 */
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

/* --------- 8. Markdown内容样式 --------- */
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
  
  :deep(h1) {
    font-size: 24px;
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  :deep(h2) {
    font-size: 20px;
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 8px;
  }
  
  :deep(h3) {
    font-size: 18px;
    margin-top: 20px;
    margin-bottom: 10px;
    font-weight: 600;
    color: #303133;
  }
  
  :deep(ul, ol) {
    padding-left: 24px;
    margin-bottom: 16px;
  }
  
  :deep(li) {
    margin-bottom: 4px;
  }
  
  :deep(table) {
    border-collapse: collapse;
    margin-bottom: 16px;
    width: 100%;
    
    th, td {
      border: 1px solid #ebeef5;
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: #f5f7fa;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #fafafa;
    }
  }
  
  :deep(blockquote) {
    border-left: 4px solid #dcdfe6;
    margin-left: 0;
    margin-right: 0;
    padding-left: 16px;
    color: #606266;
  }
}

/* --------- 9. 动画效果 --------- */
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
</style> 