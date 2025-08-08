import historyService from '../../utils/historyService.js';

Page({
  data: {
    // 表单数据
    formData: {
      requirements: '',  // 需求描述
      name: '',          // 客户姓名
      businessArea: [],   // 业务地区
      creditReport: ''   // 征信报告分析结果
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
    
    // 征信报告弹层相关
    showCreditReportPopup: false,
    selectedPersonalTask: null,
    selectedEnterpriseTask: null,

    // 征信报告列表数据
    creditReportList: [],
    filteredCreditReportList: [],
    paginatedCreditReportList: [],
    searchForm: {
      customerName: '',
      taskResults: '已出结果'
    },
    taskResultOptions: [
      { text: '已出结果', value: '已出结果' },
      { text: '进行中...', value: '进行中...' },
      { text: '排队中...', value: '排队中...' },
      { text: '任务失败', value: '任务失败' },
      { text: '已取消', value: '已取消' }
    ],

    // 下拉菜单选项
    dropdownOptions: [
      { text: '全部状态', value: '' },
      { text: '已出结果', value: '已出结果' },
      { text: '进行中', value: '进行中' },
      { text: '排队中', value: '排队中' },
      { text: '任务失败', value: '任务失败' },
      { text: '已取消', value: '已取消' }
    ],
    tableDataLoading: false,
    refreshing: false,

    // 无限滚动相关
    displayedCreditReportList: [], // 当前显示的数据
    loadSize: 20, // 每次加载20条
    hasMore: true, // 是否还有更多数据
    
    // 提取任务控制
    extractionTaskId: 0,
    lastExtractedText: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto'
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

    // 预加载征信报告数据（后台加载，不显示loading）
    this.preloadCreditReportData();
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
        creditReportList: creditReportTasks
      });
    } catch (error) {
      console.error('获取历史任务数据失败:', error);
      // 如果获取失败，使用空数组
      this.setData({
        creditReportList: []
      });
    }
  },

  // 预加载征信报告数据
  async preloadCreditReportData() {
    try {
      await historyService.init();
      const historyData = await historyService.getHistoryList();

      // 筛选征信报告相关的任务
      const creditReportTasks = historyData.filter(item =>
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      ).map(item => ({
        ...item,
        isSelected: false
      }));

      this.setData({
        creditReportList: creditReportTasks
      });
    } catch (error) {
      console.error('预加载征信报告数据失败:', error);
      // 静默失败，不影响用户体验
    }
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
      aiKeywords: this.data.aiKeywords,
      // 添加征信报告详细信息
      selectedCreditReports: {
        personalTask: this.data.selectedPersonalTask,
        enterpriseTask: this.data.selectedEnterpriseTask,
        hasSelectedReports: this.data.selectedPersonalTask !== null || this.data.selectedEnterpriseTask !== null
      }
    };
    
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
        businessAreaText: '',
        creditReport: ''
      },
      selectedAreaText: '',
      cascaderValue: ''
    });
    
    // 清空选中的征信报告
    this.clearSelectedCreditReport();
    
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

  // 征信报告弹层相关方法
  openCreditReportPopup() {
    if (this.data.isExtractingKeywords) {
      wx.showToast({
        title: '正在提取关键词，请稍后',
        icon: 'none'
      });
      return;
    }

    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    }).catch(() => {
      // 静默处理振动失败
    });

    this.setData({
      showCreditReportPopup: true
    });

    // 禁止背景滚动
    this.disableBackgroundScroll();

    // 初始化数据
    this.initCreditReportData();
  },

  closeCreditReportPopup() {
    // 添加关闭动画延迟
    setTimeout(() => {
      this.setData({
        showCreditReportPopup: false
      });

      // 恢复背景滚动
      this.enableBackgroundScroll();

      // 确保选择结果同步到主表单
      this.updateCreditReportText();
    }, 100);
  },

  showPopupInfo() {
    wx.showModal({
      title: '提示',
      content: '可选择征信报告分析结果与融资需求关键词一并交给AI以获得更精准的融资建议；最多只能同时选择一份个人和（或）一份企业征信报告分析结果。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  clearSelectedCreditReport() {
    this.setData({
      selectedPersonalTask: null,
      selectedEnterpriseTask: null,
      'formData.creditReport': ''
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
        isSelected: false // 添加选中状态
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

      // 显示错误提示并提供重试选项
      wx.showModal({
        title: '加载失败',
        content: '获取征信报告数据失败，是否重试？',
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.initCreditReportData();
          }
        }
      });
    }
  },

  // 筛选和无限滚动数据
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
      let statusClass = this.getStatusClass(item.result);

      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }

      return {
        ...item,
        isSelected,
        isDisabled,
        statusClass
      };
    });

    this.setData({
      filteredCreditReportList: filtered,
      displayedCreditReportList: displayedWithSelection,
      hasMore: filtered.length > this.data.loadSize
    });
  },

  // 加载更多数据
  loadMoreData() {
    const { filteredCreditReportList, displayedCreditReportList, loadSize } = this.data;

    if (!this.data.hasMore) {
      return;
    }

    const currentLength = displayedCreditReportList.length;
    const nextData = filteredCreditReportList.slice(currentLength, currentLength + loadSize);

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
      let statusClass = this.getStatusClass(item.result);

      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }

      return {
        ...item,
        isSelected,
        isDisabled,
        statusClass
      };
    });

    this.setData({
      displayedCreditReportList: displayedCreditReportList.concat(newDataWithSelection),
      hasMore: currentLength + nextData.length < filteredCreditReportList.length
    });
  },

  // 滚动到顶部加载更多
  onScrollToUpper() {
    if (!this.data.isLoading) {
      this.loadMoreData();
    }
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

    // 筛选变化后重新计算定位（延迟执行，确保DOM更新完成）
    setTimeout(() => {
      this.calculateDropdownPosition();
    }, 100);
  },

  // 计算下拉菜单定位
  calculateDropdownPosition() {
    try {
      const query = wx.createSelectorQuery().in(this);

      // 获取搜索容器的位置和尺寸
      query.select('.search-container').boundingClientRect();

      query.exec((res) => {
        if (res[0]) {
          const searchContainer = res[0];
          const systemInfo = wx.getSystemInfoSync();

          // 计算下拉面板应该显示的位置
          // 下拉面板的 top 值 = 搜索容器的 bottom 位置
          const dropdownTop = searchContainer.bottom;

          // 转换为 rpx 单位（微信小程序的设计稿宽度为750rpx）
          const dropdownTopRpx = Math.round(dropdownTop * 750 / systemInfo.windowWidth);

          // 设置下拉面板的定位样式，确保无缝连接
          // 减去1rpx确保完全无缝连接
          const adjustedTopRpx = dropdownTopRpx - 1;
          const popupStyle = `position: fixed; top: ${adjustedTopRpx}rpx; left: 0; right: 0; width: 100%; z-index: 1000; margin: 0; padding: 0;`;

          this.setData({
            dropdownPopupStyle: popupStyle
          });

          console.log('下拉菜单定位计算:', {
            searchContainer: {
              top: searchContainer.top,
              bottom: searchContainer.bottom,
              height: searchContainer.height
            },
            dropdownTop,
            dropdownTopRpx,
            adjustedTopRpx,
            popupStyle,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight
          });
        }
      });
    } catch (error) {
      console.error('计算下拉菜单定位失败:', error);
      // 使用默认定位
      this.setData({
        dropdownPopupStyle: 'position: fixed; top: 200rpx; left: 0; right: 0; width: 100%; z-index: 1000;'
      });
    }
  },

  onResetSearch() {
    this.setData({
      'searchForm.customerName': '',
      'searchForm.taskResults': ''
    });
    this.filterAndPaginateData();
  },

  async onRefresh() {
    this.setData({
      refreshing: true
    });

    try {
      // 强制刷新数据
      const historyData = await historyService.getHistoryList(true);

      // 筛选征信报告相关的任务
      const creditReportTasks = historyData.filter(item =>
        item && item.type && (item.type.includes('个人征信') || item.type.includes('企业征信'))
      ).map(item => ({
        ...item,
        isSelected: false
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

      // 根据错误类型显示不同的提示
      const errorMessage = error.message || '刷新失败';
      if (errorMessage.includes('网络')) {
        wx.showModal({
          title: '网络错误',
          content: '网络连接异常，请检查网络后重试',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: '刷新失败，请重试',
          icon: 'none'
        });
      }
    }
  },



  // 任务选择相关方法
  onTaskSelect(e) {
    const item = e.currentTarget.dataset.item;
    const isSelected = e.detail;

    this.handleTaskSelection(item, isSelected);
  },

  handleTaskSelection(item, isSelected) {
    if (!item || !item.type) return;

    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });

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

    // 更新表单数据
    this.updateCreditReportText();

    // 更新列表中的选中状态
    this.updateListSelectionState();

    // 显示选择反馈
    if (isSelected) {
      wx.showToast({
        title: '已选择',
        icon: 'success',
        duration: 1000
      });
    }
  },

  updateCreditReportText() {
    let text = '';
    if (this.data.selectedPersonalTask && this.data.selectedEnterpriseTask) {
      text = '已选择个人和企业的征信报告分析结果';
    } else if (this.data.selectedPersonalTask) {
      text = `已选择"${this.data.selectedPersonalTask.customerName}"的"个人征信报告分析结果"`;
    } else if (this.data.selectedEnterpriseTask) {
      text = `已选择"${this.data.selectedEnterpriseTask.customerName}"的"企业征信报告分析结果"`;
    }

    this.setData({
      'formData.creditReport': text
    });
  },

  updateListSelectionState() {
    // 更新完整列表的选中状态
    const updatedCreditReportList = this.data.creditReportList.map(item => {
      let isSelected = false;

      if (item.type.includes('个人征信') && this.data.selectedPersonalTask) {
        isSelected = item.id === this.data.selectedPersonalTask.id;
      } else if (item.type.includes('企业征信') && this.data.selectedEnterpriseTask) {
        isSelected = item.id === this.data.selectedEnterpriseTask.id;
      }

      return { ...item, isSelected };
    });

    this.setData({
      creditReportList: updatedCreditReportList
    });

    // 重新筛选和分页
    this.filterAndPaginateData();
  },

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
    if (status.includes('失败') || status.includes('取消')) return 'status-tag-failed';
    return 'status-tag-default';
  },



  // 处理卡片点击（用于展开详情或其他交互）
  onTaskCardTap() {
    // 可以在这里添加卡片点击的逻辑，比如展开详情
    // 目前暂时不做处理，避免与复选框冲突
  },



  getStatusTagType(status) {
    if (!status) return 'default';
    if (status.includes('已出结果')) return 'success';
    if (status.includes('进行中')) return 'primary';
    if (status.includes('排队中')) return 'warning';
    if (status.includes('失败') || status.includes('取消')) return 'danger';
    return 'default';
  },

  // 操作方法
  onViewResult(e) {
    const item = e.currentTarget.dataset.item;
    // TODO: 实现查看征信报告结果功能
    console.log('查看征信报告结果:', item);
    wx.showToast({
      title: '查看结果功能待实现',
      icon: 'none'
    });
  },

  onCancelTask(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '取消任务',
      content: '取消后若再次发起可能要重新排队，是否确认？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '取消中...'
            });

            // 调用历史服务取消任务
            await historyService.cancelTask(item.id);

            wx.hideLoading();
            wx.showToast({
              title: '任务已取消',
              icon: 'success'
            });

            // 刷新数据
            this.initCreditReportData();
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '取消失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  onShowFailReason(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '失败原因',
      content: item.content || '未知原因',
      showCancel: false
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
  }
});