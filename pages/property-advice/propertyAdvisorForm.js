Page({
  data: {
    // 表单数据
    formData: {
      requirements: '',  // 需求描述
      customerName: ''   // 客户姓名
    },
    
    // 分析状态
    isAnalyzing: false,
    hasAnalysisResult: false,
    analysisTime: 0,
    analysisStartTime: 0,
    currentAnalysisTime: 0,
    submitting: false,
    
    // 分析结果
    editableResults: {},
    isEditing: {},
    showEditIcon: {},
    
    // 需求指南
    requirementGuide: [
      {
        title: '1. 预算资金',
        items: [
          { label: '总价预算', example: '800-1000万' },
          { label: '首付资金', example: '300万' },
          { label: '月供预算', example: '2-3万/月' }
        ]
      },
      {
        title: '2. 区域位置',
        items: [
          { label: '意向区域', example: '天河区、海珠区' },
          { label: '具体地段', example: '珠江新城、琶洲' },
          { label: '地铁要求', example: '500米内地铁站' }
        ]
      },
      {
        title: '3. 房屋基本',
        items: [
          { label: '户型需求', example: '3房2卫' },
          { label: '面积需求', example: '85-100㎡建面' },
          { label: '楼层偏好', example: '15层以上' },
          { label: '朝向要求', example: '南向或东南向' }
        ]
      },
      {
        title: '4. 房屋品质',
        items: [
          { label: '楼龄要求', example: '10年内' },
          { label: '装修标准', example: '精装修' },
          { label: '小区品质', example: '品牌开发商' },
          { label: '物业管理', example: '专业物业' }
        ]
      },
      {
        title: '5. 金融服务',
        items: [
          { label: '按揭贷款', example: '需要/不需要' },
          { label: '购房后融资', example: '是/否需要抵押融资' }
        ]
      },
      {
        title: '6. 配套要求',
        items: [
          { label: '教育配套', example: '省级学位' },
          { label: '交通配套', example: '地铁直达市区' },
          { label: '商业配套', example: '大型商场' },
          { label: '医疗配套', example: '三甲医院' }
        ]
      },
      {
        title: '7. 购房目的',
        items: [
          { label: '使用目的', example: '自住、投资、改善' },
          { label: '入住时间', example: '即买即住' },
          { label: '特殊需求', example: '子女教育' }
        ]
      },
      {
        title: '8. 限制条件',
        items: [
          { label: '规避因素', example: '高架、加油站' },
          { label: '楼盘限制', example: '不考虑回迁房' },
          { label: '其他要求', example: '有车位配售' }
        ]
      }
    ],
    
    // 提取任务控制
    analysisTaskId: 0,
    lastAnalyzedText: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto'
  },

  onLoad(options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '房产顾问'
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
    
    // 初始化分析结果结构
    this.initEditableResults();
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

  // 初始化分析结果结构
  initEditableResults() {
    const results = {};
    const editing = {};
    const showIcon = {};
    
    this.data.requirementGuide.forEach(group => {
      results[group.title] = {};
      group.items.forEach(item => {
        results[group.title][item.label] = '无此信息，建议补充';
        editing[group.title + item.label] = false;
        showIcon[group.title + item.label] = false;
      });
    });
    
    this.setData({
      editableResults: results,
      isEditing: editing,
      showEditIcon: showIcon
    });
  },

  // 需求描述输入处理
  onRequirementsInput(e) {
    this.setData({
      'formData.requirements': e.detail.value
    });
    
    // 当用户输入时，判断是否需要重置分析状态
    if (this.data.hasAnalysisResult) {
      const trimmedText = e.detail.value.trim();
      if (trimmedText !== this.data.lastAnalyzedText) {
        this.resetAnalysisState();
      }
    }
  },

  // 客户姓名输入处理
  onCustomerNameInput(e) {
    this.setData({
      'formData.customerName': e.detail.value
    });
  },

  // 重置分析相关状态
  resetAnalysisState() {
    // 停止任何进行中的分析任务
    this.setData({
      analysisTaskId: this.data.analysisTaskId + 1
    });
    
    // 清除分析结果
    this.setData({
      hasAnalysisResult: false,
      lastAnalyzedText: '',
      isAnalyzing: false,
      submitting: false
    });
    
    // 重置分析结果
    this.initEditableResults();
    
    // 重置计时器
    this.resetAnalysisTimer();
  },

  // 开始计时
  startAnalysisTimer() {
    this.resetAnalysisTimer();
    
    const startTime = Date.now();
    this.setData({
      analysisStartTime: startTime,
      currentAnalysisTime: 0
    });
    
    this.analysisTimerInterval = setInterval(() => {
      if (this.data.analysisStartTime > 0) {
        const currentTime = Math.round((Date.now() - this.data.analysisStartTime) / 1000);
        this.setData({
          currentAnalysisTime: currentTime
        });
      }
    }, 1000);
  },

  // 停止计时
  stopAnalysisTimer() {
    if (this.analysisTimerInterval) {
      clearInterval(this.analysisTimerInterval);
      this.analysisTimerInterval = null;
    }
    
    if (this.data.analysisStartTime > 0) {
      const duration = Math.round((Date.now() - this.data.analysisStartTime) / 1000);
      this.setData({
        analysisTime: duration
      });
    }
  },

  // 重置计时器
  resetAnalysisTimer() {
    if (this.analysisTimerInterval) {
      clearInterval(this.analysisTimerInterval);
      this.analysisTimerInterval = null;
    }
    this.setData({
      analysisTime: 0,
      analysisStartTime: 0,
      currentAnalysisTime: 0
    });
  },

  // 分析需求
  analyzeRequirements() {
    if (!this.data.formData.requirements || this.data.formData.requirements.trim() === '') {
      wx.showToast({
        title: '请输入需求描述',
        icon: 'none'
      });
      return;
    }

    const trimmedText = this.data.formData.requirements.trim();
    if (trimmedText.length < 30) {
      wx.showToast({
        title: '需求描述不得少于30个字',
        icon: 'none'
      });
      return;
    }

    if (this.data.isAnalyzing) {
      return;
    }

    // 重置状态
    this.setData({
      isAnalyzing: true
    });
    
    // 生成本次任务ID
    const currentTaskId = this.data.analysisTaskId + 1;
    this.setData({
      analysisTaskId: currentTaskId
    });
    
    // 启动计时器
    this.startAnalysisTimer();

    // 模拟API调用
    setTimeout(() => {
      // 检查任务是否已被新任务取代
      if (currentTaskId !== this.data.analysisTaskId) {
        console.log('任务已过期，丢弃结果');
        return;
      }
      
      this.setData({
        hasAnalysisResult: true,
        lastAnalyzedText: trimmedText
      });
      
      // 模拟分析结果
      const mockResults = {
        '1. 预算资金': {
          '总价预算': '800-1000万',
          '首付资金': '300万',
          '月供预算': '2-3万/月'
        },
        '2. 区域位置': {
          '意向区域': '天河区、海珠区',
          '具体地段': '珠江新城、琶洲',
          '地铁要求': '500米内地铁站'
        },
        '3. 房屋基本': {
          '户型需求': '3房2卫',
          '面积需求': '85-100㎡建面',
          '楼层偏好': '15层以上',
          '朝向要求': '南向或东南向'
        },
        '4. 房屋品质': {
          '楼龄要求': '10年内',
          '装修标准': '精装修',
          '小区品质': '品牌开发商',
          '物业管理': '专业物业'
        },
        '5. 金融服务': {
          '按揭贷款': '需要',
          '购房后融资': '否'
        },
        '6. 配套要求': {
          '教育配套': '省级学位',
          '交通配套': '地铁直达市区',
          '商业配套': '大型商场',
          '医疗配套': '无此信息，建议补充'
        },
        '7. 购房目的': {
          '使用目的': '自住、子女教育',
          '入住时间': '即买即住',
          '特殊需求': '子女教育'
        },
        '8. 限制条件': {
          '规避因素': '高架、加油站',
          '楼盘限制': '不考虑回迁房',
          '其他要求': '有车位配售'
        }
      };
      
      this.setData({
        editableResults: mockResults,
        isAnalyzing: false
      });
      
      this.stopAnalysisTimer();
    }, 4000);
  },

  // 开始编辑字段
  startEditing(groupTitle, itemLabel) {
    if (this.data.isAnalyzing) return;
    
    const key = groupTitle + itemLabel;
    this.setData({
      [`isEditing.${key}`]: true
    });
    
    // 延迟聚焦到输入框
    setTimeout(() => {
      // 小程序中无法直接聚焦到动态创建的输入框
      // 这里可以考虑使用其他交互方式
    }, 100);
  },

  // 完成编辑
  finishEditing(groupTitle, itemLabel) {
    const key = groupTitle + itemLabel;
    this.setData({
      [`isEditing.${key}`]: false
    });
  },

  // 处理字段输入变化
  onFieldInput(e) {
    const { group, item } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`editableResults.${group}.${item}`]: value
    });
  },

  // 处理按揭贷款选择
  onMortgageChange(e) {
    const value = e.detail.value;
    this.setData({
      [`editableResults.5. 金融服务.按揭贷款`]: value
    });
    
    // 如果选择"需要"按揭贷款，自动设置购房后融资为"-"
    if (value === '需要') {
      this.setData({
        [`editableResults.5. 金融服务.购房后融资`]: '-'
      });
    }
  },

  // 处理购房后融资选择
  onFinancingChange(e) {
    const value = e.detail.value;
    this.setData({
      [`editableResults.5. 金融服务.购房后融资`]: value
    });
  },

  // 提交表单
  startMatchingHouses() {
    if (this.data.submitting || this.data.isAnalyzing) {
      return;
    }
    
    // 验证表单
    if (!this.data.formData.customerName || this.data.formData.customerName.trim() === '') {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      submitting: true
    });
    
    // 构建提交的数据
    const submitData = {
      ...this.data.formData,
      analysisResults: this.data.editableResults
    };
    
    // 保存到全局数据
    const app = getApp();
    app.globalData = app.globalData || {};
    app.globalData.propertyFormData = submitData;
    
    // 跳转到报告页面
    wx.navigateTo({
      url: '/pages/property-advice/propertyAdvisorReport?fromForm=true',
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

  // 重置表单
  resetForm() {
    if (this.data.isAnalyzing) {
      wx.showModal({
        title: '提示',
        content: '正在进行需求分析，确认要中止此操作吗？',
        success: (res) => {
          if (res.confirm) {
            this.resetAnalysisState();
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
        customerName: ''
      }
    });
    
    // 重置分析相关状态
    this.resetAnalysisState();
  },

  // 复制示例文本
  copyExampleText() {
    const exampleText = '预算总价800-1000万，首付3成（约240万），需按揭贷款。意向天河区珠江新城或海珠区琶洲地铁沿线，重点考察3房2卫户型。购房目的为自住及子女教育，需带省级学位。\n建面85-100㎡，优先中高楼层（15层以上），要求南向或东南向采光，接受10年内楼龄的房子。装修需精装以上标准，可接受局部翻新。\n必须满足地铁500米内（3/5/18号线），步行15分钟内有大型商场。医疗配套不作硬性要求，但需规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域。';
    
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

  // 获取项目样式类
  getItemClass(groupTitle, itemLabel) {
    const value = this.data.editableResults[groupTitle] && this.data.editableResults[groupTitle][itemLabel];
    
    if (!value || value === '无此信息，建议补充') {
      return 'item-missing';
    }
    
    if (value === '-') {
      return 'item-na';
    }
    
    return 'item-found';
  },

  onUnload() {
    // 清理计时器
    this.resetAnalysisTimer();
  }
}); 