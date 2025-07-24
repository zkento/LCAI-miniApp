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
    
    // 关键词和错误信息
    aiKeywords: [],
    extractError: '',
    
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
    
    // 征信报告历史相关
    showCreditHistory: false,
    selectedPersonalTask: null,
    selectedEnterpriseTask: null,
    
    // 征信报告历史列表数据
    historyList: [],
    searchForm: {
      customerName: '',
      taskResults: '已出结果'
    },
    tableDataLoading: false,
    currentPage: 1,
    pageSize: 20,
    
    // 提取任务控制
    extractionTaskId: 0,
    lastExtractedText: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto'
  },

  onLoad(options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '融资顾问'
    });
    
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight
        });
      }
    });
    
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
  fetchHistoryList() {
    // 模拟获取历史任务数据
    // 在实际应用中，这里会调用API获取数据
    this.setData({
      historyList: []
    });
  },

  // 需求描述输入处理
  onRequirementsInput(e) {
    this.setData({
      'formData.requirements': e.detail.value
    });
    
    // 当用户输入时，判断是否需要重置关键词状态
    if (this.data.hasAttemptedExtraction) {
      const trimmedText = e.detail.value.trim();
      if (trimmedText !== this.data.lastExtractedText) {
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
      currentAnalysisTime: 0
    });
    
    this.extractionTimerInterval = setInterval(() => {
      if (this.data.extractionStartTime > 0) {
        const currentTime = Math.round((Date.now() - this.data.extractionStartTime) / 1000);
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
      const duration = Math.round((Date.now() - this.data.extractionStartTime) / 1000);
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
      currentAnalysisTime: 0
    });
  },

  // 提取关键词
  extractKeywords() {
    if (!this.data.formData.requirements || this.data.formData.requirements.trim() === '') {
      this.setData({
        extractError: '请输入贷款需求描述再提取关键词'
      });
      return;
    }

    const trimmedText = this.data.formData.requirements.trim();
    if (trimmedText.length < 10) {
      this.setData({
        extractError: '需求描述的文字不应该少于10个字'
      });
      return;
    }

    if (this.data.isExtractingKeywords) {
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
    }, 3000);
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
      return;
    }
    
    if (!this.data.formData.businessArea || this.data.formData.businessArea.length === 0) {
      wx.showToast({
        title: '请选择业务城市',
        icon: 'none'
      });
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
      fail: () => {
        this.setData({ submitting: false });
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
        creditReport: ''
      }
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
      data: exampleText,
      success: () => {
        wx.showToast({
          title: '示例文本已复制',
          icon: 'success'
        });
      }
    });
  },

  // 征信报告选择相关方法
  toggleCreditReportHistory() {
    if (this.data.isExtractingKeywords) return;
    
    this.setData({
      showCreditHistory: !this.data.showCreditHistory
    });
  },

  backToRequirementSuggestion() {
    this.setData({
      showCreditHistory: false
    });
  },

  clearSelectedCreditReport() {
    this.setData({
      selectedPersonalTask: null,
      selectedEnterpriseTask: null,
      'formData.creditReport': ''
    });
  },

  onUnload() {
    // 清理计时器
    this.resetExtractionTimer();
  }
}); 