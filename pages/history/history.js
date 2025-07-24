// 历史记录页面
const historyService = require('../../services/historyService');

Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    showFilter: false,
    filterForm: {
      taskTypes: [],
      taskResults: []
    },
    
    // 任务类型选项
    taskTypeOptions: [
      '个人征信报告分析',
      '企业征信报告分析',
      '买家顾问报告',
      '融资顾问报告'
    ],
    
    // 任务结果选项
    taskResultOptions: [
      '已出结果',
      '进行中...',
      '排队中...',
      '任务失败',
      '已取消'
    ],
    
    // 任务列表数据
    taskList: [],
    filteredTaskList: [],
    
    // 分页和加载状态
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loadingMore: false,
    
    // 任务统计
    taskStats: {
      total: 0,
      inProgress: 0,
      queuing: 0
    },
    
    // 任务详情弹窗
    showTaskDetail: false,
    currentTask: null,

    // 页面状态管理
    scrollTop: 0,
    pageInitialized: false,
    savedState: null
  },

  onLoad(options) {
    console.log('历史记录页面加载', options);
    this.setData({ pageInitialized: true });
    this.loadTaskList();
  },

  onShow() {
    console.log('历史记录页面显示');

    // 如果页面已经初始化过，恢复状态而不是重新加载
    if (this.data.pageInitialized && this.data.savedState) {
      this.restorePageState();
    } else if (!this.data.pageInitialized) {
      // 首次显示时加载数据
      this.refreshData();
      this.setData({ pageInitialized: true });
    }
  },

  onHide() {
    console.log('历史记录页面隐藏');
    // 保存当前页面状态
    this.savePageState();
  },

  /**
   * 保存页面状态
   */
  savePageState() {
    const state = {
      taskList: this.data.taskList,
      filteredTaskList: this.data.filteredTaskList,
      searchKeyword: this.data.searchKeyword,
      filterForm: this.data.filterForm,
      currentPage: this.data.currentPage,
      hasMore: this.data.hasMore,
      taskStats: this.data.taskStats,
      scrollTop: this.data.scrollTop,
      timestamp: Date.now()
    };

    this.setData({ savedState: state });

    // 也保存到本地存储，防止页面被销毁
    try {
      wx.setStorageSync('history_page_state', JSON.stringify(state));
    } catch (error) {
      console.error('保存页面状态失败:', error);
    }
  },

  /**
   * 恢复页面状态
   */
  restorePageState() {
    let state = this.data.savedState;

    // 如果内存中没有状态，尝试从本地存储获取
    if (!state) {
      try {
        const stateStr = wx.getStorageSync('history_page_state');
        if (stateStr) {
          state = JSON.parse(stateStr);

          // 检查状态是否过期（30分钟）
          if (Date.now() - state.timestamp > 30 * 60 * 1000) {
            wx.removeStorageSync('history_page_state');
            this.refreshData();
            return;
          }
        }
      } catch (error) {
        console.error('恢复页面状态失败:', error);
        this.refreshData();
        return;
      }
    }

    if (state) {
      console.log('恢复页面状态:', state);

      this.setData({
        taskList: state.taskList || [],
        filteredTaskList: state.filteredTaskList || [],
        searchKeyword: state.searchKeyword || '',
        filterForm: state.filterForm || { taskTypes: [], taskResults: [] },
        currentPage: state.currentPage || 1,
        hasMore: state.hasMore !== undefined ? state.hasMore : true,
        taskStats: state.taskStats || { total: 0, inProgress: 0, queuing: 0 },
        scrollTop: state.scrollTop || 0
      });
    } else {
      // 没有保存的状态，重新加载
      this.refreshData();
    }
  },

  /**
   * 滚动事件处理 - 移除以避免频繁setData导致抖动
   */
  // onScroll(event) {
  //   this.setData({
  //     scrollTop: event.detail.scrollTop
  //   });
  // },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMoreTasks();
  },

  // 刷新数据
  refreshData() {
    this.setData({
      currentPage: 1,
      hasMore: true,
      taskList: []
    });
    this.loadTaskList();
  },

  // 加载任务列表
  async loadTaskList() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const filters = {
        keyword: this.data.searchKeyword,
        taskTypes: this.data.filterForm.taskTypes,
        taskResults: this.data.filterForm.taskResults
      };

      const result = await historyService.getHistoryList({
        page: this.data.currentPage,
        pageSize: this.data.pageSize,
        filters: filters
      });

      this.setData({
        taskList: result.list,
        filteredTaskList: result.list,
        hasMore: result.hasMore,
        taskStats: result.stats,
        loading: false
      });

      // 停止下拉刷新
      wx.stopPullDownRefresh();

    } catch (error) {
      console.error('加载任务列表失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载更多任务
  async loadMoreTasks() {
    if (!this.data.hasMore || this.data.loadingMore) return;

    this.setData({ loadingMore: true });

    try {
      const filters = {
        keyword: this.data.searchKeyword,
        taskTypes: this.data.filterForm.taskTypes,
        taskResults: this.data.filterForm.taskResults
      };

      const result = await historyService.getHistoryList({
        page: this.data.currentPage + 1,
        pageSize: this.data.pageSize,
        filters: filters
      });

      // 使用concat代替扩展运算符
      const updatedTaskList = this.data.taskList.concat(result.list);

      this.setData({
        taskList: updatedTaskList,
        filteredTaskList: updatedTaskList,
        currentPage: this.data.currentPage + 1,
        hasMore: result.hasMore,
        loadingMore: false
      });

    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({ loadingMore: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },



  // 搜索相关方法
  onSearchChange(event) {
    this.setData({ searchKeyword: event.detail });
  },

  onSearch() {
    this.applyCurrentFilter();
    // 添加触觉反馈
    wx.vibrateShort();
  },

  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.applyCurrentFilter();
  },

  // 筛选相关方法
  showFilterPopup() {
    this.setData({ showFilter: true });
    // 添加触觉反馈
    wx.vibrateShort();
  },

  hideFilterPopup() {
    this.setData({ showFilter: false });
  },

  onTaskTypesChange(event) {
    this.setData({
      'filterForm.taskTypes': event.detail
    });
  },

  onTaskResultsChange(event) {
    this.setData({
      'filterForm.taskResults': event.detail
    });
  },

  resetFilter() {
    this.setData({
      'filterForm.taskTypes': [],
      'filterForm.taskResults': [],
      searchKeyword: ''
    });
    this.applyCurrentFilter();
  },

  applyFilter() {
    this.applyCurrentFilter();
    this.hideFilterPopup();
    // 添加触觉反馈
    wx.vibrateShort();
  },

  // 应用当前筛选条件
  applyCurrentFilter() {
    // 使用slice()代替扩展运算符
    let filtered = this.data.taskList.slice();

    // 搜索关键词筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(function(task) {
        const customerName = task.customerName || '';
        return customerName.toLowerCase().indexOf(keyword) !== -1 ||
               task.type.toLowerCase().indexOf(keyword) !== -1;
      });
    }

    // 任务类型筛选
    if (this.data.filterForm.taskTypes.length > 0) {
      filtered = filtered.filter(function(task) {
        return this.data.filterForm.taskTypes.indexOf(task.type) !== -1;
      }.bind(this));
    }

    // 任务状态筛选
    if (this.data.filterForm.taskResults.length > 0) {
      filtered = filtered.filter(function(task) {
        return this.data.filterForm.taskResults.indexOf(task.result) !== -1;
      }.bind(this));
    }

    this.setData({
      filteredTaskList: filtered
    });
  },

  // 任务卡片点击
  onTaskTap(event) {
    const task = event.currentTarget.dataset.task;

    if (task.result === '已出结果') {
      // 已出结果的任务，跳转到结果详情页
      this.navigateToTaskResult(task);
    } else {
      // 未出结果的任务，显示详情弹窗
      this.showTaskDetailPopup(task);
    }

    // 添加触觉反馈
    wx.vibrateShort();
  },

  // 任务卡片长按
  onTaskLongPress(event) {
    const task = event.currentTarget.dataset.task;

    // 长按显示操作菜单
    const actions = [];

    if (task.result === '已出结果') {
      actions.push('查看结果');
    }

    if (task.result === '排队中...' || task.result === '进行中...') {
      actions.push('取消任务');
    }

    actions.push('复制任务信息');

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const action = actions[res.tapIndex];

        switch (action) {
          case '查看结果':
            this.navigateToTaskResult(task);
            break;
          case '取消任务':
            this.setData({ currentTask: task });
            this.cancelTask();
            break;
          case '复制任务信息':
            this.copyTaskInfo(task);
            break;
        }
      }
    });

    // 添加触觉反馈
    wx.vibrateShort();
  },

  // 复制任务信息
  copyTaskInfo(task) {
    const info = `任务类型：${task.type}\n客户姓名：${task.customerName || '未填写'}\n任务状态：${task.result}\n提交时间：${task.submitTime}`;

    wx.setClipboardData({
      data: info,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 显示任务详情弹窗
  showTaskDetailPopup(task) {
    this.setData({
      currentTask: task,
      showTaskDetail: true
    });
  },

  // 隐藏任务详情弹窗
  hideTaskDetail() {
    this.setData({
      showTaskDetail: false,
      currentTask: null
    });
  },

  // 查看任务结果
  viewTaskResult() {
    if (this.data.currentTask) {
      this.navigateToTaskResult(this.data.currentTask);
      this.hideTaskDetail();
    }
  },

  // 跳转到任务结果页面
  navigateToTaskResult(task) {
    const url = `/pages/task-result/task-result?taskId=${task.id}&type=${encodeURIComponent(task.type)}`;
    wx.navigateTo({
      url: url,
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'error'
        });
      }
    });
  },

  // 取消任务
  async cancelTask() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await historyService.cancelTask(this.data.currentTask.id);

            // 刷新任务列表
            this.refreshData();

            wx.showToast({
              title: '任务已取消',
              icon: 'success'
            });

            this.hideTaskDetail();
          } catch (error) {
            console.error('取消任务失败:', error);
            wx.showToast({
              title: '取消失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 刷新按钮点击
  async onRefresh() {
    try {
      await historyService.refreshHistoryList();
      this.refreshData();
      // 添加触觉反馈
      wx.vibrateShort();
    } catch (error) {
      console.error('刷新失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    }
  },

  // 获取状态类型（用于标签颜色）
  getStatusType(result) {
    switch (result) {
      case '已出结果':
        return 'success';
      case '进行中...':
        return 'primary';
      case '排队中...':
        return 'warning';
      case '任务失败':
        return 'danger';
      case '已取消':
        return 'default';
      default:
        return 'default';
    }
  },

  // 计算处理时长
  calculateProcessingTime(submitTime, endTime) {
    if (!submitTime || !endTime) return '-';
    
    const start = new Date(submitTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  },

  // 格式化日期时间
  formatDateTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});
