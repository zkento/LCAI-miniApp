Page({
  data: {
    // 当前步骤状态（1表示表单填写, 2表示AI分析征信报告, 3表示匹配金融产品, 4表示生成报告）
    activeStep: 1,
    
    // 表单数据
    formData: null,
    
    // 是否有征信报告
    hasCreditReport: false,
    
    // 匹配状态
    workingStatus: 'idle', // idle, working, thinking, generating, complete
    
    // 匹配计时器
    workingTimer: 1,
    
    // AI思考过程
    aiThinkingProcess: '',
    displayedThinkingProcess: '', // 用于逐字显示的思考过程
    isThinking: false, // AI是否正在思考
    
    // 报告内容
    reportContent: '',
    reportGenerationDuration: 0,
    
    // 咨询相关
    consultationMessages: [],
    consultationInput: '',
    consultationLoading: false,
    consultationThinkingTimer: 0,
    consultationResponseStatus: '',
    consultationResponseTime: 0,
    consultationThinkingProcesses: [], // 存储多个思考过程的数组
    
    // 分栏调整
    horizontalSplit: 60,
    verticalSplit: 50,
    
    // 初始匹配思考内容
    workThinkingContent: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto'
  },

  onLoad(options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '融资建议报告'
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
    
    // 如果是从表单页面跳转过来的，会带有参数
    if (options && options.fromForm) {
      // 设置为第2步或第3步（根据是否有征信报告）
      const app = getApp();
      if (app.globalData && app.globalData.financeFormData) {
        const formData = app.globalData.financeFormData;
        const hasCreditReport = !!(formData.creditReport && formData.creditReport.trim() !== '');
        
        this.setData({
          formData: formData,
          hasCreditReport: hasCreditReport,
          activeStep: hasCreditReport ? 2 : 3 // 有征信报告先分析征信，没有直接匹配产品
        });
        
        // 启动分析流程
        this.startAnalysis();
      } else {
        // 如果没有表单数据，回到第一步
        this.setData({ activeStep: 1 });
      }
    }
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

  // 开始分析流程
  startAnalysis() {
    if (this.data.hasCreditReport) {
      // 有征信报告，先分析征信报告（步骤2）
      this.setData({ activeStep: 2 });
      
      // 模拟征信报告分析过程
      setTimeout(() => {
        this.nextStep(); // 进入步骤3：匹配金融产品
      }, 2000);
    } else {
      // 没有征信报告，直接匹配金融产品（步骤3）
      this.setData({ activeStep: 3 });
      this.startAiWorking();
    }
  },

  // 开始AI工作
  startAiWorking() {
    this.setData({
      workingStatus: 'working'
    });
    
    this.startWorkingTimer();
    
    // 模拟等待AI响应时间3秒，之后进入AI思考分析步骤
    setTimeout(() => {
      this.nextStep();
    }, 3000);
  },

  // 开始匹配计时器
  startWorkingTimer() {
    this.setData({ workingTimer: 1 });
    this.workingTimerInterval = setInterval(() => {
      this.setData({
        workingTimer: this.data.workingTimer + 1
      });
    }, 1000);
  },

  // 停止匹配计时器
  stopWorkingTimer() {
    if (this.workingTimerInterval) {
      clearInterval(this.workingTimerInterval);
      this.workingTimerInterval = null;
    }
  },

  // 进入下一步
  nextStep() {
    const currentStep = this.data.activeStep;
    const hasCreditReport = this.data.hasCreditReport;
    
    if (hasCreditReport) {
      // 有征信报告的流程：1 -> 2 -> 3 -> 4
      if (currentStep < 4) {
        this.setData({ activeStep: currentStep + 1 });
        
        if (currentStep + 1 === 3) {
          // 进入匹配金融产品步骤
          this.startAiWorking();
        } else if (currentStep + 1 === 4) {
          // 进入生成报告步骤
          this.startThinkingProcess();
        }
      }
    } else {
      // 没有征信报告的流程：1 -> 3 -> 4（跳过步骤2）
      if (currentStep === 3) {
        this.setData({ activeStep: 4 });
        this.startThinkingProcess();
      }
    }
  },

  // 开始思考过程
  startThinkingProcess() {
    this.setData({
      workingStatus: 'thinking',
      isThinking: true
    });

    // 模拟AI思考过程
    const fullThinkingProcess = `正在分析客户融资需求...

思考过程：
根据客户提供的信息，这是一个餐饮企业的经营性融资需求。让我详细分析一下：

1. 客户基本情况：
- 企业类型：餐饮企业
- 经营年限：5年（相对稳定）
- 经营规模：3家连锁店
- 月营业额：约80万元（年营业额约960万元）

2. 融资需求分析：
- 融资金额：300万元
- 融资用途：新开2家分店（扩张性投资）
- 期限要求：2年以上
- 放款时间：1个月内
- 利率承受能力：月息最高5厘（年化约6%）

3. 抵押物情况：
- 有广州市值约500万元的商品房
- 目前无贷款（抵押率可达70%左右）
- 约50万元应收账款

4. 融资方案建议：
基于以上分析，我推荐以下几种融资方案...

好了，思考过程模拟完成。`;

    // 开始逐字显示思考过程
    this.setData({
      aiThinkingProcess: fullThinkingProcess,
      displayedThinkingProcess: ''
    });
    
    let thinkingIndex = 0;
    const startTime = Date.now();
    
    const thinkingInterval = setInterval(() => {
      if (thinkingIndex < fullThinkingProcess.length) {
        const nextChar = fullThinkingProcess[thinkingIndex];
        this.setData({
          displayedThinkingProcess: this.data.displayedThinkingProcess + nextChar
        });
        thinkingIndex++;
      } else {
        // 思考过程显示完成
        clearInterval(thinkingInterval);
        this.completeThinking();
      }
    }, 30);
  },

  // 完成思考过程
  completeThinking() {
    this.setData({
      workThinkingContent: this.data.aiThinkingProcess,
      isThinking: false,
      workingStatus: 'generating'
    });
    
    // 延迟3秒后生成报告
    setTimeout(() => {
      this.generateReport();
    }, 3000);
  },

  // 生成报告
  generateReport() {
    const currentDate = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-');
    
    const reportContent = `# 融资顾问报告

编制日期：${currentDate}

## 一、客户基本信息

**客户姓名**：${this.data.formData.name || '客户'}
**企业类型**：餐饮企业
**经营年限**：5年
**经营规模**：3家连锁店
**月营业额**：约80万元

## 二、融资需求分析

### 融资基本信息
- **融资金额**：300万元
- **融资用途**：新开2家分店（扩张性投资）
- **期限要求**：2年以上
- **放款时间**：1个月内
- **利率承受能力**：月息最高5厘（年化约6%）

### 抵押物情况
- **房产抵押**：广州市值约500万元商品房
- **贷款状态**：目前无贷款
- **应收账款**：约50万元

## 三、融资方案推荐

### 方案一：银行经营性房产抵押贷款（推荐）

**产品特点**：
- 利率相对较低（年化4.5%-6%）
- 额度充足（最高可达房产评估值的70%）
- 期限灵活（最长可达10年）

**申请条件**：
- 企业经营满2年
- 有稳定的经营流水
- 房产权属清晰

**预期额度**：300-350万元
**预期利率**：年化5.5%-6%
**放款时间**：15-30天

### 方案二：融资担保公司过桥融资

**产品特点**：
- 放款速度快（3-7天）
- 手续相对简单
- 利率较高但可短期使用

**预期额度**：200-300万元
**预期利率**：年化8%-12%
**适用场景**：急需资金周转

### 方案三：供应链金融

**产品特点**：
- 基于应收账款融资
- 无需房产抵押
- 期限较短

**预期额度**：30-40万元
**预期利率**：年化7%-10%
**适用场景**：补充流动资金

## 四、申请建议

### 优先推荐方案
建议优先申请**银行经营性房产抵押贷款**，理由如下：
1. 利率成本相对较低，符合客户承受能力
2. 额度充足，能满足300万元的融资需求
3. 期限灵活，有利于企业长期发展规划

### 申请准备材料
1. 企业营业执照、税务登记证
2. 近3年财务报表和银行流水
3. 房产证、土地证等权属证明
4. 企业经营场所租赁合同
5. 个人身份证、户口本、婚姻证明

### 申请流程优化建议
1. 提前准备完整材料，提高审批效率
2. 选择与企业有业务往来的银行优先申请
3. 可同时向2-3家银行递交申请，提高成功率

## 五、风险提示

1. **利率风险**：注意浮动利率可能带来的成本上升
2. **还款压力**：合理评估新店盈利能力，确保按时还款
3. **抵押风险**：房产抵押后流动性降低，需谨慎考虑

## 六、后续服务

如需进一步咨询或协助申请，请随时联系我们的专业团队。我们将为您提供全程跟踪服务，确保融资方案顺利实施。`;
    
    this.setData({
      reportContent: reportContent,
      workingStatus: 'complete',
      reportGenerationDuration: this.data.workingTimer
    });
    
    this.stopWorkingTimer();
    
    // 添加初始系统消息到咨询消息列表
    this.setData({
      consultationMessages: [{
        role: 'assistant',
        content: '我是良策AI助手，本次客户的融资建议报告已生成。您可以继续向我咨询以获取更多建议。'
      }]
    });
  },

  // 下载报告
  downloadReport() {
    // 小程序中可以将内容保存到相册或分享
    wx.showActionSheet({
      itemList: ['保存到相册', '分享给好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 保存到相册的逻辑
          wx.showToast({
            title: '保存功能开发中',
            icon: 'none'
          });
        } else if (res.tapIndex === 1) {
          // 分享给好友的逻辑
          wx.showShareMenu({
            withShareTicket: true
          });
        }
      }
    });
  },

  // 重新开始顾问流程
  restartAdvisor() {
    wx.showModal({
      title: '操作提示',
      content: '确定要开始新的融资顾问流程吗？',
      success: (res) => {
        if (res.confirm) {
          // 重置所有状态
          this.setData({
            activeStep: 1,
            formData: {},
            reportContent: '',
            workingStatus: 'idle',
            aiThinkingProcess: '',
            displayedThinkingProcess: '',
            consultationMessages: [],
            consultationInput: ''
          });
          
          // 停止所有计时器
          this.stopWorkingTimer();
          
          // 跳转回表单页面
          wx.redirectTo({
            url: '/pages/finance-advice/financeAdvisorForm'
          });
        }
      }
    });
  },

  // 发送咨询消息
  sendConsultationMessage() {
    if (!this.data.consultationInput.trim() || this.data.consultationLoading) return;
    
    const userMessage = {
      role: 'user',
      content: this.data.consultationInput.trim()
    };
    
    this.setData({
      consultationMessages: [...this.data.consultationMessages, userMessage],
      consultationInput: '',
      consultationLoading: true
    });
    
    // 启动思考状态显示
    this.startConsultationThinking();
    
    // 模拟AI回复
    setTimeout(() => {
      const aiReply = {
        role: 'assistant',
        content: '感谢您的咨询。基于您的问题，我建议您可以考虑以下几个方面...'
      };
      
      this.setData({
        consultationMessages: [...this.data.consultationMessages, aiReply],
        consultationLoading: false
      });
      
      this.stopConsultationThinking('success');
    }, 3000);
  },

  // 开始咨询思考状态计时
  startConsultationThinking() {
    this.setData({
      consultationThinkingTimer: 0,
      consultationResponseStatus: '',
      consultationResponseTime: 0
    });
    
    this.consultationThinkingInterval = setInterval(() => {
      this.setData({
        consultationThinkingTimer: this.data.consultationThinkingTimer + 1
      });
    }, 1000);
  },

  // 停止咨询思考状态计时
  stopConsultationThinking(status = 'success', error = '') {
    if (this.consultationThinkingInterval) {
      clearInterval(this.consultationThinkingInterval);
      this.consultationThinkingInterval = null;
      
      this.setData({
        consultationResponseTime: this.data.consultationThinkingTimer,
        consultationThinkingTimer: 0
      });
      
      if (status === 'success') {
        this.setData({
          consultationResponseStatus: 'AI已回复'
        });
      } else {
        this.setData({
          consultationResponseStatus: error || '请求失败'
        });
      }
    }
  },

  // 咨询输入处理
  onConsultationInput(e) {
    this.setData({
      consultationInput: e.detail.value
    });
  },

  onUnload() {
    // 清理计时器
    this.stopWorkingTimer();
    if (this.consultationThinkingInterval) {
      clearInterval(this.consultationThinkingInterval);
    }
  }
}); 