<template>
  <div class="finance-advisor-form">
    <div class="form-container">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2 class="panel-title">填写客户融资需求</h2>
        </div>
        <div class="panel-content">
          <p class="description-hint">请参照右侧的需求描述建议输入客户的融资需求，信息覆盖得越全面越好。</p>
          
          <el-form :model="formData" :rules="rules" ref="financeForm">
            <!-- 需求描述文本框 -->
            <el-form-item prop="requirements" :rules="[
              { required: true, message: '请输入需求描述', trigger: 'blur' }
            ]">
              <el-input
                v-model="formData.requirements"
                type="textarea"
                :rows="10"
                :autosize="{ minRows: 10, maxRows: 12 }"
                placeholder="请用不少于10个字详细地描述客户的融资需求"
                @focus="handleInputFocus"
                @input="handleDescriptionInput"
                @blur="handleDescriptionBlur"
                ref="descriptionTextarea"
                maxlength="500"
                show-word-limit
                :disabled="isExtractingKeywords || hasAttemptedExtraction"
              ></el-input>
            </el-form-item>
            
            <!-- 客户信息输入区域 -->
            <div class="client-info-section">
              <!-- 客户姓名输入框 -->
              <el-form-item prop="name">
                <el-input 
                  v-model="formData.name" 
                  placeholder="请输入客户姓名（必填，方便你查询结果）" 
                  @focus="handleInputFocus"
                  @keydown.enter.prevent
                  clearable
                  :disabled="isExtractingKeywords"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <!-- 业务地区选择 -->
              <el-form-item prop="businessArea" class="business-area-item">
                <el-cascader
                  v-model="formData.businessArea"
                  :options="provinceOptions"
                  :props="{
                    expandTrigger: 'hover',
                    value: 'value',
                    label: 'label',
                    children: 'children'
                  }"
                  placeholder="请选择业务城市（必填）"
                  clearable
                  filterable
                  style="width: 100%"
                  :disabled="isExtractingKeywords"
                  @focus="handleInputFocus"
                >
                  <template #prefix>
                    <el-icon><Location /></el-icon>
                  </template>
                </el-cascader>
              </el-form-item>

              <!-- 征信报告分析结果选择器 -->
              <el-form-item prop="creditReport" class="credit-report-item">
                <div 
                  class="credit-report-trigger" 
                  @click="toggleCreditReportHistory"
                  :class="{ 
                    'is-disabled': isExtractingKeywords,
                    'has-value': hasSelectedCreditReport,
                    'is-expanded': showCreditHistory && !hasSelectedCreditReport
                  }"
                >
                  <span class="trigger-prefix">
                    <el-icon><PriceTag /></el-icon>
                  </span>
                  <span class="trigger-text" :class="{ 'has-selected': hasSelectedCreditReport }">
                    {{ selectedCreditReportText }}
                  </span>
                  <span class="trigger-suffix">
                    <el-icon class="arrow-icon" :class="{'is-reverse': showCreditHistory && !hasSelectedCreditReport}"><ArrowRight /></el-icon>
                    <el-icon v-if="hasSelectedCreditReport" class="clear-icon" @click.stop="clearSelectedCreditReport"><Close /></el-icon>
                  </span>
                </div>
              </el-form-item>
            </div>

            <!-- 表单按钮操作区 -->
            <div class="form-actions">
              <template v-if="!hasAttemptedExtraction">
              <el-button 
                @click="resetForm" 
                plain
                :disabled="!formData.requirements && !formData.name && (!formData.businessArea || !formData.businessArea.length) && !hasSelectedCreditReport"
              >重置</el-button>
              <el-button 
                type="primary" 
                  @click="extractKeywords" 
                  :loading="isExtractingKeywords"
                  :disabled="!formData.requirements || formData.requirements.trim().length < 10 || isExtractingKeywords"
              >
                <template v-if="!isExtractingKeywords">
                    让AI分析客户需求
                    <!-- <span class="button-hint">Shift+Enter</span> -->
                </template>
                <template v-else>
                  AI正在提取关键词
                    <span class="button-hint">用时{{currentAnalysisTime}}秒</span>
                </template>
              </el-button>
              </template>
              <template v-else>
                <el-button 
                  @click="resetForm" 
                  plain
                >新的需求</el-button>
                <el-button 
                  type="primary" 
                  @click="submitFinanceForm"
                  :loading="submitting"
                  :disabled="isExtractingKeywords"
                ><el-icon><CaretRight /></el-icon> 让AI生成融资建议报告</el-button>
              </template>
            </div>
          </el-form>
                  
          <!-- 贷款计算器入口 -->
          <div class="tools-section">
            <div class="tool-card" @click="openLoanCalculator">
              <div class="tool-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="tool-content">
                <div class="tool-title">贷款计算器</div>
                <div class="tool-description">计算各种贷款方式的总还款额、利息及月供等</div>
              </div>
              <div class="tool-action">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容面板 -->
      <div class="content-panel">
        <!-- 遮罩层 -->
        <div class="drawer-overlay" v-show="showCreditHistory" @click="backToRequirementSuggestion"></div>
        
        <!-- 引导内容始终保持在背景 -->
        <div class="reference-content" :class="{ 'is-background': showCreditHistory }" v-show="!hasAttemptedExtraction">
          <div class="panel-header">
            <h2 class="panel-title">融资需求描述建议</h2>
          </div>
          <div class="panel-content">
            <div class="reference-section">                
              <h4>需求尽可能详细地包含以下信息：</h4>
              <div class="reference-items">
                <span class="reference-item">
                  <span class="item-label">贷款方式：按揭贷款、抵押贷款、信用贷款、经营贷款、消费贷款等</span>
                </span>
                <span class="reference-item">
                  <span class="item-label">融资金额与期限：需要多少资金，使用多长时间</span>
                </span>
                <span class="reference-item">
                  <span class="item-label">融资用途：资金将用于哪些方面，例如周转、扩大生产、新项目等</span>
                </span>
                <span class="reference-item">
                  <span class="item-label">企业情况：行业、规模、经营时间、近期营收情况</span>
                </span>
                <span class="reference-item">
                  <span class="item-label">现有资产：有无房产、车辆等可抵押物</span>
                </span>
                <span class="reference-item">
                  <span class="item-label">特殊要求：放款速度、利率要求、还款方式偏好</span>
                </span>
              </div>
            </div>
          
            <div class="example-section">
              <div class="example-block">
                <h4>融资需求描述参考示例：</h4>
                <blockquote 
                  class="example-quote" 
                  @click="copyExampleText"
                  v-html="'我是一家成立了5年的餐饮企业老板，在广州有3家连锁店，月营业额约80万元。<br>现计划申请经营抵押贷款300万元用于新开2家分店，希望能在1个月内放款，期限2年以上，可接受月息最高5厘。<br>目前在广州名下有一套市值约500万元的商品房可以抵押，目前无贷款，也有约50万元应收账款。希望了解银行抵押贷款和企业经营贷款哪个更合适，最快多久能拿到资金。'">
                </blockquote>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 征信报告历史列表，添加动画效果 -->
        <div class="credit-history-drawer" :class="{ 'is-visible': showCreditHistory }">
          <div class="credit-history-content full-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                选择征信报告分析结果
                <el-popover
                  content="可选择征信报告分析结果与融资需求关键词一并交给AI以获得更精准的融资建议；最多只能同时选择一份个人和（或）一份企业征信报告分析结果。"
                  placement="top"
                  trigger="hover"
                  :width="530"
                >
                  <template #reference>
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </template>
                </el-popover>
              </h2>
              <div class="header-actions">
                <el-button 
                  type="primary" 
                  link
                  @click="backToRequirementSuggestion"
                  class="back-button"
                >
                  <el-icon><CloseBold /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="panel-content no-padding">
              <!-- 筛选区域 -->
              <div class="search-filters">
                <div class="filter-row">
                  <!-- 客户姓名 -->
                <div class="filter-item">
                  <el-input
                      v-model="searchForm.customerName" 
                      placeholder="请输入客户姓名" 
                    clearable
                    size="small"
                      :disabled="tableDataLoading"
                    />
                </div>
                  
                  <!-- 任务结果 -->
                <div class="filter-item">
                  <el-select
                      v-model="searchForm.taskResults" 
                    placeholder="任务结果"
                    clearable
                    size="small"
                      :disabled="tableDataLoading"
                    >
                    <el-option v-for="item in creditReportResultOptions" :key="item" :label="item" :value="item" />
                </el-select>
                </div>
                  
                  <!-- 按钮组 -->
                  <div class="filter-item button-group">
                  <el-button 
                    type="primary" 
                      @click="handleSearch" 
                    size="small"
                      :loading="tableDataLoading"
                      :disabled="tableDataLoading"
                  >
                      {{ tableDataLoading ? '搜索中...' : '搜索' }}
                  </el-button>
                  <el-button 
                      @click="resetSearch" 
                    size="small"
                      :disabled="tableDataLoading"
                  >
                    重置
                  </el-button>
                  </div>
                </div>
              </div>
              
              <div class="table-wrapper">
                <!-- 表格区域包装器 -->
                <div class="table-content-wrapper">
                  <!-- 表格，调整loading效果 -->
                  <el-table
                    :data="paginatedHistoryList"
                    style="width: 100%"
                    :border="true"
                    :stripe="true"
                    size="small"
                    fit
                    :header-cell-style="{ 'white-space': 'nowrap', 'height': '35px', 'font-size': '13px', 'font-weight': '400' }"
                    :table-layout="'fixed'"
                    :cell-style="{ 'color': '#606266', 'font-size': '13px' }"
                    :row-style="{ height: '35px' }"
                    height="100%"
                  >
                    <!-- 自定义空数据提示 -->
                    <template #empty>
                      <div class="empty-state">
                        <div class="empty-state-container">
                          <div class="empty-state-icon">
                            <el-icon :size="40" ><Drizzling /></el-icon>
                          </div>
                          <h3 class="empty-state-title">没找到征信报告分析结果</h3>
                          <p class="empty-state-description">
                            可<a href="/" target="_blank" class="empty-state-link">前去发起征信分析</a>，获得结果后再回来选择
                          </p>
                        </div>
                      </div>
                    </template>
                    <el-table-column label="选择" width="55" :fixed="true" align="center" header-align="center">
                      <template #default="scope">
                        <el-checkbox 
                          v-model="scope.row.isSelected" 
                          :disabled="isCheckboxDisabled(scope.row)"
                          @change="(val) => handleTaskSelection(scope.row, val)"
                        ></el-checkbox>
                      </template>
                    </el-table-column>
                    <el-table-column prop="customerName" label="客户姓名" min-width="155" show-overflow-tooltip/>
                    <el-table-column prop="type" label="AI任务类型" min-width="130" show-overflow-tooltip>
                      <template #default="scope">
                        <span v-if="scope.row.type && (scope.row.type.includes('个人征信') || scope.row.type.includes('企业征信'))">
                          {{ scope.row.type }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="任务结束时间" min-width="155" show-overflow-tooltip>
                      <template #default="scope">
                        <template v-if="scope.row.result && (scope.row.result.includes('进行中') || scope.row.result.includes('排队中'))">
                          <!-- 进行中/排队中任务结束时间为空 -->
                        </template>
                        <template v-else>
                          {{ scope.row.endTime || '' }}
                        </template>
                      </template>
                    </el-table-column>
                    <el-table-column label="任务结果" min-width="90">
                      <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.result)">{{ scope.row.result }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" min-width="90" :fixed="'right'" align="center" header-align="center">
                      <template #default="scope">
                        <el-button 
                          type="primary" 
                          link
                          v-if="scope.row.result === '已出结果'"
                          @click="viewResult(scope.row)"
                        >
                          查看结果
                        </el-button>
                        
                        <el-button 
                          type="danger" 
                          link
                          v-if="scope.row.result && scope.row.result.includes('排队中')"
                          @click="showCancelConfirm(scope.row.id)"
                          class="cancel-btn"
                        >
                          取消任务
                        </el-button>
                        
                        <el-tooltip
                          content="暂未能支持取消进行中的任务"
                          placement="top"
                          :show-after="100"
                          v-if="scope.row.result && scope.row.result.includes('进行中')"
                        >
                          <el-button 
                            type="danger" 
                            link
                            disabled
                          >
                            取消任务
                          </el-button>
                        </el-tooltip>

                        <!-- 为任务失败状态添加失败原因按钮 -->
                        <el-tooltip
                          :content="'失败原因：' + (scope.row.content && scope.row.content.includes('原因：') ? scope.row.content.split('原因：')[1] : scope.row.content || '未知')"
                          placement="top"
                          :show-after="100"
                          v-if="scope.row.result && scope.row.result.includes('任务失败')"
                        >
                          <el-button 
                            type="info" 
                            link
                          >
                            查看原因
                          </el-button>
                        </el-tooltip>

                        <span v-if="!scope.row.result || (!scope.row.result.includes('排队中') && !scope.row.result.includes('进行中') && scope.row.result !== '已出结果' && !scope.row.result.includes('任务失败'))">-</span>
                      </template>
                    </el-table-column>
                  </el-table>
                  
                  <!-- 自定义加载层 -->
                  <div v-if="tableDataLoading" class="custom-loading-mask">
                    <div class="custom-loading-container">
                      <div class="custom-loading-spinner"></div>
                      <span class="custom-loading-text">正在搜索历史任务...</span>
                    </div>
                  </div>
                </div>
                
                <!-- 分页容器样式 -->
                <div class="pagination-container" v-if="filteredHistoryList && filteredHistoryList.length > 0">
                  <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredHistoryList && Array.isArray(filteredHistoryList) ? filteredHistoryList.length : 0"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    background
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析结果内容 -->
        <div class="analysis-content" v-show="hasAttemptedExtraction">
          <div class="panel-header">
            <h3 class="panel-title">
              AI关键词提取结果
              <span class="analysis-time" v-if="extractionDuration">
                用时{{ extractionDuration }}秒
              </span>
            </h3>
            <!-- 重新提取按钮 -->
            <el-button 
              class="reanalyze-button" 
              @click="extractKeywords" 
              :loading="isExtractingKeywords"
            >
              <template v-if="!isExtractingKeywords">
                重新提取 <span class="button-hint">Shift+Enter</span>
              </template>
              <template v-else>
                提取中 <span class="button-hint">用时{{currentAnalysisTime}}秒</span>
              </template>
            </el-button>
          </div>
          <div class="panel-content">
            <div class="keywords-display">
              <h4>提取的关键词</h4>
              <div class="keywords-content" v-if="aiKeywords && aiKeywords.length > 0">
                <el-tag
                  v-for="keyword in aiKeywords"
                  :key="keyword.key"
                  class="keyword-tag"
                  :type="keyword.type"
                >
                  {{ keyword.value }}
                </el-tag>
              </div>
              <div class="keywords-placeholder" v-else>
                <template v-if="extractError">
                  {{ extractError }}
                </template>
                <template v-else-if="isExtractingKeywords">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  AI正在提取关键词中...
                </template>
              </div>
            </div>
            
            <div class="analysis-suggestion-section">
              <h4 class="result-title">AI分析结果建议
                <!-- <span class="advice-hint">
                  确认关键词准确后，请让AI生成融资建议报告
                </span> -->
              </h4>                  
              <div class="user-requirement-suggestion" ref="keywordsSuggestionRef">
                <p>AI已成功提取融资需求关键词，点击"让AI生成融资建议报告"获取完整建议。</p>
                <p>若对关键词结果不满意，可"重新提取"或点击"新的需求"按钮来重新填写客户融资需求。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { User, CaretRight, Money, Loading, Aim, InfoFilled, Location, ArrowRight, Document, Close, CloseBold, Drizzling, Tickets } from '@element-plus/icons-vue'
