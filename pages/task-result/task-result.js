// pages/task-result/task-result.js

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面状态
    loading: true,
    loadError: '',
    
    // 任务信息
    taskId: '',
    taskType: '',
    taskResult: null,
    
    // Tab相关
    activeTab: 0,
    tabList: [
      { key: 'report', title: 'AI结果报告' },
      { key: 'thinking', title: 'AI思考过程' },
      { key: 'consultation', title: '继续向AI咨询' }
    ],
    
    // 报告内容
    reportContent: '',
    reportGenerationDuration: 0,
    
    // AI思考过程
    aiThinkingProcess: '',
    
    // 咨询相关
    consultationMessages: [],
    consultationInput: '',
    consultationLoading: false,
    consultationThinkingProcesses: [],

    // 滚动相关
    messagesScrollTop: 0,
    scrollIntoView: '',
    navHeight: 0, // 导航栏高度，用于设置Tab吸顶偏移量

    // 系统状态
    systemInfo: null,
    forceUpdate: 0, // 用于强制更新页面
    hideShareButton: false // 控制分享按钮的显示
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('TaskResult页面加载，参数:', options);
    
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        // 计算导航栏高度 = 状态栏高度 + 导航栏固定高度(44px)
        const navHeight = res.statusBarHeight + 44;
        
        this.setData({
          systemInfo: res,
          navHeight: navHeight
        });
        
        console.log('系统信息:', res);
        console.log('导航栏高度:', navHeight);
      }
    });
    
    // 获取URL参数
    const { id, type, hideShareButton } = options;
    
    if (!id || !type) {
      this.setData({
        loading: false,
        loadError: '缺少必要参数，请从历史记录页面重新进入'
      });
      return;
    }
    
    this.setData({
      taskId: id,
      taskType: decodeURIComponent(type),
      // 根据hideShareButton参数决定是否显示分享按钮
      hideShareButton: hideShareButton === 'true'
    });
    
    // 加载任务结果
    this.loadTaskResult();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (this.data.taskId) {
      this.loadTaskResult();
    }
  },

  /**
   * 生命周期函数--监听页面渲染完成
   */
  onReady() {
    // 页面渲染完成后，检查报告内容是否正确显示
    if (this.data.reportContent) {
      console.log('页面渲染完成，报告内容长度:', this.data.reportContent.length);
      
      // 延迟一会儿再次检查，确保渲染完成
      setTimeout(() => {
        this.checkAndForceUpdate();
        
        // 调试样式应用情况
        console.log('检查样式应用情况...');
        const query = wx.createSelectorQuery();
        query.select('.thinking-text').fields({
          computedStyle: ['fontSize', 'color', 'lineHeight', 'whiteSpace', 'width', 'display']
        }, function(res) {
          console.log('thinking-text 样式:', res);
        }).exec();
        
        query.select('.report-text').fields({
          computedStyle: ['fontSize', 'color', 'lineHeight', 'whiteSpace', 'width', 'display']
        }, function(res) {
          console.log('report-text 样式:', res);
        }).exec();
      }, 1000);
    }
  },

  /**
   * 检查并强制更新页面
   */
  checkAndForceUpdate() {
    const { reportContent } = this.data;
    if (reportContent) {
      console.log('强制更新页面，确保内容显示');
      this.setData({ 
        forceUpdate: Date.now() 
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadTaskResult().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * Tab切换事件
   */
  onTabChange(event) {
    const index = event.detail.index;
    this.setData({
      activeTab: index
    });
    console.log('切换到Tab:', index);
  },

  /**
   * 加载任务结果数据
   */
  async loadTaskResult() {
    const { taskId, taskType } = this.data;
    
    if (!taskId || !taskType) {
      this.setData({
        loading: false,
        loadError: '参数错误'
      });
      return;
    }

    this.setData({ loading: true, loadError: '' });

    try {
      // 模拟API请求获取任务结果
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成模拟任务结果数据
      const taskResult = this.generateMockTaskResult(taskId, taskType);
      
      this.setData({
        taskResult,
        loading: false
      });

      // 生成报告内容
      this.generateReportContent();

      // 调试：检查报告内容是否生成
      console.log('报告内容生成完成:', this.data.reportContent ? '有内容' : '无内容');

      // 初始化AI思考过程
      this.initAiThinkingProcess();
      
      // 初始化咨询消息
      this.initConsultationMessages();
      
      // 加载历史咨询记录
      this.loadConsultationHistory();

    } catch (error) {
      console.error('加载任务结果失败:', error);
      this.setData({
        loading: false,
        loadError: '加载失败，请稍后重试'
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 生成模拟任务结果数据
   */
  generateMockTaskResult(taskId, taskType) {
    const now = new Date();
    const submitTime = new Date(now.getTime() - 3600000); // 1小时前
    const actualStartTime = new Date(now.getTime() - 3540000); // 59分钟前
    const endTime = new Date(now.getTime() - 60000); // 1分钟前
    
    // 计算处理时长
    const processingDuration = Math.floor((endTime - actualStartTime) / 1000);
    const totalDuration = Math.floor((endTime - submitTime) / 1000);
    
    return {
      id: taskId,
      type: taskType,
      customerName: '赵俊杰',
      uploadFile: '赵俊杰_征信报告_461.pdf',
      submitTime: submitTime.toLocaleString('zh-CN'),
      actualStartTime: actualStartTime.toLocaleString('zh-CN'),
      endTime: endTime.toLocaleString('zh-CN'),
      processingTime: this.formatTimeInterval(processingDuration),
      totalTime: this.formatTimeInterval(totalDuration),
      result: '已出结果',
      content: `这是${taskType}的结果内容`
    };
  },

  /**
   * 格式化时间间隔
   */
  formatTimeInterval(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  },

  /**
   * 生成报告内容
   */
  generateReportContent() {
    const { taskType, taskResult } = this.data;
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    console.log('开始生成报告内容，任务类型:', taskType);

    // 设置报告生成时间（模拟）
    this.setData({
      reportGenerationDuration: Math.floor(Math.random() * 10) + 5
    });

    // 根据任务类型生成不同的报告内容
    let reportContent = '';
    
    switch(taskType) {
      case '个人征信报告分析':
        console.log('生成个人征信报告');
        reportContent = this.generatePersonalCreditReportContent();
        break;
      case '企业征信报告分析':
        console.log('生成企业征信报告');
        reportContent = this.generateBusinessCreditReportContent();
        break;
      case '买家顾问报告':
        console.log('生成买家顾问报告');
        reportContent = this.generateBuyerAdvisorReportContent();
        break;
      case '融资顾问报告':
        console.log('生成融资顾问报告');
        reportContent = this.generateFinanceAdvisorReportContent();
        break;
      default:
        console.log('未知任务类型，使用默认模板');
        reportContent = `# ${taskType || '未知类型任务'}\n\n生成时间：${currentDate}\n\n暂不支持显示该类型任务的详细结果。`;
    }
    
    // 直接设置reportContent
    if (reportContent) {
      this.setData({ reportContent }, () => {
        console.log('报告内容设置成功，长度:', reportContent.length);
        // 强制更新页面
        this.setData({ 
          forceUpdate: Date.now() 
        });
      });
    } else {
      console.error('报告内容生成失败');
    }

    // 延迟检查报告内容是否设置成功
    setTimeout(() => {
      console.log('报告内容设置结果:', this.data.reportContent ? '成功' : '失败');
      if (this.data.reportContent) {
        console.log('报告内容长度:', this.data.reportContent.length);
      }
    }, 500);
  },

  /**
   * 生成个人征信报告分析
   */
  generatePersonalCreditReportContent() {
    const { taskResult } = this.data;
    const customerName = taskResult?.customerName || '未知客户';
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    const reportContent = `# 个人征信分析报告

编制日期：${currentDate}

## 一、个人基本信息

**姓名**：${customerName}
**报告类型**：个人征信报告
**报告期限**：截至 ${currentDate}
**报告用途**：购房贷款审批参考

## 二、征信数据分析

### 信用评分与风险等级

- **信用评分**：良好
- **风险等级**：低风险
- **总体情况**：征信状况健康，无重大不良记录

### 贷款情况概述

- **现有贷款**：1笔住房贷款
- **贷款总额**：约45万元
- **剩余金额**：约32万元
- **贷款期限**：20年（已还款5年）
- **月供金额**：约5,000元
- **还款状态**：正常还款中，无逾期

### 信用卡使用情况

- **持有信用卡**：3张
- **总授信额度**：15万元
- **已使用额度**：3.2万元（使用率21.3%）
- **近6个月平均使用率**：25%
- **近6个月最高使用率**：35%
- **当前状态**：正常使用，无逾期

## 三、风险评估

### 还款能力分析

- **月收入估算**：约20,000元
- **月债务支出**：约5,000元
- **债务收入比**：约25%
- **评估结果**：债务收入比处于合理范围（低于40%），还款能力良好

### 贷款申请可行性分析

- **贷款申请类型**：个人住房贷款
- **申请可行性**：高
- **建议贷款额度**：约100-150万元
- **建议贷款期限**：25-30年
- **预计月供**：约5,500-8,500元（基于当前利率）`;

    console.log('个人征信报告内容长度:', reportContent.length);
    return reportContent;
  },

  /**
   * 生成企业征信报告分析
   */
  generateBusinessCreditReportContent() {
    const { taskResult } = this.data;
    const customerName = taskResult?.customerName || '未知企业';
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    const reportContent = `# 企业征信分析报告

编制日期：${currentDate}

## 一、企业基本信息

**企业名称**：${customerName}
**统一社会信用代码**：91XXXXXXXXXXXXXXXXXX
**企业类型**：有限责任公司
**注册资本**：1000万元人民币
**成立日期**：2015-06-12
**报告期限**：截至 ${currentDate}

## 二、征信数据分析

### 信用评级与风险等级

- **信用评级**：AA-
- **风险等级**：低风险
- **总体情况**：企业信用状况良好，经营稳定

### 贷款情况概述

- **贷款总笔数**：3笔
- **贷款总额**：2,500万元
- **已还款总额**：1,200万元
- **未结清余额**：1,300万元
- **还款状态**：所有贷款均正常还款，无逾期

## 三、风险评估

### 偿债能力分析

- **流动比率**：1.8
- **速动比率**：1.2
- **资产负债率**：42%
- **评估结果**：企业短期和长期偿债能力均处于良好水平`;

    console.log('企业征信报告内容长度:', reportContent.length);
    return reportContent;
  },

  /**
   * 生成买家顾问报告
   */
  generateBuyerAdvisorReportContent() {
    const { taskResult } = this.data;
    const customerName = taskResult?.customerName || '未知客户';
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    const reportContent = `# 买家顾问报告

编制日期：${currentDate}

## 一、客户需求分析

**客户姓名**：${customerName}
**购房目的**：自住
**预算范围**：300-500万元
**区域偏好**：城市中心区、学区房
**户型需求**：3房2厅，面积约100-140平方米
**特殊要求**：地铁沿线，小区环境好，物业服务优质

## 二、市场行情分析

### 目标区域市场概况

- **平均房价**：35,000-45,000元/平方米
- **近6个月价格走势**：稳中有升，涨幅约3%
- **成交量分析**：较去年同期增长12%
- **新房供应情况**：新增楼盘4个，新增房源约2000套
- **二手房挂牌量**：约3500套，较上季度增加5%

### 学区房市场分析

- **重点学区房价**：45,000-55,000元/平方米
- **溢价情况**：比普通住宅高约20-30%
- **供需情况**：供不应求，成交周期短
- **投资价值**：保值增值能力强，流动性好

## 三、房源推荐

### 推荐房源一：城心花园小区

- **位置**：市中心区域，地铁2号线旁
- **户型**：3房2厅2卫，建筑面积125平方米
- **楼层**：18层/共33层，南北通透
- **价格**：480万元（38,400元/平方米）
- **建筑年代**：2015年
- **学区情况**：对口市重点小学和初中
- **配套设施**：小区内有游泳池、健身房、儿童乐园
- **推荐理由**：位置优越，对口优质学校，小区环境佳，物业服务好`;

    console.log('买家顾问报告内容长度:', reportContent.length);
    return reportContent;
  },

  /**
   * 生成融资顾问报告
   */
  generateFinanceAdvisorReportContent() {
    const { taskResult } = this.data;
    const customerName = taskResult?.customerName || '未知客户';
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    const reportContent = `# 融资顾问报告

编制日期：${currentDate}

## 一、客户基本情况

**客户姓名**：${customerName}
**融资需求**：购房按揭贷款
**贷款金额**：300万元
**期望贷款期限**：30年
**客户信用状况**：良好，无不良征信记录
**月收入情况**：税前月收入3.5万元，家庭月收入6万元

## 二、客户资质分析

### 还款能力评估

- **月收入**：个人税前月收入3.5万元
- **家庭月收入**：6万元
- **月固定支出**：约1.5万元（不含房贷）
- **理财资产**：约50万元（包括存款、基金等）
- **评估结果**：客户收入稳定，具备较强还款能力

### 信用状况评估

- **个人信用评分**：良好
- **信用卡使用**：3张信用卡，使用率低于30%
- **现有贷款**：无其他贷款
- **逾期记录**：无
- **评估结果**：信用记录良好，符合银行放贷要求

## 三、贷款方案建议

### 方案一：商业银行普通按揭贷款

- **建议银行**：建设银行、工商银行
- **贷款金额**：300万元
- **贷款期限**：30年
- **贷款利率**：LPR+55BP（约4.75%）
- **月供金额**：约15,670元
- **首付比例**：30%
- **审批周期**：约15-20个工作日
- **所需材料**：身份证、收入证明、银行流水、购房合同等
- **优势**：利率相对稳定，手续简单

### 方案二：公积金贷款

- **贷款金额**：120万元（公积金贷款上限）
- **贷款期限**：30年
- **贷款利率**：3.1%
- **月供金额**：约5,130元
- **审批周期**：约20-30个工作日
- **所需材料**：身份证、公积金缴存证明、购房合同等
- **优势**：利率低，总利息少`;

    console.log('融资顾问报告内容长度:', reportContent.length);
    return reportContent;
  },

  /**
   * 初始化AI思考过程
   */
  initAiThinkingProcess() {
    const { taskType, taskResult } = this.data;
    const thinkingPrefix = `正在分析${taskType}...\n`;

    const aiThinkingProcess = thinkingPrefix +
`嗯，用户给了一个PDF文件，看起来是个人信用报告。我需要仔细分析里面的内容，然后给出专业的建议。首先，我要理解各个表格和数据的含义。
从报告中可以看到，用户名为张三，有2家机构的3笔贷款，总余额为1,200,000元。其中包括一笔住房贷款，余额900,000元，还款状态正常；一笔消费贷款，余额200,000元，还款状态也正常。
信用卡方面，用户有3家银行发行的4张信用卡，授信总额200,000元，已用额度50,000元，使用率为25%。从明细来看，各卡使用情况都正常，没有超限或逾期情况。
公共记录部分显示无不良记录，这是很好的信号，表明用户没有严重的信用问题。
查询记录显示，最近2年内被查询8次，其中贷款审批查询3次，信用卡审批查询2次，本人查询3次。查询次数适中，不会对信用评分产生太大负面影响。
综合分析，用户的信用状况总体良好，所有贷款和信用卡账户均按时还款，无逾期记录。但需要注意以下几点：
1. 总债务水平较高，尤其是住房贷款占比较大，需要关注月供与收入的比例，确保还款能力。
2. 信用卡使用率为25%，处于合理范围内（建议保持在30%以下），有利于维持良好的信用评分。
3. 查询记录次数适中，不会对信用评分产生太大影响。
建议用户继续保持良好的还款习惯，合理规划财务，避免过度依赖信用产品，同时关注信用报告中的查询记录，减少不必要的信用检查。
好了，模拟思考的内容差不多就得了，够了，就这样吧。`;

    this.setData({ aiThinkingProcess });
  },

  /**
   * 初始化咨询消息
   */
  initConsultationMessages() {
    const { taskResult, taskType } = this.data;

    // 添加初始系统消息
    const consultationMessages = [{
      role: 'assistant',
      content: `我是良策AI助手，您正在查看${taskResult?.customerName || '客户'}的${taskType}的结果。您可以继续向我咨询关于此报告的任何问题。`,
      timestamp: new Date().toISOString(),
      isSystemMessage: true
    }];

    this.setData({ consultationMessages });
  },

  /**
   * 加载历史咨询记录
   */
  loadConsultationHistory() {
    const { taskId } = this.data;
    if (!taskId) return;

    try {
      const storageKey = `task_consultation_${taskId}`;
      const savedData = wx.getStorageSync(storageKey);

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // 恢复历史思考过程
        if (parsedData.thinkingProcesses && parsedData.thinkingProcesses.length > 0) {
          this.setData({
            consultationThinkingProcesses: parsedData.thinkingProcesses
          });
        }

        // 恢复历史消息，但过滤掉系统消息
        if (parsedData.messages && parsedData.messages.length > 0) {
          const filteredMessages = parsedData.messages.filter(msg => !msg.isSystemMessage);

          // 合并历史消息和系统消息
          const consultationMessages = [...filteredMessages, ...this.data.consultationMessages];
          this.setData({ consultationMessages });
        }
      }
    } catch (error) {
      console.error('加载历史咨询记录失败:', error);
    }
  },

  /**
   * 保存咨询历史记录
   */
  saveConsultationHistory() {
    const { taskId, taskType, consultationThinkingProcesses, consultationMessages } = this.data;
    if (!taskId) return;

    try {
      // 过滤掉系统消息再保存
      const messagesWithoutSystem = consultationMessages.filter(msg => !msg.isSystemMessage);

      const storageKey = `task_consultation_${taskId}`;
      const dataToSave = {
        taskId,
        taskType,
        thinkingProcesses: consultationThinkingProcesses,
        messages: messagesWithoutSystem,
        updatedAt: new Date().toISOString()
      };

      wx.setStorageSync(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存咨询历史记录失败:', error);
    }
  },

  /**
   * 咨询输入框内容变化
   */
  onConsultationInput(event) {
    this.setData({
      consultationInput: event.detail.value
    });
  },

  /**
   * 发送咨询消息
   */
  async sendConsultationMessage() {
    const { consultationInput, consultationLoading } = this.data;

    if (!consultationInput.trim() || consultationLoading) return;

    // 创建用户消息对象
    const userMessage = {
      role: 'user',
      content: consultationInput.trim(),
      timestamp: new Date().toISOString()
    };

    // 添加用户消息到列表
    const consultationMessages = [...this.data.consultationMessages, userMessage];
    this.setData({
      consultationMessages,
      consultationInput: '',
      consultationLoading: true
    });

    // 保存咨询历史
    this.saveConsultationHistory();

    try {
      // 模拟AI思考过程
      const question = userMessage.content;
      const { taskType } = this.data;

      const thinkingProcessContent = `用户的咨询内容："${question}"
思考过程：
我需要为用户提供关于${taskType}的专业解答。基于报告内容和专业知识，我将分析用户的问题并给出合适的建议。

首先理解用户的问题，看起来用户想了解关于${taskType}的具体内容...
根据我对报告的分析，我可以提供以下几点建议...

考虑到用户的关注点，我应该强调...
同时也需要说明...

我需要确保回答准确、专业，同时易于理解...`;

      // 添加思考过程
      const consultationThinkingProcesses = [...this.data.consultationThinkingProcesses, thinkingProcessContent];
      this.setData({ consultationThinkingProcesses });

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成回复内容
      let reply = '';

      // 根据问题生成不同的回复
      if (question.includes('贷款') || question.includes('融资')) {
        reply = `根据您的咨询，关于${taskType}中的贷款问题，我建议您关注以下几点：

1. 当前的贷款利率和条件是市场上较为优惠的
2. 建议您考虑固定利率与浮动利率的差异和适用性
3. 提前还款策略可以帮助您节省利息支出

如果您有更具体的贷款问题，可以继续咨询我。`;
      } else if (question.includes('风险') || question.includes('安全')) {
        reply = `关于您咨询的风险问题，${taskType}中已进行了全面评估：

1. 报告显示目前风险等级为低风险，整体状况良好
2. 无重大不良记录，信用历史稳定
3. 建议您仍需定期检查信用报告，保持良好的信用记录

风险控制是一个持续的过程，如需更详细的风险管理建议，请随时咨询。`;
      } else {
        reply = `感谢您的咨询。基于${taskType}的分析结果，我可以提供以下建议：

1. 报告显示整体状况良好，符合大多数金融机构的要求
2. 建议您关注报告中提到的几个优化点，这将进一步提升评估结果
3. 如果您有具体的决策需求，可以结合报告中的详细数据进行考量

如有更多问题，请继续咨询，我很乐意为您提供更详细的解答。`;
      }

      // 添加回复到消息列表
      const assistantMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...this.data.consultationMessages, assistantMessage];
      this.setData({
        consultationMessages: updatedMessages,
        consultationLoading: false
      });

      // 保存咨询历史
      this.saveConsultationHistory();

    } catch (error) {
      console.error('发送咨询消息出错:', error);
      this.setData({
        consultationLoading: false
      });

      wx.showToast({
        title: '发送失败，请重试',
        icon: 'error'
      });
    }
  },

  /**
   * 查看征信文件
   */
  viewCreditFile(event) {
    const { taskType, taskResult } = this.data;

    // 获取文件信息
    const fileName = event?.currentTarget?.dataset?.file || taskResult?.uploadFile;

    // 只有征信报告类型才显示文件查看功能
    if (!taskType.includes('征信')) {
      wx.showToast({
        title: '该任务类型不支持文件查看',
        icon: 'none'
      });
      return;
    }

    // 检查是否有文件
    if (!fileName) {
      wx.showToast({
        title: '没有可查看的文件',
        icon: 'none'
      });
      return;
    }

    console.log('查看文件:', fileName);

    wx.showToast({
      title: '文件查看功能需要后端API支持',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 下载报告
   */
  downloadReport() {
    const { taskType, taskResult, reportContent } = this.data;

    if (!reportContent) {
      wx.showToast({
        title: '报告内容为空',
        icon: 'error'
      });
      return;
    }

    // 小程序环境下，可以将内容复制到剪贴板
    wx.setClipboardData({
      data: reportContent,
      success: () => {
        wx.showToast({
          title: '报告内容已复制到剪贴板',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 显示分享功能说明弹窗
   */
  showShareDialog() {
    wx.showModal({
      title: '功能说明',
      content: '点击后将从服务器获取PDF版本报告链接，并自动打开PDF预览页面，用户可在预览页面使用微信原生分享功能进行分享',
      showCancel: false,
      confirmText: '确定',
      // confirmColor: '#1b68de',
      // success: (res) => {
      //   if (res.confirm) {
      //     console.log('用户点击确定');
      //   }
      // }
    });
  },

  /**
   * 分享报告（保留原方法，以备后续使用）
   */
  shareReport() {
    const { taskType, taskResult } = this.data;

    wx.showShareMenu({
      withShareTicket: true,
      success: () => {
        console.log('分享菜单显示成功');
      },
      fail: (error) => {
        console.error('分享菜单显示失败:', error);
        wx.showToast({
          title: '分享功能暂不可用',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 页面分享配置
   */
  onShareAppMessage() {
    const { taskType, taskResult } = this.data;

    return {
      title: `${taskResult?.customerName || '客户'}的${taskType}结果`,
      path: `/pages/task-result/task-result?id=${this.data.taskId}&type=${encodeURIComponent(this.data.taskType)}`,
      imageUrl: '' // 可以设置分享图片
    };
  },

  /**
   * 返回上一页
   */
  goBack() {
    console.log('返回上一页');
    // 直接调用navigateBack，不做额外处理，这样会保留上一页的状态
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败（例如没有上一页），则跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  /**
   * 重新加载
   */
  reload() {
    this.loadTaskResult();
  },

  /**
   * 格式化消息时间
   */
  formatMessageTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }

    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }

    // 小于1天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }

    // 超过1天，显示具体时间
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * 判断是否为征信报告
   */
  isCreditReport() {
    return this.data.taskType.includes('征信');
  },

  /**
   * 测试报告内容显示
   */
  testReportContent() {
    console.log('测试报告内容显示');
    console.log('当前reportContent长度:', this.data.reportContent ? this.data.reportContent.length : 0);
    
    // 检查reportContent是否正确设置
    if (!this.data.reportContent) {
      console.error('报告内容为空，重新生成');
      this.generateReportContent();
      return;
    }
    
    // 测试markdown转换
    const html = this.markdownToHtml(this.data.reportContent);
    console.log('markdownToHtml结果长度:', html.length);
    
    // 输出HTML的前200个字符用于调试
    console.log('HTML预览:', html.substring(0, 200) + '...');
    
    // 更新调试信息
    wx.showToast({
      title: '内容已重新渲染',
      icon: 'success'
    });
  },

  /**
   * 简单的Markdown转HTML处理
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';

    try {
      // 先将markdown内容按行分割
      const lines = markdown.split('\n');
      let html = '';
      let inList = false;
      
      // 逐行处理markdown内容
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // 跳过空行，但在列表中时需要结束列表
        if (line === '') {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          html += '<p></p>';
          continue;
        }
        
        // 处理标题
        if (line.startsWith('# ')) {
          html += `<h1 style="font-size: 40rpx; font-weight: bold; margin: 28rpx 0 24rpx 0; color: #262626;">${line.substring(2)}</h1>`;
        } 
        else if (line.startsWith('## ')) {
          html += `<h2 style="font-size: 36rpx; font-weight: bold; margin: 24rpx 0 20rpx 0; color: #262626;">${line.substring(3)}</h2>`;
        } 
        else if (line.startsWith('### ')) {
          html += `<h3 style="font-size: 32rpx; font-weight: bold; margin: 20rpx 0 16rpx 0; color: #262626;">${line.substring(4)}</h3>`;
        } 
        // 处理列表项
        else if (line.startsWith('- ')) {
          if (!inList) {
            html += '<ul style="margin: 16rpx 0; padding-left: 30rpx;">';
            inList = true;
          }
          html += `<li style="margin: 8rpx 0; color: #303133;">${line.substring(2)}</li>`;
        } 
        // 处理普通段落
        else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          // 处理粗体
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #1b68de;">$1</strong>');
          html += `<p style="margin: 16rpx 0; line-height: 1.6; color: #303133;">${line}</p>`;
        }
      }
      
      // 确保列表正确关闭
      if (inList) {
        html += '</ul>';
      }

      // 包装在一个容器中，设置整体样式
      return `<div style="padding: 0; font-size: 30rpx; line-height: 1.6; word-break: break-all; width: 100%; box-sizing: border-box;">${html}</div>`;
    } catch (error) {
      console.error('Markdown转换错误:', error);
      return `<div style="padding: 20rpx; color: #999;">${markdown}</div>`;
    }
  }
});
