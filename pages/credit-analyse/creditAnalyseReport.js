// 征信分析报告页面
Page({
  data: {
    // 添加征信类型字段
    creditType: 'personal-credit', // 'personal-credit' 或 'business-credit'
    creditTypeName: '个人征信', // 用于显示的征信类型名称
    
    // 当前步骤状态（1表示表单填写, 2表示提取内容, 3表示AI思考, 4表示生成报告）
    activeStep: 1,
    
    // 表单数据
    formData: null,
    
    // 分析步骤状态
    extractionProgress: 0,
    extractedText: '',
    isExtracting: false, // 是否正在提取文字
    filePreviewUrl: null,
    isImageFile: false,
    fileList: [],

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
    // 从页面参数中获取征信类型
    const creditType = options.type || 'personal-credit';
    const creditTypeName = creditType === 'business-credit' ? '企业征信' : '个人征信';
    
    this.setData({
      creditType,
      creditTypeName
    });
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: `${creditTypeName}分析报告`
    });
    
    // 页面加载时的初始化
    // 如果是从表单页面跳转过来的，会带有参数
    if (options && options.fromForm) {
      // 设置为第2步（提取内容）
      this.setData({ activeStep: 2 });
      
      // 从全局数据中获取表单数据
      const app = getApp();
      if (app.globalData && app.globalData.creditFormData) {
        this.setData({
          formData: app.globalData.creditFormData,
          fileList: app.globalData.creditFormData.fileList || []
        });
        
        // 初始化文件预览
        if (this.data.fileList.length > 0) {
          this.createFilePreview(this.data.fileList[0]);
        }
        
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
  
  // 创建文件预览URL
  createFilePreview(file) {
    if (!file) return;
    
    // 检查文件类型
    const isImage = file.path && (file.path.endsWith('.png') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg'));
    this.setData({
      isImageFile: isImage,
      filePreviewUrl: file.path || file.tempFilePath
    });
    
    console.log('创建了文件预览:', file.name, isImage);
  },
  
  // 开始分析流程
  startAnalysis() {
    // 确保处于第2步（提取内容）
    this.setData({ activeStep: 2 });
    
    // 提取PDF文本内容
    if (this.data.formData && this.data.fileList.length > 0) {
      console.log('开始提取PDF内容');
      this.extractPDFContent(this.data.fileList[0]);
    } else {
      console.error('缺少文件数据，无法开始分析');
      wx.showToast({
        title: '缺少文件数据，无法开始分析',
        icon: 'none'
      });
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

  // 提取PDF内容
  extractPDFContent(pdfFile) {
    // 初始化提取状态 - 清空extractedText以显示placeholder
    this.setData({
      extractedText: '',
      isExtracting: true
    });
    
    // 模拟提取进度
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        clearInterval(progressInterval);
        return;
      }
      this.setData({ extractionProgress: progress });
    }, 200);
    
    // 模拟提取文本（实际项目中应调用真实的API）
    setTimeout(() => {
      clearInterval(progressInterval);
      
      // 模拟提取结果
      const extractedText = `个人信用报告
      
报告编号: CRCSR2023-09-12-00000001
报告时间: 2023年09月12日

一、个人基本信息
姓名: 张三
证件类型: 居民身份证
证件号码: 110101199001010001
报告时间: 2023年09月12日

二、信贷记录
1. 贷款记录
机构数: 2
笔数: 3
余额: 1,200,000元

贷款明细:
1) 机构: 某银行
   贷款类型: 个人住房贷款
   发放日期: 2020年01月01日
   到期日期: 2040年01月01日
   合同金额: 1,000,000元
   余额: 900,000元
   还款状态: 正常

2) 机构: 某银行
   贷款类型: 个人消费贷款
   发放日期: 2022年05月01日
   到期日期: 2025年05月01日
   合同金额: 300,000元
   余额: 200,000元
   还款状态: 正常

2. 信用卡记录
发卡机构数: 3
账户数: 4
授信总额: 200,000元
已用额度: 50,000元

信用卡明细:
1) 发卡机构: 某银行
   账户状态: 正常
   授信额度: 50,000元
   已用额度: 20,000元
   最近6个月平均使用额度: 15,000元

2) 发卡机构: 某银行
   账户状态: 正常
   授信额度: 80,000元
   已用额度: 10,000元
   最近6个月平均使用额度: 8,000元

三、公共记录
无不良记录

四、查询记录
最近2年内被查询: 8次
贷款审批查询: 3次
信用卡审批查询: 2次
本人查询: 3次`;
      
      this.setData({
        extractedText: extractedText,
        extractionProgress: 100,
        isExtracting: false
      });
      
      // 开始匹配计时器并显示匹配蒙层
      this.setData({ workingStatus: 'working' });
      this.startWorkingTimer();
      
      // 模拟等待AI服务器响应时间3秒，之后进入AI思考分析步骤（第3步）
      setTimeout(() => {
        this.nextStep();
      }, 3000);//功能调试期间暂时加大等待时间，不得改回3000
    }, 4000);
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
  
  // 开始征信分析
  startAiWorking() {
    try {
      // 设置完整的AI思考过程数据
      const fullThinkingProcess = `正在分析征信报告...

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
      console.error('征信分析时出错:', error);
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
  
  // 完成思考过程
  completeThinking() {
    // 清除计时器
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    // 显示完整思考内容
    this.setData({
      displayedThinkingProcess: this.data.aiThinkingProcess,
      isThinking: false
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
        // 生成征信分析报告
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
    
    const reportContent = `# ${this.data.creditTypeName}分析报告

编制日期：${currentDate}

## 一、${this.data.creditType === 'business-credit' ? '企业' : '个人'}基本信息

**${this.data.creditType === 'business-credit' ? '企业名称' : '姓名'}**：${this.data.formData?.customerName || '未知客户'}
**报告类型**：${this.data.creditTypeName}报告
**报告期限**：截至 ${currentDate}
**报告用途**：${this.data.creditType === 'business-credit' ? '企业融资审批参考' : '购房贷款审批参考'}

## 二、征信数据分析

### 信用评分与风险等级

- **信用评分**：良好
- **风险等级**：低风险
- **总体情况**：征信状况健康，无重大不良记录

${this.data.creditType === 'business-credit' ? `### 企业贷款情况概述

- **现有贷款**：3笔（2笔经营贷款，1笔设备贷款）
- **贷款总额**：约500万元
- **剩余金额**：约450万元
- **还款状态**：正常还款中，无逾期

### 企业信用记录

- **银行授信额度**：800万元
- **已使用额度**：450万元（使用率56.25%）
- **担保情况**：有第三方担保
- **当前状态**：正常使用，无逾期

### 征信查询记录

- **近2年查询次数**：12次
- **贷款审批查询**：6次
- **授信审批查询**：4次
- **企业自查**：2次` : `### 贷款情况概述

- **现有贷款**：2笔（1笔住房贷款，1笔消费贷款）
- **贷款总额**：约120万元
- **剩余金额**：约110万元
- **还款状态**：正常还款中，无逾期

### 信用卡使用情况

- **持有信用卡**：4张
- **总授信额度**：20万元
- **已使用额度**：5万元（使用率25%）
- **当前状态**：正常使用，无逾期

### 征信查询记录

- **近2年查询次数**：8次
- **贷款审批查询**：3次
- **信用卡审批查询**：2次
- **本人查询**：3次`}

## 三、风险评估

${this.data.creditType === 'business-credit' ? `### 企业还款能力分析

- **年营业收入估算**：约2,000万元
- **年债务支出**：约600万元
- **资产负债比**：约30%
- **评估结果**：资产负债比处于合理范围，企业还款能力良好

### 企业经营评估

- **经营历史长度**：8年
- **历史逾期情况**：无明显逾期记录
- **评估结果**：经营稳定，信用记录良好

### 特殊记录分析

- **司法记录**：无
- **行政处罚**：无
- **执行记录**：无
- **不良信用记录**：无
- **评估结果**：无任何特殊不良记录，企业信用状况良好

## 四、融资申请可行性分析

### 企业贷款申请评估

- **贷款申请类型**：企业经营贷款
- **申请可行性**：高
- **建议贷款额度**：约200-300万元
- **建议贷款期限**：3-5年
- **预计年利率**：约5.5%-7.0%（基于当前市场利率）` : `### 还款能力分析

- **月收入估算**：约20,000元
- **月债务支出**：约8,000元
- **债务收入比**：约40%
- **评估结果**：债务收入比处于合理上限（建议不超过40%），还款能力尚可

### 信用历史评估

- **信用历史长度**：良好
- **历史逾期情况**：无明显逾期记录
- **评估结果**：信用历史稳定，为良好信用等级

### 特殊记录分析

- **司法记录**：无
- **行政处罚**：无
- **执行记录**：无
- **不良信用记录**：无
- **评估结果**：无任何特殊不良记录，信用状况良好

## 四、贷款申请可行性分析

### 购房贷款申请评估

- **贷款申请类型**：个人住房贷款
- **申请可行性**：中高
- **建议贷款额度**：约80-100万元
- **建议贷款期限**：25-30年
- **预计月供**：约4,000-5,000元（基于当前利率）`}

${this.data.creditType === 'business-credit' ? `### 可能影响申请的因素

- **正面因素**：
  - 企业经营稳定，信用记录良好
  - 现有贷款按时还款，无逾期记录
  - 无不良征信记录，各项指标健康
  - 企业资产负债比合理

- **需要关注的因素**：
  - 现有授信使用率较高，可能影响新增授信
  - 需关注行业风险和市场变化

## 五、优化建议

1. **短期建议（1-3个月）**
   - 保持良好的银行流水记录
   - 确保所有贷款按时足额还款
   - 减少非必要的征信查询

2. **中期建议（3-6个月）**
   - 适当降低现有授信使用率
   - 稳定企业经营状况和现金流
   - 完善企业财务管理制度

3. **长期建议（6个月以上）**
   - 建立多元化的融资渠道
   - 维持长期稳定的还款历史
   - 提升企业盈利能力和抗风险能力` : `### 可能影响申请的因素

- **正面因素**：
  - 信用历史良好，无逾期记录
  - 现有贷款按时还款，信用卡使用正常
  - 无不良征信记录，各项指标健康

- **需要关注的因素**：
  - 现有债务水平较高，可能影响新增贷款的审批
  - 债务收入比接近上限，需关注还款压力

## 五、优化建议

1. **短期建议（1-3个月）**
   - 保持信用卡低使用率（建议控制在30%以下）
   - 确保所有账单按时足额还款
   - 减少非必要的征信查询

2. **中期建议（3-6个月）**
   - 适当减少现有债务，特别是消费贷款
   - 稳定当前收入和就业状况
   - 避免频繁变换工作或收入来源

3. **长期建议（6个月以上）**
   - 建立多元化的信用记录
   - 维持长期稳定的还款历史
   - 提高收入水平，改善债务收入比`}

${this.data.creditType === 'business-credit' ? `## 六、融资申请策略

### 最佳申请时机

基于当前征信状况，建议在2-3个月后申请企业贷款，以便：
- 进一步优化企业财务结构
- 降低现有授信使用率
- 持续积累良好的还款记录

### 融资申请准备

申请企业贷款时建议准备的材料：
1. 企业营业执照、组织机构代码证
2. 近12个月银行流水和财务报表
3. 企业经营状况证明材料
4. 企业资产和负债清单
5. 税务缴纳记录和完税证明

### 融资沟通策略

与银行沟通时可强调以下有利因素：
- 良好的企业信用历史和还款记录
- 稳定的经营状况和现金流
- 合理的资产负债比
- 无任何不良征信记录

## 七、结论

基于对企业征信报告的全面分析，该企业目前具备良好的信用状况和还款能力，是银行融资的优质客户。从征信角度看，申请企业贷款获批的可能性较高。建议企业可以在短期内完成征信优化后，按推荐策略申请融资。` : `## 六、贷款申请策略

### 最佳申请时机

基于当前征信状况，建议在3-6个月后申请住房贷款，以便：
- 进一步降低现有债务水平
- 改善债务收入比
- 持续积累良好的还款记录

### 贷款申请准备

申请贷款时建议准备的材料：
1. 个人身份证件、户口本
2. 近6个月银行流水（体现稳定收入）
3. 工作收入证明（至少6个月以上）
4. 现有房产和负债清单
5. 税单或社保缴纳记录

### 贷款沟通策略

与银行沟通时可强调以下有利因素：
- 良好的信用历史和还款记录
- 稳定的工作和收入来源
- 合理的债务收入比
- 无任何不良征信记录

## 七、结论

基于对征信报告的全面分析，申请人目前具备良好的信用状况和还款能力，是银行贷款的优质客户。从征信角度看，申请住房贷款获批的可能性较高，但需要关注现有债务水平和债务收入比。建议申请人可以在短期内完成征信优化后，按推荐策略申请贷款。`}`;

    // 将Markdown转换为HTML（简单实现，实际项目中可使用第三方库）
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
  
  // 简单的Markdown转HTML函数（实际项目中应使用专业库）
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
    if (this.data.activeStep < 4) {
      this.setData({
        activeStep: this.data.activeStep + 1
      });
      
      // 根据当前步骤执行相应的操作
      if (this.data.activeStep === 3) {
        // 征信分析步骤
        this.startAiWorking();
      }
    }
  },
  

  
  // 查看上传文件（步骤2中的悬浮按钮功能）
  viewUploadedFile() {
    console.log('查看上传文件，文件类型:', this.data.isImageFile ? '图片' : 'PDF');

    if (!this.data.filePreviewUrl) {
      wx.showToast({
        title: '文件加载中，请稍候',
        icon: 'none'
      });
      return;
    }

    if (this.data.isImageFile) {
      // 如果是图片，使用预览图片API
      const urls = this.data.fileList.map(file => file.tempFilePath || file.path);
      wx.previewImage({
        current: this.data.filePreviewUrl,
        urls: urls.length > 0 ? urls : [this.data.filePreviewUrl],
        success: () => {
          console.log('图片预览成功');
        },
        fail: (error) => {
          console.error('图片预览失败:', error);
          wx.showToast({
            title: '图片预览失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 如果是PDF，调用 openDocument 方法
      this.openDocument();
    }
  },

  // 查看征信文件（步骤4中的按钮功能）
  viewCreditFile() {
    if (this.data.filePreviewUrl) {
      if (this.data.isImageFile) {
        // 如果是图片，使用预览图片API
        wx.previewImage({
          current: this.data.filePreviewUrl,
          urls: [this.data.filePreviewUrl]
        });
      } else {
        // 如果是PDF，调用 openDocument 方法
        this.openDocument();
      }
    }
  },
  
  openDocument() {
    const filePath = this.data.filePreviewUrl;
    if (!filePath || this.data.isImageFile) {
      return;
    }
    
    wx.showLoading({
      title: '正在打开文件',
    });

    wx.openDocument({
      filePath: filePath,
      showMenu: true,
      success: () => {
        wx.hideLoading();
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '打开文件失败',
          icon: 'none',
        });
        console.error('打开文件失败', err);
      }
    });
  },
  
  // 重新开始顾问流程
  restartAdvisor() {
    // 提示用户确认重新开始
    wx.showModal({
      title: '操作提示',
      content: '确定要开始新的征信分析流程吗？',
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
            lastScrollTime: 0,
            extractionProgress: 0,
            extractedText: '',
            filePreviewUrl: null,
            isImageFile: false,
            fileList: []
          });
          
          // 停止所有计时器
          this.stopWorkingTimer();
          if (this.thinkingInterval) {
            clearInterval(this.thinkingInterval);
            this.thinkingInterval = null;
          }
          
          // 跳转回上传页面
          wx.redirectTo({
            url: '/pages/credit-analyse/creditAnalyseForm'
          });
        }
      }
    });
  },

  // 分享征信分析报告
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
          content: '征信分析报告已复制到剪贴板，您可以粘贴到微信等应用中分享给好友',
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

  onUnload() {
    // 页面卸载时清理资源
    this.stopWorkingTimer();
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
  }
});