import { sendMessage } from '../api/chat'
import store from '../store'

export default {
  name: 'FinanceAdvisorForm',
  components: {
    User,
    CaretRight,
    Money,
    Loading,
    Aim,
    InfoFilled,
    Location,
    ArrowRight,
    Document,
    Close,
    CloseBold,
    Drizzling
  },
  emits: ['submit'],
  
  setup(props, { emit }) {
    // 表单引用
    const financeForm = ref(null)
    const descriptionTextarea = ref(null)
    
    // 表单数据对象
    const formData = reactive({
      requirements: '',  // 需求描述
      name: '',          // 客户姓名
      businessArea: [],   // 业务地区
      creditReport: ''   // 征信报告分析结果
    })
    
    // 表单验证规则
    const rules = reactive({
      requirements: [
        { required: true, message: '请输入需求描述', trigger: 'blur' }
      ],
        name: [
        { required: true, message: '请输入客户姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
        ],
        businessArea: [
        { required: true, message: '请选择业务城市', trigger: 'change' },
        { type: 'array', min: 1, message: '请选择业务城市', trigger: 'change' }
      ]
    })
    
    // 征信报告分析结果选项
    const creditReportOptions = [
      { value: '优秀', label: '优秀(700分以上)' },
      { value: '良好', label: '良好(650-699分)' },
      { value: '一般', label: '一般(600-649分)' },
      { value: '较差', label: '较差(550-599分)' },
      { value: '差', label: '差(550分以下)' },
      { value: '无记录', label: '无信用记录' }
    ]
    
    // 关键词提取状态
    const isExtractingKeywords = ref(false)
    const hasAttemptedExtraction = ref(false)
    const extractionDuration = ref(0)
    const extractionStartTime = ref(0)
    const extractionTimerInterval = ref(null)
    const currentAnalysisTime = ref(0)
    const submitting = ref(false)
    const shouldIgnoreResult = ref(false)
    
    // 提取任务控制
    const extractionTaskId = ref(0)
    
    // 关键词和错误信息
    const aiKeywords = ref([])
    const extractError = ref('')
    
    // 结果建议的DOM引用
    const keywordsSuggestionRef = ref(null)
    
    // 省份选项
    const provinceOptions = [
        {
          value: '北京',
          label: '北京',
          children: [{ value: '北京市', label: '北京市' }]
        },
        {
          value: '上海',
          label: '上海',
          children: [{ value: '上海市', label: '上海市' }]
        },
        {
          value: '天津',
          label: '天津',
          children: [{ value: '天津市', label: '天津市' }]
        },
        {
          value: '重庆',
          label: '重庆',
          children: [{ value: '重庆市', label: '重庆市' }]
        },
        {
          value: '广东',
          label: '广东',
          children: [
            { value: '广州市', label: '广州市' },
            { value: '深圳市', label: '深圳市' },
            { value: '珠海市', label: '珠海市' },
            { value: '汕头市', label: '汕头市' },
            { value: '佛山市', label: '佛山市' },
            { value: '韶关市', label: '韶关市' },
            { value: '江门市', label: '江门市' },
            { value: '湛江市', label: '湛江市' },
            { value: '茂名市', label: '茂名市' },
            { value: '肇庆市', label: '肇庆市' },
            { value: '惠州市', label: '惠州市' },
            { value: '梅州市', label: '梅州市' },
            { value: '汕尾市', label: '汕尾市' },
            { value: '河源市', label: '河源市' },
            { value: '阳江市', label: '阳江市' },
            { value: '清远市', label: '清远市' },
            { value: '东莞市', label: '东莞市' },
            { value: '中山市', label: '中山市' },
            { value: '潮州市', label: '潮州市' },
            { value: '揭阳市', label: '揭阳市' },
            { value: '云浮市', label: '云浮市' }
          ]
        },
        {
          value: '江苏',
          label: '江苏',
          children: [
            { value: '南京市', label: '南京市' },
            { value: '无锡市', label: '无锡市' },
            { value: '徐州市', label: '徐州市' },
            { value: '常州市', label: '常州市' },
            { value: '苏州市', label: '苏州市' },
            { value: '南通市', label: '南通市' },
            { value: '连云港市', label: '连云港市' },
            { value: '淮安市', label: '淮安市' },
            { value: '盐城市', label: '盐城市' },
            { value: '扬州市', label: '扬州市' },
            { value: '镇江市', label: '镇江市' },
            { value: '泰州市', label: '泰州市' },
            { value: '宿迁市', label: '宿迁市' }
          ]
        },
        {
          value: '浙江',
          label: '浙江',
          children: [
            { value: '杭州市', label: '杭州市' },
            { value: '宁波市', label: '宁波市' },
            { value: '温州市', label: '温州市' },
            { value: '嘉兴市', label: '嘉兴市' },
            { value: '湖州市', label: '湖州市' },
            { value: '绍兴市', label: '绍兴市' },
            { value: '金华市', label: '金华市' },
            { value: '衢州市', label: '衢州市' },
            { value: '舟山市', label: '舟山市' },
            { value: '台州市', label: '台州市' },
            { value: '丽水市', label: '丽水市' }
          ]
        },
      // 保留其他省份
    ]
    
    // 打开贷款计算器窗口
    const openLoanCalculator = () => {
      // 检查是否已有计算器窗口打开
      if (window.loanCalculatorWindow && !window.loanCalculatorWindow.closed) {
        // 已有窗口，激活它
        window.loanCalculatorWindow.focus();
        return;
      }
      
      // 计算窗口尺寸和居中位置
      const width = 1010;
      const defaultHeight = 900;
      // 使用screen.height获取屏幕高度而不是浏览器窗口高度
      const maxHeight = screen.height;
      // 如果屏幕高度足够，使用默认高度；否则使用屏幕的最大高度
      const height = maxHeight >= defaultHeight ? defaultHeight : maxHeight;
      const left = Math.floor((window.innerWidth - width) / 2);
      const top = Math.floor((window.innerHeight - height) / 2);
      
      // 打开居中显示的新窗口
      const newWindow = window.open(
        '/loan-calculator', 
        '_blank', 
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // 确保窗口成功打开
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        ElMessage.warning('您的浏览器阻止了弹出窗口，请允许弹出窗口后重试');
      } else {
        // 保存窗口引用以便后续使用
        window.loanCalculatorWindow = newWindow;
      }
    }
    
    // 输入框获取焦点处理
    const handleInputFocus = (event) => {
      if (event && event.target) {
        setTimeout(() => {
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select();
          }
        }, 0);
      }
    }
    
    // 需求描述输入处理
    const handleDescriptionInput = () => {
      // 当用户输入时，判断是否需要重置关键词状态
      if (hasAttemptedExtraction.value) {
        const trimmedText = formData.requirements.trim();
        // 如果内容变化了，重置关键词状态
        if (trimmedText !== lastExtractedText.value) {
          resetExtractionState();
        }
      }
    }
    
    // 描述框失焦处理
    const handleDescriptionBlur = () => {
      // 当输入内容为空时，重置状态
      if (!formData.requirements || formData.requirements.trim() === '') {
        extractError.value = '';
        aiKeywords.value = [];
        return;
      }
      
      // 检查文字长度是否少于10个字
      const trimmedText = formData.requirements.trim();
      if (trimmedText.length < 10 && aiKeywords.value && !aiKeywords.value.length) {
        extractError.value = '需求描述的文字不应该少于10个字';
      }
    }
    
    // 记录上次提取时的文本内容
    const lastExtractedText = ref('');
    
    // 重置提取关键词相关状态
    const resetExtractionState = () => {
      // 停止任何进行中的提取任务
      extractionTaskId.value++;
      
      // 清除关键词
      aiKeywords.value = [];
      extractError.value = '';
      hasAttemptedExtraction.value = false;
      lastExtractedText.value = '';
      
      // 重置计时器
      resetExtractionTimer();
      
      // 重置状态
      isExtractingKeywords.value = false;
      submitting.value = false;
    }

    // 开始计时
    const startExtractionTimer = () => {
      // 重置计时器状态
      resetExtractionTimer();
      
      // 设置开始时间和初始化持续时间
      extractionStartTime.value = Date.now();
      currentAnalysisTime.value = 1;
      
      // 创建新的计时器
      extractionTimerInterval.value = setInterval(() => {
        if (extractionStartTime.value > 0) {
          currentAnalysisTime.value = Math.round((Date.now() - extractionStartTime.value) / 1000) + 1;
        }
      }, 1000);
    }

    // 停止计时
    const stopExtractionTimer = () => {
      if (extractionTimerInterval.value) {
        clearInterval(extractionTimerInterval.value);
        extractionTimerInterval.value = null;
      }
      
      // 确保最后更新一次持续时间
      if (extractionStartTime.value > 0) {
        extractionDuration.value = Math.round((Date.now() - extractionStartTime.value) / 1000) + 1;
      }
    }

    // 重置计时器
    const resetExtractionTimer = () => {
      if (extractionTimerInterval.value) {
        clearInterval(extractionTimerInterval.value);
        extractionTimerInterval.value = null;
      }
      extractionDuration.value = 0;
      extractionStartTime.value = 0;
      currentAnalysisTime.value = 1;
    }
    
    // 提取关键词
    const extractKeywords = async () => {
      if (!formData.requirements || formData.requirements.trim() === '') {
        extractError.value = '请输入贷款需求描述再提取关键词';
        return;
      }

      // 检查文字长度是否少于10个字
      const trimmedText = formData.requirements.trim();
      if (trimmedText.length < 10) {
        extractError.value = '需求描述的文字不应该少于10个字';
        return;
      }

      if (isExtractingKeywords.value) {
        return;
      }

      // 开始提取前，确保显示AI关键词提取结果页面
      // showCreditHistory.value = false;

      // 重置状态
      aiKeywords.value = [];
      extractError.value = '';
      isExtractingKeywords.value = true;
      
      // 生成本次任务ID
      const currentTaskId = ++extractionTaskId.value;
      
      // 确保在开始提取前启动计时器
      startExtractionTimer();

      try {
        const userDescription = trimmedText;
        lastExtractedText.value = userDescription;
        
        const messages = [
          {
            role: 'user',
            content: userDescription
          }
        ];
        
        const response = await sendMessage(messages, 'loan-keywords');
        
        // 检查任务是否已被新任务取代
        if (currentTaskId !== extractionTaskId.value) {
          console.log('任务已过期，丢弃结果');
          return;
        }
        
        hasAttemptedExtraction.value = true;
        
        // 无论右侧面板当前显示什么内容，都切换回AI关键词提取结果页面
        // 之前是直接设置showCreditHistory.value = false
        // 现在我们应该平滑地关闭它，利用CSS动画
        if (showCreditHistory.value) {
          // 触发一个平滑的关闭动画
          showCreditHistory.value = false;
        }
        
        if (response.error) {
          console.error('API返回错误:', response.error);
          extractError.value = response.message || '关键词提取失败';
          return;
        }

        try {
          const responseText = response.content;
          
          if (!responseText || responseText.trim() === '') {
            extractError.value = 'AI返回了空响应，请重试';
            return;
          }
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          
          if (!jsonMatch) {
            console.warn('无法从AI响应中提取JSON:', responseText);
            extractError.value = '无法解析AI提取的关键词，请修改描述后重试';
            return;
          }

          let jsonData = JSON.parse(jsonMatch[0]);
          
          if (jsonData.keywords === undefined) {
            console.warn('AI返回的JSON中没有keywords字段:', jsonData);
            extractError.value = '需求描述不是有效的融资需求，请调整后重新提取。';
            return;
          }

          let keywords = Array.isArray(jsonData.keywords) 
            ? jsonData.keywords 
            : jsonData.keywords.split(/\s+/).filter(k => k);
          
          if (keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) {
            extractError.value = '需求描述不是有效的融资需求，请调整后重新提取。';
            return;
          }
          
          const colors = ['black'];
          
          aiKeywords.value = keywords.map((keyword, index) => ({
            key: `keyword_${index}`,
            value: keyword,
            type: colors[index % colors.length]
          }));
          
        } catch (error) {
          console.error('处理AI响应时出错:', error);
          extractError.value = '处理AI响应时出错，请重试';
        }
      } catch (error) {
        // 检查任务是否已被新任务取代
        if (currentTaskId !== extractionTaskId.value) {
          return;
        }
        
        console.error('提取关键词失败:', error);
        extractError.value = '提取关键词失败: ' + (error.message || '未知错误');
      } finally {
        // 检查任务是否已被新任务取代
        if (currentTaskId !== extractionTaskId.value) {
          return;
        }
        
        // 确保在所有处理完成后停止计时器
        isExtractingKeywords.value = false;
        stopExtractionTimer();
        
        // 重置提交按钮状态
        submitting.value = false;
      }
    }

    // 检查AI关键词是否有效
    const validateKeywords = () => {
      if (!aiKeywords.value || aiKeywords.value.length === 0) {
        ElNotification({
          title: '无法获取报告',
          message: '需求描述不是有效的融资需求，请调整后重新提取关键词。',
          type: 'warning',
          duration: 5000,
          position: 'top-right',
          showClose: true
        });
        return false;
      }
      return true;
    }
    
    // 提交表单，生成融资建议报告
    const submitFinanceForm = async () => {
      // 避免重复提交
      if (submitting.value || isExtractingKeywords.value) {
        return;
      }
      
      submitting.value = true;
      
      // 创建引用
      const businessAreaInput = document.querySelector('.el-cascader__search-input');
      const nameRef = document.querySelector('.client-info-section input');
      let validationError = false;

      financeForm.value.validate(async (valid, errorFields) => {
        if (valid) {
          try {
            // 检查AI关键词分析结果
            if (!validateKeywords()) {
              submitting.value = false;
              return false;
            }
            
            // 构建提交的数据
            const submitData = {
              ...formData,
              aiKeywords: aiKeywords.value,
            };
            
            // 触发提交事件
            emit('submit', submitData);
            
            ElMessage.success('正在生成融资建议报告...');
          } catch (error) {
            console.error('提交表单时出错:', error);
            ElMessage.error('提交失败，请重试');
          } finally {
            submitting.value = false;
          }
        } else {
          validationError = true;
          submitting.value = false;
          
          // 处理验证错误，检查具体是哪个字段错误并聚焦
          if (errorFields.name) {
            // 姓名验证失败，聚焦到姓名输入框
            ElMessage.error('请输入客户姓名');
            nextTick(() => {
              if (nameRef) nameRef.focus();
            });
          } else if (errorFields.businessArea) {
            // 业务城市验证失败，打开城市选择器
            ElMessage.error('请选择业务城市');
            nextTick(() => {
              // 点击级联选择器以打开下拉面板
              const cascaderElement = document.querySelector('.el-cascader');
              if (cascaderElement) {
                cascaderElement.click();
              }
            });
          }
          return false;
        }
      });
    }
    
    // 重置表单
    const resetForm = () => {
      // 如果正在提取关键词，弹出确认
      if (isExtractingKeywords.value) {
        ElMessageBox.confirm('正在进行关键词提取，确认要中止此操作吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 停止提取任务
          resetExtractionState();
          resetFormFields();
          ElMessage.success('已重置表单');
        }).catch(() => {
          // 用户取消操作
        });
        return;
      }
      
      // 正常情况下直接询问确认
      ElMessageBox.confirm('确定要重置所有已填写的内容吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        resetFormFields();
        ElMessage.success('已重置表单');
      }).catch(() => {
        // 用户取消操作
      });
    }
    
    // 重置所有表单字段
    const resetFormFields = () => {
      // 重置表单验证
      financeForm.value.resetFields();
      
      // 重置表单内容
      formData.requirements = '';
      formData.name = '';
      formData.businessArea = [];
      formData.creditReport = '';
      
      // 清空选中的征信报告
      clearSelectedCreditReport();
      
      // 重置关键词相关状态
      resetExtractionState();
    }
    
    // 复制示例文本
    const copyExampleText = () => {
      const exampleText = '我是一家成立了5年的餐饮企业老板，在广州有3家连锁店，月营业额约80万元。\n现计划申请经营抵押贷款300万元用于新开2家分店，希望能在1个月内放款，期限2年以上，可接受月息最高5厘。\n目前在广州名下有一套市值约500万元的商品房可以抵押，目前无贷款，也有约50万元应收账款。希望了解银行抵押贷款和企业经营贷款哪个更合适，最快多久能拿到资金。';
      
      // 使用navigator.clipboard API复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(exampleText)
          .then(() => {
            // ElMessage.success('示例文本已复制到剪贴板');
          })
          .catch(err => {
            console.error('无法复制文本:', err);
          });
      } else {
        // 兼容性处理 - 创建临时textarea元素
        const textarea = document.createElement('textarea');
        textarea.value = exampleText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          // ElMessage.success('示例文本已复制到剪贴板');
        } catch (err) {
          console.error('复制失败:', err);
        }
        
        document.body.removeChild(textarea);
      }
    }
    
    // 处理键盘事件
    const handleKeydown = (event) => {
      // Shift+Enter 触发提取关键词
      if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        // 检查是否可以提取：有内容、字数足够且未在提取中
        const requirements = formData.requirements;
        const hasEnoughChars = requirements && requirements.trim().length >= 10;
        const canExtract = requirements && hasEnoughChars && !isExtractingKeywords.value;
        
        if (canExtract) {
          event.preventDefault();
          extractKeywords();
        } else if (requirements && !hasEnoughChars) {
          // 如果内容不足10个字，显示错误提示
          event.preventDefault();
          extractError.value = '需求描述的文字不应该少于10个字';
        }
      }
    }
    
    // 处理内容滚动
    const handleContentScroll = (e) => {
      const header = document.querySelector('.content-panel .panel-header');
      if (header) {
        // 当滚动位置大于0时添加scrolled类
        if (e.target.scrollTop > 0) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    }
    
    // 监听生命周期
    onMounted(() => {
      // 注册键盘事件监听
      window.addEventListener('keydown', handleKeydown);
      
      // 监听右侧内容区域的滚动事件
      const panelContent = document.querySelector('.content-panel .panel-content');
      if (panelContent) {
        panelContent.addEventListener('scroll', handleContentScroll);
      }
      
      // 获取历史任务数据
      try {
        store.dispatch('history/fetchHistoryList').catch(error => {
          console.error('获取历史任务数据失败:', error);
          // 确保即使获取数据失败，UI也能正常显示
        });
      } catch (error) {
        console.error('调用获取历史任务数据方法失败:', error);
      }
    })
    
    // 监听historyList变化，初始化选中状态
    watch(
      historyList,
      (newVal) => {
        if (newVal && Array.isArray(newVal)) {
          // 当历史列表数据变化时，初始化选中状态
          initTableSelections();
        }
      },
      { immediate: true, deep: true }
    )
    
    onBeforeUnmount(() => {
      // 清理计时器
      resetExtractionTimer();
      
      // 清理事件监听
      window.removeEventListener('keydown', handleKeydown);
      
      // 移除滚动事件监听
      const panelContent = document.querySelector('.content-panel .panel-content');
      if (panelContent) {
        panelContent.removeEventListener('scroll', handleContentScroll);
      }
    })

    // 是否显示征信报告历史
    const showCreditHistory = ref(false)
    
    // 从store获取历史任务数据
    const historyList = computed(() => {
      // 确保 sortedHistoryList 存在并且是数组
      const sortedList = store.getters['history/sortedHistoryList'] || []
      // 从store中获取历史任务，并筛选只包含征信报告类型的任务
      return sortedList.filter(item => 
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      )
    })
    
    // 任务结果选项
    const creditReportResultOptions = [
      '已出结果',
      '进行中...',
      '排队中...',
      '任务失败',
      '已取消'
    ]
    
    // 搜索筛选相关
    const searchForm = ref({
      customerName: '', // 客户姓名
      taskResults: '已出结果' // 任务结果，默认选中"已出结果"
    })
    
    // 添加表格数据加载状态
    const tableDataLoading = ref(false)
    
    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(20) // 默认每页20条
    
    // 根据搜索条件筛选历史记录
    const filteredHistoryList = computed(() => {
      if (!historyList.value || !Array.isArray(historyList.value)) return []
      
      return historyList.value.filter(item => {
        if (!item) return false

        // 筛选客户姓名
        if (searchForm.value.customerName && 
            (!item.customerName || !item.customerName.includes(searchForm.value.customerName))) {
          return false
        }
        
        // 筛选任务结果
        if (searchForm.value.taskResults && 
            (!item.result || item.result !== searchForm.value.taskResults)) {
          return false
        }
        
        return true
      })
    })
    
    // 获取当前页的数据
    const paginatedHistoryList = computed(() => {
      if (!filteredHistoryList.value || !Array.isArray(filteredHistoryList.value)) return []
      
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredHistoryList.value.slice(start, end)
    })
    
    // 处理页码变化
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }
    
    // 处理每页条数变化
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1 // 切换每页条数后重置为第一页
    }    
    
    // 处理搜索
    const handleSearch = async () => {
      try {
        tableDataLoading.value = true;
        currentPage.value = 1; // 搜索后重置为第一页
        
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 在实际应用中，此处会调用API获取数据
        // 这里直接使用 computed 值通过过滤条件筛选
      } catch (error) {
        ElMessage({
          type: 'error',
          message: '搜索失败，请稍后重试',
          duration: 2000
        });
        console.error('搜索历史任务失败:', error);
      } finally {
        tableDataLoading.value = false;
      }
    }
    
    // 重置搜索条件
    const resetSearch = () => {
      // 重置搜索表单
      searchForm.value = {
        customerName: '',
        taskResults: '已出结果' // 重置为默认选中"已出结果"
      }
      currentPage.value = 1; // 重置页码
      
      // 清空已选择的任务
      selectedPersonalTask.value = null;
      selectedEnterpriseTask.value = null;
      
      // 清空选中状态
      if (historyList.value && Array.isArray(historyList.value)) {
        historyList.value.forEach(item => {
          if (item && item.isSelected) {
            item.isSelected = false;
          }
        });
      }
      
      // 更新征信报告文本
      formData.creditReport = selectedCreditReportText.value;
    }
    
    // 显示取消确认对话框
    const showCancelConfirm = (historyId) => {
      ElMessageBox.confirm(
        '取消后若再次发起可能要重新排队，是否确认？',
        '取消任务',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(() => {
          // 用户点击确认，执行取消任务操作
          cancelTask(historyId)
        })
        .catch(() => {
          // 用户取消操作，不做任何处理
        })
    }
    
    // 取消任务
    const cancelTask = (historyId) => {
      // 调用store中的取消任务方法
      store.dispatch('history/cancelTask', historyId).then(() => {
        // ElMessage({
        //   type: 'success',
        //   message: '任务已取消',
        //   duration: 2000
        // })
        // 移除本地的成功提示，避免重复提示
        // store action中已有提示
      }).catch(error => {
        ElMessage({
          type: 'error',
          message: '取消任务失败，请稍后重试',
          duration: 2000
        })
        console.error('取消任务失败:', error)
      })
    }
    
    // 查看任务结果
    const viewResult = (history) => {
      // 检查是否已有结果窗口打开
      if (window.taskResultWindow && !window.taskResultWindow.closed) {
        // 已有窗口，激活它
        window.taskResultWindow.focus();
        return;
      }
      
      // 计算窗口尺寸和居中位置
      const width = Math.floor(window.screen.width * 0.75);
      const height = Math.floor(window.screen.height * 0.95);
      const left = Math.floor((window.screen.width - width) / 2);
      const top = Math.floor((window.screen.height - height) / 2);
      
      // 打开居中显示的新窗口
      const newWindow = window.open(
        `/task-result?id=${history.id}&type=${encodeURIComponent(history.type)}`, 
        '_blank', 
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // 确保窗口成功打开
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        ElMessage.warning('您的浏览器阻止了弹出窗口，请允许弹出窗口后重试');
      } else {
        // 保存窗口引用以便后续使用
        window.taskResultWindow = newWindow;
      }
    }
    
    // 获取任务状态对应的类型
    const getStatusType = (status) => {
      if (!status) return ''
      if (status.includes('已出结果')) return 'success'
      if (status.includes('进行中')) return 'primary'
      if (status.includes('排队中')) return 'info'
      if (status.includes('失败') || status.includes('取消')) return 'danger'
      return 'info'
    }
    
    // 显示征信报告历史
    const showCreditReportHistory = () => {
      if (isExtractingKeywords.value) return
      
      showCreditHistory.value = true
    }
    
    // 返回融资需求描述建议
    const backToRequirementSuggestion = () => {
      // 隐藏历史面板，回到正常状态
      showCreditHistory.value = false
    }

    // 切换征信报告历史显示状态
    const toggleCreditReportHistory = () => {
      if (isExtractingKeywords.value) return
      
      // 如果已有选择，则和原来逻辑相同，直接显示
      if (hasSelectedCreditReport.value) {
        showCreditHistory.value = true
        return
      }
      
      // 否则切换显示状态
      showCreditHistory.value = !showCreditHistory.value
    }

    // 选中的任务
    const selectedPersonalTask = ref(null);
    const selectedEnterpriseTask = ref(null);
    
    // 判断是否已经选择了征信报告
    const hasSelectedCreditReport = computed(() => {
      return selectedPersonalTask.value !== null || selectedEnterpriseTask.value !== null;
    });
    
    // 获取已选择的征信报告名称文本
    const selectedCreditReportText = computed(() => {
      if (selectedPersonalTask.value && selectedEnterpriseTask.value) {
        return '已选择个人和企业的征信报告分析结果';
      } else if (selectedPersonalTask.value) {
        return `已选择"${selectedPersonalTask.value.customerName}"的"个人征信报告分析结果"`;
      } else if (selectedEnterpriseTask.value) {
        return `已选择"${selectedEnterpriseTask.value.customerName}"的"企业征信报告分析结果"`;
      } else {
        return '请选择征信报告分析结果';
      }
    });
    
    // 判断复选框是否应该禁用
    const isCheckboxDisabled = (row) => {
      try {
        // 安全检查
        if (!row) return true;
        
        // 任务状态不是"已出结果"，禁用选择
        if (row.result !== '已出结果') return true;
        
        // 如果任务类型非征信报告，禁用选择
        if (!row.type || !(row.type.includes('个人征信') || row.type.includes('企业征信'))) {
          return true;
        }
        
        // 如果是个人征信报告，且已经选择了另一个个人征信报告
        if (row.type.includes('个人征信') && 
            selectedPersonalTask.value && 
            selectedPersonalTask.value.id && 
            row.id && 
            selectedPersonalTask.value.id !== row.id) {
          return true;
        }
        
        // 如果是企业征信报告，且已经选择了另一个企业征信报告
        if (row.type.includes('企业征信') && 
            selectedEnterpriseTask.value && 
            selectedEnterpriseTask.value.id && 
            row.id && 
            selectedEnterpriseTask.value.id !== row.id) {
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('检查复选框禁用状态时出错:', error);
        // 出错时默认禁用复选框，确保安全
        return true;
      }
    };
    
    // 处理任务选择
    const handleTaskSelection = (row, isSelected) => {
      try {
        // 检查是否是有效任务
        if (!row || !row.type) return;
        
        // 处理个人征信报告选择
        if (row.type.includes('个人征信')) {
          if (isSelected) {
            selectedPersonalTask.value = { ...row };
          } else if (selectedPersonalTask.value && 
                    selectedPersonalTask.value.id && 
                    row.id === selectedPersonalTask.value.id) {
            selectedPersonalTask.value = null;
          }
        }
        
        // 处理企业征信报告选择
        if (row.type.includes('企业征信')) {
          if (isSelected) {
            selectedEnterpriseTask.value = { ...row };
          } else if (selectedEnterpriseTask.value && 
                    selectedEnterpriseTask.value.id && 
                    row.id === selectedEnterpriseTask.value.id) {
            selectedEnterpriseTask.value = null;
          }
        }
        
        // 同步选择状态到数据模型
        formData.creditReport = selectedCreditReportText.value;
        
        // 强制重新初始化表格选择状态
        initTableSelections();
      } catch (error) {
        console.error('处理任务选择时出错:', error);
      }
    };
    
    // 初始化表格数据中的选中状态
    const initTableSelections = () => {
      try {
        // 安全检查
        if (!historyList || !historyList.value) {
          console.log('historyList不存在或未初始化');
          return;
        }
        
        if (!Array.isArray(historyList.value)) {
          console.log('historyList.value不是数组');
          return;
        }
        
        historyList.value.forEach(item => {
          if (!item) return;
          
          // 安全地添加isSelected属性
          try {
            // 使用Vue的响应式API添加属性
            if (item.isSelected === undefined) {
              // 使用扩展运算符创建新对象来规避响应式对象的直接修改限制
              const itemWithSelection = { ...item, isSelected: false };
              Object.assign(item, itemWithSelection);
            }
            
            // 如果已经有选中的任务，同步状态
            if (selectedPersonalTask.value && 
                selectedPersonalTask.value.id && 
                item.id === selectedPersonalTask.value.id) {
              item.isSelected = true;
            }
            
            if (selectedEnterpriseTask.value && 
                selectedEnterpriseTask.value.id && 
                item.id === selectedEnterpriseTask.value.id) {
              item.isSelected = true;
            }
          } catch (itemError) {
            console.error('处理表格项时出错:', itemError);
          }
        });
      } catch (error) {
        console.error('初始化表格选择状态时出错:', error);
      }
    };

    // 清空选中的征信报告
    const clearSelectedCreditReport = () => {
      // 清空选中的任务对象
      selectedPersonalTask.value = null;
      selectedEnterpriseTask.value = null;
      
      // 清空表单中的征信报告字段
      formData.creditReport = '';
      
      // 将所有任务的选中状态设为false
      if (historyList.value && Array.isArray(historyList.value)) {
        historyList.value.forEach(item => {
          if (item && item.isSelected !== undefined) {
            item.isSelected = false;
          }
        });
      }
      
      // 更新表格选择状态
      initTableSelections();
    }

    return {
      financeForm,
      descriptionTextarea,
      formData,
      isExtractingKeywords,
      hasAttemptedExtraction,
      extractionDuration,
      extractionStartTime,
      currentAnalysisTime,
      submitting,
      shouldIgnoreResult,
      aiKeywords,
      extractError,
      keywordsSuggestionRef,
      provinceOptions,
      creditReportOptions,
      openLoanCalculator,
      handleInputFocus,
      handleDescriptionInput,
      handleDescriptionBlur,
      resetExtractionState,
      startExtractionTimer,
      stopExtractionTimer,
      resetExtractionTimer,
      extractKeywords,
      validateKeywords,
      submitFinanceForm,
      resetForm,
      resetFormFields,
      copyExampleText,
      rules,
      showCreditHistory,
      showCreditReportHistory,
      backToRequirementSuggestion,
      selectedCreditReportText,
      hasSelectedCreditReport,
      clearSelectedCreditReport,
      searchForm,
      historyList,
      creditReportResultOptions,
      getStatusType,
      paginatedHistoryList,
      filteredHistoryList,
      handleSearch,
      resetSearch,
      currentPage,
      pageSize,
      handleCurrentChange,
      handleSizeChange,
      tableDataLoading,
      viewResult,
      showCancelConfirm,
      isCheckboxDisabled,
      handleTaskSelection,
      initTableSelections,
      toggleCreditReportHistory
    }
  }
}
</script>

