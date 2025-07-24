// 任务结果查看器页面
const historyService = require('../../services/historyService');

Page({
  data: {
    // 页面参数
    taskId: '',
    taskType: '',
    
    // 任务数据
    taskDetail: null,
    loading: true,
    loadError: '',
    
    // 标签页相关
    activeTab: 0,
    tabList: [
      { name: 'report', title: '分析报告' },
      { name: 'thinking', title: 'AI思考' },
      { name: 'consultation', title: '继续咨询' }
    ],
    
    // 分析报告内容
    reportContent: '',
    reportGenerationDuration: 0,
    
    // AI思考过程
    aiThinkingProcess: '',
    
    // 咨询相关
    consultationMessages: [],
    consultationInput: '',
    consultationLoading: false,
    consultationHistory: [],
    
    // 文件操作
    showActionSheet: false,
    actionSheetActions: [],

    // 滚动控制
    scrollIntoView: ''
  },

  onLoad(options) {
    console.log('任务结果页面参数:', options);
    
    if (options.taskId) {
      this.setData({
        taskId: options.taskId,
        taskType: decodeURIComponent(options.type || '')
      });
      
      this.loadTaskDetail();
    } else {
      this.setData({
        loadError: '参数错误：缺少任务ID',
        loading: false
      });
      
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 页面显示时加载咨询历史
    if (this.data.taskId) {
      this.loadConsultationHistory();
    }
  },

  onUnload() {
    // 页面卸载时保存咨询历史
    this.saveConsultationHistory();
  },

  /**
   * 加载任务详情
   */
  async loadTaskDetail() {
    this.setData({ loading: true, loadError: '' });
    
    try {
      const taskDetail = await historyService.getTaskDetail(this.data.taskId);
      
      this.setData({
        taskDetail: taskDetail,
        loading: false
      });
      
      // 生成报告内容
      this.generateReportContent();
      
      // 生成AI思考过程
      this.generateAIThinkingProcess();
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: taskDetail.type + ' - 结果详情'
      });
      
    } catch (error) {
      console.error('加载任务详情失败:', error);
      this.setData({
        loadError: '加载失败：' + error.message,
        loading: false
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 生成报告内容
   */
  generateReportContent() {
    const task = this.data.taskDetail;
    if (!task) return;
    
    // 使用iOS兼容的日期格式
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = year + '/' + month + '/' + day;
    const customerName = task.customerName || '客户';
    
    let reportContent = '';
    
    // 根据任务类型生成不同的报告内容
    switch (task.type) {
      case '个人征信报告分析':
        reportContent = this.generatePersonalCreditReport(customerName, currentDate);
        break;
      case '企业征信报告分析':
        reportContent = this.generateBusinessCreditReport(customerName, currentDate);
        break;
      case '买家顾问报告':
        reportContent = this.generateBuyerAdvisorReport(customerName, currentDate);
        break;
      case '融资顾问报告':
        reportContent = this.generateFinanceAdvisorReport(customerName, currentDate);
        break;
      default:
        reportContent = this.generateDefaultReport(customerName, currentDate);
    }
    
    this.setData({
      reportContent: reportContent,
      reportGenerationDuration: Math.floor(Math.random() * 30) + 10 // 10-40秒
    });
  },

  /**
   * 生成个人征信报告内容
   */
  generatePersonalCreditReport(customerName, currentDate) {
    return `# ${customerName}个人征信报告分析

编制日期：${currentDate}

## 一、基本信息概览

**客户姓名**：${customerName}
**身份证号**：****1234（已脱敏）
**报告查询时间**：${currentDate}
**报告版本**：详细版

## 二、信用状况评估

### 整体信用评级：良好 ⭐⭐⭐⭐

**综合评分**：78分（满分100分）

### 主要优势
- ✅ 无逾期还款记录
- ✅ 信用卡使用规范
- ✅ 贷款按时还款
- ✅ 征信查询次数适中

### 需要关注的问题
- ⚠️ 信用卡负债率偏高（65%）
- ⚠️ 近期征信查询较频繁
- ⚠️ 部分账户使用时间较短

## 三、详细分析

### 信贷记录分析
- **信用卡账户**：5个，总授信额度15万元
- **贷款账户**：2个，房贷余额80万元，车贷余额5万元
- **还款记录**：24个月内无逾期记录
- **当前负债**：约55万元

### 查询记录分析
- **近6个月查询次数**：8次
- **查询机构类型**：银行、消费金融公司
- **查询原因**：贷款审批、信用卡审批

## 四、风险提示

1. **负债率风险**：当前负债率较高，建议适当降低
2. **查询频率**：近期查询较频繁，可能影响新申请
3. **还款能力**：需关注收入稳定性

## 五、改善建议

### 短期建议（1-3个月）
1. 降低信用卡使用率至50%以下
2. 暂停新的信贷申请
3. 保持良好的还款记录

### 中期建议（3-12个月）
1. 逐步提升信用记录长度
2. 多元化信贷产品使用
3. 建立稳定的收入来源证明

### 长期建议（1年以上）
1. 维持良好的信用记录
2. 适时申请更高额度的信贷产品
3. 建立完善的个人财务规划

## 六、申贷建议

### 适合申请的产品
- 💳 **信用卡**：成功率85%，建议申请额度3-5万
- 🏠 **房贷**：成功率90%，可申请优惠利率
- 🚗 **车贷**：成功率95%，条件优良

### 不建议申请的产品
- 消费贷款（负债率已高）
- 多张信用卡同时申请

## 七、总结

${customerName}的征信状况整体良好，具备较强的还款能力和良好的信用意识。建议在控制负债率的前提下，继续保持良好的信用记录，为未来的信贷需求做好准备。

---
*本报告基于征信数据分析生成，仅供参考。具体信贷申请结果以金融机构审批为准。*`;
  },

  /**
   * 生成企业征信报告内容
   */
  generateBusinessCreditReport(customerName, currentDate) {
    return `# ${customerName}企业征信报告分析

编制日期：${currentDate}

## 一、企业基本信息

**企业名称**：${customerName}
**统一社会信用代码**：****1234（已脱敏）
**企业类型**：有限责任公司
**注册资本**：500万元
**成立时间**：2018年3月

## 二、信用状况评估

### 整体信用评级：优秀 ⭐⭐⭐⭐⭐

**综合评分**：85分（满分100分）

### 主要优势
- ✅ 经营状况稳定
- ✅ 财务指标健康
- ✅ 无不良信用记录
- ✅ 合规经营良好

## 三、经营状况分析

### 财务指标
- **年营业收入**：2000万元
- **净利润率**：12%
- **资产负债率**：45%
- **流动比率**：1.8

### 信贷记录
- **银行授信总额**：800万元
- **已使用授信**：300万元
- **还款记录**：良好，无逾期

## 四、风险评估

### 低风险因素
- 行业前景良好
- 管理团队稳定
- 客户结构合理

### 需关注因素
- 应收账款周转率需提升
- 现金流管理需优化

## 五、融资建议

建议融资额度：200-500万元
推荐产品：银行流动资金贷款、供应链金融

---
*本报告基于企业征信数据分析生成，仅供参考。*`;
  },

  /**
   * 生成买家顾问报告内容
   */
  generateBuyerAdvisorReport(customerName, currentDate) {
    return `# ${customerName}买家顾问报告

编制日期：${currentDate}

## 一、客户需求分析

**客户姓名**：${customerName}
**购房目的**：自住
**预算范围**：300-500万元
**区域偏好**：城市中心区、学区房
**户型需求**：3房2厅，面积约100-140平方米

## 二、市场行情分析

### 目标区域市场概况
- **平均房价**：35,000-45,000元/平方米
- **近6个月价格走势**：稳中有升，涨幅约3%
- **成交量分析**：较去年同期增长12%

### 学区房市场分析
- **重点学区房价**：45,000-55,000元/平方米
- **溢价情况**：比普通住宅高约20-30%
- **投资价值**：保值增值能力强

## 三、房源推荐

### 推荐房源一：城心花园小区
- **位置**：市中心区域，地铁2号线旁
- **户型**：3房2厅2卫，建筑面积125平方米
- **价格**：480万元（38,400元/平方米）
- **推荐理由**：位置优越，对口优质学校

### 推荐房源二：翡翠湾小区
- **位置**：新区核心地段
- **户型**：3房2厅1卫，建筑面积110平方米
- **价格**：385万元（35,000元/平方米）
- **推荐理由**：性价比高，升值潜力大

## 四、购房建议

### 投资建议
1. 优先考虑地铁沿线房源
2. 关注学区房的长期价值
3. 注意小区物业管理水平

### 风险提示
1. 注意政策变化对市场的影响
2. 合理评估自身还款能力
3. 充分了解房源的法律状况

---
*本报告基于市场调研数据分析生成，仅供参考。*`;
  },

  /**
   * 生成融资顾问报告内容
   */
  generateFinanceAdvisorReport(customerName, currentDate) {
    return `# ${customerName}融资顾问报告

编制日期：${currentDate}

## 一、融资需求分析

**客户名称**：${customerName}
**融资目的**：业务扩张
**融资金额**：500万元
**期望期限**：3年
**还款方式**：等额本息

## 二、企业资质评估

### 基本情况
- **成立时间**：5年
- **注册资本**：1000万元
- **主营业务**：制造业
- **年营业收入**：3000万元

### 财务状况
- **净利润率**：15%
- **资产负债率**：50%
- **现金流状况**：良好
- **担保能力**：充足

## 三、融资方案推荐

### 方案一：银行流动资金贷款
- **融资额度**：500万元
- **贷款期限**：3年
- **预期利率**：5.5%-6.5%
- **担保方式**：企业资产抵押

### 方案二：供应链金融
- **融资额度**：300万元
- **贷款期限**：1年（可续贷）
- **预期利率**：6.0%-7.0%
- **担保方式**：应收账款质押

## 四、申请建议

### 准备材料
1. 企业基本资料
2. 财务报表（近3年）
3. 银行流水记录
4. 担保资产证明

### 申请策略
1. 优先选择合作银行
2. 准备充分的申请材料
3. 合理设计还款计划

---
*本报告基于企业财务数据分析生成，仅供参考。*`;
  },

  /**
   * 生成默认报告内容
   */
  generateDefaultReport(customerName, currentDate) {
    return `# ${customerName}任务分析报告

编制日期：${currentDate}

## 一、任务概述

本次为${customerName}提供专业的分析服务，基于提供的信息进行深入分析，并给出相应的建议和方案。

## 二、分析结果

经过详细分析，我们为您提供以下专业建议：

### 主要发现
- 整体情况良好
- 具备较好的基础条件
- 存在一定的优化空间

### 建议措施
1. 保持现有优势
2. 改善薄弱环节
3. 制定长期规划

## 三、总结

基于以上分析，建议${customerName}按照我们的建议执行相关措施，以达到最佳效果。

---
*本报告基于提供的信息分析生成，仅供参考。*`;
  },

  /**
   * 生成AI思考过程
   */
  generateAIThinkingProcess() {
    const task = this.data.taskDetail;
    if (!task) return;
    
    const thinkingProcess = `# AI分析思考过程

## 第一步：信息收集与整理

我首先对${task.customerName || '客户'}提供的信息进行了全面的收集和整理：

1. **基础信息提取**
   - 客户基本情况
   - 任务具体需求
   - 相关背景资料

2. **数据验证**
   - 信息完整性检查
   - 数据准确性验证
   - 关键指标识别

## 第二步：专业知识匹配

基于任务类型"${task.type}"，我调用了相关的专业知识库：

1. **行业标准对比**
   - 参考行业最佳实践
   - 对比同类案例
   - 识别关键风险点

2. **法规政策分析**
   - 相关法律法规梳理
   - 政策变化影响评估
   - 合规要求确认

## 第三步：深度分析推理

1. **多维度分析**
   - 从不同角度审视问题
   - 考虑各种可能性
   - 权衡利弊得失

2. **逻辑推理**
   - 因果关系分析
   - 风险概率评估
   - 影响程度量化

## 第四步：方案制定

1. **方案设计**
   - 制定多个备选方案
   - 评估方案可行性
   - 优化实施路径

2. **风险控制**
   - 识别潜在风险
   - 制定应对措施
   - 建立监控机制

## 第五步：结果验证

1. **逻辑自检**
   - 推理过程验证
   - 结论合理性检查
   - 建议可操作性评估

2. **质量保证**
   - 专业性确认
   - 实用性验证
   - 完整性检查

## 思考总结

通过以上五个步骤的系统性分析，我为${task.customerName || '客户'}提供了专业、全面、可操作的分析报告。整个思考过程严格遵循专业标准，确保分析结果的准确性和实用性。

---
*以上为AI分析的完整思考过程，展示了从信息收集到结果输出的全过程。*`;
    
    this.setData({
      aiThinkingProcess: thinkingProcess
    });
  },

  /**
   * 标签页切换
   */
  onTabChange(event) {
    const index = event.detail.index;
    const oldTab = this.data.activeTab;

    this.setData({ activeTab: index });

    // 添加触觉反馈
    wx.vibrateShort();

    // 记录标签页切换
    console.log(`标签页切换: ${oldTab} -> ${index}`);

    // 如果切换到咨询页面，滚动到底部
    if (index === 2 && this.data.consultationMessages.length > 0) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }

    // 如果切换到报告或思考页面，滚动到顶部
    if (index === 0 || index === 1) {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    }
  },

  /**
   * 加载咨询历史
   */
  loadConsultationHistory() {
    try {
      const key = `consultation_${this.data.taskId}`;
      const historyStr = wx.getStorageSync(key);
      
      if (historyStr) {
        const history = JSON.parse(historyStr);
        this.setData({
          consultationMessages: history.messages || [],
          consultationHistory: history.messages || []
        });
      }
    } catch (error) {
      console.error('加载咨询历史失败:', error);
    }
  },

  /**
   * 保存咨询历史
   */
  saveConsultationHistory() {
    try {
      const key = `consultation_${this.data.taskId}`;
      const history = {
        taskId: this.data.taskId,
        messages: this.data.consultationMessages,
        updateTime: new Date().toISOString()
      };
      
      wx.setStorageSync(key, JSON.stringify(history));
    } catch (error) {
      console.error('保存咨询历史失败:', error);
    }
  },

  /**
   * 咨询输入变化
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
    const input = this.data.consultationInput.trim();
    if (!input || this.data.consultationLoading) return;
    
    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      time: this.formatTime(new Date())
    };
    
    const messages = this.data.consultationMessages.concat([userMessage]);
    
    this.setData({
      consultationMessages: messages,
      consultationInput: '',
      consultationLoading: true
    });
    
    // 滚动到底部
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
    
    try {
      // 模拟AI回复
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: this.generateAIResponse(input),
        time: this.formatTime(new Date())
      };
      
      const updatedMessages = this.data.consultationMessages.concat([aiMessage]);
      
      this.setData({
        consultationMessages: updatedMessages,
        consultationLoading: false
      });
      
      // 保存历史记录
      this.saveConsultationHistory();
      
      // 滚动到底部
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      this.setData({ consultationLoading: false });
      
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      });
    }
    
    // 添加触觉反馈
    wx.vibrateShort();
  },

  /**
   * 生成AI回复
   */
  generateAIResponse(userInput) {
    const responses = [
      `感谢您的咨询。关于"${userInput}"这个问题，我建议您可以从以下几个方面考虑：\n\n1. 首先评估当前的实际情况\n2. 制定合理的目标和计划\n3. 考虑可能的风险和应对措施\n\n如果您需要更详细的分析，请提供更多具体信息。`,
      
      `根据您提到的"${userInput}"，我认为这是一个很好的问题。基于我的分析，建议您：\n\n• 深入了解相关政策和规定\n• 咨询专业人士的意见\n• 制定详细的实施方案\n\n您还有其他相关问题需要咨询吗？`,
      
      `关于"${userInput}"的问题，我理解您的关注点。从专业角度来看：\n\n✓ 这个方向是可行的\n✓ 需要注意一些关键因素\n✓ 建议分步骤实施\n\n如果您需要更具体的建议，请告诉我更多详情。`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    // 使用scroll-view的scroll-into-view属性
    this.setData({
      scrollIntoView: 'message-bottom'
    });

    // 清除scrollIntoView，避免影响后续滚动
    setTimeout(() => {
      this.setData({
        scrollIntoView: ''
      });
    }, 500);
  },

  /**
   * 键盘弹起事件
   */
  onKeyboardShow() {
    // 键盘弹起时滚动到底部
    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  },

  /**
   * 键盘收起事件
   */
  onKeyboardHide() {
    // 键盘收起时可以做一些清理工作
  },

  /**
   * 显示操作菜单
   */
  showActionMenu() {
    const actions = ['下载报告', '分享报告'];

    // 如果是征信报告，添加查看文件选项
    if (this.data.taskType && this.data.taskType.includes('征信')) {
      actions.unshift('查看征信文件');
    }

    this.setData({
      actionSheetActions: actions,
      showActionSheet: true
    });

    // 添加触觉反馈
    wx.vibrateShort();
  },

  /**
   * 隐藏操作菜单
   */
  hideActionMenu() {
    this.setData({
      showActionSheet: false
    });
  },

  /**
   * 操作菜单选择
   */
  onActionSelect(event) {
    const action = event.detail.name;
    
    switch (action) {
      case '查看征信文件':
        this.viewCreditFile();
        break;
      case '下载报告':
        this.downloadReport();
        break;
      case '分享报告':
        this.shareReport();
        break;
    }
    
    this.hideActionMenu();
  },

  /**
   * 查看征信文件
   */
  viewCreditFile() {
    const task = this.data.taskDetail;
    if (!task) return;

    // 在小程序中，我们可以跳转到一个专门的文件查看页面
    // 或者显示文件信息弹窗
    wx.showModal({
      title: '征信文件查看',
      content: `客户：${task.customerName || '未知客户'}\n任务类型：${task.type}\n文件状态：已上传\n\n注：完整的文件查看功能需要后端API支持`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到专门的文件查看页面
          wx.navigateTo({
            url: `/pages/file-viewer/file-viewer?taskId=${this.data.taskId}&type=credit`,
            fail: () => {
              wx.showToast({
                title: '文件查看页面开发中',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 下载报告
   */
  async downloadReport() {
    const task = this.data.taskDetail;
    if (!task || !this.data.reportContent) {
      wx.showToast({
        title: '报告内容不存在',
        icon: 'error'
      });
      return;
    }

    try {
      // 在小程序中，我们可以将报告内容保存到本地或分享
      wx.showActionSheet({
        itemList: ['保存到相册', '复制报告内容', '分享给好友'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.saveReportToAlbum();
              break;
            case 1:
              this.copyReportContent();
              break;
            case 2:
              this.shareReport();
              break;
          }
        }
      });
    } catch (error) {
      console.error('下载报告失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  /**
   * 保存报告到相册（生成图片）
   */
  saveReportToAlbum() {
    wx.showToast({
      title: '图片生成功能开发中',
      icon: 'none'
    });

    // 实际实现中，可以使用canvas生成报告图片
    // 然后保存到相册
  },

  /**
   * 复制报告内容
   */
  copyReportContent() {
    const reportText = this.data.reportContent;
    if (!reportText) {
      wx.showToast({
        title: '报告内容为空',
        icon: 'error'
      });
      return;
    }

    wx.setClipboardData({
      data: reportText,
      success: () => {
        wx.showToast({
          title: '报告内容已复制',
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
    const task = this.data.taskDetail;
    if (!task) return;

    // 设置分享信息
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        // 可以在这里设置分享的标题和路径
        this.setData({
          shareTitle: `${task.customerName || '客户'}的${task.type}分析报告`,
          sharePath: `/pages/task-result/task-result?taskId=${this.data.taskId}&type=${encodeURIComponent(this.data.taskType)}`
        });
      }
    });

    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    });
  },

  /**
   * 报告内容长按
   */
  onReportLongPress() {
    wx.showActionSheet({
      itemList: ['复制全部内容', '分享报告', '保存到相册'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.copyReportContent();
            break;
          case 1:
            this.shareReport();
            break;
          case 2:
            this.saveReportToAlbum();
            break;
        }
      }
    });

    // 添加触觉反馈
    wx.vibrateShort();
  },

  /**
   * 格式化时间 - iOS兼容版本
   */
  formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return hours + ':' + minutes + ':' + seconds;
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 页面分享配置
   */
  onShareAppMessage() {
    const task = this.data.taskDetail;
    return {
      title: task ? `${task.customerName || '客户'}的${task.type}分析报告` : '任务分析报告',
      path: `/pages/task-result/task-result?taskId=${this.data.taskId}&type=${encodeURIComponent(this.data.taskType)}`,
      imageUrl: '' // 可以设置分享图片
    };
  },

  /**
   * 分享到朋友圈配置
   */
  onShareTimeline() {
    const task = this.data.taskDetail;
    return {
      title: task ? `${task.customerName || '客户'}的${task.type}分析报告` : '任务分析报告',
      query: `taskId=${this.data.taskId}&type=${encodeURIComponent(this.data.taskType)}`,
      imageUrl: '' // 可以设置分享图片
    };
  }
});
