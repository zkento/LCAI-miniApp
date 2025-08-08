// 购房建议报告页面
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
      if (app.globalData && app.globalData.propertyFormData) {
        this.setData({
          formData: app.globalData.propertyFormData
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

  // 开始购房分析
  startAiWorking() {
    try {
      // 设置完整的AI思考过程数据
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

基于以上分析，我将推荐符合条件的优质房源，并提供详细的购房建议报告。`;

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
      console.error('购房分析时出错:', error);
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
        // 生成购房建议报告
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
    
    const reportContent = `# 购房建议报告

编制日期：${currentDate}

## 一、客户需求概述

**客户姓名**：${this.data.formData?.customerName || '客户'}
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

  // 分享购房建议报告
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
          content: '购房建议报告已复制到剪贴板，您可以粘贴到微信等应用中分享给好友',
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
      content: '确定要开始新的购房顾问流程吗？',
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
            url: '/pages/property-advice/propertyAdvisorForm'
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