<style lang="scss" scoped>
/* ----------------- 基础布局 ----------------- */
.finance-advisor-form {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.form-container {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

/* ----------------- 左侧输入面板 ----------------- */
.input-panel {
  width: 400px; 
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  position: relative;
  height: 100%;
}

.description-hint {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.el-form {
  display: flex;
  flex-direction: column;
}

.el-form-item {
  margin-bottom: 12px;
}

/* 客户信息输入区域 */
.client-info-section {
  margin: 10px 0 15px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.client-info-section .el-form-item {
  margin-bottom: 0;
  width: 100%;
}

.client-info-section .el-input,
.client-info-section .el-cascader {
  width: 100%;
}

.client-info-section .el-input__prefix,
.client-info-section .el-cascader .el-input__prefix {
  color: #909399;
  padding-left: 4px;
}

/* 按钮区域 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
  margin-bottom: 16px;
}

.button-hint {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.7;
}

/* 重新分析按钮样式 */
.reanalyze-button {
  height: 30px;
  padding: 0 15px;
  border-radius: 4px;
  font-size: 14px;
  border: 1px solid #1b68de;
  color: #1b68de;
  background-color: transparent;
  transition: all 0.3s;
}

.reanalyze-button:hover {
  background-color: #ecf5ff;
}

.reanalyze-button:active {
  background-color: #e6f1ff;
}

.reanalyze-button .button-hint {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.7;
}

/* ----------------- 面板通用样式 ----------------- */
.panel-header {
  padding: 0;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  height: 50px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
}

.panel-title {
  padding: 0;
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  line-height: 50px;
  margin: 0;
  display: flex;
  align-items: center;
}

.panel-content {
  padding: 0 20px 15px 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ----------------- 右侧内容面板 ----------------- */
.content-panel {
  flex: 1;
  overflow-y: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative; /* 添加相对定位以支持抽屉的绝对定位 */
}

.content-panel .panel-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: #f8f9fa;
  transition: box-shadow 0.3s ease;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-panel .panel-header.scrolled {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.reference-content,
.analysis-content {
      display: flex;
      flex-direction: column;
  height: 100%;
  position: relative;
  opacity: 1;
  transition: opacity 0.35s ease;
}

/* 分析时间显示 */
.analysis-time {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
  font-weight: normal;
}

.advice-hint {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
  font-weight: normal;
}

/* ----------------- 需求参考部分 ----------------- */
.reference-section h4 {
    font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.reference-items {
  margin: 0;
    display: flex;
    flex-direction: column;
  gap: 8px;
}

.reference-item {
      display: flex;
  align-items: baseline;
  font-size: 14px;
}

.reference-item::before {
  content: "•"; /* 使用圆点作为项目符号 */
  color: #606266;
  font-size: 18px; /* 稍微调大项目符号 */
  margin-right: 6px; /* 添加项目符号与文本之间的间距 */
  line-height: 1; /* 确保垂直对齐 */
}

.item-label {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

/* 示例部分 */
.example-section {
  padding-top: 16px;
}

.example-block {
  margin-top: 16px;
}

.example-block h4 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.example-quote {
  margin: 0;
  padding: 12px 16px;
  background-color: #f8f9fb;
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
  transition: background-color 0.2s;
  cursor: pointer;
}

.example-quote:hover {
  background-color: #ecf5ff80;
}

/* 分析建议部分 */
.analysis-suggestion-section {
  padding-top: 16px;
}

.analysis-suggestion-section h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 500;
}

/* ----------------- 分析结果样式 ----------------- */

.keywords-display h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 12px;
}

.keywords-content {
  padding: 8px 12px;
  background-color: #f8f9fb;
  border-radius: 4px;
  min-height: 80px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
  
  .keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.keywords-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-height: 80px;
  color: #909399;
  font-size: 14px;
  background-color: #f8f9fb;
  border-radius: 4px;
  padding: 12px;
}

.user-requirement-suggestion {
  margin: 0;
  padding: 12px 16px;
  background-color: #fbf8d2;
  border-radius: 4px;
  color: #6b6204;
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
  scrollbar-width: thin;
  white-space: pre-line;
}

.user-requirement-suggestion::-webkit-scrollbar {
  width: 4px;
}

.user-requirement-suggestion::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 2px;
}

.user-requirement-suggestion p {
  margin: 0 0 8px 0;
}

.user-requirement-suggestion p:last-child {
  margin-bottom: 0;
}

/* ----------------- 响应式布局 ----------------- */
/* 中等屏幕：保持左右布局，但要点变为单列 */
@media (max-width: 1024px) {
  .reference-section h4 {
    margin-bottom: 8px;
  }
  
  .reference-item {
    margin-bottom: 4px;
  }
}

/* 窄屏：切换为上下布局 */
@media (max-width: 850px) {
  .finance-advisor-form {
    padding: 12px;
    height: auto;
    overflow-y: auto;
    display: block;
  }
  
  .form-container {
    height: auto;
    min-height: auto;
    display: block;
    overflow: visible;
  }
  
  .input-panel {
    width: 100%;
    border-right: none;
    height: auto;
    overflow: visible;
    display: flex;
    flex-direction: column;
  }
  
  .content-panel {
    width: 100%;
    overflow: visible;
    height: auto;
  }

  .panel-content {
    padding: 12px 16px;
    overflow: visible;
  }
  
  .content-panel .panel-content {
    overflow: visible;
    height: auto;
  }

  .reference-content,
  .analysis-content {
    height: auto;
    overflow: visible;
  }

  .reference-content .panel-header,
  .analysis-content .panel-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #f8f9fa;
  }

  .example-block {
    margin-top: 8px;
  }

  .example-block h4 {
    margin-bottom: 6px;
  }

  .example-quote {
    padding: 10px 12px;
  }

  .client-info-section {
    margin: 8px 0 12px 0;
    gap: 8px;
  }
}

/* 添加贷款计算器相关组件样式 */
.tools-section {
  margin-top: 0;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.tool-card {
  display: flex;
  align-items: center;
  background-color: #f8f9fb;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tool-card:hover {
  background-color: #f0f6ff;
  border-color: #1b68de99;
  transform: translateY(-2px);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #e6f1ff;
  color: #1b68de;
  margin-right: 12px;
  font-size: 20px;
}

.tool-content {
  flex: 1;
}

.tool-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.tool-description {
  font-size: 12px;
  color: #909399;
}

.tool-action {
  color: #909399;
  font-size: 16px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.tool-card:hover .tool-action {
  color: #1b68de;
  opacity: 1;
  transform: translateX(4px);
}

/* 移除原有的计算器链接样式 */
.calculator-link {
  display: none;
}

/* 移除原有的计算器按钮样式 */
.calculator-button {
  display: none;
}

/* 在窄屏幕下确保工具区域正确显示 */
@media (max-width: 850px) {
  .tools-section {
    position: relative;
    margin-top: 16px;
    bottom: auto;
  }
  
  .tool-card {
    padding: 8px 10px;
  }
  
  .tool-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

@media (max-height: 700px) {
  .tools-section {
    position: relative;
    margin-top: 16px;
  }
}

/* 征信报告分析结果样式 */
.credit-report-trigger {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 1px 11px;
  height: 32px;
  line-height: 32px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  background-color: #ffffff;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
}

.credit-report-trigger.is-disabled {
  cursor: not-allowed;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

/* 隐藏清空按钮，默认显示箭头 */
.credit-report-trigger .clear-icon {
  display: none;
}

.credit-report-trigger .arrow-icon {
  display: inline-flex;
}

/* 有值且悬停时显示清空按钮，隐藏箭头 */
.credit-report-trigger.has-value:hover .clear-icon {
  display: inline-flex;
}

.credit-report-trigger.has-value:hover .arrow-icon {
  display: none;
}

/* 禁用状态下不显示清空按钮 */
.credit-report-trigger.is-disabled .clear-icon {
  display: none !important;
}

.credit-report-trigger.is-disabled .arrow-icon {
  display: inline-flex !important;
}

.credit-report-trigger:hover {
  border-color: #C0C4CC !important;
}

/* 触发器点击效果 */
.credit-report-trigger:active {
  border-color: #1b68de !important;
}

.trigger-prefix {
  color: #a8abb2;
  margin-right: 8px;
  margin-left: -1px;
  display: flex;
  align-items: center;
}

.trigger-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #a8abb2;
  font-size: 14px;
  padding-right: 15px; /* 添加右侧内边距，避免文本与图标重叠 */
}

.trigger-text.has-selected {
  color: #606266;
}

.trigger-suffix {
  color: #a8abb2;
  margin-left: 5px;
  display: flex;
  align-items: center;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* 添加箭头旋转动画 */
.arrow-icon {
  transition: transform 0.3s ease;
}

.arrow-icon.is-reverse {
  transform: rotate(-180deg);
}

/* 添加清除图标的悬停效果 */
.clear-icon:hover {
  cursor: pointer;
}

/* 触发器悬停效果 */
.credit-report-trigger:hover {
  border-color: #C0C4CC !important;
}

/* 触发器点击效果 */
.credit-report-trigger:active {
  border-color: #1b68de !important;
}


/* 征信报告历史列表样式 */
.credit-history-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.full-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-button {
  font-size: 14px;
}

.back-button:hover {
  color: #729ee4;
}

/* 面板内容无内边距 */
.no-padding {
  padding: 0 !important;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 表格相关样式 */
.table-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 强制取消表格边框样式 */
:deep(.el-table) {
  --el-table-border-color: transparent !important;
  --el-table-border: none !important;
}

/* 分页容器样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  // border-top: 1px solid #ebeef5;
  min-height: 52px; /* 确保有足够的高度 */
}

:deep(.el-table .cell .file-cell:last-child) {
  margin-bottom: 0;
}

:deep(.el-table .cell .file-cell .file-name) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-table .cell .file-cell .el-link) {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  text-align: right;
}

/* 确保表格能够横向滚动 */
:deep(.el-table) {
  overflow-x: auto !important;
}

/* 固定列的样式优化，增加阴影效果 */
:deep(.el-table .is-left-fixed) {
  box-shadow: 6px 0 8px -4px rgba(0, 0, 0, 0.12) !important;
}

:deep(.el-table .is-right-fixed) {
  box-shadow: -6px 0 8px -4px rgba(0, 0, 0, 0.12) !important;
}

/* 确保表格中的文本不会断行，并在溢出时显示省略号 */
:deep(.el-table .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 搜索筛选区域样式 */
.search-filters {
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid #e4e7ed;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.filter-item {
  flex: 1;
  min-width: 100px;
  flex-shrink: 0;
  display: flex;
}

.button-group {
  flex: 0 0 auto;
  min-width: 130px;
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.button-group .el-button {
  min-width: 60px;
  margin-left: 8px;
}

/* 媒体查询确保在小屏幕上合理换行 */
@media (max-width: 1200px) {
  .button-group {
    margin-left: 0;
    justify-content: flex-start;
  }
  
  .filter-item {
    min-width: 180px;
  }
  
  .filter-item .el-select,
  .filter-item .el-input,
  .filter-item .el-date-editor {
    min-width: 180px;
  }
  
  .filter-item .el-date-editor--daterange {
    min-width: 250px;
  }
}

/* 自定义加载层 */
.custom-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none; /* 允许鼠标事件穿透到下层元素，可以滚动 */
}

.custom-loading-container {
  width: 210px;
  height: 115px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  margin-bottom: 100px; /* 在整个任务面板上下居中，而不是在列表范围内上下居中 */
  pointer-events: auto; /* 加载容器本身可以接收鼠标事件 */
}

.custom-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #c3c3c3;
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.custom-loading-text {
  font-size: 14px;
  color: white;
  text-align: center;
}

/* 修正旋转动画关键帧名称 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.credit-report-trigger.is-disabled .arrow-icon {
  display: inline-flex !important;
}

.credit-report-trigger.is-disabled:hover,
.credit-report-trigger.is-disabled:active {
  border-color: #e4e7ed !important;
  background-color: #f5f7fa;
}

/* 征信报告选择器禁用状态下不显示清空按钮 */
.credit-report-trigger.is-disabled .clear-icon {
  display: none !important;
}

.credit-report-trigger.is-disabled .arrow-icon {
  display: inline-flex !important;
}

.credit-report-trigger.is-disabled:hover,
.credit-report-trigger.is-disabled:active {
  border-color: #e4e7ed !important;
  background-color: #f5f7fa;
}

/* 空数据提示样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72px 0;
  background: #FFFFFF;
  border-radius: 4px;
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 320px;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5fd;
  border-radius: 50%;
}

.empty-state-title {
  font-size: 16px;
  color: #262626;
  margin: 0;
  font-weight: 500;
  line-height: 18px;
}

.empty-state-description {
  font-size: 14px;
  color: #595959;
  margin-top: 4px;
  line-height: 14px;
  text-align: center;
}

.empty-state-link {
  color: #1b68de;
  text-decoration: none;
  font-weight: 500;
}

.empty-state-link:hover {
  color: #3f7adc;
}

/* 信息图标样式 */
.info-icon {
  margin-left: 8px;
  color: #909399;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}

.info-icon:hover {
  color: #1b68de;
}

/* 展开状态的样式 */
.credit-report-trigger.is-expanded {
  border-color: #1b68de !important;
}

.credit-report-trigger.is-expanded:hover {
  border-color: #1b68de !important;
}

/* 触发器悬停效果 */
.credit-report-trigger:hover {
  border-color: #C0C4CC !important;
}

/* 征信报告历史列表样式 */
.credit-history-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateX(-100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
  background-color: #fff;
  overflow: hidden;
  // box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.credit-history-drawer.is-visible {
  transform: translateX(0);
}

.credit-history-drawer .panel-header {
  z-index: 6;
}

/* 背景内容样式 */
.reference-content.is-background {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

/* 确保抽屉内容样式正确 */
.credit-history-content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 遮罩层样式 */
.drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 4;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: auto;
  cursor: pointer;
}

.drawer-overlay[style*="display: block"] {
  opacity: 1;
}
</style>
