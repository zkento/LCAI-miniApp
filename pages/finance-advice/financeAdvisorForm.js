import historyService from '../../utils/historyService.js';

Page({
  data: {
    // 表单数据
    formData: {
      requirements: '',  // 需求描述
      name: '',          // 客户姓名
      businessArea: [],   // 业务地区
    },
    
    // 关键词提取状态
    isExtractingKeywords: false,
    hasAttemptedExtraction: false,
    extractionDuration: 0,
    extractionStartTime: 0,
    currentAnalysisTime: 0,
    submitting: false,
    canExtractKeywords: false,
    
    // 关键词和错误信息
    aiKeywords: [],
    extractError: '',

    // 滚动位置
    scrollTop: 0,
    scrollIntoView: '',
    
    // 征信报告弹层相关
    showCreditReportPopup: false,
    selectedPersonalTask: null,
    selectedEnterpriseTask: null,
    
    // 征信报告列表数据
    creditReportList: [],
    displayedCreditReportList: [], // 当前显示的数据
    tableDataLoading: false,
    refreshing: false,
    searchForm: {
      customerName: '',
      taskResults: '已出结果'
    },
    
    // 下拉菜单选项
    dropdownOptions: [
      { text: '全部状态', value: '' },
      { text: '已出结果', value: '已出结果' },
      { text: '进行中', value: '进行中' },
      { text: '排队中', value: '排队中' },
      { text: '任务失败', value: '任务失败' },
      { text: '已取消', value: '已取消' }
    ],
    
    // 无限滚动相关
    loadSize: 20, // 每次加载20条
    hasMore: true, // 是否还有更多数据
    
    // 省份选项
    provinceOptions: [
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
      }
    ],
    
    // Cascader相关状态
    showCascader: false,
    selectedAreaText: '',
    cascaderValue: '',
    
    // 征信报告相关功能
    creditReportList: [], // 征信报告列表
    filteredCreditReportList: [], // 筛选后的征信报告列表
    showCreditReportSelector: false, // 是否显示征信报告选择器
    creditReportSearchKeyword: '', // 征信报告搜索关键词
    creditReportFilterStatus: '', // 征信报告筛选状态
    selectedCreditReportId: '', // 选中的征信报告ID
    selectedPersonalTask: null, // 选中的个人征信任务
    selectedEnterpriseTask: null, // 选中的企业征信任务
    
    // 提取任务控制
    extractionTaskId: 0,
    lastExtractedText: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto',

    // 状态选项
    statusOptions: [
      { text: '全部状态', value: '' },
      { text: '已出结果', value: 'completed' },
      { text: '进行中', value: 'processing' },
      { text: '排队中', value: 'waiting' },
      { text: '任务失败', value: 'failed' },
      { text: '已取消', value: 'cancelled' }
    ],

    // 状态下拉菜单状态
    showStatusDropdown: false
  },

  onLoad() {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '融资顾问'
    });
    
    // 获取系统信息
    try {
      const res = wx.getSystemInfoSync();
      this.setData({
        windowWidth: res.windowWidth,
        windowHeight: res.windowHeight
      });
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
    
    // 获取历史任务数据
    this.fetchHistoryList();
  },

  onReady() {
    // 动态计算滚动区域高度
    const query = wx.createSelectorQuery();
    query.select('#nav-bar').boundingClientRect(navRect => {
      if (navRect) {
        const scrollViewHeight = this.data.windowHeight - navRect.height;
        this.setData({
          scrollViewHeight: `${scrollViewHeight}px`
        });
      }
    }).exec();
  },

  // 处理导航栏返回事件
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 获取历史任务数据
  async fetchHistoryList() {
    try {
      // 使用历史服务获取数据
      await historyService.init();
      const historyData = await historyService.getHistoryList();

      // 筛选征信报告相关的任务
      const creditReportTasks = historyData.filter(item =>
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      );

      this.setData({
        creditReportList: creditReportTasks,
        filteredCreditReportList: creditReportTasks
      });
    } catch (error) {
      console.error('获取历史任务数据失败:', error);
      // 如果获取失败，使用空数组
      this.setData({
        creditReportList: [],
        filteredCreditReportList: []
      });
    }
  },

  // 征信报告分析结果选择器
  openCreditReportSelector() {
    if (this.data.isExtractingKeywords) {
      wx.showToast({
        title: '正在提取关键词，请稍后',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showCreditReportPopup: true
    });
    
    // 禁止背景滚动
    this.disableBackgroundScroll();
    
    // 初始化数据
    this.initCreditReportData();
  },
  
  // 关闭征信报告选择器
  closeCreditReportPopup() {
    this.setData({
      showCreditReportPopup: false
    });
    
    // 恢复背景滚动
    this.enableBackgroundScroll();
  },
  
  // 显示弹层信息
  showPopupInfo() {
    wx.showModal({
      title: '提示',
      content: '可选择征信报告分析结果与融资需求关键词一并交给AI以获得更精准的融资建议；最多只能同时选择一份个人和（或）一份企业征信报告分析结果。',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  
  // 初始化征信报告数据
  async initCreditReportData() {
    this.setData({
      tableDataLoading: true
    });

    try {
      // 使用历史服务获取数据
      await historyService.init();
      const historyData = await historyService.getHistoryList();
      
      // 筛选征信报告相关的任务
      const creditReportTasks = historyData.filter(item =>
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      ).map(item => ({
        ...item,
        isSelected: false, // 添加选中状态
        statusClass: this.getStatusClass(item.result) // 添加状态样式类
      }));
      
      this.setData({
        creditReportList: creditReportTasks,
        tableDataLoading: false
      });
      
      this.filterAndPaginateData();
    } catch (error) {
      console.error('初始化征信报告数据失败:', error);
      this.setData({
        creditReportList: [],
        tableDataLoading: false
      });
    }
  },
  
  // 筛选和分页数据
  filterAndPaginateData() {
    let filtered = this.data.creditReportList.filter(item => {
      // 筛选客户姓名
      if (this.data.searchForm.customerName &&
          !item.customerName.includes(this.data.searchForm.customerName)) {
        return false;
      }
      
      // 筛选任务结果
      if (this.data.searchForm.taskResults &&
          item.result !== this.data.searchForm.taskResults) {
        return false;
      }
      
      return true;
    });
    
    // 重置显示数据，加载前20条
    const initialData = filtered.slice(0, this.data.loadSize);
    
    // 预处理数据，添加UI状态
    const displayedWithSelection = initialData.map(item => {
      let isSelected = false;
      let isDisabled = this.isCheckboxDisabled(item);
      
      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }
      
        return {
          ...item,
        isSelected,
        isDisabled
        };
      });
      
      this.setData({
      displayedCreditReportList: displayedWithSelection,
      hasMore: filtered.length > this.data.loadSize
    });
  },
  
  // 加载更多数据
  loadMoreData() {
    const { creditReportList, displayedCreditReportList, loadSize, searchForm } = this.data;
    
    if (!this.data.hasMore) {
      return;
    }
    
    // 筛选数据
    let filtered = creditReportList.filter(item => {
      // 筛选客户姓名
      if (searchForm.customerName &&
          !item.customerName.includes(searchForm.customerName)) {
        return false;
      }
      
      // 筛选任务结果
      if (searchForm.taskResults &&
          item.result !== searchForm.taskResults) {
        return false;
      }
      
      return true;
    });
    
    const currentLength = displayedCreditReportList.length;
    const nextData = filtered.slice(currentLength, currentLength + loadSize);
    
    if (nextData.length === 0) {
      this.setData({
        hasMore: false
      });
      return;
    }
    
    // 预处理新数据
    const newDataWithSelection = nextData.map(item => {
      let isSelected = false;
      let isDisabled = this.isCheckboxDisabled(item);
      
      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }
      
      return {
        ...item,
        isSelected,
        isDisabled
      };
    });
    
    this.setData({
      displayedCreditReportList: displayedCreditReportList.concat(newDataWithSelection),
      hasMore: currentLength + nextData.length < filtered.length
    });
  },
  
  // 检查复选框是否应该禁用
  isCheckboxDisabled(item) {
    if (!item || item.result !== '已出结果') return true;
    
    // 如果是个人征信报告，且已经选择了另一个个人征信报告
    if (item.type.includes('个人征信') &&
        this.data.selectedPersonalTask &&
        this.data.selectedPersonalTask.id !== item.id) {
      return true;
    }
    
    // 如果是企业征信报告，且已经选择了另一个企业征信报告
    if (item.type.includes('企业征信') &&
        this.data.selectedEnterpriseTask &&
        this.data.selectedEnterpriseTask.id !== item.id) {
      return true;
    }
    
    return false;
  },
  
  // 获取状态样式类名
  getStatusClass(status) {
    if (!status) return 'status-tag-default';
    if (status.includes('已出结果')) return 'status-tag-completed';
    if (status.includes('进行中')) return 'status-tag-processing';
    if (status.includes('排队中')) return 'status-tag-waiting';
    if (status.includes('失败')) return 'status-tag-failed';
    if (status.includes('取消')) return 'status-tag-cancelled';
    return 'status-tag-default';
  },
  
  // 搜索相关方法
  onCustomerNameChange(e) {
    this.setData({
      'searchForm.customerName': e.detail
    }, () => {
      // 实时搜索
      this.filterAndPaginateData();
    });
  },
  
  onClearCustomerName() {
    this.setData({
      'searchForm.customerName': ''
    }, () => {
      // 清除搜索关键词后立即应用筛选
      this.filterAndPaginateData();
    });
  },
  
  onSearch() {
    // 由于已经在输入变化时进行了搜索，这里不需要额外操作
    // 可以关闭键盘
    wx.hideKeyboard();
  },
  
  onTaskResultChange(event) {
    this.setData({
      'searchForm.taskResults': event.detail
    });
    this.filterAndPaginateData();
  },
  
  // 刷新列表
  async onRefresh() {
    this.setData({
      refreshing: true
    });
    
    try {
      // 强制刷新数据
      await historyService.init();
      const historyData = await historyService.getHistoryList(true);
      
      // 筛选征信报告相关的任务
      const creditReportTasks = historyData.filter(item =>
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      ).map(item => ({
        ...item,
        isSelected: false,
        statusClass: this.getStatusClass(item.result)
      }));
      
      this.setData({
        creditReportList: creditReportTasks,
        refreshing: false
      });
      
      this.filterAndPaginateData();
    } catch (error) {
      console.error('刷新数据失败:', error);
      this.setData({
        refreshing: false
      });
    }
  },
  
  // 滚动到顶部加载更多
  onScrollToUpper() {
    this.loadMoreData();
  },
  
  // 任务选择相关方法
  onTaskSelect(e) {
    const item = e.currentTarget.dataset.item;
    const isSelected = e.detail;
    
    this.handleTaskSelection(item, isSelected);
  },
  
  handleTaskSelection(item, isSelected) {
    if (!item || !item.type) return;
    
    // 处理个人征信报告选择
    if (item.type.includes('个人征信')) {
      if (isSelected) {
        this.setData({
          selectedPersonalTask: { ...item }
        });
      } else if (this.data.selectedPersonalTask &&
                 this.data.selectedPersonalTask.id === item.id) {
        this.setData({
          selectedPersonalTask: null
        });
      }
    }
    
    // 处理企业征信报告选择
    if (item.type.includes('企业征信')) {
      if (isSelected) {
        this.setData({
          selectedEnterpriseTask: { ...item }
        });
      } else if (this.data.selectedEnterpriseTask &&
                 this.data.selectedEnterpriseTask.id === item.id) {
        this.setData({
          selectedEnterpriseTask: null
        });
      }
    }
    
    // 更新列表中的选中状态
    this.updateListSelectionState();
  },
  
  // 更新列表选中状态
  updateListSelectionState() {
    const updatedList = this.data.displayedCreditReportList.map(item => {
      let isSelected = false;
      let isDisabled = this.isCheckboxDisabled(item);
      
      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }
      
      return { ...item, isSelected, isDisabled };
    });
    
    this.setData({
      displayedCreditReportList: updatedList
    });
  },
  
  // 处理卡片点击
  onTaskCardTap(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || item.isDisabled) return;
    
    // 切换选中状态
    this.handleTaskSelection(item, !item.isSelected);
  },
  
  // 查看任务结果
  onViewResult(e) {
    console.log('查看任务结果', e);
    // 微信小程序中没有stopPropagation方法，应该在WXML中使用catchtap
    
    const item = e.currentTarget.dataset.item;
    console.log('任务项数据:', item);
    
    if (!item || !item.id) {
      console.error('任务信息不完整:', item);
      wx.showToast({
        title: '任务信息不完整',
        icon: 'none'
      });
      return;
    }

    // 不再关闭征信报告选择器弹层，直接跳转
    // this.closeCreditReportPopup();
    
    // 跳转到任务结果页面，并传递hideShareButton=true参数，表示从查看结果按钮进入
    const url = `/pages/task-result/task-result?id=${item.id}&type=${encodeURIComponent(item.type)}&hideShareButton=true`;
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('跳转成功');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 取消任务
  onCancelTask(e) {
    console.log('取消任务', e);
    // 微信小程序中没有stopPropagation方法，应该在WXML中使用catchtap
    // e.stopPropagation(); // 这行代码导致错误，移除
    
    const item = e.currentTarget.dataset.item;
    console.log('要取消的任务:', item);
    
    if (!item || !item.id) {
      wx.showToast({
        title: '任务信息不完整',
        icon: 'none'
      });
      return;
    }

    // 显示确认对话框
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此任务吗？',
      success: (res) => {
        if (res.confirm) {
          // 模拟取消任务
          wx.showLoading({
            title: '取消中...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '任务已取消',
              icon: 'success'
            });
            
            // 刷新列表
            this.initCreditReportData();
          }, 1000);
        }
      }
    });
  },
  
  // 查看失败原因
  onShowFailReason(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '失败原因',
      content: item.content || '未知原因',
      showCancel: false
    });
  },

  // 关闭征信报告选择器
  onCloseCreditReportSelector() {
    this.setData({
      showCreditReportSelector: false,
      showStatusDropdown: false
    });
  },

  // 切换状态下拉菜单
  toggleStatusDropdown() {
    this.setData({
      showStatusDropdown: !this.data.showStatusDropdown
    });
  },

  // 选择状态筛选
  selectStatusFilter(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      creditReportFilterStatus: status,
      showStatusDropdown: false
    });
    this.filterCreditReportList();
  },

  // 阻止弹层内容滚动穿透
  preventTouchMove() {
    return false;
  },

  // 征信报告搜索
  onCreditReportSearchChange(e) {
    const keyword = e.detail;
    this.setData({
      creditReportSearchKeyword: keyword
    });
    this.filterCreditReportList();
  },

  // 清除征信报告搜索
  onCreditReportSearchClear() {
    this.setData({
      creditReportSearchKeyword: ''
    });
    this.filterCreditReportList();
  },

  // 征信报告状态筛选 - 下拉菜单方式
  onCreditReportFilterChange(e) {
    this.setData({
      creditReportFilterStatus: e.detail
    });
    this.filterCreditReportList();
  },

  // 查看征信报告结果
  viewCreditReportResult(e) {
    const id = e.currentTarget.dataset.id;
    // 选中当前项
    this.setData({
      selectedCreditReportId: id
    });
    // 自动确认选择
    this.onConfirmCreditReportSelect();
  },

  // 筛选征信报告列表
  filterCreditReportList() {
    const { creditReportList, creditReportSearchKeyword, creditReportFilterStatus } = this.data;
    let filtered = [...creditReportList];
    
    // 按关键词筛选
    if (creditReportSearchKeyword) {
      const keyword = creditReportSearchKeyword.toLowerCase();
      filtered = filtered.filter(item => 
        item.customerName && item.customerName.toLowerCase().includes(keyword)
      );
    }
    
    // 按状态筛选
    if (creditReportFilterStatus) {
      // 状态映射
      const statusMap = {
        'completed': '已出结果',
        'processing': '进行中',
        'waiting': '排队中',
        'failed': '任务失败',
        'cancelled': '已取消'
      };
      
      filtered = filtered.filter(item => item.result && item.result.includes(statusMap[creditReportFilterStatus]));
    }
    
    // 添加状态类名
    filtered = filtered.map(item => {
      let statusClass = 'status-tag-default';
      if (item.result) {
        if (item.result.includes('已出结果')) {
          statusClass = 'status-tag-completed';
        } else if (item.result.includes('进行中')) {
          statusClass = 'status-tag-processing';
        } else if (item.result.includes('排队中')) {
          statusClass = 'status-tag-waiting';
        } else if (item.result.includes('任务失败')) {
          statusClass = 'status-tag-failed';
        } else if (item.result.includes('已取消')) {
          statusClass = 'status-tag-cancelled';
        }
      }
      return { ...item, statusClass };
    });
    
    this.setData({
      filteredCreditReportList: filtered
    });
  },

  // 选择征信报告
  onCreditReportSelect(e) {
    this.setData({
      selectedCreditReportId: e.detail.value
    });
  },

  // 确认选择征信报告
  onConfirmCreditReportSelect() {
    const { selectedCreditReportId, creditReportList } = this.data;
    if (!selectedCreditReportId) return;
    
    const selectedTask = creditReportList.find(item => item.id === selectedCreditReportId);
    if (!selectedTask) return;
    
    // 根据类型设置不同的选中任务
    if (selectedTask.type.includes('个人征信')) {
      this.setData({
        selectedPersonalTask: selectedTask,
        selectedEnterpriseTask: null
      });
    } else if (selectedTask.type.includes('企业征信')) {
      this.setData({
        selectedPersonalTask: null,
        selectedEnterpriseTask: selectedTask
      });
    }
    
    this.onCloseCreditReportSelector();
  },

  // 需求描述输入处理
  onRequirementsInput(e) {
    const value = e.detail.value;
    const trimmedValue = value.trim();

    this.setData({
      'formData.requirements': value,
      'canExtractKeywords': trimmedValue.length >= 10
    });

    // 当用户输入时，判断是否需要重置关键词状态
    if (this.data.hasAttemptedExtraction) {
      if (trimmedValue !== this.data.lastExtractedText) {
        this.resetExtractionState();
      }
    }
  },

  // 客户姓名输入处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  // 业务地区选择处理
  onBusinessAreaChange(e) {
    this.setData({
      'formData.businessArea': e.detail.value
    });
  },

  // Cascader相关方法
  openCascader() {
    if (this.data.isExtractingKeywords) return;
    
    this.setData({
      showCascader: true
    });
  },

  onCloseCascader() {
    this.setData({
      showCascader: false
    });
  },

  onFinishCascader(e) {
    const { selectedOptions, value } = e.detail;
    
    // 确保selectedOptions有值
    if (!selectedOptions || !Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return;
    }
    
    // 获取文本
    let areaText = '';
    try {
      // 根据field-names配置，尝试获取文本
      areaText = selectedOptions.map(option => option.text || option.label).join(' - ');
    } catch (error) {
      // 出错时继续处理
    }
    
    // 获取省市的索引值，用于兼容原有逻辑
    let provinceIndex = -1;
    let cityIndex = -1;
    
    for (let i = 0; i < this.data.provinceOptions.length; i++) {
      if (this.data.provinceOptions[i].value === selectedOptions[0].value) {
        provinceIndex = i;
        break;
      }
    }
    
    if (provinceIndex !== -1 && selectedOptions.length > 1) {
      const children = this.data.provinceOptions[provinceIndex].children;
      for (let j = 0; j < children.length; j++) {
        if (children[j].value === selectedOptions[1].value) {
          cityIndex = j;
          break;
        }
      }
    }
    
    // 如果areaText为空，尝试从索引直接构建
    if (!areaText && provinceIndex !== -1) {
      try {
        const province = this.data.provinceOptions[provinceIndex].label;
        let city = '';
        if (cityIndex !== -1) {
          city = this.data.provinceOptions[provinceIndex].children[cityIndex].label;
        }
        areaText = city ? `${province} - ${city}` : province;
      } catch (error) {
        // 出错时继续处理
      }
    }
    
    // 如果还是为空，使用原始值
    if (!areaText && Array.isArray(value)) {
      areaText = value.join(' - ');
    }
    
    this.setData({
      selectedAreaText: areaText,
      cascaderValue: value,
      showCascader: false,
      'formData.businessArea': [provinceIndex, cityIndex],
      'formData.businessAreaText': areaText
    });
  },

  // 重置提取关键词相关状态
  resetExtractionState() {
    // 停止任何进行中的提取任务
    this.setData({
      extractionTaskId: this.data.extractionTaskId + 1
    });
    
    // 清除关键词
    this.setData({
      aiKeywords: [],
      extractError: '',
      hasAttemptedExtraction: false,
      lastExtractedText: '',
      isExtractingKeywords: false,
      submitting: false
    });
    
    // 重置计时器
    this.resetExtractionTimer();
  },

  // 开始计时
  startExtractionTimer() {
    this.resetExtractionTimer();
    
    const startTime = Date.now();
    this.setData({
      extractionStartTime: startTime,
      currentAnalysisTime: 1
    });
    
    this.extractionTimerInterval = setInterval(() => {
      if (this.data.extractionStartTime > 0) {
        const currentTime = Math.round((Date.now() - this.data.extractionStartTime) / 1000) + 1;
        this.setData({
          currentAnalysisTime: currentTime
        });
      }
    }, 1000);
  },

  // 停止计时
  stopExtractionTimer() {
    if (this.extractionTimerInterval) {
      clearInterval(this.extractionTimerInterval);
      this.extractionTimerInterval = null;
    }
    
    if (this.data.extractionStartTime > 0) {
      const duration = Math.round((Date.now() - this.data.extractionStartTime) / 1000) + 1;
      this.setData({
        extractionDuration: duration
      });
    }
  },

  // 重置计时器
  resetExtractionTimer() {
    if (this.extractionTimerInterval) {
      clearInterval(this.extractionTimerInterval);
      this.extractionTimerInterval = null;
    }
    this.setData({
      extractionDuration: 0,
      extractionStartTime: 0,
      currentAnalysisTime: 1
    });
  },

  // 提取关键词
  extractKeywords() {
    // 检查是否正在提取关键词
    if (this.data.isExtractingKeywords) {
      return;
    }

    // 检查是否有输入内容
    if (!this.data.formData.requirements || this.data.formData.requirements.trim() === '') {
      wx.showToast({
        title: '请输入客户融资需求',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const trimmedText = this.data.formData.requirements.trim();
    if (trimmedText.length < 10) {
      wx.showToast({
        title: '请输入10个字以上的客户融资需求',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 重置状态
    this.setData({
      aiKeywords: [],
      extractError: '',
      isExtractingKeywords: true
    });
    
    // 生成本次任务ID
    const currentTaskId = this.data.extractionTaskId + 1;
    this.setData({
      extractionTaskId: currentTaskId
    });
    
    // 启动计时器
    this.startExtractionTimer();

    // 模拟API调用
    setTimeout(() => {
      // 检查任务是否已被新任务取代
      if (currentTaskId !== this.data.extractionTaskId) {
        console.log('任务已过期，丢弃结果');
        return;
      }
      
      this.setData({
        hasAttemptedExtraction: true,
        lastExtractedText: trimmedText
      });
      
      // 模拟关键词提取结果
      const mockKeywords = [
        { key: 'keyword_1', value: '经营贷款', type: 'primary' },
        { key: 'keyword_2', value: '300万元', type: 'success' },
        { key: 'keyword_3', value: '餐饮企业', type: 'info' },
        { key: 'keyword_4', value: '抵押贷款', type: 'warning' }
      ];
      
      this.setData({
        aiKeywords: mockKeywords,
        isExtractingKeywords: false
      });

      this.stopExtractionTimer();

      // 自动滚动到分析结果区域
      this.scrollToAnalysisContent();
    }, 3000);
  },

  // 自动滚动到分析结果区域
  scrollToAnalysisContent() {
    // 延迟执行，确保DOM更新完成
    setTimeout(() => {
      // 使用 scroll-view 的 scroll-into-view 属性实现平滑滚动
      this.setData({
        scrollIntoView: 'analysis-content'
      });

      // 清除 scroll-into-view，避免影响后续滚动
      setTimeout(() => {
        this.setData({
          scrollIntoView: ''
        });
      }, 500);
    }, 100);
  },

  // 监听滚动事件
  onScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop
    });
  },

  // 提交表单
  submitFinanceForm() {
    if (this.data.submitting || this.data.isExtractingKeywords) {
      return;
    }
    
    // 验证表单
    if (!this.data.formData.name || this.data.formData.name.trim() === '') {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      });
      
      // 自动聚焦到姓名输入框
      this.focusNameInput();
      return;
    }
    
    if (!this.data.formData.businessArea || this.data.formData.businessArea.length === 0 || this.data.formData.businessArea[0] === -1) {
      wx.showToast({
        title: '请选择业务城市',
        icon: 'none'
      });
      
      // 自动唤起城市选择器
      this.openCascader();
      return;
    }
    
    if (!this.validateKeywords()) {
      return;
    }
    
    this.setData({
      submitting: true
    });
    
    // 构建提交的数据
    const submitData = {
      ...this.data.formData,
      aiKeywords: this.data.aiKeywords
    };
    
    // 添加征信报告数据（如果有）
    if (this.data.selectedPersonalTask) {
      submitData.personalCreditTask = this.data.selectedPersonalTask;
    }
    
    if (this.data.selectedEnterpriseTask) {
      submitData.enterpriseCreditTask = this.data.selectedEnterpriseTask;
    }
    
    // 保存到全局数据
    const app = getApp();
    app.globalData = app.globalData || {};
    app.globalData.financeFormData = submitData;
    
    // 跳转到报告页面
    wx.navigateTo({
      url: '/pages/finance-advice/financeAdvisorReport?fromForm=true',
      success: () => {
        this.setData({ submitting: false });
      },
      fail: (error) => {
        this.setData({ submitting: false });
        console.error('跳转失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 检查AI关键词是否有效
  validateKeywords() {
    if (!this.data.aiKeywords || this.data.aiKeywords.length === 0) {
      wx.showToast({
        title: '需求描述不是有效的融资需求，请调整后重新提取关键词',
        icon: 'none',
        duration: 3000
      });
      return false;
    }
    return true;
  },

  // 重置表单
  resetForm() {
    if (this.data.isExtractingKeywords) {
      wx.showModal({
        title: '提示',
        content: '正在进行关键词提取，确认要中止此操作吗？',
        success: (res) => {
          if (res.confirm) {
            this.resetExtractionState();
            this.resetFormFields();
            wx.showToast({
              title: '已重置表单',
              icon: 'success'
            });
          }
        }
      });
      return;
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要重置所有已填写的内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetFormFields();
          wx.showToast({
            title: '已重置表单',
            icon: 'success'
          });
        }
      }
    });
  },

  // 重置所有表单字段
  resetFormFields() {
    this.setData({
      formData: {
        requirements: '',
        name: '',
        businessArea: [],
        businessAreaText: ''
      },
      selectedAreaText: '',
      cascaderValue: '',
      selectedPersonalTask: null,
      selectedEnterpriseTask: null,
      selectedCreditReportId: ''
    });
    
    // 重置关键词相关状态
    this.resetExtractionState();
  },

  // 复制示例文本
  copyExampleText() {
    const exampleText = '我是一家成立了5年的餐饮企业老板，在广州有3家连锁店，月营业额约80万元。\n现计划申请经营抵押贷款300万元用于新开2家分店，希望能在1个月内放款，期限2年以上，可接受月息最高5厘。\n目前在广州名下有一套市值约500万元的商品房可以抵押，目前无贷款，也有约50万元应收账款。希望了解银行抵押贷款和企业经营贷款哪个更合适，最快多久能拿到资金。';

    wx.setClipboardData({
      data: exampleText
    });
  },

  // 背景滚动控制方法
  disableBackgroundScroll() {
    // 获取当前滚动位置
    const query = wx.createSelectorQuery();
    query.select('.scroll-container').scrollOffset();
    query.exec((res) => {
      if (res[0]) {
        this.scrollTop = res[0].scrollTop;
      }
    });

    // 禁用页面滚动
    wx.pageScrollTo({
      scrollTop: this.scrollTop || 0,
      duration: 0
    });
  },

  enableBackgroundScroll() {
    // 恢复页面滚动（小程序中通常不需要特殊处理）
    // 这里主要是为了保持代码的完整性
  },
  
  // 阻止弹层内容滚动穿透
  preventTouchMove() {
    return false;
  },

  onUnload() {
    // 清理计时器
    this.resetExtractionTimer();

    // 确保恢复背景滚动
    this.enableBackgroundScroll();
  },

  // 自动聚焦到姓名输入框
  focusNameInput() {
    // 使用延时确保toast显示后再聚焦
    setTimeout(() => {
      // 创建选择器查询
      const query = wx.createSelectorQuery();
      // 选择姓名输入框
      query.select('.name-input').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          // 滚动到姓名输入框位置
          this.setData({
            scrollIntoView: 'name-input-container'
          });
          
          // 使用微信小程序API聚焦输入框
          wx.createSelectorQuery()
            .select('.name-input')
            .context((ctx) => {
              if (ctx && ctx.context) {
                ctx.context.focus();
              }
            })
            .exec();
        }
      });
    }, 500); // 延迟500毫秒执行
  },

  // 查看任务失败原因
  onShowFailReason(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '失败原因',
      content: item.content || '未知原因',
      showCancel: false
    });
  }
});