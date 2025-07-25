/**
 * 历史记录页面
 * 提供任务历史记录的查看、搜索、筛选等功能
 */

import historyService from '../../utils/historyService.js';
import { getTaskTypeIcon } from '../../utils/design-constants.js';
import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';

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

    // 搜索和筛选
    searchKeyword: '',         // 搜索关键词
    showFilterPopup: false,    // 是否显示筛选弹窗
    filterForm: {              // 筛选表单
      taskTypes: [],
      taskResults: []
    },

    // 选项数据
    taskTypeOptions: [
      '个人征信报告分析',
      '企业征信报告分析',
      '买家顾问报告',
      '融资顾问报告'
    ],
    taskResultOptions: [
      '已出结果',
      '进行中...',
      '排队中...',
      '任务失败',
      '已取消'
    ],

    // 详情弹窗
    showDetailPopup: false,    // 是否显示详情弹窗
    currentTask: null,         // 当前查看的任务

    // 分页
    pageSize: 10,              // 每页显示数量
    currentPage: 1,            // 当前页码

    // 系统信息和定位
    systemInfo: {},            // 系统信息
    filterPopupTop: 200        // 筛选面板top位置
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    try {
      // 获取系统信息并计算筛选面板位置
      await this.calculateFilterPopupPosition();

      // 初始化历史记录服务
      await historyService.init();

      // 加载历史记录数据
      await this.loadHistoryData();
    } catch (error) {
      console.error('页面加载失败:', error);
      Toast.fail('加载失败，请稍后重试');
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新数据
    this.refreshData();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    await this.onRefresh();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.onLoadMore();
  },

  /**
   * 加载历史记录数据
   */
  async loadHistoryData(refresh = false) {
    try {
      this.setData({ loading: true });

      // 获取历史记录列表
      const rawHistoryList = await historyService.getHistoryList(refresh);

      // 处理历史记录数据，添加状态标签信息
      const historyList = rawHistoryList.map(item => {
        const statusText = this.getStatusText(item.result);
        const statusTagType = this.getStatusTagType(item.result);
        const statusTagColor = this.getStatusTagColor(item.result);

        // 调试排队中任务的数据
        if (item.result && item.result.includes('排队中')) {
          console.log('🔍 排队中任务数据调试:', {
            id: item.id,
            result: item.result,
            queuePosition: item.queuePosition,
            hasQueuePosition: !!item.queuePosition,
            queuePositionType: typeof item.queuePosition,
            expectedStartTime: item.expectedStartTime,
            customerName: item.customerName
          });
        }

        return {
          ...item,
          statusText: statusText,
          statusTagType: statusTagType,
          statusTagColor: statusTagColor
        };
      });

      // 获取任务统计
      const taskStats = historyService.getTaskStats();

      // 更新数据
      this.setData({
        historyList,
        taskStats,
        loading: false
      });

      // 应用当前筛选条件
      this.applyFilters();

    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.setData({ loading: false });
      Toast.fail('加载失败，请稍后重试');
    }
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
    });
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.applyFilters();
  },

  /**
   * 清除搜索
   */
  onSearchClear() {
    this.setData({
      searchKeyword: ''
    });
    this.applyFilters();
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
   * 任务类型筛选变化
   */
  onTaskTypeChange(event) {
    this.setData({
      'filterForm.taskTypes': event.detail
    });
  },

  /**
   * 任务状态筛选变化
   */
  onTaskResultChange(event) {
    this.setData({
      'filterForm.taskResults': event.detail
    });
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    this.setData({
      'filterForm.taskTypes': [],
      'filterForm.taskResults': [],
      searchKeyword: ''
    });
  },

  /**
   * 应用筛选条件
   */
  onApplyFilter() {
    this.applyFilters();
    this.setData({
      showFilterPopup: false
    });
  },

  /**
   * 应用筛选和搜索
   */
  applyFilters() {
    let filteredList = [...this.data.historyList];

    // 应用搜索关键词
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredList = filteredList.filter(item =>
        item.type.toLowerCase().includes(keyword) ||
        (item.customerName && item.customerName.toLowerCase().includes(keyword))
      );
    }

    // 应用筛选条件
    const filters = {
      taskTypes: this.data.filterForm.taskTypes,
      taskResults: this.data.filterForm.taskResults
    };

    filteredList = historyService.searchHistory(filters);

    // 如果有搜索关键词，再次过滤
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredList = filteredList.filter(item =>
        item.type.toLowerCase().includes(keyword) ||
        (item.customerName && item.customerName.toLowerCase().includes(keyword))
      );
    }

    this.setData({
      filteredList,
      currentPage: 1
    });

    this.updateDisplayList();
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
   * 加载更多
   */
  onLoadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;

    this.setData({
      loadingMore: true,
      currentPage: this.data.currentPage + 1
    });

    // 模拟加载延迟
    setTimeout(() => {
      this.updateDisplayList();
      this.setData({
        loadingMore: false
      });
    }, 500);
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
      this.setData({
        currentTask: task,
        showDetailPopup: true
      });
    }
  },

  /**
   * 关闭详情弹窗
   */
  onCloseDetail() {
    this.setData({
      showDetailPopup: false,
      currentTask: null
    });
  },

  /**
   * 查看任务结果
   */
  onViewResult(event) {
    event.stopPropagation();
    const task = event.currentTarget.dataset.task;

    // 跳转到任务结果页面
    wx.navigateTo({
      url: `/pages/task-result/task-result?id=${task.id}&type=${encodeURIComponent(task.type)}`,
      fail: (error) => {
        console.error('跳转失败:', error);
        Toast.fail('跳转失败，请稍后重试');
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
    Toast('文件预览功能开发中...');
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
   * 计算筛选面板位置
   */
  async calculateFilterPopupPosition() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();

      // 计算各个组件的高度（单位：rpx）
      const statusBarHeight = (systemInfo.statusBarHeight || 44) * 2; // px转rpx
      const navigationBarHeight = 88; // 自定义导航栏高度
      const searchContainerHeight = 120; // 搜索容器高度（包括内边距）

      // 计算筛选面板的top位置
      const filterPopupTop = statusBarHeight + navigationBarHeight + searchContainerHeight + 16; // 额外间距

      this.setData({
        systemInfo,
        filterPopupTop
      });

    } catch (error) {
      console.error('计算筛选面板位置失败:', error);
      // 使用默认值
      this.setData({
        filterPopupTop: 240
      });
    }
  }
});