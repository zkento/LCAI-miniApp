/**
 * 历史记录页面
 * 提供任务历史记录的查看、搜索、筛选等功能
 */

import historyService from '../../utils/historyService.js';
import { getTaskTypeIcon } from '../../utils/design-constants.js';
import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import deviceDetector from '../../utils/device-detector.js';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 数据状态
    historyList: [],           // 完整历史记录列表
    displayList: [],           // 当前显示的列表
    filteredList: [],          // 筛选后的列表
    taskStats: {               // 任务统计
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    },

    // 加载状态
    loading: true,             // 初始加载状态
    loadingMore: false,        // 加载更多状态
    hasMore: true,             // 是否还有更多数据
    refreshing: false,         // 下拉刷新状态
    shouldAutoRefresh: true,   // 控制是否自动刷新

    // 搜索和筛选
    searchKeyword: '',         // 搜索关键词
    showFilterPopup: false,    // 是否显示筛选弹窗
    filterForm: {              // 筛选表单
      taskTypes: [],           // 任务类型筛选
      taskResults: [],         // 任务状态筛选
      timeRange: ''            // 时间范围筛选：today, week, month
    },

    // 选项数据
    taskTypeOptions: [
      '个人征信报告分析',
      '企业征信报告分析',
      '买家顾问报告',
      '融资顾问报告'
    ],
    taskResultOptions: [
      '排队中...',
      '进行中...',
      '已出结果',
      '任务失败',
      '已取消'
    ],

    // 详情弹窗
    showDetailPopup: false,    // 是否显示详情弹窗
    currentTask: null,         // 当前查看的任务

    // 实时计时
    realtimeProcessingTime: '', // 实时处理耗时
    realtimeTotalTime: '',      // 实时全部耗时
    realtimeTimer: null,        // 实时计时器

    // 分页
    pageSize: 10,              // 每页显示数量
    currentPage: 1,            // 当前页码

    // 系统信息和定位
    systemInfo: {},            // 系统信息
    filterPopupTop: 200,       // 筛选面板top位置
    
    // 页面布局相关
    headerHeight: 0,           // 头部区域高度(rpx)
    contentPaddingTop: 0,      // 内容区域顶部内边距(rpx)
    statusBarHeight: 0,        // 状态栏高度(rpx)
    navBarHeight: 88,          // 导航栏高度(rpx)
    searchHeight: 100,         // 搜索栏高度(rpx)
    contentStyle: '',          // 内容区域样式

    // 选中状态映射
    taskTypeSelected: {},
    taskResultSelected: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 计算页面布局
    this.calculateLayout();

    // 设置设备信息
    this.setData({
      deviceClass: deviceDetector.getDeviceType() + '-device',
      needIconFallback: deviceDetector.shouldUseIconFallback()
    });

    // 初始化选中状态映射
    this.updateSelectedMaps();

    // 加载历史数据
    this.loadHistoryData();
    
    // 监听设备方向变化
    wx.onDeviceMotionChange(() => {
      this.onResize();
    });
  },
  
  /**
   * 计算页面布局
   */
  async calculateLayout() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      console.log('系统信息:', systemInfo);
      
      // 计算状态栏高度(px转rpx)
      const statusBarHeight = (systemInfo.statusBarHeight || 20) * 2; // px转rpx
      
      // 导航栏高度(rpx)
      const navBarHeight = 88; // 自定义导航栏高度
      
      // 搜索容器高度(rpx)
      const searchHeight = 100; // 搜索容器高度（包括内边距）
      
      // 计算头部总高度(rpx)
      const headerHeight = statusBarHeight + navBarHeight + searchHeight;
      
      // 设置内容区域的顶部内边距和头部高度
      this.setData({
        systemInfo,
        statusBarHeight,
        navBarHeight,
        searchHeight,
        headerHeight,
        contentPaddingTop: headerHeight,
        contentStyle: `height: calc(100vh - ${statusBarHeight}rpx); padding-top: ${headerHeight}rpx;`
      });
      
      // 计算筛选面板的top位置 - 确保与搜索框无缝连接
      const filterPopupTop = headerHeight;
      this.setData({
        filterPopupTop
      });
      
      console.log('页面布局计算完成:', {
        statusBarHeight,
        navBarHeight,
        searchHeight,
        headerHeight,
        contentPaddingTop: headerHeight,
        filterPopupTop
      });
    } catch (error) {
      console.error('计算页面布局失败:', error);
      // 使用默认值
      this.setData({
        headerHeight: 275, // 默认头部高度
        contentPaddingTop: 275, // 默认内容区域顶部内边距
        filterPopupTop: 275, // 默认筛选面板top位置
        contentStyle: 'height: calc(100vh - 275rpx); padding-top: 275rpx;'
      });
    }
  },

  /**
   * 监听设备方向变化事件
   */
  onResize() {
    // 重新计算布局
    this.calculateLayout();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 只有在允许自动刷新时才刷新数据
    if (this.data.shouldAutoRefresh) {
      this.refreshData();
    }
    // 重置自动刷新标志
    this.setData({
      shouldAutoRefresh: true
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 停止实时计时器
    this.stopRealtimeTimer();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      refreshing: true
    });
    
    // 重新加载数据
    this.loadHistoryData().then(() => {
      wx.stopPullDownRefresh();
      this.setData({
        refreshing: false
      });
    }).catch(error => {
      console.error('刷新失败:', error);
      wx.stopPullDownRefresh();
      this.setData({
        refreshing: false
      });
      Toast.fail('刷新失败');
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.onLoadMore();
  },

  /**
   * 加载历史数据
   */
  loadHistoryData() {
    this.setData({
      loading: true
    });
    
    // 使用 Promise 包装，方便处理异步
    return new Promise((resolve, reject) => {
      try {
        // 获取模拟数据
        const historyData = historyService.getMockHistoryData();
        
        this.setData({
          historyList: historyData,
          filteredList: historyData,
          displayList: historyData.slice(0, this.data.pageSize),
          hasMore: historyData.length > this.data.pageSize,
          currentPage: 1,
          loading: false
        });
        
        // 更新任务统计
        this.updateTaskStats(historyData);
        
        resolve();
      } catch (error) {
        console.error('加载历史数据失败:', error);
        this.setData({
          loading: false
        });
        Toast.fail('加载失败');
        reject(error);
      }
    });
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      // 静默刷新，不显示loading
      const historyList = await historyService.getHistoryList(false);
      const taskStats = historyService.getTaskStats();

      this.setData({
        historyList,
        taskStats
      });

      this.applyFilters();
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  },

  /**
   * 下拉刷新
   */
  async onRefresh() {
    this.setData({ refreshing: true });
    try {
      await this.loadHistoryData(true);
      // Toast.success('刷新成功');
    } catch (error) {
      console.error('刷新失败:', error);
      Toast.fail('刷新失败，请稍后重试');
    } finally {
      this.setData({ refreshing: false });
    }
  },



  /**
   * 搜索输入变化
   */
  onSearchChange(event) {
    this.setData({
      searchKeyword: event.detail
    }, () => {
      // 输入变化时立即应用筛选
      this.applyFilters();
    });
  },

  /**
   * 执行搜索
   */
  onSearch() {
    // 由于已经在输入变化时进行了搜索，这里不需要额外操作
    // 可以关闭键盘
    wx.hideKeyboard();
  },

  /**
   * 清除搜索
   */
  onSearchClear() {
    this.setData({
      searchKeyword: ''
    }, () => {
      // 清除搜索关键词后立即应用筛选
      this.applyFilters();
    });
  },

  /**
   * 切换筛选弹窗显示状态
   */
  onShowFilter() {
    this.setData({
      showFilterPopup: !this.data.showFilterPopup
    });
  },

  /**
   * 关闭筛选弹窗
   */
  onCloseFilter() {
    this.setData({
      showFilterPopup: false
    });
  },

  /**
   * 更新选中状态映射
   */
  updateSelectedMaps() {
    const taskTypeSelected = {};
    const taskResultSelected = {};

    // 更新任务类型选中状态
    taskTypeSelected[''] = this.data.filterForm.taskTypes.length === 0; // "不限"选项
    this.data.taskTypeOptions.forEach(item => {
      taskTypeSelected[item] = this.data.filterForm.taskTypes.indexOf(item) > -1;
    });

    // 更新任务状态选中状态
    taskResultSelected[''] = this.data.filterForm.taskResults.length === 0; // "不限"选项
    this.data.taskResultOptions.forEach(item => {
      taskResultSelected[item] = this.data.filterForm.taskResults.indexOf(item) > -1;
    });

    this.setData({
      taskTypeSelected,
      taskResultSelected
    });
  },

  /**
   * 处理筛选选项点击
   */
  onFilterOptionTap(event) {
    const { type, value } = event.currentTarget.dataset;
    const filterForm = { ...this.data.filterForm };

    console.log('筛选选项点击:', { type, value });
    console.log('点击前filterForm:', JSON.stringify(this.data.filterForm));

    // 处理不同类型的筛选
    if (type === 'taskTypes') {
      if (value === '') {
        // 点击"不限"选项，清空任务类型筛选
        filterForm.taskTypes = [];
      } else {
        // 切换选中状态
        const index = filterForm.taskTypes.indexOf(value);
        if (index > -1) {
          // 已选中，则取消选中
          filterForm.taskTypes.splice(index, 1);
        } else {
          // 未选中，则添加选中
          filterForm.taskTypes.push(value);
        }
      }
    } else if (type === 'taskResults') {
      if (value === '') {
        // 点击"不限"选项，清空任务状态筛选
        filterForm.taskResults = [];
      } else {
        // 切换选中状态
        const index = filterForm.taskResults.indexOf(value);
        if (index > -1) {
          // 已选中，则取消选中
          filterForm.taskResults.splice(index, 1);
        } else {
          // 未选中，则添加选中
          filterForm.taskResults.push(value);
        }
      }
    } else if (type === 'timeRange') {
      // 时间范围是单选
      filterForm.timeRange = value === filterForm.timeRange ? '' : value;
    }

    console.log('点击后filterForm:', JSON.stringify(filterForm));

    // 更新筛选表单并立即应用筛选
    this.setData({ filterForm }, () => {
      console.log('setData后filterForm:', JSON.stringify(this.data.filterForm));

      // 额外的调试信息
      if (type === 'taskTypes') {
        console.log('任务类型数组:', this.data.filterForm.taskTypes);
        console.log('任务类型选项:', this.data.taskTypeOptions);
        this.data.taskTypeOptions.forEach(item => {
          console.log(`检查"${item}"是否在数组中:`, this.data.filterForm.taskTypes.indexOf(item) !== -1, '数组内容:', this.data.filterForm.taskTypes);
        });
      }
      if (type === 'taskResults') {
        console.log('任务状态数组:', this.data.filterForm.taskResults);
        console.log('任务状态选项:', this.data.taskResultOptions);
        this.data.taskResultOptions.forEach(item => {
          console.log(`检查"${item}"是否在数组中:`, this.data.filterForm.taskResults.indexOf(item) !== -1, '数组内容:', this.data.filterForm.taskResults);
        });
      }

      this.applyFilters();
      this.updateSelectedMaps();
    });
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    this.setData({
      filterForm: {
        taskTypes: [],
        taskResults: [],
        timeRange: ''
      },
      searchKeyword: ''
    }, () => {
      // 重置后立即应用筛选
      this.applyFilters();
      // 更新选中状态映射
      this.updateSelectedMaps();
      // 关闭筛选弹窗
      this.onCloseFilter();
    });
  },

  /**
   * 应用筛选条件
   */
  applyFilters() {
    if (!this.data.historyList || this.data.historyList.length === 0) {
      return;
    }

    const { searchKeyword, filterForm } = this.data;
    console.log('应用筛选条件:', { searchKeyword, filterForm });
    let filteredList = [...this.data.historyList];

    // 1. 应用搜索关键词筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filteredList = filteredList.filter(item => 
        (item.type && item.type.toLowerCase().includes(keyword)) ||
        (item.customerName && item.customerName.toLowerCase().includes(keyword))
      );
    }

    // 2. 应用任务类型筛选
    if (filterForm.taskTypes && filterForm.taskTypes.length > 0) {
      filteredList = filteredList.filter(item => 
        filterForm.taskTypes.includes(item.type)
      );
    }

    // 3. 应用任务状态筛选
    if (filterForm.taskResults && filterForm.taskResults.length > 0) {
      console.log('应用任务状态筛选:', filterForm.taskResults);
      console.log('筛选前数据示例:', filteredList.slice(0, 3).map(item => ({ id: item.id, result: item.result })));
      filteredList = filteredList.filter(item =>
        filterForm.taskResults.includes(item.result)
      );
      console.log('筛选后数据数量:', filteredList.length);
    }

    // 4. 应用时间范围筛选
    if (filterForm.timeRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (filterForm.timeRange) {
        case 'today':
          // 今天凌晨
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          // 本周一
          const day = startDate.getDay() || 7; // 获取星期几，星期日为0转为7
          startDate.setDate(startDate.getDate() - day + 1); // 设置为本周一
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // 本月1号
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'quarter':
          // 本季度初
          const month = startDate.getMonth();
          const quarterStartMonth = Math.floor(month / 3) * 3;
          startDate.setMonth(quarterStartMonth, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
      
      filteredList = filteredList.filter(item => {
        const submitTime = new Date(item.submitTime);
        return submitTime >= startDate && submitTime <= now;
      });
    }

    // 更新筛选后的列表和分页数据
    this.setData({
      filteredList,
      displayList: filteredList.slice(0, this.data.pageSize),
      hasMore: filteredList.length > this.data.pageSize,
      currentPage: 1
    });

    // 更新任务统计
    this.updateTaskStats(filteredList);
  },

  /**
   * 更新任务统计
   */
  updateTaskStats(list) {
    const stats = {
      total: list.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    // 统计各状态任务数量
    list.forEach(item => {
      if (item.result.includes('排队中')) {
        stats.pending++;
      } else if (item.result.includes('进行中')) {
        stats.processing++;
      } else if (item.result.includes('已出结果')) {
        stats.completed++;
      } else if (item.result.includes('任务失败')) {
        stats.failed++;
      } else if (item.result.includes('已取消')) {
        stats.cancelled++;
      }
    });

    this.setData({ taskStats: stats });
  },

  /**
   * 更新显示列表（分页）
   */
  updateDisplayList() {
    const { filteredList, currentPage, pageSize } = this.data;
    const startIndex = 0;
    const endIndex = currentPage * pageSize;
    const displayList = filteredList.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredList.length;

    this.setData({
      displayList,
      hasMore
    });
  },

  /**
   * 加载更多数据
   */
  onLoadMore() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return;
    }
    
    this.setData({ loadingMore: true });
    
    const nextPage = this.data.currentPage + 1;
    const start = this.data.pageSize * (nextPage - 1);
    const end = this.data.pageSize * nextPage;
    const newItems = this.data.filteredList.slice(start, end);
    
    if (newItems.length > 0) {
      this.setData({
        displayList: [...this.data.displayList, ...newItems],
        currentPage: nextPage,
        hasMore: end < this.data.filteredList.length,
        loadingMore: false
      });
    } else {
      this.setData({
        hasMore: false,
        loadingMore: false
      });
    }
  },

  /**
   * 点击任务卡片
   */
  onTaskTap(event) {
    const task = event.currentTarget.dataset.task;

    // 如果是已出结果的任务，直接跳转到结果页面
    if (task.result === '已出结果') {
      this.onViewResult(event);
    } else {
      // 其他状态显示详情弹窗
      console.log('🔍 显示任务详情:', {
        id: task.id,
        type: task.type,
        result: task.result,
        queuePosition: task.queuePosition,
        expectedStartTime: task.expectedStartTime,
        customerName: task.customerName,
        uploadFile: task.uploadFile
      });

      this.setData({
        currentTask: task,
        showDetailPopup: true
      });

      // 如果是进行中任务，开始实时计时
      if (task.result && task.result.includes('进行中')) {
        this.startRealtimeTimer();
      }
    }
  },

  /**
   * 关闭详情弹窗
   */
  onCloseDetail() {
    // 停止实时计时器
    this.stopRealtimeTimer();

    this.setData({
      showDetailPopup: false,
      currentTask: null,
      realtimeProcessingTime: '',
      realtimeTotalTime: ''
    });
  },

  /**
   * 查看任务结果
   */
  onViewResult(event) {
    const task = event.currentTarget.dataset.task;

    // 跳转到任务结果页面
    wx.navigateTo({
      url: `/pages/task-result/task-result?id=${task.id}&type=${encodeURIComponent(task.type)}`,
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 取消任务
   */
  async onCancelTask(event) {
    event.stopPropagation();
    const taskId = event.currentTarget.dataset.taskId;

    try {
      const result = await Dialog.confirm({
        title: '取消任务',
        message: '取消后若再次发起可能要重新排队，是否确认？',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      });

      if (result) {
        Toast.loading('取消中...');

        await historyService.cancelTask(taskId);

        Toast.success('任务已取消');

        // 刷新数据
        await this.refreshData();
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('取消任务失败:', error);
        Toast.fail('取消失败，请稍后重试');
      }
    }
  },

  /**
   * 查看失败原因
   */
  onViewFailReason(event) {
    event.stopPropagation();
    const content = event.currentTarget.dataset.content;

    let message = content;
    if (content.includes('原因：')) {
      message = content.split('原因：')[1];
    }

    Dialog.alert({
      title: '失败原因',
      message: message,
      confirmButtonText: '知道了'
    });
  },

  /**
   * 查看上传文件
   */
  onViewFile(event) {
    const file = event.currentTarget.dataset.file;

    // 这里可以实现文件预览功能
    console.log('预览文件:', file);

    // 先关闭详情弹窗，再显示Toast
    this.setData({
      showDetailPopup: false
    }, () => {
      // 使用正确的Toast调用方式，并设置更高的层级
      Toast({
        message: 'Demo不提供文件预览功能...',
        zIndex: 10000,
        duration: 2000
      });
    });
  },

  /**
   * 获取任务类型图标
   */
  getTaskTypeIcon(taskType) {
    return getTaskTypeIcon(taskType);
  },

  /**
   * 获取状态标签颜色配置
   */
  getStatusTagColor(status) {
    const colorMap = {
      '进行中...': {
        color: '#e6f4ff',      // 浅蓝色背景
        textColor: '#1890ff'   // 蓝色文字
      },
      '排队中...': {
        color: '#f5f5f5',      // 浅灰色背景
        textColor: '#8c8c8c'   // 灰色文字
      },
      '已出结果': {
        color: '#f6ffed',      // 浅绿色背景
        textColor: '#52c41a'   // 绿色文字
      },
      '任务失败': {
        color: '#fff2f0',      // 浅红色背景
        textColor: '#ff4d4f'   // 红色文字
      },
      '已取消': {
        color: '#fff7e6',      // 浅橙色背景
        textColor: '#fa8c16'   // 橙色文字
      }
    };
    return colorMap[status] || {
      color: '#f5f5f5',
      textColor: '#8c8c8c'
    };
  },

  /**
   * 获取状态标签类型（保留兼容性）
   */
  getStatusTagType(status) {
    const typeMap = {
      '进行中...': 'primary',    // 蓝色
      '排队中...': 'default',    // 灰色
      '已出结果': 'success',     // 绿色
      '任务失败': 'danger',      // 红色
      '已取消': 'warning'        // 橙色
    };
    return typeMap[status] || 'default';
  },

  /**
   * 获取状态文本（简化版）
   */
  getStatusText(status) {
    const statusMap = {
      '进行中...': '进行中',
      '排队中...': '排队中',
      '已出结果': '已完成',
      '任务失败': '失败',
      '已取消': '已取消'
    };
    return statusMap[status] || status;
  },

  /**
   * 格式化时间间隔为HH:MM:SS格式
   */
  formatTimeInterval(seconds) {
    if (seconds <= 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // 将时、分、秒格式化为两位数，不足两位前补0
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  },

  /**
   * 开始实时计时
   */
  startRealtimeTimer() {
    // 先停止之前的计时器
    this.stopRealtimeTimer();

    // 立即执行一次计算
    this.calculateRealtimeValues();

    // 设置每秒更新一次
    this.data.realtimeTimer = setInterval(() => {
      this.calculateRealtimeValues();
    }, 1000);
  },

  /**
   * 停止实时计时
   */
  stopRealtimeTimer() {
    if (this.data.realtimeTimer) {
      clearInterval(this.data.realtimeTimer);
      this.setData({
        realtimeTimer: null
      });
    }
  },

  /**
   * 计算实时耗时值
   */
  calculateRealtimeValues() {
    const currentTask = this.data.currentTask;
    if (!currentTask || !currentTask.result || !currentTask.result.includes('进行中')) {
      return;
    }

    const now = new Date().getTime();

    // 处理耗时 = 当前时间 - 实际开始时间
    if (currentTask.actualStartTime) {
      const actualStartTime = new Date(currentTask.actualStartTime).getTime();
      if (!isNaN(actualStartTime)) {
        const processingSeconds = Math.floor((now - actualStartTime) / 1000);
        this.setData({
          realtimeProcessingTime: this.formatTimeInterval(processingSeconds)
        });
      }
    }

    // 全部耗时 = 当前时间 - 提交时间
    if (currentTask.submitTime) {
      const submitTime = new Date(currentTask.submitTime).getTime();
      if (!isNaN(submitTime)) {
        const totalSeconds = Math.floor((now - submitTime) / 1000);
        this.setData({
          realtimeTotalTime: this.formatTimeInterval(totalSeconds)
        });
      }
    }
  },

  /**
   * 显示取消任务确认对话框
   */
  onShowCancelConfirm() {
    const Dialog = this.selectComponent('#van-dialog');
    Dialog.showConfirmDialog({
      title: '取消任务',
      message: '取消后若再次发起可能要重新排队，是否确认？',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }).then(() => {
      // 用户点击确认，执行取消任务操作
      this.cancelTask();
    }).catch(() => {
      // 用户取消操作，不做任何处理
    });
  },

  /**
   * 进行中任务点击取消按钮的处理
   */
  onCancelInProgressTask() {
    const Toast = this.selectComponent('#van-toast');
    Toast.showToast({
      type: 'fail',
      message: '暂未能支持取消进行中的任务'
    });
  },

  /**
   * 取消任务
   */
  async cancelTask() {
    const currentTask = this.data.currentTask;
    if (!currentTask) return;

    const Toast = this.selectComponent('#van-toast');

    try {
      Toast.showLoadingToast({
        message: '取消中...',
        forbidClick: true
      });

      // 调用取消任务API
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.data.baseUrl}/api/tasks/${currentTask.id}/cancel`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.data.success) {
        Toast.showSuccessToast('任务已取消');

        // 更新任务状态
        const updatedTask = {
          ...currentTask,
          result: '已取消',
          endTime: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '/'),
          content: `${currentTask.type}任务已被用户取消，取消时间：${new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '/')}`
        };

        // 更新当前任务和历史列表
        this.setData({
          currentTask: updatedTask
        });

        // 更新历史列表中的任务
        const historyList = this.data.historyList.map(item =>
          item.id === currentTask.id ? updatedTask : item
        );

        this.setData({
          historyList,
          filteredHistoryList: this.filterHistoryList(historyList)
        });

        // 停止实时计时器
        this.stopRealtimeTimer();

      } else {
        Toast.showFailToast(response.data.message || '取消失败');
      }
    } catch (error) {
      console.error('取消任务失败:', error);
      Toast.showFailToast('取消失败，请稍后重试');
    }
  }
});