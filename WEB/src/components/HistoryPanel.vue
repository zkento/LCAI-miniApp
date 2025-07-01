<!-- 最后修改记录时间 -> 2024-04-29 15:30:00 -->
<template>
  <teleport to="body">
    <!-- 历史任务列表面板 -->
    <transition name="fade">
      <div v-if="panelVisible" class="history-float-panel" :class="{ 'table-view-mode': isTableView, 'transitioning': tableViewTransition }">
        <div class="panel-header">
          <h3>
            {{ isTableView ? '全部AI历史任务' : '历史任务' }}
            <span v-if="!isTableView" class="refresh-icon" @click="refreshHistoryList" title="刷新历史任务">
              <el-icon><Refresh /></el-icon>
            </span>
            <span v-if="isTableView" class="task-stats">
              当前进行中的任务数：{{ inProgressTaskCount }}，排队中的任务数：{{ queueingTaskCount }}
              <el-button 
                type="" 
                size="small" 
                class="refresh-btn" 
                @click="refreshHistoryList"
              >
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </span>
          </h3>
          <div class="panel-actions">
            <el-button 
              type="text" 
              :icon="isTableView ? 'List' : 'Grid'" 
              @click="toggleView"
              class="action-btn"
            >
              {{ isTableView ? '概要视图' : '完整视图' }}
            </el-button>
            <el-button 
              type="text" 
              icon="Close" 
              @click="handleClose"
              class="action-btn close-btn"
            />
          </div>
        </div>

        <!-- 概要视图 -->
        <div v-if="!isTableView" class="history-panel">
          <!-- 任务列表 -->
          <div 
            class="history-list"
            @mouseleave="startHideDetailTimer"
            @scroll="handleScroll"
            ref="historyListRef"
          >
            <div 
              v-for="item in summaryPagedHistoryList" 
              :key="item.id" 
              class="history-item"
              :class="{ 'active': currentHistory && currentHistory.id === item.id }"
              @mouseenter="showDetail(item, $event)"
              ref="historyItems"
            >
              <!-- 队列位置标记（仅排队中和进行中任务显示） -->
              <div 
                v-if="(item.result.includes('排队中') || item.result.includes('进行中')) && item.queuePosition && item.queuePosition !== '-'" 
                class="queue-position"
              >
                当前{{ item.queuePosition }}
              </div>
              
              <div class="history-item-title">
                <el-tag 
                  size="small" 
                  :type="getStatusType(item.result)"
                >
                  {{ item.result }}
                </el-tag>
                
                <!-- 已出结果的任务右上角显示查看结果按钮 -->
                <el-button 
                  v-if="item.result === '已出结果'"
                  type="primary" 
                  link
                  size="small"
                  class="view-result-btn"
                  @click.stop="viewResult(item)"
                >
                  查看结果
                </el-button>
              </div>
              
              <div class="history-item-content">
                <div class="history-item-type">{{ item.type }}</div>
                <div class="history-item-customer" v-if="item.customerName">客户：{{ item.customerName }}</div>
              </div>
              <div class="history-item-time">提交时间：{{ item.submitTime }}</div>
              
              <!-- 排队中任务显示预计开始时间 -->
              <div v-if="item.result.includes('排队中') && item.expectedStartTime" 
                class="history-item-expected-time">
                预计开始：{{ item.expectedStartTime }}
              </div>
            </div>
            
            <!-- 加载更多区域 -->
            <div v-if="hasMoreSummaryData" class="load-more">
              <div v-if="loadingSummaryData" class="loading-spinner">
                <svg viewBox="0 0 50 50" class="spinner">
                  <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                <span>加载中...</span>
              </div>
              <div v-else class="load-more-text" @click="loadMoreSummaryData">
                继续加载更多
              </div>
            </div>
            
            <!-- 无更多数据提示 -->
            <div v-if="!hasMoreSummaryData && summaryPagedHistoryList.length > 0" class="no-more-data">
              —— 任务已全部加载 ——
            </div>
          </div>
        </div>
        
        <!-- 列表视图 -->
        <div v-else class="table-view" :style="{ width: tableViewWidth }">
          <!-- 搜索筛选区域 -->
          <div class="search-filters">
            <div class="filter-row">
              <!-- 任务类型 -->
              <div class="filter-item">
                <el-select 
                  v-model="searchForm.taskTypes" 
                  multiple 
                  placeholder="请选择任务类型" 
                  clearable 
                  collapse-tags 
                  size=""
                  :disabled="false"
                >
                  <el-option v-for="item in taskTypeOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </div>
              
              <!-- 客户姓名 -->
              <div class="filter-item">
                <el-input 
                  v-model="searchForm.customerName" 
                  placeholder="请输入客户姓名" 
                  clearable 
                  size=""
                  :disabled="false"
                />
              </div>
              
              <!-- 提交任务时间 -->
              <div class="filter-item">
                <el-date-picker
                  v-model="searchForm.submitTimeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="提交任务时间"
                  end-placeholder="提交任务时间"
                  value-format="YYYY/MM/DD"
                  size=""
                  :disabled="false"
                />
              </div>
              
              <!-- 任务结束时间 -->
              <div class="filter-item">
                <el-date-picker
                  v-model="searchForm.endTimeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="任务结束时间"
                  end-placeholder="任务结束时间"
                  value-format="YYYY/MM/DD"
                  size=""
                  :disabled="false"
                />
              </div>
              
              <!-- 任务结果 -->
              <div class="filter-item">
                <el-select 
                  v-model="searchForm.taskResults" 
                  multiple 
                  placeholder="请选择任务结果" 
                  clearable 
                  collapse-tags 
                  size=""
                  :disabled="false"
                >
                  <el-option v-for="item in taskResultOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </div>
              
              <!-- 按钮组 -->
              <div class="filter-item button-group">
                <el-button 
                  type="primary" 
                  @click="handleSearch" 
                  size=""
                  :loading="tableDataLoading"
                  :disabled="tableDataLoading"
                >
                  {{ tableDataLoading ? '搜索中...' : '搜索' }}
                </el-button>
                <el-button 
                  @click="resetSearch" 
                  size=""
                  :disabled="tableDataLoading"
                >
                  重置
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 表格区域包装器 -->
          <div class="table-wrapper">
            <!-- 表格，调整loading效果 -->
            <el-table
              :data="paginatedHistoryList"
              style="width: 100%"
              :border="true"
              :stripe="true"
              :height="calcTableHeight"
              size="small"
              fit
              :header-cell-style="{ 'white-space': 'nowrap', 'height': '35px', 'font-size': '13px', 'font-weight': '400' }"
              :table-layout="'fixed'"
              :cell-style="{ 'color': '#606266', 'font-size': '13px' }"
              :row-style="{ height: '35px' }"
              ref="tableRef"
              @resize-end="handleTableResize"
            >
              <el-table-column prop="type" label="AI任务类型" min-width="130" :fixed="tableNeedsScroll ? 'left' : null" show-overflow-tooltip/>
              <el-table-column prop="customerName" label="客户姓名" min-width="155" show-overflow-tooltip/>
              <el-table-column label="上传的文件" min-width="190">
                <template #default="scope">
                  <!-- 处理融资顾问报告和买家顾问报告不支持上传文件的情况 -->
                  <template v-if="scope.row.type === '融资顾问报告' || scope.row.type === '买家顾问报告'">
                    <span class="no-file">-</span>
                  </template>
                  <!-- 统一处理单文件和多文件情况 -->
                  <template v-else-if="(scope.row.uploadFiles && scope.row.uploadFiles.length) || scope.row.uploadFile">
                    <div 
                      class="file-cell" 
                      v-for="(file, index) in scope.row.uploadFiles && scope.row.uploadFiles.length ? scope.row.uploadFiles : [scope.row.uploadFile]" 
                      :key="index"
                    >
                      <div class="file-info">
                        <el-tooltip 
                          :content="file.name || file" 
                          placement="top" 
                          :show-after="100"
                          :hide-after="0"
                        >
                          <span class="file-name">{{ file.name || file }}</span>
                        </el-tooltip>
                      </div>
                      <el-link type="primary" :underline="false" @click="viewUploadedFile(file)">查看</el-link>
                    </div>
                  </template>
                  <!-- 无文件情况 -->
                  <template v-else>
                    <span class="no-file">-</span>
                  </template>
                </template>
              </el-table-column>
              <el-table-column prop="submitTime" label="提交任务时间" min-width="155" show-overflow-tooltip />
              <el-table-column prop="queuePosition" label="任务队列位置" min-width="95">
                <template #default="scope">
                  <template v-if="(scope.row.result.includes('排队中') || scope.row.result.includes('进行中')) && scope.row.queuePosition && scope.row.queuePosition !== '-'">
                    {{ scope.row.queuePosition }}
                  </template>
                  <template v-else>
                    <!-- 当无值时，不显示"-"，直接留空 -->
                  </template>
                </template>
              </el-table-column>
              
              <!-- 预计开始时间列 -->
              <el-table-column label="任务预计开始时间" min-width="155" show-overflow-tooltip>
                <template #default="scope">
                  <template v-if="!scope.row.result.includes('排队中')">
                    <!-- 非排队中任务不显示预计开始时间 -->
                  </template>
                  <template v-else>
                    {{ scope.row.expectedStartTime || '' }}
                  </template>
                </template>
              </el-table-column>
              
              <el-table-column prop="actualStartTime" label="任务实际开始时间" min-width="155" show-overflow-tooltip>
                <template #default="scope">
                  <template v-if="scope.row.result.includes('排队中') || scope.row.result.includes('已取消')">
                    <!-- 排队中或已取消任务的实际开始时间为空 -->
                  </template>
                  <template v-else>
                    {{ scope.row.actualStartTime || '' }}
                  </template>
                </template>
              </el-table-column>

              <el-table-column label="任务结束时间" min-width="155" show-overflow-tooltip>
                <template #default="scope">
                  <template v-if="scope.row.result.includes('进行中') || scope.row.result.includes('排队中')">
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
              <el-table-column label="处理耗时" min-width="80" show-overflow-tooltip>
                <template #default="scope">
                  <template v-if="scope.row.result.includes('排队中') || scope.row.result.includes('已取消')">
                    <!-- 排队中或已取消任务处理耗时为空 -->
                  </template>
                  <template v-else-if="scope.row.result.includes('进行中')">
                    <!-- 进行中任务动态计算处理耗时 -->
                    {{ calculateProcessingTime(scope.row) }}
                  </template>
                  <template v-else>
                    {{ scope.row.processingTime || '' }}
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="全部耗时" min-width="80" show-overflow-tooltip>
                <template #default="scope">
                  <template v-if="scope.row.result.includes('排队中') || scope.row.result.includes('已取消')">
                    <!-- 排队中或已取消任务全部耗时为空 -->
                  </template>
                  <template v-else-if="scope.row.result.includes('进行中')">
                    <!-- 进行中任务动态计算全部耗时 -->
                    {{ calculateTotalTime(scope.row) }}
                  </template>
                  <template v-else>
                    {{ scope.row.totalTime || '' }}
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90" :fixed="tableNeedsScroll ? 'right' : null">
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
                    v-if="scope.row.result.includes('排队中')"
                    @click="showCancelConfirm(scope.row.id)"
                    class="cancel-btn"
                  >
                    取消任务
                  </el-button>
                  
                  <el-tooltip
                    content="暂未能支持取消进行中的任务"
                    placement="top"
                    :show-after="100"
                    v-if="scope.row.result.includes('进行中')"
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
                    :content="'失败原因：' + (scope.row.content.includes('原因：') ? scope.row.content.split('原因：')[1] : scope.row.content)"
                    placement="top"
                    :show-after="100"
                    v-if="scope.row.result.includes('任务失败')"
                  >
                    <el-button 
                      type="info" 
                      link
                    >
                      查看原因
                    </el-button>
                  </el-tooltip>

                  <span v-if="!scope.row.result.includes('排队中') && !scope.row.result.includes('进行中') && scope.row.result !== '已出结果' && !scope.row.result.includes('任务失败')">-</span>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页容器样式 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredHistoryList.length"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                background
              />
            </div>
            
            <!-- 自定义加载层 -->
            <div v-if="tableDataLoading" class="custom-loading-mask">
              <div class="custom-loading-container">
                <div class="custom-loading-spinner"></div>
                <span class="custom-loading-text">正在搜索历史任务...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 独立的任务详情悬浮层 -->
    <transition name="slide">
      <div 
        class="history-detail-popup" 
        v-if="currentHistory && showDetailPanel && panelVisible"
        @mouseenter="cancelHideDetailTimer"
        @mouseleave="startHideDetailTimer"
        :style="detailPopupStyle"
      >
        <div class="detail-header">
          <h3>{{ currentHistory.type }}</h3>
          <el-tag 
            size="small" 
            :type="getStatusType(currentHistory.result)"
          >
            {{ currentHistory.result }}
          </el-tag>
        </div>
        
        <div class="detail-content-container">
          <div class="detail-info">
            <!-- 客户姓名 - 新增 -->
            <div class="info-item" v-if="currentHistory.customerName">
              <span class="label">客户姓名：</span>
              <span class="value">
                {{ currentHistory.customerName || '' }}
              </span>
            </div>
            
            <!-- 上传文件 -->
            <div class="info-item">
              <span class="label">上传文件：</span>
              <span class="value file-value">
                <!-- 处理融资顾问报告和买家顾问报告不支持上传文件的情况 -->
                <template v-if="currentHistory.type === '融资顾问报告' || currentHistory.type === '买家顾问报告'">
                  <span class="no-file">-</span>
                </template>
                <!-- 统一处理单文件和多文件情况 -->
                <template v-else-if="(currentHistory.uploadFiles && currentHistory.uploadFiles.length) || currentHistory.uploadFile">
                  <div class="file-list">
                    <div 
                      class="file-item" 
                      v-for="(file, index) in currentHistory.uploadFiles && currentHistory.uploadFiles.length ? currentHistory.uploadFiles : [currentHistory.uploadFile]" 
                      :key="index"
                    >
                      <div class="file-name-wrapper">
                        <!-- 统一处理文件名：对象取 name，字符串直接显示 -->
                        <el-tooltip 
                          :content="file.name || file" 
                          placement="top" 
                          :show-after="100"
                          :hide-after="0"
                        >
                          <span>{{ file.name || file }}</span>
                        </el-tooltip>
                      </div>
                      <el-link type="primary" :underline="false" class="view-link" @click="viewUploadedFile(file)">查看</el-link>
                    </div>
                  </div>
                </template>
                <!-- 无文件情况 -->
                <template v-else>
                  <span class="no-file">-</span>
                </template>
              </span>
            </div>
            
            <!-- 提交时间 -->
            <div class="info-item">
              <span class="label">提交时间：</span>
              <span class="value">
                {{ currentHistory.submitTime || '' }}
              </span>
            </div>
            
            <!-- 队列位置（仅排队中和进行中任务显示） -->
            <div class="info-item" v-if="(currentHistory.result.includes('排队中') || currentHistory.result.includes('进行中')) && currentHistory.queuePosition && currentHistory.queuePosition !== '-'">
              <span class="label">队列位置：</span>
              <span class="value">{{ currentHistory.queuePosition }}</span>
            </div>
            
            <!-- 预计开始 - 仅排队中任务显示 -->
            <div class="info-item" v-if="currentHistory.result.includes('排队中')">
              <span class="label">预计开始：</span>
              <span class="value">
                {{ currentHistory.expectedStartTime || '' }}
              </span>
            </div>
            
            <!-- 实际开始 -->
            <div class="info-item">
              <span class="label">实际开始：</span>
              <span class="value">
                <template v-if="currentHistory.result.includes('排队中') || currentHistory.result.includes('已取消')">
                  <!-- 排队中或已取消任务的实际开始时间为空 -->
                </template>
                <template v-else>
                  {{ currentHistory.actualStartTime || '' }}
                </template>
              </span>
            </div>
            
            <!-- 结束时间 -->
            <div class="info-item">
              <span class="label">结束时间：</span>
              <span class="value">
                <template v-if="currentHistory.result.includes('进行中') || currentHistory.result.includes('排队中')">
                  <!-- 进行中/排队中任务结束时间为空 -->
                </template>
                <template v-else>
                  {{ currentHistory.endTime || '' }}
                </template>
              </span>
            </div>
            
            <!-- 处理耗时 -->
            <div class="info-item">
              <span class="label">处理耗时：</span>
              <span class="value">
                <template v-if="currentHistory.result.includes('排队中') || currentHistory.result.includes('已取消')">
                  <!-- 排队中或已取消任务处理耗时为空 -->
                </template>
                <template v-else-if="currentHistory.result.includes('进行中')">
                  <!-- 进行中任务实时计算处理耗时 -->
                  {{ processingTimeDisplay }}
                </template>
                <template v-else>
                  {{ currentHistory.processingTime || '' }}
                </template>
              </span>
            </div>
            
            <!-- 全部耗时 -->
            <div class="info-item">
              <span class="label">全部耗时：</span>
              <span class="value">
                <template v-if="currentHistory.result.includes('排队中') || currentHistory.result.includes('已取消')">
                  <!-- 排队中或已取消任务全部耗时为空 -->
                </template>
                <template v-else-if="currentHistory.result.includes('进行中')">
                  <!-- 进行中任务实时计算全部耗时 -->
                  {{ totalTimeDisplay }}
                </template>
                <template v-else>
                  {{ currentHistory.totalTime || '' }}
                </template>
              </span>
            </div>
          </div>
          
          <div class="detail-content" v-if="currentHistory.content">
            <div class="content-title">任务详情</div>
            <div class="content-body">
              <template v-if="currentHistory.result === '已取消'">
                {{ currentHistory.type }}任务已被用户取消，取消时间：{{ currentHistory.endTime }}
              </template>
              <template v-else>
                {{ currentHistory.content }}
              </template>
            </div>
          </div>
        </div>
        
        <!-- 详情面板操作区域 -->
        <div class="detail-actions">
          <el-button 
            type="danger" 
            size="small"
            v-if="currentHistory.result.includes('排队中')"
            @click="showCancelConfirm(currentHistory.id)"
          >
            取消任务
          </el-button>
          
          <el-tooltip
            content="暂未能支持取消进行中的任务"
            placement="top"
            :show-after="100"
            v-if="currentHistory.result.includes('进行中')"
          >
            <el-button 
              type="danger" 
              size="small"
              disabled
            >
              取消任务
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from 'vuex'
import { List, Grid, Close, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

// 添加一个简单的防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export default {
  name: 'HistoryPanel',
  components: {
    List,
    Grid,
    Close,
    Refresh
  },
  setup() {
    const store = useStore()
    const headerHeight = ref(64) // 默认header高度
    const showDetailPanel = ref(false)
    const hideDetailTimer = ref(null)
    const historyItems = ref([])
    const historyListRef = ref(null) // 概要视图列表容器引用
    const detailPopupStyle = ref({})
    const tableViewWidth = ref('85%') // 列表视图默认宽度
    const isWideScreen = ref(false) // 是否宽屏
    const tableViewTransition = ref(false) // 列表视图过渡状态
    const isAutomaticOpen = ref(false) // 是否为自动打开（大屏幕自动展示）
    const tableNeedsScroll = ref(false) // 是否需要显示横向滚动条
    const scrollThrottle = ref(null) // 滚动节流定时器
    
    // 概要视图分页相关
    const summaryPageSize = ref(10) // 真正开发时调整为概要视图每页加载20条
    const summaryCurrentPage = ref(1) // 概要视图当前页码
    const loadingSummaryData = ref(false) // 是否正在加载概要视图数据
    
    // 实时计时相关变量
    const processingTimeDisplay = ref('') // 处理耗时显示值
    const totalTimeDisplay = ref('') // 全部耗时显示值
    const timerInterval = ref(null) // 计时器
    
    // 表格中进行中任务的实时耗时计算
    const processingTimeCache = ref(new Map()) // 缓存计算结果
    const totalTimeCache = ref(new Map()) // 缓存计算结果
    
    // 计算面板高度
    const getPanelHeight = () => {
      const windowHeight = window.innerHeight
      return windowHeight - headerHeight.value + 'px'
    }
    
    // 从store获取状态
    const panelVisible = computed({
      get: () => store.state.history.historyPanelVisible,
      set: (value) => store.commit('history/SET_HISTORY_PANEL_VISIBLE', value)
    })
    
    const historyList = computed(() => store.getters['history/sortedHistoryList'])
    const isTableView = computed(() => store.state.history.isTableView)
    const currentHistory = computed(() => store.state.history.currentHistory)
    
    // 搜索筛选相关
    const searchForm = ref({
      taskTypes: [], // 任务类型多选
      customerName: '', // 客户姓名
      submitTimeRange: [], // 提交时间范围
      endTimeRange: [], // 结束时间范围
      taskResults: [] // 任务结果多选
    })
    
    // 任务类型选项
    const taskTypeOptions = [
      '个人征信报告分析',
      '企业征信报告分析',
      '买家顾问报告',
      '融资顾问报告'
    ]
    
    // 任务结果选项
    const taskResultOptions = [
      '已出结果',
      '进行中...',
      '排队中...',
      '任务失败',
      '已取消'
    ]
    
    // 添加表格数据加载状态
    const tableDataLoading = ref(false)
    
    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(20) // 默认每页20条
    
    // 根据搜索条件筛选历史记录
    const filteredHistoryList = computed(() => {
      if (!historyList.value) return []
      
      return historyList.value.filter(item => {
        // 筛选任务类型
        if (searchForm.value.taskTypes.length > 0 && !searchForm.value.taskTypes.includes(item.type)) {
          return false
        }
        
        // 筛选客户姓名
        if (searchForm.value.customerName && 
            (!item.customerName || !item.customerName.includes(searchForm.value.customerName))) {
          return false
        }
        
        // 筛选提交时间范围
        if (searchForm.value.submitTimeRange && searchForm.value.submitTimeRange.length === 2) {
          const submitDate = item.submitTime ? item.submitTime.split(' ')[0] : null
          if (!submitDate) return false
          
          const startDate = searchForm.value.submitTimeRange[0]
          const endDate = searchForm.value.submitTimeRange[1]
          
          if (submitDate < startDate || submitDate > endDate) {
            return false
          }
        }
        
        // 筛选结束时间范围
        if (searchForm.value.endTimeRange && searchForm.value.endTimeRange.length === 2) {
          // 只有已结束的任务才筛选结束时间
          if (!item.endTime) return false
          
          const endDate = item.endTime ? item.endTime.split(' ')[0] : null
          if (!endDate) return false
          
          const startDate = searchForm.value.endTimeRange[0]
          const endDateRange = searchForm.value.endTimeRange[1]
          
          if (endDate < startDate || endDate > endDateRange) {
            return false
          }
        }
        
        // 筛选任务结果
        if (searchForm.value.taskResults.length > 0 && !searchForm.value.taskResults.includes(item.result)) {
          return false
        }
        
        return true
      })
    })
    
    // 获取当前页的数据
    const paginatedHistoryList = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredHistoryList.value.slice(start, end)
    })
    
    // 处理搜索 - 修改为模拟网络请求
    const handleSearch = async () => {
      try {
        tableDataLoading.value = true;
        
        // 使用nextTick和setTimeout将状态更新分离，避免快速连续的DOM更新
        await nextTick();
        
        // 延迟重置页码，避免与加载状态同时触发多次DOM更新
        setTimeout(() => {
          currentPage.value = 1; // 搜索后重置为第一页
        }, 10);
        
        // 使用较长的延迟模拟网络请求，同时给浏览器足够时间完成DOM更新
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 主请求延迟，避免与页面状态切换冲突
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟服务器端搜索逻辑
        // 在实际应用中，这里会使用store.dispatch来调用API获取数据
        // store.dispatch('history/searchHistoryTasks', searchForm.value);
        
        // 此处仅使用本地过滤代替，实际应用需要替换为真实API调用
        ElMessage({
          type: 'success',
          message: '搜索完成',
          duration: 2000
        });
      } catch (error) {
        ElMessage({
          type: 'error',
          message: '搜索失败，请稍后重试',
          duration: 2000
        });
        console.error('搜索历史任务失败:', error);
      } finally {
        // 使用setTimeout延迟关闭加载状态，避免与其他DOM更新冲突
        setTimeout(() => {
          tableDataLoading.value = false;
        }, 100);
      }
    }
    
    // 重置搜索条件
    const resetSearch = () => {
      searchForm.value = {
        taskTypes: [],
        customerName: '',
        submitTimeRange: [],
        endTimeRange: [],
        taskResults: []
      }
      // 不自动执行搜索，等用户点击搜索按钮
    }
    
    // 处理页码变化
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }
    
    // 处理每页条数变化
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1 // 切换每页条数后重置为第一页
    }
    
    // 计算进行中的任务数
    const inProgressTaskCount = computed(() => 
      historyList.value.filter(task => task.result.includes('进行中')).length
    )
    
    // 计算排队中的任务数
    const queueingTaskCount = computed(() => 
      historyList.value.filter(task => task.result.includes('排队中')).length
    )
    
    // 计算表格高度
    const calcTableHeight = computed(() => {
      if (!isTableView.value) return 'auto'
      // 考虑搜索区域和分页的高度
      return 'calc(100% - 135px)' // 减去搜索区域高度(约85px)和分页区域高度(约50px)
    })
    
    // 检查是否是宽屏
    const checkScreenWidth = () => {
      isWideScreen.value = window.innerWidth > 1400
      
      // 宽屏自动展示历史任务面板（仅在初始化时）
      if (isWideScreen.value && !initialCheck.value) {
        if (!panelVisible.value) {
          isAutomaticOpen.value = true // 标记为自动打开
          store.dispatch('history/showHistoryPanel')
        }
        initialCheck.value = true
      }
    }
    
    // 初始化检查标志，确保只在首次加载时自动展示
    const initialCheck = ref(false)
    
    // 处理点击外部区域
    const handleOutsideClick = (event) => {
      if (!isTableView.value) return
      
      // 检查点击是否在表格视图区域外
      const panelElement = document.querySelector('.history-float-panel.table-view-mode')
      if (!panelElement) return
      
      // 检查点击是否在日期选择器相关元素中
      const isDatePickerClick = event.target.closest('.el-picker-panel') || 
                               event.target.closest('.el-date-picker') ||
                               event.target.closest('.el-date-table') ||
                               event.target.closest('.el-picker-panel__sidebar') ||
                               event.target.closest('.el-date-range-picker__header') ||
                               event.target.closest('.el-picker-panel__content') ||
                               event.target.closest('.el-date-table__row')
      
      // 如果是日期选择器相关元素的点击，不触发切换视图
      if (isDatePickerClick) return
      
      // 如果点击的不是面板本身或其子元素，则认为是点击了外部区域
      if (panelElement && !panelElement.contains(event.target)) {
        // 检查点击的元素本身是否已有点击事件处理（如按钮等）
        let element = event.target
        let hasClickHandler = false
        
        // 简单判断元素是否可点击
        const clickableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']
        if (clickableElements.includes(element.tagName)) {
          hasClickHandler = true
        } else if (element.getAttribute('role') === 'button' || 
                 element.classList.contains('el-button') ||
                 element.onclick) {
          hasClickHandler = true
        }
        
        // 如果点击区域没有点击事件处理，则切换回概要视图
        if (!hasClickHandler) {
          // 标记为过渡状态，触发动画
          tableViewTransition.value = true
          
          // 延迟切换回概要视图，等待动画完成
          setTimeout(() => {
            store.commit('history/SET_TABLE_VIEW', false)
            tableViewTransition.value = false
          }, 300) // 300ms匹配CSS过渡时间
        }
      }
    }
    
    // 格式化时间间隔为HH:MM:SS格式
    const formatTimeInterval = (seconds) => {
      if (seconds <= 0) return '00:00:00'
      
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      
      // 将时、分、秒格式化为两位数，不足两位前补0
      const formattedHours = hours.toString().padStart(2, '0')
      const formattedMinutes = minutes.toString().padStart(2, '0')
      const formattedSeconds = remainingSeconds.toString().padStart(2, '0')
      
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    }
    
    // 计算处理耗时和全部耗时（用于进行中的任务）
    const calculateRealTimeValues = () => {
      if (!currentHistory.value || !currentHistory.value.result.includes('进行中')) {
        return
      }
      
      const now = new Date().getTime()
      
      // 处理耗时 = 当前时间 - 实际开始时间
      if (currentHistory.value.actualStartTime) {
        const actualStartTime = new Date(currentHistory.value.actualStartTime).getTime()
        if (!isNaN(actualStartTime)) {
          const processingSeconds = Math.floor((now - actualStartTime) / 1000)
          processingTimeDisplay.value = formatTimeInterval(processingSeconds)
        }
      }
      
      // 全部耗时 = 当前时间 - 提交时间
      if (currentHistory.value.submitTime) {
        const submitTime = new Date(currentHistory.value.submitTime).getTime()
        if (!isNaN(submitTime)) {
          const totalSeconds = Math.floor((now - submitTime) / 1000)
          totalTimeDisplay.value = formatTimeInterval(totalSeconds)
        }
      }
    }
    
    // 开始实时计时
    const startRealtimeTimer = () => {
      stopRealtimeTimer() // 确保先停止之前的计时器
      
      // 立即执行一次计算
      calculateRealTimeValues()
      
      // 设置每秒更新一次
      timerInterval.value = setInterval(() => {
        calculateRealTimeValues()
      }, 1000)
    }
    
    // 停止实时计时
    const stopRealtimeTimer = () => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }
    
    // 监听当前任务变化
    watch(
      () => currentHistory.value,
      (newHistory) => {
        // 停止之前的计时器
        stopRealtimeTimer()
        
        // 如果当前任务是进行中状态，开始实时计时
        if (newHistory && newHistory.result && newHistory.result.includes('进行中')) {
          startRealtimeTimer()
        }
      },
      { immediate: true }
    )
    
    // 初始化时获取header高度
    onMounted(() => {
      const headerElement = document.querySelector('.el-header')
      if (headerElement) {
        headerHeight.value = headerElement.offsetHeight
      }
      
      // 监听窗口大小变化，更新表格宽度
      window.addEventListener('resize', calculateTableWidth)
      window.addEventListener('resize', checkScreenWidth)
      
      // 添加点击外部区域的监听
      document.addEventListener('click', handleOutsideClick)
      
      // 添加错误监听
      window.addEventListener('error', handleWindowError, true);
      
      // 初始计算表格宽度和检查屏幕宽度
      nextTick(() => {
        calculateTableWidth()
        checkScreenWidth()
        
        // 不管面板是否显示，始终确保获取历史任务数据用于徽标计数
        if (historyList.value.length === 0) {
          store.dispatch('history/fetchHistoryList')
        }
      })
    })
    
    // 组件销毁前清除计时器和事件监听
    onBeforeUnmount(() => {
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
      }
      window.removeEventListener('resize', calculateTableWidth)
      window.removeEventListener('resize', checkScreenWidth)
      document.removeEventListener('click', handleOutsideClick)
      window.removeEventListener('error', handleWindowError, true);
      
      // 清除实时计时器
      stopRealtimeTimer()
      
      // 清除表格计算缓存的所有定时器
      processingTimeCache.value.clear()
      totalTimeCache.value.clear()
    })
    
    // 计算列表视图的理想宽度
    const calculateTableWidth = debounce(() => {
      if (!isTableView.value) return
      
      try {
        const windowWidth = window.innerWidth
        
        // 实现自适应宽度计算
        // 所有列最小宽度总和，确保横向滚动条出现时有足够宽度
        const baseWidth = 60 // 表格边框和内边距
        const leftFixedColWidth = 130 // AI任务类型固定列
        const rightFixedColWidth = 90 // 操作固定列
        const padding = 50 // 预留空间，防止过于拥挤
        
        // 各列宽度按照新的规格调整
        const fileColWidth = 190 // 文件名列宽度
        const customerNameWidth = 155 // 客户姓名列宽度 (从140调整为155)
        const submitTimeWidth = 155 // 提交任务时间 (从140调整为155)
        const queuePositionWidth = 95 // 队列位置 (从90调整为95)
        const expectedStartTimeWidth = 155 // 预计开始时间 (从140调整为155)
        const actualStartTimeWidth = 155 // 实际开始时间 (从140调整为155)
        const endTimeWidth = 155 // 结束时间 (从140调整为155)
        const statusColWidth = 90 // 任务结果
        const processingTimeWidth = 80 // 处理耗时
        const totalTimeWidth = 80 // 全部耗时
        
        // 计算所有列的最小宽度总和
        const allColumnsMinWidth = 
          leftFixedColWidth + // AI任务类型
          customerNameWidth + // 客户姓名
          fileColWidth + // 上传的文件
          submitTimeWidth + // 提交任务时间
          queuePositionWidth + // 队列位置
          expectedStartTimeWidth + // 预计开始时间
          actualStartTimeWidth + // 实际开始时间
          endTimeWidth + // 结束时间
          statusColWidth + // 任务结果
          processingTimeWidth + // 处理耗时
          totalTimeWidth + // 全部耗时
          rightFixedColWidth; // 操作列
        
        // 计算内容需要的最小宽度，确保所有列至少能显示其最小宽度
        const contentBasedWidth = baseWidth + allColumnsMinWidth + padding;
        
        // 计算最终宽度
        // 1. 如果窗口宽度足够显示所有列的最小宽度，使用85%窗口宽度
        // 2. 如果窗口宽度不足，使用所有列最小宽度总和，触发横向滚动条
        let finalWidth;
        
        if (windowWidth * 0.85 >= contentBasedWidth) {
          // 窗口宽度足够，使用85%窗口宽度
          finalWidth = windowWidth * 0.85;
          tableNeedsScroll.value = false; // 不需要滚动条
        } else {
          // 窗口宽度不足，使用所有列最小宽度总和，确保显示横向滚动条
          finalWidth = contentBasedWidth;
          tableNeedsScroll.value = true; // 需要滚动条
        }
        
        // 考虑屏幕限制，不超过95%屏幕宽度
        const maxAllowedWidth = windowWidth * 0.95;
        finalWidth = Math.min(finalWidth, maxAllowedWidth);
        
        // 设置最终宽度
        tableViewWidth.value = `${finalWidth}px`;
        
        // 指示需要延迟更新表格布局
        nextTick(() => {
          if (tableRef.value) {
            // 在DOM更新后再处理表格布局
            setTimeout(() => {
              handleTableResize();
            }, 50);
          }
        });
      } catch (error) {
        console.error('计算表格宽度出错:', error);
      }
    }, 100); // 100ms防抖
    
    // 监听窗口错误
    const handleWindowError = (event) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.preventDefault(); // 阻止错误冒泡
        resizeObserverError.value = true;
        
        // 尝试修复ResizeObserver循环错误
        if (tableRef.value && tableRef.value.$el) {
          // 强制断开ResizeObserver循环
          setTimeout(() => {
            if (tableRef.value && tableRef.value.$el) {
              // 强制重新计算表格布局
              const el = tableRef.value.$el;
              el.style.display = 'none';
              void el.offsetHeight; // 强制重绘
              el.style.display = '';
            }
          }, 0);
        }
      }
    };
    
    // 监听面板可见性变化
    watch(panelVisible, (newVisible) => {
      // 当面板隐藏时，确保详情面板也隐藏
      if (!newVisible) {
        showDetailPanel.value = false
        store.commit('history/SET_CURRENT_HISTORY', null)
        isAutomaticOpen.value = false // 重置自动打开标记
      } else {
        // 每次打开时，确保是概要视图模式
        if (isTableView.value) {
          store.commit('history/SET_TABLE_VIEW', false)
        }
        
        // 重新计算列表视图宽度
        nextTick(() => {
          calculateTableWidth()
        })
      }
    })
    
    // 当面板可见或列表变化时，确保显示第一条记录，但只在用户主动打开面板时
    watch([panelVisible, historyList], ([newVisible, newList]) => {
      if (newVisible && newList.length > 0 && !isAutomaticOpen.value) {
        // 只在非自动打开（用户主动打开）的情况下，自动显示第一条记录详情
        nextTick(() => {
          if (!currentHistory.value || !showDetailPanel.value) {
            const firstItem = newList[0]
            store.commit('history/SET_CURRENT_HISTORY', firstItem)
            showDetailPanel.value = true
            
            // 等待DOM更新后计算位置
            nextTick(() => {
              if (historyItems.value && historyItems.value.length > 0) {
                updateDetailPosition(historyItems.value[0])
              } else {
                // 如果没有获取到DOM引用，使用默认位置
                resetDetailPosition()
              }
            })
          }
        })
      }
    }, { immediate: true })
    
    // 监听列表视图模式变化
    watch(isTableView, (newIsTableView) => {
      // 当切换到列表视图时，重新计算表格宽度
      if (newIsTableView) {
        nextTick(() => {
          calculateTableWidth()
        })
      }
    })

    // 添加窗口尺寸变化的监听，确保表格宽度动态调整
    watch(() => window.innerWidth, () => {
      if (isTableView.value) {
        calculateTableWidth()
      }
    }, { immediate: false })
    
    // 处理关闭面板
    const handleClose = (event) => {
      // 阻止事件冒泡，避免点击事件传递到其他元素
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      
      // 移除阻止关闭的条件判断
      
      // 取消可能存在的timer
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
        hideDetailTimer.value = null
      }
      
      // 停止实时计时器
      stopRealtimeTimer()
      
      // 隐藏详情面板
      showDetailPanel.value = false
      
      // 重置当前选中的任务
      store.commit('history/SET_CURRENT_HISTORY', null)
      
      // 重置自动打开标记
      isAutomaticOpen.value = false
      
      // 最后隐藏面板
      store.dispatch('history/hideHistoryPanel')
    }
    
    // 切换视图
    const toggleView = () => {
      store.dispatch('history/toggleTableView')
      showDetailPanel.value = false
      store.commit('history/SET_CURRENT_HISTORY', null)
      
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
      }
      
      // 当切换到列表视图时，计算理想宽度
      if (!isTableView.value) {
        nextTick(() => {
          calculateTableWidth()
        })
      }
    }
    
    // 计算详情弹窗位置
    const updateDetailPosition = (element) => {
      if (!element) return resetDetailPosition()
      
      const rect = element.getBoundingClientRect()
      
      // 使用距离右侧的方式定位，而不是固定的left值
      // 计算方式：任务列表右边距(16px) + 任务列表宽度(245px) + 与任务列表间距(16px)
      const rightDistance = 16 + 245 + 16 // 右边距 + 任务列表宽度 + 间距
      
      // 垂直方向上与当前任务项对齐，但确保不超出可视区域
      const viewportHeight = window.innerHeight
      const detailHeight = Math.min(500, viewportHeight - 112) // 预设最大高度
      let topPosition = rect.top
      
      // 确保详情面板底部不超出视口
      if (topPosition + detailHeight > viewportHeight - 20) {
        topPosition = Math.max(80, viewportHeight - detailHeight - 20)
      }

      detailPopupStyle.value = {
        top: `${topPosition}px`,
        right: `${rightDistance}px`,
        left: 'auto',
        maxHeight: `${detailHeight}px`
      }
    }
    
    // 重置详情弹窗位置为默认值
    const resetDetailPosition = () => {
      // 使用距离右侧的方式定位，保持一致性
      const rightDistance = 16 + 245 + 16 // 右边距 + 任务列表宽度 + 间距
      
      detailPopupStyle.value = {
        top: 'calc(64px + 16px)', // 与任务列表面板顶部对齐
        right: `${rightDistance}px`,
        left: 'auto'
      }
    }
    
    // 显示详情
    const showDetail = (history, event) => {
      store.commit('history/SET_CURRENT_HISTORY', history)
      showDetailPanel.value = true
      
      // 如果有事件对象，则更新位置
      if (event && event.target) {
        let element = event.target
        // 确保找到.history-item元素
        while (element && !element.classList.contains('history-item')) {
          element = element.parentElement
        }
        if (element) {
          updateDetailPosition(element)
        }
      }
      
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
      }
    }
    
    // 开始隐藏详情计时器
    const startHideDetailTimer = () => {
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
      }
      
      hideDetailTimer.value = setTimeout(() => {
        hideDetail()
      }, 300) // 延迟300ms，给用户时间移动到详情面板
    }
    
    // 取消隐藏详情计时器
    const cancelHideDetailTimer = () => {
      if (hideDetailTimer.value) {
        clearTimeout(hideDetailTimer.value)
        hideDetailTimer.value = null
      }
    }
    
    // 隐藏详情
    const hideDetail = () => {
      showDetailPanel.value = false
      // 重置当前选中项，解决隐藏后仍保持选中状态的问题
      store.commit('history/SET_CURRENT_HISTORY', null)
    }
    
    // 查看结果
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
      store.dispatch('history/cancelTask', historyId).then(() => {
        // 如果当前正在查看的是被取消的任务，更新显示状态
        if (currentHistory.value && currentHistory.value.id === historyId) {
          // 获取更新后的任务对象
          const updatedTask = store.state.history.historyList.find(h => h.id === historyId)
          if (updatedTask) {
            // 更新当前历史对象
            store.commit('history/SET_CURRENT_HISTORY', updatedTask)
            
            // 停止任何正在进行的计时器，因为任务已被取消
            stopRealtimeTimer()
          }
        }
      })
    }
    
    // 获取状态对应的type
    const getStatusType = (status) => {
      if (status.includes('已出结果')) return 'success'
      if (status.includes('进行中')) return 'primary'
      if (status.includes('排队中')) return 'info'
      if (status.includes('失败') || status.includes('取消')) return 'danger'
      return 'info'
    }
    
    // 计算表格中进行中任务的处理耗时
    const calculateProcessingTime = (task) => {
      if (!task || !task.id || 
          !task.result.includes('进行中') || 
          task.result.includes('已取消') || 
          !task.actualStartTime) {
        return ''
      }
      
      // 检查缓存
      if (processingTimeCache.value.has(task.id)) {
        return processingTimeCache.value.get(task.id)
      }
      
      // 计算处理耗时
      const now = new Date().getTime()
      const actualStartTime = new Date(task.actualStartTime).getTime()
      if (isNaN(actualStartTime)) return ''
      
      const processingSeconds = Math.floor((now - actualStartTime) / 1000)
      const formattedTime = formatTimeInterval(processingSeconds)
      
      // 更新缓存
      processingTimeCache.value.set(task.id, formattedTime)
      
      // 一秒后清除缓存，强制重新计算
      setTimeout(() => {
        processingTimeCache.value.delete(task.id)
      }, 1000)
      
      return formattedTime
    }
    
    // 计算表格中进行中任务的全部耗时
    const calculateTotalTime = (task) => {
      if (!task || !task.id || 
          !task.result.includes('进行中') || 
          task.result.includes('已取消') || 
          !task.submitTime) {
        return ''
      }
      
      // 检查缓存
      if (totalTimeCache.value.has(task.id)) {
        return totalTimeCache.value.get(task.id)
      }
      
      // 计算全部耗时
      const now = new Date().getTime()
      const submitTime = new Date(task.submitTime).getTime()
      if (isNaN(submitTime)) return ''
      
      const totalSeconds = Math.floor((now - submitTime) / 1000)
      const formattedTime = formatTimeInterval(totalSeconds)
      
      // 更新缓存
      totalTimeCache.value.set(task.id, formattedTime)
      
      // 一秒后清除缓存，强制重新计算
      setTimeout(() => {
        totalTimeCache.value.delete(task.id)
      }, 1000)
      
      return formattedTime
    }
    
    // 查看文件方法
    const viewUploadedFile = (file) => {
      // 如果是融资顾问报告或买家顾问报告类型，不执行任何操作
      if (currentHistory.value && (currentHistory.value.type === '融资顾问报告' || currentHistory.value.type === '买家顾问报告')) {
        return;
      }
      
      // 获取文件名（可能是对象或字符串）
      const fileName = file.name || file;
      
      // 计算窗口尺寸（宽度80%，高度95%）
      const width = Math.floor(window.screen.width * 0.8);
      const height = Math.floor(window.screen.height * 0.95);
      const left = Math.floor((window.screen.width - width) / 2);
      const top = Math.floor((window.screen.height - height) / 2);
      
      // 构建文件URL（实际应用中应该使用真实的文件路径）
      const fileUrl = `/api/files/${encodeURIComponent(fileName)}`;
      
      // 打开新窗口并写入提示内容
      const newWindow = window.open(
        '', 
        '_blank', 
        `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no`
      );
      
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>文件查看 - ${fileName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f7fa;
                }
                .message {
                  text-align: center;
                  padding: 30px;
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
                  max-width: 80%;
                }
                h2 {
                  color: #303133;
                  margin-bottom: 20px;
                }
                p {
                  color: #606266;
                  font-size: 16px;
                  line-height: 1.5;
                }
              </style>
            </head>
            <body>
              <div class="message">
                <h2>文件查看器</h2>
                <p>将在这里显示用户上传的文件</p>
                <p>文件名：${fileName}</p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    };

    // 计算概要视图的分页数据
    const summaryPagedHistoryList = computed(() => {
      if (!historyList.value) return []
      
      const end = summaryCurrentPage.value * summaryPageSize.value
      return historyList.value.slice(0, end)
    })
    
    // 是否还有更多概要视图数据
    const hasMoreSummaryData = computed(() => {
      if (!historyList.value) return false
      return summaryPagedHistoryList.value.length < historyList.value.length
    })
    
    // 加载更多概要视图数据
    const loadMoreSummaryData = () => {
      if (loadingSummaryData.value || !hasMoreSummaryData.value) return
      
      loadingSummaryData.value = true
      
      // 模拟异步加载
      setTimeout(() => {
        summaryCurrentPage.value += 1
        loadingSummaryData.value = false
      }, 500)
    }
    
    // 处理概要视图滚动
    const handleScroll = (event) => {
      if (scrollThrottle.value) return
      
      scrollThrottle.value = setTimeout(() => {
        const target = event.target
        const scrollTop = target.scrollTop
        const scrollHeight = target.scrollHeight
        const clientHeight = target.clientHeight
        
        // 当滚动到距离底部50px以内时，加载更多数据
        if ((scrollHeight - scrollTop - clientHeight) < 50 && !loadingSummaryData.value && hasMoreSummaryData.value) {
          loadMoreSummaryData()
        }
        
        scrollThrottle.value = null
      }, 200)
    }
    
    // 重置概要视图分页状态
    const resetSummaryPaging = () => {
      summaryCurrentPage.value = 1
      loadingSummaryData.value = false
    }
    
    // 监听面板显示状态变化
    watch(panelVisible, (newVal) => {
      if (newVal) {
        // 面板显示，重新获取历史记录并重置分页
        store.dispatch('history/fetchHistoryList')
        resetSummaryPaging()
      } else {
        // 面板隐藏，清理相关状态
        hideDetail()
        stopRealtimeTimer()
      }
    })
    
    // 监听视图模式变化
    watch(isTableView, () => {
      // 切换视图模式时重置分页
      resetSummaryPaging()
    })
    
    // 刷新历史任务列表
    const refreshHistoryList = async () => {
      try {
        // 设置加载状态
        tableDataLoading.value = true;
        loadingSummaryData.value = true;
        
        // 重置分页状态
        resetSummaryPaging();
        
        // 调用store的获取历史任务方法
        await store.dispatch('history/fetchHistoryList');
        
        // 显示刷新成功提示
        ElMessage({
          message: '历史任务列表已刷新',
          type: 'success',
          duration: 2000
        });
      } catch (error) {
        // 加载失败处理
        ElMessage({
          message: '刷新历史任务列表失败，请稍后重试',
          type: 'error',
          duration: 2000
        });
        console.error('刷新历史任务失败:', error);
      } finally {
        // 无论成功失败都关闭加载状态
        tableDataLoading.value = false;
        loadingSummaryData.value = false;
      }
    };
    
    const tableRef = ref(null) // 表格引用
    
    // 处理表格重新调整大小完成事件
    const handleTableResize = () => {
      // 确保表格容器在调整大小后有正确的布局
      if (tableRef.value) {
        // 使用微任务延迟，避免ResizeObserver冲突
        setTimeout(() => {
          if (tableRef.value?.$el) {
            // 触发重新布局
            tableRef.value.$el.style.display = 'none'
            void tableRef.value.$el.offsetHeight // 强制重绘
            tableRef.value.$el.style.display = ''
          }
        }, 0)
      }
    }
    
    const resizeObserverError = ref(false) // 是否出现过ResizeObserver错误
    
    return {
      panelVisible,
      historyList,
      isTableView,
      currentHistory,
      showDetailPanel,
      calcTableHeight,
      historyItems,
      historyListRef,
      detailPopupStyle,
      tableViewWidth,
      handleClose,
      toggleView,
      showDetail,
      hideDetail,
      startHideDetailTimer,
      cancelHideDetailTimer,
      viewResult,
      viewUploadedFile,
      showCancelConfirm,
      getStatusType,
      getPanelHeight,
      processingTimeDisplay,
      totalTimeDisplay,
      calculateProcessingTime,
      calculateTotalTime,
      tableViewTransition,
      isWideScreen,
      isAutomaticOpen,
      tableNeedsScroll,
      inProgressTaskCount,
      queueingTaskCount,
      searchForm,
      taskTypeOptions,
      taskResultOptions,
      currentPage,
      pageSize,
      filteredHistoryList,
      paginatedHistoryList,
      handleSearch,
      resetSearch,
      handleCurrentChange,
      handleSizeChange,
      // 概要视图分页相关
      summaryPagedHistoryList,
      hasMoreSummaryData,
      loadingSummaryData,
      loadMoreSummaryData,
      handleScroll,
      // 刷新功能
      refreshHistoryList,
      tableDataLoading,
      tableRef,
      handleTableResize,
      resizeObserverError
    }
  }
}
</script>

