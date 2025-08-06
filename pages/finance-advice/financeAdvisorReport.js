// 融资建议报告页面
Page({
  data: {
    // 当前步骤状态（1表示表单填写, 2表示AI思考, 3表示生成报告）
    activeStep: 1,
    
    // Tab相关
    activeReportTab: 'report', // 'report'表示分析结果报告, 'thinking'表示分析思考过程
    
    // 表单数据
    formData: null,
    
    // 匹配状态
    workingStatus: 'idle', // idle, working, thinking, generating, complete
    
    // 匹配计时器
    workingTimer: 1,
    
    // AI匹配思考过程
    aiThinkingProcess: '',
    displayedThinkingProcess: '', // 用于逐字显示的思考过程
    isThinking: false, // AI是否正在思考
    thinkingScrollTarget: '', // 滚动目标ID
    lastScrollTime: 0, // 上次滚动时间，用于控制滚动频率
    
    // 报告内容
    reportContent: '',
    reportContentHtml: '',
    reportGenerationDuration: 0
  },

  onLoad(options) {
    // 页面加载时的初始化
    // 如果是从表单页面跳转过来的，会带有参数
    if (options && options.fromForm) {
      // 设置为第2步（AI思考）
      this.setData({ activeStep: 2 });
      
      // 从全局数据中获取表单数据
      const app = getApp();
      if (app.globalData && app.globalData.financeFormData) {
        this.setData({
          formData: app.globalData.financeFormData
        });
        
        // 启动分析流程
        this.startAnalysis();
      } else {
        // 如果没有表单数据，回到第一步
        this.setData({ activeStep: 1 });
      }
    }
  },
  
  // 处理导航栏返回事件
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 开始分析流程
  startAnalysis() {
    // 确保处于第2步（AI思考）
    this.setData({ activeStep: 2 });
    
    // 开始匹配计时器并显示匹配蒙层
    this.setData({ workingStatus: 'working' });
    this.startWorkingTimer();
    
    // 模拟等待AI服务器响应时间3秒，之后进入AI思考分析步骤
    setTimeout(() => {
      this.startAiWorking();
    }, 3000);
  },
  
  // 开始匹配计时器
  startWorkingTimer() {
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
  
  // 自动滚动到思考内容底部
  scrollToThinkingBottom() {
    const now = Date.now();
    // 限制滚动频率，每150ms最多滚动一次
    if (now - this.data.lastScrollTime < 150) {
      return;
    }

    // 使用nextTick确保DOM更新完成后再滚动
    wx.nextTick(() => {
      // 方法1: 使用scroll-into-view
      this.setData({
        thinkingScrollTarget: 'thinking-bottom',
        lastScrollTime: now
      });

      // 方法2: 备用方案，使用pageScrollTo滚动到底部
      setTimeout(() => {
        const query = wx.createSelectorQuery();
        query.select('#thinking-content').boundingClientRect((rect) => {
          if (rect) {
            // 滚动到内容底部
            wx.pageScrollTo({
              scrollTop: rect.bottom,
              duration: 300
            });
          }
        }).exec();

        // 清除滚动目标
        this.setData({
          thinkingScrollTarget: ''
        });
      }, 100);
    });
  },
  
  // 开始融资分析
  startAiWorking() {
    try {
      // 设置完整的AI思考过程数据
      const fullThinkingProcess = `正在分析客户融资需求...

思考过程：
嗯，用户给了一个PDF文件，看起来是个人信用报告。我需要仔细分析里面的内容，然后给出专业的建议。首先，我要理解各个表格和数据的含义。

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

      // 开始模拟AI思考过程逐字显示
      this.setData({
        aiThinkingProcess: fullThinkingProcess, // 保存完整内容以便后续使用
        displayedThinkingProcess: '', // 清空已显示的内容
        workingStatus: 'thinking',
        isThinking: true
      });
      
      // 计算文本总长度和每秒应该显示的字符数，以确保在30-50秒内完成
      const totalLength = fullThinkingProcess.length;
      // 每秒应该处理的字符数，按40秒计算（为了保证在30-50秒的区间内）
      const charsPerSecond = totalLength / 40;
      
      let thinkingIndex = 0;
      const startTime = Date.now();
      
      // 启动逐字显示
      this.thinkingInterval = setInterval(() => {
        if (thinkingIndex < fullThinkingProcess.length) {
          // 计算当前已经过的时间(秒)
          const elapsedTime = (Date.now() - startTime) / 1000;
          
          // 计算按当前速度应该显示到的索引位置
          const targetIndex = Math.floor(elapsedTime * charsPerSecond);
          
          // 计算本次应该显示多少字符
          let chunkSize = 1;
          
          // 如果落后于目标进度，则加速
          if (thinkingIndex < targetIndex - 20) {
            chunkSize = 3; // 严重落后，快速追赶
          } else if (thinkingIndex < targetIndex - 5) {
            chunkSize = 2; // 略有落后，稍微加速
          }
          
          // 保证不会越界
          const remainingChars = fullThinkingProcess.length - thinkingIndex;
          const actualChunkSize = Math.min(chunkSize, remainingChars);
          
          // 添加字符块到显示内容
          const nextChunk = fullThinkingProcess.substring(thinkingIndex, thinkingIndex + actualChunkSize);
          
          this.setData({
            displayedThinkingProcess: this.data.displayedThinkingProcess + nextChunk
          });

          // 自动滚动到底部
          this.scrollToThinkingBottom();
          
          thinkingIndex += actualChunkSize;
          
          // 检查是否遇到特殊字符需要停顿
          const lastChar = nextChunk[nextChunk.length - 1];
          if (lastChar === '。' || lastChar === '\n' || lastChar === '：') {
            // 句子结束后稍微暂停
            clearInterval(this.thinkingInterval);
            setTimeout(() => {
              // 继续逐字显示
              this.thinkingInterval = setInterval(() => {
                if (thinkingIndex < fullThinkingProcess.length) {
                  const nextChar = fullThinkingProcess[thinkingIndex];
                  
                  this.setData({
                    displayedThinkingProcess: this.data.displayedThinkingProcess + nextChar
                  });

                  // 自动滚动到底部
                  this.scrollToThinkingBottom();
                  
                  thinkingIndex++;
                } else {
                  // 处理完成
                  this.finishThinking(startTime);
                }
              }, 40); // 句末后的显示速度
            }, 300); // 句末停顿时间
            return;
          }
        } else {
          // 所有内容显示完毕
          this.finishThinking(startTime);
        }
      }, 40);
    } catch (error) {
      console.error('融资分析时出错:', error);
      this.setData({ workingStatus: 'error' });
      this.stopWorkingTimer();
    }
  },
  
  // 定义结束显示的函数
  finishThinking(startTime) {
    // 计算已经过的时间
    const elapsedMs = Date.now() - startTime;
    const elapsedSec = elapsedMs / 1000;
    
    console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒`);
    
    // 清除原有的逐字显示计时器
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    // 直接完成，不再等待最少30秒
    this.completeThinking();
  },
  
  /**
   * 完成思考过程并准备生成报告
   */
  completeThinking() {
    // 清除计时器
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    // 显示完整思考内容
    this.setData({
      displayedThinkingProcess: this.data.aiThinkingProcess,
      isThinking: false,
      // 同时保存思考过程用于Tab显示
      aiThinkingProcess: this.data.aiThinkingProcess
    });
    
    // 滚动到底部显示完整内容
    setTimeout(() => {
      this.scrollToThinkingBottom();
    }, 100);
    
    // 延迟一会，让用户看到完整的思考过程
    setTimeout(() => {
      // 转换为生成报告状态，添加过渡效果
      this.setData({ workingStatus: 'generating' });
      
      // 延迟约3秒后生成报告，提供良好的过渡体验
      setTimeout(() => {
        // 生成融资建议报告
        this.generateReport();
      }, 3000);
    }, 1000);
  },
  
  // 生成报告
  generateReport() {
    const currentDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    const reportContent = `# 融资顾问报告

编制日期：${currentDate}

## 一、客户基本信息

**客户姓名**：${this.data.formData?.name || '客户'}
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
    
    // 将Markdown转换为HTML
    const reportContentHtml = this.markdownToHtml(reportContent);
    
    // 更新状态为完成
    this.setData({
      workingStatus: 'complete',
      reportContent: reportContent,
      reportContentHtml: reportContentHtml,
      reportGenerationDuration: this.data.workingTimer
    });
    
    this.stopWorkingTimer();
    
    // 进入下一步
    this.nextStep();
  },
  
  // 简单的Markdown转HTML函数
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 简单替换标题
    let html = markdown
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '<br>• ');
    
    // 包装在段落中
    html = '<p>' + html + '</p>';
    
    return html;
  },
  
  // 进入下一步
  nextStep() {
    if (this.data.activeStep < 3) {
      this.setData({
        activeStep: this.data.activeStep + 1
      });
    }
  },
  
  // 分享融资建议报告
  shareReport() {
    if (!this.data.reportContent) {
      wx.showToast({
        title: '暂无报告内容可分享',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示分享选项
    wx.showActionSheet({
      itemList: ['复制文本分享', '生成PDF分享'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.shareText();
            break;
          case 1:
            this.showPdfShareLimitation();
            break;
        }
      }
    });
  },

  // 截图分享
  showPdfShareLimitation() {
    wx.showModal({
      title: '功能提示',
      content: '此功能在demo版本中暂不支持，将在正式开发项目时完整实现',
      confirmText: '知道了',
      showCancel: false
    });
  },

  // 文本分享
  shareText() {
    // 将报告内容复制到剪贴板
    wx.setClipboardData({
      data: this.data.reportContent,
      success: () => {
        wx.showModal({
          title: '复制成功',
          content: '融资建议报告已复制到剪贴板，您可以粘贴到微信等应用中分享给好友',
          confirmText: '知道了',
          showCancel: false
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  
  // 重新开始顾问流程
  restartAdvisor() {
    // 提示用户确认重新开始
    wx.showModal({
      title: '操作提示',
      content: '确定要开始新的融资顾问流程吗？',
      confirmText: '确定',
      cancelText: '取消',
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
            thinkingScrollTarget: '',
            lastScrollTime: 0
          });
          
          // 停止所有计时器
          this.stopWorkingTimer();
          if (this.thinkingInterval) {
            clearInterval(this.thinkingInterval);
            this.thinkingInterval = null;
          }
          
          // 跳转回表单页面
          wx.redirectTo({
            url: '/pages/finance-advice/financeAdvisorForm'
          });
        }
      }
    });
  },

  /**
   * Tab切换事件处理
   */
  onReportTabChange(event) {
    const tabName = event.detail.name;
    this.setData({
      activeReportTab: tabName
    });
    console.log('切换到Tab:', tabName);
  },

  onUnload() {
    // 页面卸载时清理资源
    this.stopWorkingTimer();
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
  }
}); 