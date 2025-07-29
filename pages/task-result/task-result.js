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

    // 系统状态
    systemInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('TaskResult页面加载，参数:', options);
    
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          systemInfo: res
        });
      }
    });
    
    // 获取URL参数
    const { id, type } = options;
    
    if (!id || !type) {
      this.setData({
        loading: false,
        loadError: '缺少必要参数，请从历史记录页面重新进入'
      });
      return;
    }
    
    this.setData({
      taskId: id,
      taskType: decodeURIComponent(type)
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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadTaskResult().finally(() => {
      wx.stopPullDownRefresh();
    });
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
   * Tab切换事件
   */
  onTabChange(event) {
    const index = event.detail.index;
    this.setData({
      activeTab: index
    });
  },

  /**
   * 生成报告内容
   */
  generateReportContent() {
    const { taskType, taskResult } = this.data;
    const currentDate = new Date().toLocaleString('zh-CN').replace(/\//g, '-');

    // 设置报告生成时间（模拟）
    this.setData({
      reportGenerationDuration: Math.floor(Math.random() * 10) + 5
    });

    // 根据任务类型生成不同的报告内容
    switch(taskType) {
      case '个人征信报告分析':
        this.generatePersonalCreditReport();
        break;
      case '企业征信报告分析':
        this.generateBusinessCreditReport();
        break;
      case '买家顾问报告':
        this.generateBuyerAdvisorReport();
        break;
      case '融资顾问报告':
        this.generateFinanceAdvisorReport();
        break;
      default:
        this.setData({
          reportContent: `# ${taskType || '未知类型任务'}\n\n生成时间：${currentDate}\n\n暂不支持显示该类型任务的详细结果。`
        });
    }
  },

  /**
   * 生成个人征信报告分析
   */
  generatePersonalCreditReport() {
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

    this.setData({ reportContent });
  },

  /**
   * 生成企业征信报告分析
   */
  generateBusinessCreditReport() {
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

    this.setData({ reportContent });
  },

  /**
   * 生成买家顾问报告
   */
  generateBuyerAdvisorReport() {
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

    this.setData({ reportContent });
  },

  /**
   * 生成融资顾问报告
   */
  generateFinanceAdvisorReport() {
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

    this.setData({ reportContent });
  },

  /**
   * 初始化AI思考过程
   */
  initAiThinkingProcess() {
    const { taskType, taskResult } = this.data;
    const thinkingPrefix = `正在分析${taskType}...\n\n思考过程：\n`;

    const aiThinkingProcess = thinkingPrefix +
      `嗯，我需要仔细分析这份${taskType}的内容，提取关键信息并给出专业建议。\n\n` +
      `首先，我注意到这是一份关于${taskResult?.customerName || '客户'}的${taskType}。\n` +
      `让我逐项分析内容，确保不遗漏任何重要信息...\n\n` +
      `看起来总体情况良好，没有发现明显的风险点。\n` +
      `基于分析结果，我可以提供以下几点建议...\n\n` +
      `综合评估，客户的状况适合...\n` +
      `需要特别注意的是...\n\n` +
      `我认为这份报告的结论是合理的，可以作为决策参考。`;

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
   * 分享报告
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
    // 获取页面栈
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      // 如果上一页是历史记录页面，设置不自动刷新
      if (prevPage.route === 'pages/history/history') {
        prevPage.setData({
          shouldAutoRefresh: false
        });
      }
    }

    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果无法返回，则跳转到历史记录页面
        wx.redirectTo({
          url: '/pages/history/history'
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
   * 简单的Markdown转HTML处理
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';

    return markdown
      // 处理标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 处理粗体
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // 处理列表
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      // 处理换行
      .replace(/\n/gim, '<br/>');
  }
});