<style scoped>
.history-float-panel {
  position: fixed;
  top: calc(64px + 16px); /* header高度 + 16px间距 */
  right: 16px;
  bottom: 16px;
  width: 245px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
}

/* 列表视图模式下的面板样式 */
.history-float-panel.table-view-mode {
  /* 宽度由JS动态计算 */
  width: auto;
}

/* 列表视图过渡效果 - 改为向右平移 */
.history-float-panel.table-view-mode.transitioning {
  transform: translateX(30px);
  opacity: 0.9;
  transition: width 0.3s ease-in-out, transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.task-stats {
  font-size: 13px;
  font-weight: normal;
  color: #909399;
  margin-left: 8px;
}

.panel-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  font-size: 14px;
  margin-left: 6px;
}

.close-btn {
  padding: 4px;
}

.history-panel {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.history-list {
  padding: 8px;
  box-sizing: border-box;
  overflow-y: auto;
  max-height: calc(100vh - 100px); /* 减去头部和边距的高度 */
  scrollbar-width: thin;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-thumb {
  background-color: #c0c4cc;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.history-item {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  position: relative; /* 添加相对定位，使队列位置标记能够定位 */
}

.history-item:last-child {
  margin-bottom: 4px;
}

.history-item:hover,
.history-item.active {
  background-color: #f0f5ff;
  border-color: #a0cfff;
}

.history-item-title {
  margin-bottom: 6px;
  display: flex;
  overflow: hidden;
}

.history-item-content {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  color: #303133;
  word-break: break-word;
  line-height: 1.3;
  width: 100%;
  overflow: hidden;
}

.history-item-type {
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-customer {
  font-size: 13px;
  color: #606266;
  font-weight: normal;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-time {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 队列位置标记样式 */
.queue-position {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 0 4px 0 4px;
  font-weight: 400;
  z-index: 1;
}

/* 独立的悬浮详情样式 */
.history-detail-popup {
  position: fixed;
  /* 位置将由JS动态计算 */
  width: 320px;
  max-height: calc(100vh - 112px); /* 视窗高度减去上下间距 */
  height: auto; /* 自适应内容高度 */
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  z-index: 1999; /* 低于任务列表面板 */
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.detail-content-container {
  flex: 1 0 auto;
}

.detail-info {
  margin-bottom: 12px;
}

.info-item {
  margin-bottom: 6px;
  display: flex;
  font-size: 13px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  width: 85px;
  color: #909399;
  flex-shrink: 0;
}

.info-item .value {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  flex: 0 0 auto; /* 不强制占据剩余空间 */
}

.content-title {
  font-weight: 500;
  margin-bottom: 4px;
  color: #303133;
}

.content-body {
  line-height: 1.5;
  word-break: break-all;
}

.detail-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.table-view {
  padding: 12px;
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-cell {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 24px;
  overflow: hidden;
  position: relative; /* 相对定位 */
  padding-right: 48px; /* 为查看按钮预留空间 */
  margin-bottom: 5px; /* 多个文件时的间距 */
}

.file-cell:last-child {
  margin-bottom: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-value {
  width: 100%;
  overflow: hidden;
  position: relative; /* 关键：为单文件情况下的容器添加相对定位 */
  padding-right: 48px; /* 为单文件情况预留查看按钮的空间 */
}

.file-name-wrapper {
  flex: 1;
  max-width: 195px; /* 增加宽度：320 - 32 - 85 - 8 = 195px */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-link {
  position: absolute; /* 使用绝对定位 */
  right: 0; /* 固定在右侧 */
  top: 50%; /* 垂直居中 */
  transform: translateY(-50%);
  width: 40px;
  text-align: right;
}

/* 表格中的文件单元格特有样式 */
:deep(.el-table .cell .file-cell) {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding-right: 48px;
  margin-bottom: 5px;
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

/* 当表格内容过多时，确保可以横向滚动 */
:deep(.el-table__body-wrapper) {
  overflow-x: auto !important;
  /* 添加平滑滚动效果 */
  scroll-behavior: smooth;
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

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 添加预计开始时间样式 */
.history-item-expected-time {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 4px;
}

/* 1. 添加取消按钮焦点样式修复 */
.cancel-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* 取消所有按钮的焦点样式 */
:deep(.el-button:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

/* 修改滚动条样式 - 调小概要视图的滚动条 */
.history-list::-webkit-scrollbar {
  width: 6px; /* 减小滚动条宽度 */
}

.history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 详情面板文件列表样式 */
.file-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 24px;
  overflow: hidden;
  position: relative; /* 为每个文件项单独设置相对定位 */
  padding-right: 48px; /* 为查看按钮预留固定空间 */
}

.file-item:last-child {
  margin-bottom: 0;
}

/* 重构的搜索筛选区域样式 */
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

.filter-item .el-select,
.filter-item .el-input,
.filter-item .el-date-editor {
  width: 100%;
  min-width: 100px;
  flex-shrink: 0;
}

/* 日期范围选择器需要更宽一些 */
.filter-item .el-date-editor--daterange {
  min-width: 220px;
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

/* 分页容器样式 */
.pagination-container {
  margin-top: 16px;
  text-align: right;
  padding: 10px 0;
  display: flex;
  justify-content: flex-end;
}

/* 分页按钮高度统一 */
:deep(.pagination-container .el-pagination button),
:deep(.pagination-container .el-pagination .el-input__wrapper),
:deep(.pagination-container .el-select .el-input__wrapper) {
  min-height: 30px;
  height: 30px;
  line-height: 30px;
}

/* 调整表格在有搜索和分页时的高度 */
.table-view {
  padding: 12px;
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 保证表格区域能伸缩 */
.table-view .el-table {
  flex: 1;
  overflow: auto;
}

/* 任务项样式 */
.history-item {
  position: relative;
  padding: 8px;
  margin-bottom: 12px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.history-item:last-child {
  margin-bottom: 0;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border-color: #c6e2ff;
}

.history-item.active {
  background-color: #ecf5ff;
  border-color: #a0cfff;
}

.history-item-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-content {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-time {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 查看结果按钮样式 */
.view-result-btn {
  display: none;
}

.history-item:hover .view-result-btn {
  display: inline-flex;
}

/* 加载更多区域 */
.load-more {
  text-align: center;
  padding: 15px 0;
  color: #909399;
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  animation: rotate 1.5s linear infinite;
  margin-bottom: 5px;
}


.load-more-text {
  cursor: pointer;
}

.load-more-text:hover {
  color: #1b68de;
}

.no-more-data {
  text-align: center;
  padding: 15px 0;
  color: #c0c4cc;
  font-size: 12px;
}

/* 标题样式 */
h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
}

/* 刷新图标按钮 */
.refresh-icon {
  /* margin-left: 8px; */
  cursor: pointer;
  color: #1b68de;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}

.refresh-icon:hover {
  transform: rotate(90deg);
}

/* 任务统计 */
.task-stats {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
  margin-left: 20px;
  display: flex;
  align-items: center;
}

/* 刷新按钮 */
.refresh-btn {
  margin-left: 10px;
  padding: 5px 10px;
  height: 28px;
}

/* 表格区域包装器 */
.table-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate; /* 创建新的层叠上下文 */
  contain: layout; /* 优化渲染性能 */
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

/* 修正表格重绘问题 */
:deep(.el-table__inner-wrapper) {
  contain: paint; /* 独立绘制层 */
}

/* 优化表格渲染性能 */
:deep(.el-table) {
  contain: layout style paint; /* 优化渲染性能 */
  will-change: transform; /* 提示浏览器元素将发生变化 */
}

/* 强制取消表格边框样式 */
/* :deep(.el-table) {
  --el-table-border-color: transparent !important;
  --el-table-border: none !important;
} */
</style>