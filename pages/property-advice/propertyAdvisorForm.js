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
        title: '1. 核心需求',
        items: [
          { label: '预算范围', example: '如总价600万左右，首付3成' },
          { label: '购房目的', example: '自住/投资/改善/养老/子女教育' },
          { label: '意向区域', example: '如天河区珠江新城、海珠区琶洲' },
          { label: '户型需求', example: '如3房2卫' },
        ]
      },
      {
        title: '2. 居住偏好',
        items: [
          
          { label: '面积区间', example: '如建面80-100㎡' },
          { label: '楼层要求', example: '低楼层/中楼层/高楼层/顶楼带露台' },
          { label: '朝向要求', example: '南北通透/东向/西向/南向/北向' },
          { label: '装修标准', example: '翻新/简装/精装/豪装' }
        ]
      },
      {
        title: '3. 配套要求',
        items: [
          { label: '交通便利', example: '如地铁步行10分钟内' },
          { label: '教育资源', example: '如省级学位小学' },
          { label: '商圈覆盖', example: '商场/超市/菜市场需求' },
          { label: '医疗条件', example: '三甲医院车程要求' },
          { label: '景观要求', example: '江景/公园/无硬性要求' }
        ]
      },
      {
        title: '4. 特殊关注',
        items: [
          { label: '产权性质', example: '商品房/公寓/法拍房' },
          { label: '楼龄要求', example: '次新房/5-10年/10-20年/20年以上' },
          { label: '交易周期', example: '急需/可等合适房源' },
          { label: '抗性因素', example: '临高架/加油站/殡仪馆等' }
        ]
      },
      {
        title: '5. 金融服务',
        items: [
          { label: '按揭贷款', example: '是否需要按揭贷款' },
          { label: '购房融资', example: '若全款购房是否需要抵押融资' }
        ]
      }
    ],
    
    // 提取任务控制
    analysisTaskId: 0,
    lastAnalyzedText: '',
    
    // 窗口信息
    windowWidth: 0,
    windowHeight: 0,
    scrollViewHeight: '100vh',
    
    // 滚动相关
    scrollIntoView: '', // 滚动到指定视图
    scrollTop: 0,       // 滚动位置
    lastScrollTime: 0   // 上次滚动时间
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
    
    // 确保金融服务字段已初始化，使用完整对象替换而不是直接修改属性
    const initialEditableResults = {
      ...this.data.editableResults,
      '5. 金融服务': {
        '按揭贷款': '无此信息，建议补充',
        '购房融资': '无此信息，建议补充'
      }
    };
    
    this.setData({
      editableResults: initialEditableResults,
      originalAIResults: {} // 初始化原始AI分析结果对象，用于保存编辑前的值
    });
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
    
    // 确保所有组和项都被初始化
    this.data.requirementGuide.forEach(group => {
      results[group.title] = {};
      group.items.forEach(item => {
        results[group.title][item.label] = '无此信息，建议补充';
        const key = group.title + item.label;
        editing[key] = false;
        showIcon[key] = false;
      });
    });
    
    // 确保金融服务字段被正确初始化
    if (!results['5. 金融服务']) {
      results['5. 金融服务'] = {};
    }
    results['5. 金融服务']['按揭贷款'] = '无此信息，建议补充';
    results['5. 金融服务']['购房融资'] = '无此信息，建议补充';
    
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
      submitting: false,
      originalAIResults: {} // 重置原始AI分析结果
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
      currentAnalysisTime: 1
    });
    
    this.analysisTimerInterval = setInterval(() => {
      if (this.data.analysisStartTime > 0) {
        const currentTime = Math.round((Date.now() - this.data.analysisStartTime) / 1000) + 1;
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
      const duration = Math.round((Date.now() - this.data.analysisStartTime) / 1000) + 1;
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
      currentAnalysisTime: 1
    });
  },

  // 分析客户需求
  analyzeRequirements() {
    // 如果已经在分析中，不重复执行
    if (this.data.isAnalyzing) {
      return;
    }
    
    // 检查需求描述是否为空
    if (!this.data.formData.requirements || this.data.formData.requirements.trim() === '') {
      wx.showToast({
        title: '请输入客户购房需求',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 检查需求描述是否达到最小字数要求
    const trimmedText = this.data.formData.requirements.trim();
    if (trimmedText.length < 30) {
      wx.showToast({
        title: '请输入30个字以上的客户购房需求',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 重置分析计时器
    this.resetAnalysisTimer();
    
    // 初始化可编辑结果
    this.initEditableResults();

    // 确保金融服务字段存在默认值，使用完整对象替换
    const initialEditableResults = {
      ...this.data.editableResults,
      '5. 金融服务': {
        '按揭贷款': '无此信息，建议补充',
        '购房融资': '无此信息，建议补充'
    }
    };
    
    this.setData({
      editableResults: initialEditableResults,
      lastAnalyzedText: trimmedText,
      isAnalyzing: true
    });
    
    // 开始计时
    this.startAnalysisTimer();
    
    // 模拟AI分析过程
    setTimeout(() => {
      // 分析文本，提取关键信息
      this.extractRequirementInfo(trimmedText);
      
      // 停止计时
      this.stopAnalysisTimer();
      
      // 设置分析完成状态
    this.setData({
        isAnalyzing: false,
        hasAnalysisResult: true
    });
    
      // 自动滚动到分析结果区域
    setTimeout(() => {
        this.scrollToAnalysisContent();
      }, 300);
    }, 3000);
  },

  // 提取需求信息
  extractRequirementInfo(text) {
    // 类别映射 - 将组标题映射到分析结果的类别
    const categoryMapping = {
      '1. 核心需求': ['核心需求', '预算', '预算信息', '基本信息', '核心信息', '主要需求', '区位偏好', '购房用途', '附加需求', '预算', '区域偏好', '购房目的'],
      '2. 居住偏好': ['居住偏好', '房源要求', '户型需求', '房屋属性', '居住要求', '房型偏好', '房源要求', '户型需求', '房屋条件'],
      '3. 配套要求': ['配套要求', '周边配套', '区位偏好', '区位要求', '配套设施', '地段要求', '附加需求', '区位偏好', '配套设施', '周边配套'],
      '4. 特殊关注': ['特殊关注', '附加需求', '特殊要求', '其他要求', '附加条件', '物业属性', '房源要求', '物业属性', '房屋条件'],
      '5. 金融服务': ['金融服务', '金融需求', '贷款信息', '融资需求', '按揭信息', '贷款需求']
    };
    
    // 标签映射 - 匹配不同名称的相似字段
    const labelMappings = {
      '预算范围': ['预算范围', '总价范围', '总价', '预算', '总预算', '价格范围', '价格区间'],
      '购房目的': ['购房目的', '购房用途', '用途', '主要用途', '购买目的'],
      '意向区域': ['意向区域', '区域', '位置', '地点', '行政区', '区位', '首选区域'],
      '户型需求': ['户型需求', '户型', '户型结构', '房型', '房屋类型', '户型偏好'],
      '面积区间': ['面积区间', '面积范围', '面积', '建筑面积', '使用面积', '建面'],
      '楼层要求': ['楼层要求', '楼层', '楼层偏好', '所在楼层', '楼层需求'],
      '朝向要求': ['朝向要求', '朝向', '朝向偏好', '采光方向', '朝向需求'],
      '装修标准': ['装修标准', '装修要求', '装修程度', '装修', '装修情况', '装修水平'],
      '交通便利': ['交通便利', '交通', '交通要求', '交通配套', '出行', '地铁要求'],
      '教育资源': ['教育资源', '学位要求', '学区', '学位', '教育', '学校'],
      '商圈覆盖': ['商圈覆盖', '商业配套', '商场', '商业', '购物'],
      '医疗条件': ['医疗条件', '医疗配套', '医院', '诊所', '医疗'],
      '景观要求': ['景观要求', '景观', '视野', '景色', '风景'],
      '产权性质': ['产权性质', '产权', '房屋产权', '产权年限', '产权要求'],
      '楼龄要求': ['楼龄要求', '楼龄', '房龄', '建筑年代', '房屋年龄', '楼龄限制'],
      '交易周期': ['交易周期', '交易时间', '交易要求', '交易限制'],
      '抗性因素': ['抗性因素', '避嫌设施', '避免区域', '规避设施', '禁忌因素'],
      '按揭贷款': ['按揭贷款', '按揭', '贷款', '贷款需求', '按揭需求', '是否需要贷款'],
      '购房融资': ['购房融资', '抵押融资', '购房融资', '房产抵押', '抵押贷款', '是否需要抵押融资']
    };
    
    // 模拟AI分析结果 - 基于用户输入的文本进行简单的关键词提取
    // 在实际应用中，这里应该调用AI接口进行分析
    const analysisResult = this.simulateAIAnalysis(text, categoryMapping, labelMappings);
    
    // 从分析结果中提取所需信息，构建可编辑结果
    const extractedResults = {};
    
    // 遍历需求指南中的每个类别
    Object.keys(categoryMapping).forEach(groupTitle => {
      extractedResults[groupTitle] = {};
      
      // 获取该组下的所有标签
      const groupLabels = this.data.requirementGuide.find(group => group.title === groupTitle)?.items.map(item => item.label) || [];
      
      // 为每个标签提取值
      groupLabels.forEach(label => {
        const value = this.getItemValue(analysisResult, groupTitle, label, categoryMapping, labelMappings);
        extractedResults[groupTitle][label] = value;
      });
    });
    
    // 特殊处理：如果按揭贷款为"需要"，自动设置购房后融资为"-"
    if (extractedResults['5. 金融服务'] && extractedResults['5. 金融服务']['按揭贷款'] === '需要') {
      extractedResults['5. 金融服务']['购房融资'] = '-';
    } else if (extractedResults['5. 金融服务'] && extractedResults['5. 金融服务']['按揭贷款'] === '不需要') {
      // 如果是不需要按揭贷款，但没有明确的购房后融资信息，则保持为"无此信息，建议补充"
      if (extractedResults['5. 金融服务']['购房融资'] === '无此信息，建议补充') {
        // 保持原样
      }
    }
    
    // 更新分析结果
      this.setData({
      editableResults: extractedResults,
      analysisResult: analysisResult // 保存原始分析结果，用于后续处理
    });
    
    // 生成需求建议
    this.generateRequirementSuggestion();
  },
  
  // 模拟AI分析结果
  simulateAIAnalysis(text, categoryMapping, labelMappings) {
    const result = [];
    
    // 简单的关键词匹配逻辑
    // 预算范围
    const budgetMatch = text.match(/(\d{2,}[\-－到至]?\d{2,}万|总价\s*\d{2,}[\-－到至]?\d{2,}万|\d{2,}万[\-－到至]?\d{2,}万)/);
    if (budgetMatch) {
      result.push({
        category: '核心需求',
        items: [{ label: '预算范围', value: budgetMatch[0] }]
      });
    }
    
    // 购房目的
    const purposeMatch = text.match(/(自住|投资|改善|养老|学区|教育|子女)/);
    if (purposeMatch) {
      result.push({
        category: '核心需求',
        items: [{ label: '购房目的', value: purposeMatch[0] }]
      });
    }
    
    // 意向区域
    const areaMatch = text.match(/([一-龥]{1,3}区|[一-龥]{1,3}城|[一-龥]{2,4}地段)/);
    if (areaMatch) {
      result.push({
        category: '核心需求',
        items: [{ label: '意向区域', value: areaMatch[0] }]
      });
    }
    
    // 户型需求
    const houseTypeMatch = text.match(/(\d房\d厅|\d室\d厅|\d房|\d室|\d居室)/);
    if (houseTypeMatch) {
      result.push({
        category: '核心需求',
        items: [{ label: '户型需求', value: houseTypeMatch[0] }]
      });
    }
    
    // 面积区间
    const areaRangeMatch = text.match(/(\d{2,}[\-－到至]?\d{2,}平|面积\s*\d{2,}[\-－到至]?\d{2,}平|\d{2,}平[\-－到至]?\d{2,}平|\d{2,}[\-－到至]?\d{2,}㎡|面积\s*\d{2,}[\-－到至]?\d{2,}㎡|\d{2,}㎡[\-－到至]?\d{2,}㎡)/);
    if (areaRangeMatch) {
      result.push({
        category: '居住偏好',
        items: [{ label: '面积区间', value: areaRangeMatch[0] }]
      });
    }
    
    // 楼层要求
    const floorMatch = text.match(/(高层|中层|低层|底层|顶层|\d{1,2}层以上|\d{1,2}[\-－到至]\d{1,2}层)/);
    if (floorMatch) {
      result.push({
        category: '居住偏好',
        items: [{ label: '楼层要求', value: floorMatch[0] }]
      });
    }
    
    // 朝向要求
    const orientationMatch = text.match(/(南北通透|朝南|朝北|朝东|朝西|东南|西南|东北|西北|南向|北向|东向|西向)/);
    if (orientationMatch) {
      result.push({
        category: '居住偏好',
        items: [{ label: '朝向要求', value: orientationMatch[0] }]
      });
    }
    
    // 装修标准
    const decorationMatch = text.match(/(精装|简装|毛坯|豪装|中装|装修|翻新)/);
    if (decorationMatch) {
      result.push({
        category: '居住偏好',
        items: [{ label: '装修标准', value: decorationMatch[0] }]
      });
    }
    
    // 交通便利
    const trafficMatch = text.match(/(地铁|公交|高铁|轻轨|站|线路|交通便利|通勤|出行方便)/);
    if (trafficMatch) {
      result.push({
        category: '配套要求',
        items: [{ label: '交通便利', value: trafficMatch[0] + '便利' }]
      });
    }
    
    // 教育资源
    const educationMatch = text.match(/(学校|幼儿园|小学|中学|高中|学区|学位|教育)/);
    if (educationMatch) {
      result.push({
        category: '配套要求',
        items: [{ label: '教育资源', value: educationMatch[0] + '资源丰富' }]
      });
    }
    
    // 商圈覆盖
    const commercialMatch = text.match(/(商场|超市|商业|购物|商圈|市场)/);
    if (commercialMatch) {
      result.push({
        category: '配套要求',
        items: [{ label: '商圈覆盖', value: commercialMatch[0] + '周边' }]
      });
    }
    
    // 医疗条件
    const medicalMatch = text.match(/(医院|诊所|医疗|保健|康复|养生)/);
    if (medicalMatch) {
      result.push({
        category: '配套要求',
        items: [{ label: '医疗条件', value: medicalMatch[0] + '设施完善' }]
      });
    }
    
    // 景观要求
    const viewMatch = text.match(/(江景|湖景|山景|公园|绿化|景观|视野|风景)/);
    if (viewMatch) {
      result.push({
        category: '配套要求',
        items: [{ label: '景观要求', value: viewMatch[0] }]
      });
    }
    
    // 产权性质
    const propertyMatch = text.match(/(商品房|住宅|公寓|商住两用|商铺|写字楼|产权|年限)/);
    if (propertyMatch) {
      result.push({
        category: '特殊关注',
        items: [{ label: '产权性质', value: propertyMatch[0] }]
      });
    }
    
    // 楼龄要求
    const buildingAgeMatch = text.match(/(\d{1,2}年内|新房|二手房|新小区|老小区|楼龄|房龄)/);
    if (buildingAgeMatch) {
      result.push({
        category: '特殊关注',
        items: [{ label: '楼龄要求', value: buildingAgeMatch[0] }]
      });
    }
    
    // 交易周期
    const transactionMatch = text.match(/(急售|随时看房|短期|长期|交易|过户|周期)/);
    if (transactionMatch) {
      result.push({
        category: '特殊关注',
        items: [{ label: '交易周期', value: transactionMatch[0] }]
      });
    }
    
    // 抗性因素
    const avoidMatch = text.match(/(避开|远离|不要|不能|禁止|规避|高架|加油站|垃圾站|工厂|噪音|污染)/);
    if (avoidMatch) {
      result.push({
        category: '特殊关注',
        items: [{ label: '抗性因素', value: avoidMatch[0] + '区域' }]
      });
    }
    
    // 按揭贷款
    const mortgageMatch = text.match(/(按揭|贷款|首付|月供|利率|银行)/);
    if (mortgageMatch) {
      result.push({
        category: '金融服务',
        items: [{ label: '按揭贷款', value: '需要' }]
      });
    } else if (text.match(/(全款|现金|不需要贷款|不贷款)/)) {
      result.push({
        category: '金融服务',
        items: [{ label: '按揭贷款', value: '不需要' }]
      });
      
      // 购房融资
      if (text.match(/(抵押|融资|再贷款|二次贷款)/)) {
        result.push({
          category: '金融服务',
          items: [{ label: '购房融资', value: '是' }]
        });
      } else {
        result.push({
          category: '金融服务',
          items: [{ label: '购房融资', value: '否' }]
        });
      }
    }
    
    return result;
  },
  
  // 从分析结果中获取特定项的值
  getItemValue(analysisResult, groupTitle, itemLabel, categoryMapping, labelMappings) {
    // 获取匹配的类别列表
    const categoryNames = categoryMapping[groupTitle] || [];
    if (categoryNames.length === 0) return '无此信息，建议补充';
    
    // 在分析结果中查找对应的类别
    let foundCategory = null;
    
    // 尝试精确匹配
    for (const categoryName of categoryNames) {
      const exactMatch = analysisResult.find(c => 
        (c.category === categoryName) || (c.name === categoryName)
      );
      if (exactMatch) {
        foundCategory = exactMatch;
        break;
      }
    }
    
    // 如果没找到精确匹配，尝试模糊匹配
    if (!foundCategory) {
      for (const categoryName of categoryNames) {
        const fuzzyMatch = analysisResult.find(c => {
          const catName = (c.category || c.name || '').toString();
          return catName.toLowerCase().includes(categoryName.toLowerCase()) ||
                categoryName.toLowerCase().includes(catName.toLowerCase());
        });
        if (fuzzyMatch) {
          foundCategory = fuzzyMatch;
          break;
        }
      }
    }
    
    if (!foundCategory) return '无此信息，建议补充';
    
    // 根据不同的数据结构查找对应的值
    if (foundCategory.items && Array.isArray(foundCategory.items)) {
      // 使用items数组，每个项有label和value
      const matchLabels = labelMappings[itemLabel] || [itemLabel];
      
      for (const matchLabel of matchLabels) {
        const foundItem = foundCategory.items.find(item => {
          if (!item || !item.label || typeof item.label !== 'string') return false;
          return item.label === matchLabel || 
            item.label.toLowerCase().includes(matchLabel.toLowerCase()) || 
            matchLabel.toLowerCase().includes(item.label.toLowerCase());
        });
        if (foundItem) {
          let value = foundItem.value;
          // 确保值不超过50个字符
          if (value && value.length > 50) {
            value = value.substring(0, 50);
          }
          return value;
        }
      }
    } 
    else if (foundCategory.details && typeof foundCategory.details === 'object') {
      // 详细信息对象格式：使用details对象，直接以键值对方式存储
      const matchLabels = labelMappings[itemLabel] || [itemLabel];
      
      // 尝试使用映射的标签名称查找
      for (const matchLabel of matchLabels) {
        if (matchLabel && foundCategory.details[matchLabel] !== undefined) {
          const value = foundCategory.details[matchLabel];
          let result = Array.isArray(value) ? value.join('、') : String(value);
          // 确保值不超过50个字符
          if (result && result.length > 50) {
            result = result.substring(0, 50);
          }
          return result;
        }
        
        // 尝试模糊匹配键名
        if (matchLabel) {
          const matchingKey = Object.keys(foundCategory.details).find(key => {
            if (!key || typeof key !== 'string') return false;
            return key.toLowerCase().includes(matchLabel.toLowerCase()) ||
              matchLabel.toLowerCase().includes(key.toLowerCase());
          });
          if (matchingKey) {
            const value = foundCategory.details[matchingKey];
            let result = Array.isArray(value) ? value.join('、') : String(value);
            // 确保值不超过50个字符
            if (result && result.length > 50) {
              result = result.substring(0, 50);
            }
            return result;
          }
        }
      }
    }
    
    return '无此信息，建议补充';
  },

  // 开始编辑字段
  startEditing(e) {
    if (this.data.isAnalyzing) {
      return;
    }
    
    const { group, item } = e.currentTarget.dataset;
    const key = group + item;
    
    // 保存原始AI分析结果，以便在编辑取消时恢复
    if (!this.data.originalAIResults) {
      this.setData({
        originalAIResults: {}
      });
    }
    
    if (!this.data.originalAIResults[group]) {
      const originalResults = this.data.originalAIResults || {};
      originalResults[group] = {};
      this.setData({
        originalAIResults: originalResults
      });
    }
    
    // 保存当前值作为原始值（如果尚未保存）
    const originalResults = this.data.originalAIResults;
    if (originalResults[group] && originalResults[group][item] === undefined) {
      originalResults[group][item] = this.data.editableResults[group][item];
      this.setData({
        originalAIResults: originalResults
      });
    }
    
    // 创建一个完整的新对象，确保视图更新
    const newIsEditing = {...this.data.isEditing};
    newIsEditing[key] = true;
    
    // 确保所有其他编辑状态都是false，避免多个输入框同时处于编辑状态
    Object.keys(newIsEditing).forEach(k => {
      if (k !== key) {
        newIsEditing[k] = false;
      }
    });
    
    // 如果当前值是"无此信息，建议补充"，则清空它
    const newEditableResults = {...this.data.editableResults};
    if (!newEditableResults[group]) {
      newEditableResults[group] = {};
    }
    
    if (newEditableResults[group][item] === '无此信息，建议补充') {
      newEditableResults[group][item] = '';
    }
    
    this.setData({
      isEditing: newIsEditing,
      editableResults: newEditableResults
    });
    
    // 强制刷新视图
    setTimeout(() => {
      wx.showToast({
        title: '请输入内容',
        icon: 'none',
        duration: 1000
      });
    }, 50);
  },

  // 完成编辑
  finishEditing(e) {
    const { group, item } = e.currentTarget.dataset;
    const key = group + item;
    
    // 获取当前输入的值
    let currentValue = this.data.editableResults[group][item];
    
    // 如果值为undefined，设置为空字符串以避免错误
    if (currentValue === undefined) {
      currentValue = '';
    }
    
    // 去除前后空格
    if (typeof currentValue === 'string') {
      currentValue = currentValue.trim();
    }
    
    // 确保不超过50个字符
    if (currentValue && currentValue.length > 50) {
      currentValue = currentValue.substring(0, 50);
    }
    
    // 如果用户清空了内容或输入的全是空格
    if (!currentValue) {
      // 恢复到AI原始分析结果
      if (this.data.originalAIResults && 
          this.data.originalAIResults[group] && 
          this.data.originalAIResults[group][item] !== undefined) {
        currentValue = this.data.originalAIResults[group][item];
      } else {
        // 作为后备，如果没有原始分析结果，则使用"无此信息，建议补充"
        currentValue = '无此信息，建议补充';
      }
    }
    
    // 创建新对象，确保视图更新
    const newEditableResults = {...this.data.editableResults};
    if (!newEditableResults[group]) {
      newEditableResults[group] = {};
    }
    newEditableResults[group][item] = currentValue;
    
    const newIsEditing = {...this.data.isEditing};
    newIsEditing[key] = false;
    
    // 更新值
    this.setData({
      editableResults: newEditableResults,
      isEditing: newIsEditing
    });
    
    // 重新生成建议
    this.generateRequirementSuggestion();
  },

  // 处理字段输入变化
  onFieldInput(e) {
    const { group, item } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    // 确保不超过50个字符
    let finalValue = value;
    if (finalValue && finalValue.length > 50) {
      finalValue = finalValue.substring(0, 50);
    }
    
    // 处理换行符，最多允许2个换行符
    if (finalValue) {
      const newlineCount = (finalValue.match(/\n/g) || []).length;
      if (newlineCount > 2) {
        // 保留前两个换行符
        const parts = finalValue.split(/\n/);
        finalValue = parts.slice(0, 3).join('\n');
      }
    }
    
    // 创建新对象，确保视图更新
    const newEditableResults = {...this.data.editableResults};
    if (!newEditableResults[group]) {
      newEditableResults[group] = {};
    }
    newEditableResults[group][item] = finalValue;
    
    this.setData({
      editableResults: newEditableResults
    });
  },

  // 处理按揭贷款选择
  onMortgageChange(e) {
    const value = e.detail;
    
    // 创建一个新的对象以确保状态更新
    const updatedFinanceService = {
      ...this.data.editableResults['5. 金融服务'],
      '按揭贷款': value
    };
    
    // 根据按揭贷款选择设置购房后融资
    if (value === '需要') {
      // 如果选择"需要"按揭贷款，自动设置购房后融资为"-"
      updatedFinanceService['购房融资'] = '-';
    } else if (value === '不需要') {
      // 如果选择"不需要"按揭贷款，重置购房后融资为"无此信息，建议补充"
      updatedFinanceService['购房融资'] = '无此信息，建议补充';
    }
    
    // 更新整个金融服务对象
    const newEditableResults = {
      ...this.data.editableResults,
      '5. 金融服务': updatedFinanceService
    };
    
      this.setData({
      editableResults: newEditableResults
      });
    
    // 重新生成建议
    this.generateRequirementSuggestion();
  },

  // 处理购房后融资选择
  onFinancingChange(e) {
    const value = e.detail;
    
    // 创建一个新的对象以确保状态更新
    const updatedFinanceService = {
      ...this.data.editableResults['5. 金融服务'],
      '购房融资': value
    };
    
    // 更新整个金融服务对象
    const newEditableResults = {
      ...this.data.editableResults,
      '5. 金融服务': updatedFinanceService
    };
    
    this.setData({
      editableResults: newEditableResults
    });
    
    // 重新生成建议
    this.generateRequirementSuggestion();
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
      // 自动聚焦到姓名输入框
      this.focusNameInput();
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
      fail: (error) => {
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
      data: exampleText
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

  // 自动聚焦到姓名输入框
  focusNameInput() {
    // 使用延时确保toast显示后再聚焦
    setTimeout(() => {
      // 设置滚动到姓名输入框
      this.setData({
        scrollIntoView: 'client-info-section'
      });
      
      // 使用微信小程序API聚焦输入框
      setTimeout(() => {
        wx.createSelectorQuery()
          .select('.customer-name-input')
          .context((ctx) => {
            if (ctx && ctx.context) {
              ctx.context.focus();
            }
          })
          .exec();
      }, 300); // 等待滚动完成后再聚焦
    }, 500); // 延迟500毫秒执行
  },

  // 处理滚动事件
  onScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop
    });
  },
  
  // 滚动到分析结果区域
  scrollToAnalysisContent() {
    const now = Date.now();
    // 限制滚动频率，每150ms最多滚动一次
    if (now - this.data.lastScrollTime < 150) {
      return;
    }
    
    this.setData({
      scrollIntoView: 'scroll-anchor',
      lastScrollTime: now
    });
  },

  // 生成需求建议
  generateRequirementSuggestion() {
    // 需求项权重配置 - 分级权重体系
    const weightConfig = {
      // T0级 - 核心需求（权重最高）
      T0: {
        '预算范围': 10,
        '购房目的': 9,
        '意向区域': 9,
        '户型需求': 8
      },
      // T1级 - 居住偏好（次高权重）
      T1: {
        '面积区间': 7,
        '楼层要求': 5,
        '朝向要求': 5,
        '装修标准': 6
      },
      // T2级 - 配套要求（中等权重）
      T2: {
        '交通便利': 6,
        '教育资源': 7,
        '商圈覆盖': 5,
        '医疗条件': 4,
        '景观要求': 3
      },
      // T3级 - 特殊关注（低权重，但数量多时需要关注）
      T3: {
        '产权性质': 5,
        '楼龄要求': 6,
        '交易周期': 4,
        '抗性因素': 6
      },
      // T4级 - 金融服务（补充权重）
      T4: {
        '按揭贷款': 7,
        '购房融资': 4
      }
    };
    
    // 匹配需求指南与权重配置
    const weightMapping = {
      '1. 核心需求': 'T0',
      '2. 居住偏好': 'T1',
      '3. 配套要求': 'T2',
      '4. 特殊关注': 'T3',
      '5. 金融服务': 'T4'
    };
    
    // 收集缺失项和已有项
    let missingItems = [];
    let existingItems = [];
    
    this.data.requirementGuide.forEach(group => {
      const groupTitle = group.title;
      const weightLevel = weightMapping[groupTitle];
      
      group.items.forEach(item => {
        // 特殊处理金融服务
        if (groupTitle === '5. 金融服务') {
          if (item.label === '按揭贷款') {
            const value = this.data.editableResults[groupTitle][item.label];
            const itemInfo = {
              group: groupTitle,
              label: item.label,
              example: item.example,
              weight: weightConfig[weightLevel][item.label] || 1,
              weightLevel,
              value: value
            };
            
            if (!value || value === '无此信息，建议补充') {
              missingItems.push(itemInfo);
            } else {
              existingItems.push(itemInfo);
            }
          } 
          else if (item.label === '购房融资') {
            // 只有当按揭贷款为"不需要"时才检查购房后融资
            if (this.data.editableResults[groupTitle]['按揭贷款'] === '不需要') {
              const value = this.data.editableResults[groupTitle][item.label];
              const itemInfo = {
                group: groupTitle,
                label: item.label,
                example: item.example,
                weight: weightConfig[weightLevel][item.label] || 1,
                weightLevel,
                value: value
              };
              
              if (!value || value === '无此信息，建议补充') {
                missingItems.push(itemInfo);
              } else {
                existingItems.push(itemInfo);
              }
            }
            // 如果按揭贷款未选择或为"需要"，购房后融资不计入统计
          }
        } else {
          // 其他非金融服务项目的处理保持不变
          const value = this.data.editableResults[groupTitle][item.label];
          const itemInfo = {
            group: groupTitle,
            label: item.label,
            example: item.example,
            weight: weightConfig[weightLevel][item.label] || 1,
            weightLevel,
            value: value
          };
          
          if (!value || value === '无此信息，建议补充') {
            missingItems.push(itemInfo);
          } else {
            existingItems.push(itemInfo);
          }
        }
      });
    });
    
    // 如果没有缺失项，直接返回完整评价
    if (missingItems.length === 0) {
      this.setData({
        requirementSuggestion: '客户的需求描述非常完整！已包含所有描述要点，马上让AI为客户生成购房建议报告吧~'
      });
      return;
    }
    
    // 缺失项按权重排序
    missingItems.sort((a, b) => b.weight - a.weight);
    
    // 统计各级别缺失项数量
    const missingStats = {
      T0: missingItems.filter(item => item.weightLevel === 'T0').length,
      T1: missingItems.filter(item => item.weightLevel === 'T1').length,
      T2: missingItems.filter(item => item.weightLevel === 'T2').length,
      T3: missingItems.filter(item => item.weightLevel === 'T3').length,
      T4: missingItems.filter(item => item.weightLevel === 'T4').length,
      total: missingItems.length
    };
    
    // 检查已有项中的简单描述，如果字数过少，也提示可以补充
    const briefDescriptionItems = existingItems.filter(item => {
      const description = item.value.trim();
      // 简单描述的判断标准：字数少于4个字符或不包含具体数字和详细地点
      return description.length < 4 || 
            (item.label === '预算范围' && !description.match(/\d{3,}/)) || // 预算范围应包含至少三位数字
            (item.label === '意向区域' && !description.match(/[区县市镇]|[城]/)); // 区域应包含"区县市镇"或"城"字
    });
    
    // 按权重对简单描述的项进行排序
    briefDescriptionItems.sort((a, b) => b.weight - a.weight);
    
    // 计算综合缺失得分
    const missingScore = missingItems.reduce((score, item) => score + item.weight, 0);
    
    // 建议模板选择
    let suggestionTemplate = '';
    let detailSuggestions = [];
    
    // T0级缺失项处理（最高优先级）
    if (missingStats.T0 > 0) {
      const t0Items = missingItems.filter(item => item.weightLevel === 'T0');
      suggestionTemplate = '客户的需求缺少重要的核心信息，建议补充：';
      
      t0Items.forEach(item => {
        detailSuggestions.push(`• ${item.label}：${item.example}`);
      });
      
      // 如果只有1-2个T0项缺失，添加其他高权重的T1项
      if (missingStats.T0 <= 2 && missingStats.T1 > 0) {
        const highT1Items = missingItems
          .filter(item => item.weightLevel === 'T1' && item.weight >= 6)
          .slice(0, 2);
        
        if (highT1Items.length > 0) {
          detailSuggestions.push('同时建议也考虑提供：');
          highT1Items.forEach(item => {
            detailSuggestions.push(`• ${item.label}：${item.example}`);
          });
        }
      }
    }
    // 没有T0缺失但T1缺失较多
    else if (missingStats.T1 >= 3 || (missingStats.T1 >= 2 && missingStats.T2 >= 3)) {
      suggestionTemplate = '客户的核心需求已明确，但居住偏好信息不足，建议补充：';
      
      const t1Items = missingItems
        .filter(item => item.weightLevel === 'T1')
        .slice(0, 3);
      
      t1Items.forEach(item => {
        detailSuggestions.push(`• ${item.label}：${item.example}`);
      });
      
      // 如果有高权重的T2项，也提示补充
      const highT2Items = missingItems
        .filter(item => item.weightLevel === 'T2' && item.weight >= 6)
        .slice(0, 2);
      
      if (highT2Items.length > 0) {
        detailSuggestions.push('为提高匹配精度，也请考虑：');
        highT2Items.forEach(item => {
          detailSuggestions.push(`• ${item.label}：${item.example}`);
        });
      }
    }
    // T2/T3/T4级缺失较多
    else if (missingScore > 25) {
      // 选择权重最高的5个项目提示
      const topItems = missingItems.slice(0, 5);
      
      suggestionTemplate = '客户的需求基本明确，为提高房源匹配精度，建议补充以下信息：';
      
      topItems.forEach(item => {
        detailSuggestions.push(`• ${item.label}：${item.example}`);
      });
    }
    // 缺失较少
    else {
      suggestionTemplate = '客户的需求描述已相当完整，如有以下补充将更有助于精准匹配：';
      
      // 选择权重最高的3个项目提示
      const topItems = missingItems.slice(0, 3);
      
      topItems.forEach(item => {
        detailSuggestions.push(`• ${item.label}：${item.example}`);
      });
    }
    
    // 情况概述
    const summaryText = `客户的需求描述中共有${missingStats.total}项信息缺失：核心需求${missingStats.T0}项、居住偏好${missingStats.T1}项、配套要求${missingStats.T2}项、特殊关注${missingStats.T3}项、金融服务${missingStats.T4}项。`;
    
    // 组合最终建议文本
    let finalSuggestion = summaryText + '\n\n' + suggestionTemplate + '\n';
    
    // 添加详细建议
    let inSubSection = false;
    detailSuggestions.forEach(item => {
      if (item.startsWith('同时') || item.startsWith('为提高')) {
        // 处理小标题
        finalSuggestion += '\n' + item + '\n';
        inSubSection = true;
      } else {
        // 处理常规列表项
        finalSuggestion += item + '\n';
      }
    });
    
    // 更新到页面数据
    this.setData({
      requirementSuggestion: finalSuggestion
    });
  },

  onUnload() {
    // 清理计时器
    this.resetAnalysisTimer();
  }
}); 