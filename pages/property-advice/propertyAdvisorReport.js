Page({
  data: {
    // 当前步骤状态（1表示表单填写, 2表示AI思考分析, 3表示生成报告）
    activeStep: 1,
    
    // 表单数据
    formData: null,
    
    // 工作状态
    workingStatus: 'idle', // idle, working, thinking, generating, complete
    
    // 工作计时器
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
    verticalSplit: 50,
    
    // 初始工作思考内容
    workThinkingContent: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: 'auto'
  },

  onLoad(options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '购房建议报告'
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
      // 设置为第2步（AI思考分析）
      const app = getApp();
      if (app.globalData && app.globalData.propertyFormData) {
        const formData = app.globalData.propertyFormData;
        
        this.setData({
          formData: formData,
          activeStep: 2
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
    // 直接进入AI思考分析（步骤2）
    this.setData({ activeStep: 2 });
    this.startAiWorking();
  },

  // 开始AI工作
  startAiWorking() {
    this.setData({
      workingStatus: 'working'
    });
    
    this.startWorkingTimer();
    
    // 模拟等待AI响应时间4秒，之后进入AI思考分析步骤
    setTimeout(() => {
      this.nextStep();
    }, 4000);
  },

  // 开始工作计时器
  startWorkingTimer() {
    this.setData({ workingTimer: 1 });
    this.workingTimerInterval = setInterval(() => {
      this.setData({
        workingTimer: this.data.workingTimer + 1
      });
    }, 1000);
  },

  // 停止工作计时器
  stopWorkingTimer() {
    if (this.workingTimerInterval) {
      clearInterval(this.workingTimerInterval);
      this.workingTimerInterval = null;
    }
  },

  // 进入下一步
  nextStep() {
    const currentStep = this.data.activeStep;
    
    if (currentStep === 2) {
      this.setData({ activeStep: 3 });
      this.startThinkingProcess();
    }
  },

  // 开始思考过程
  startThinkingProcess() {
    this.setData({
      workingStatus: 'thinking',
      isThinking: true
    });

    // 模拟AI思考过程
    const fullThinkingProcess = `正在分析客户购房需求...

思考过程：
根据客户提供的购房需求信息，我需要进行全面的分析：

1. 客户预算分析：
- 总价预算：800-1000万（属于高端购房需求）
- 首付资金：300万（充足的首付能力）
- 月供预算：2-3万/月（收入水平较高）

2. 区域选择分析：
- 意向区域：天河区、海珠区（广州核心商务区）
- 具体地段：珠江新城、琶洲（CBD和新兴商务区）
- 交通便利性：地铁500米内（对交通要求较高）

3. 房屋需求分析：
- 户型：3房2卫（改善性住房需求）
- 面积：85-100㎡（合理的面积需求）
- 楼层和朝向：15层以上，南向或东南向（注重居住品质）

4. 品质要求分析：
- 楼龄：10年内（相对较新的房源）
- 装修：精装修（减少装修成本和时间）
- 开发商：品牌开发商（注重品质保障）

5. 配套需求分析：
- 教育：省级学位（为子女教育考虑）
- 交通：地铁直达市区（工作便利）
- 商业：大型商场（生活便利）

基于以上分析，我将推荐符合条件的优质房源...`;

    // 开始逐字显示思考过程
    this.setData({
      aiThinkingProcess: fullThinkingProcess,
      displayedThinkingProcess: ''
    });
    
    let thinkingIndex = 0;
    
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
    
    const reportContent = `# 购房建议报告

编制日期：${currentDate}

## 一、客户需求概述

**客户姓名**：${this.data.formData.customerName || '客户'}
**预算范围**：800-1000万元
**首付资金**：300万元
**月供预算**：2-3万元/月

## 二、区域选择建议

### 优先推荐区域
1. **天河区珠江新城**
   - 位置优势：广州金融商务中心，配套成熟
   - 交通便利：地铁3号线、5号线交汇
   - 教育资源：华阳小学、天河中学等优质学校
   - 商业配套：太古汇、天环广场等高端商场

2. **海珠区琶洲**
   - 发展潜力：琶洲人工智能与数字经济试验区
   - 交通规划：地铁8号线、18号线
   - 居住环境：临江景观，生态环境优越
   - 投资价值：未来增值潜力较大

## 三、房源推荐标准

### 基本要求
- **户型**：3房2卫，建筑面积85-100㎡
- **楼层**：15层以上，视野开阔
- **朝向**：南向或东南向，采光充足
- **楼龄**：10年以内，房屋条件较新

### 品质要求
- **装修标准**：精装修，可拎包入住
- **开发商**：知名品牌开发商
- **物业管理**：专业物业公司
- **小区环境**：绿化率高，安保完善

## 四、配套设施评估

### 教育配套（重要）
- 省级学位房：确保子女教育需求
- 学校距离：步行15分钟内到达
- 教育质量：重点小学、中学学区

### 交通配套（重要）
- 地铁距离：500米内
- 线路选择：3号线、5号线、18号线优先
- 出行便利：直达市区主要商务区

### 商业配套
- 购物中心：步行15分钟内大型商场
- 生活配套：超市、餐饮、银行等
- 娱乐设施：电影院、健身房等

### 医疗配套
- 医院等级：三甲医院优先
- 距离要求：车程20分钟内
- 医疗服务：综合医疗服务完善

## 五、金融方案建议

### 按揭贷款方案
- **贷款额度**：500-700万元
- **贷款期限**：20-30年
- **还款方式**：等额本息
- **预期利率**：4.2%-4.6%（参考当前市场）

### 购房成本预估
- **首付款**：300万元（30%）
- **月供金额**：2.6-3.7万元
- **税费成本**：约30-50万元
- **装修成本**：如需重新装修约50-100万元

## 六、风险提示与建议

### 市场风险
1. **政策风险**：关注房地产调控政策变化
2. **价格风险**：房价波动可能影响投资收益
3. **流动性风险**：高端物业变现周期较长

### 购房建议
1. **实地考察**：建议实地查看至少5-8个项目
2. **价格比较**：同区域同品质房源价格对比
3. **时机选择**：关注市场时机，择机入市
4. **专业咨询**：委托专业中介或顾问协助

## 七、推荐楼盘清单

### 天河区珠江新城
1. **汇景新城**
   - 均价：约8-10万/㎡
   - 特色：成熟社区，配套完善
   - 推荐理由：地铁便利，学位房

2. **珠江新城花园**
   - 均价：约9-11万/㎡
   - 特色：高端社区，品质优良
   - 推荐理由：景观资源好，物业优质

### 海珠区琶洲
1. **保利天悦**
   - 均价：约6-8万/㎡
   - 特色：江景房源，发展潜力大
   - 推荐理由：价格相对合理，升值空间

2. **琶洲新苑**
   - 均价：约7-9万/㎡
   - 特色：交通便利，商业配套好
   - 推荐理由：地铁直达，配套成熟

## 八、后续服务

我们将为您提供：
1. **房源推荐**：根据需求精准匹配房源
2. **实地陪看**：专业顾问陪同看房
3. **价格谈判**：协助价格谈判和合同审核
4. **贷款办理**：协助办理按揭贷款手续
5. **过户服务**：全程协助过户手续办理

如需进一步咨询或预约看房，请随时联系我们的专业团队。`;
    
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
        content: '我是良策AI助手，本次客户的购房建议报告已生成。您可以继续向我咨询以获取更多建议。'
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
      content: '确定要开始新的购房顾问流程吗？',
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
            url: '/pages/property-advice/propertyAdvisorForm'
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
        content: '感谢您的咨询。基于您的问题，我建议您可以考虑以下几个方面：1. 实地考察推荐楼盘 2. 了解最新市场价格 3. 确认学位房政策。需要更详细的建议吗？'
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