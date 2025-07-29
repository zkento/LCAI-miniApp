/**
 * 历史记录数据服务
 * 提供历史任务的数据管理、API调用、本地存储等功能
 */

import { TASK_STATUS, STATUS_TEXT_MAPPING, getStatusConfig } from './design-constants.js';

// 存储键名
const STORAGE_KEYS = {
  HISTORY_LIST: 'history_list',
  LAST_UPDATE: 'history_last_update',
  SEARCH_HISTORY: 'search_history'
};

// 模拟数据生成器
function generateMockData() {
  const taskTypes = ['个人征信报告分析', '企业征信报告分析', '买家顾问报告', '融资顾问报告'];
  const statuses = ['排队中...', '进行中...', '已出结果', '任务失败', '已取消'];
  const customers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

  const mockData = [];

  // 用于生成不重复的排队位置
  let queueCounter = 1;
  let progressCounter = 1;
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    const submitTime = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000); // 30天内
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    let actualStartTime = null;
    let endTime = null;
    let processingTime = '';
    let totalTime = '';
    let queuePosition = '-';
    let expectedStartTime = '';
    
    // 根据状态设置时间信息
    if (status === '进行中...') {
      actualStartTime = new Date(submitTime.getTime() + Math.random() * 60 * 60 * 1000);
      queuePosition = `第${progressCounter++}位`;
    } else if (status === '已出结果') {
      actualStartTime = new Date(submitTime.getTime() + Math.random() * 60 * 60 * 1000);
      endTime = new Date(actualStartTime.getTime() + Math.random() * 120 * 60 * 1000);
      processingTime = formatDuration(endTime - actualStartTime);
      totalTime = formatDuration(endTime - submitTime);
    } else if (status === '排队中...') {
      queuePosition = `第${queueCounter + 10}位`; // 排队中的位置从11开始
      queueCounter++;
      expectedStartTime = new Date(now + Math.random() * 60 * 60 * 1000).toLocaleString('zh-CN');
    } else if (status === '已取消') {
      endTime = new Date(submitTime.getTime() + Math.random() * 30 * 60 * 1000);
    } else if (status === '任务失败') {
      actualStartTime = new Date(submitTime.getTime() + Math.random() * 60 * 60 * 1000);
      endTime = new Date(actualStartTime.getTime() + Math.random() * 60 * 60 * 1000);
      // 添加处理耗时和总耗时计算
      processingTime = formatDuration(endTime - actualStartTime);
      totalTime = formatDuration(endTime - submitTime);
    }
    
    const task = {
      id: `task_${Date.now()}_${i}`,
      type: taskType,
      customerName: customer,
      result: status,
      submitTime: submitTime.toLocaleString('zh-CN'),
      actualStartTime: actualStartTime ? actualStartTime.toLocaleString('zh-CN') : '',
      endTime: endTime ? endTime.toLocaleString('zh-CN') : '',
      processingTime,
      totalTime,
      queuePosition,
      expectedStartTime,
      content: generateTaskContent(taskType, status),
      uploadFile: generateUploadFiles(taskType)
    };
    
    mockData.push(task);
  }
  
  return mockData.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime));
}

// 生成任务内容
function generateTaskContent(taskType, status) {
  if (status === '已取消') {
    return `${taskType}任务已被用户取消`;
  }
  
  if (status === '任务失败') {
    const reasons = ['文件格式不支持', '文件损坏无法解析', '网络连接超时', '系统繁忙请稍后重试'];
    return `任务处理失败，原因：${reasons[Math.floor(Math.random() * reasons.length)]}`;
  }
  
  const contents = {
    '个人征信报告分析': '正在分析个人征信报告，包括信用记录、负债情况、还款能力等维度',
    '企业征信报告分析': '正在分析企业征信报告，包括经营状况、财务数据、信用风险等',
    '买家顾问报告': '正在生成买家顾问报告，分析市场趋势和投资建议',
    '融资顾问报告': '正在生成融资顾问报告，评估融资方案和风险控制'
  };
  
  return contents[taskType] || '正在处理任务...';
}

// 生成上传文件信息（最多1个文件）
function generateUploadFiles(taskType) {
  if (taskType === '融资顾问报告' || taskType === '买家顾问报告') {
    return null; // 这两种类型不需要上传文件
  }

  // 根据任务类型生成对应的文件
  let fileNames = [];

  if (taskType === '个人征信报告分析') {
    fileNames = [
      '征信报告.pdf',
      '银行流水.pdf'
    ];
  } else if (taskType === '企业征信报告分析') {
    fileNames = [
      '征信报告.pdf',
      '财务报表.xlsx',
      '银行流水.pdf'
    ];
  } else {
    // 其他类型的默认文件
    fileNames = [
      '征信报告.pdf'
    ];
  }

  // 随机选择1个文件
  const selectedFile = fileNames[Math.floor(Math.random() * fileNames.length)];

  return {
    name: selectedFile,
    size: Math.floor(Math.random() * 3000) + 2000,
    type: selectedFile.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

// 格式化时长
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 历史记录服务类
 */
class HistoryService {
  constructor() {
    this.historyList = [];
    this.lastUpdate = 0;
    this.isLoading = false;
  }
  
  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.loadFromStorage();
      
      // 如果没有数据或数据过期，生成模拟数据
      if (this.historyList.length === 0 || this.isDataExpired()) {
        await this.generateMockData();
      }
    } catch (error) {
      console.error('初始化历史记录服务失败:', error);
      await this.generateMockData();
    }
  }
  
  /**
   * 从本地存储加载数据
   */
  async loadFromStorage() {
    try {
      const historyData = wx.getStorageSync(STORAGE_KEYS.HISTORY_LIST);
      const lastUpdate = wx.getStorageSync(STORAGE_KEYS.LAST_UPDATE);
      
      if (historyData && Array.isArray(historyData)) {
        this.historyList = historyData;
        this.lastUpdate = lastUpdate || 0;
      }
    } catch (error) {
      console.error('从本地存储加载历史记录失败:', error);
    }
  }
  
  /**
   * 保存数据到本地存储
   */
  async saveToStorage() {
    try {
      wx.setStorageSync(STORAGE_KEYS.HISTORY_LIST, this.historyList);
      wx.setStorageSync(STORAGE_KEYS.LAST_UPDATE, Date.now());
    } catch (error) {
      console.error('保存历史记录到本地存储失败:', error);
    }
  }
  
  /**
   * 检查数据是否过期（超过1小时）
   */
  isDataExpired() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return (now - this.lastUpdate) > oneHour;
  }
  
  /**
   * 生成模拟数据
   */
  async generateMockData() {
    this.historyList = generateMockData();
    await this.saveToStorage();
  }
  
  /**
   * 获取历史记录列表
   */
  async getHistoryList(refresh = false) {
    if (refresh || this.historyList.length === 0) {
      await this.fetchHistoryList();
    }
    return this.historyList;
  }
  
  /**
   * 从服务器获取历史记录
   */
  async fetchHistoryList() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 在实际应用中，这里应该调用真实的API
      // const response = await wx.request({
      //   url: 'https://api.example.com/history',
      //   method: 'GET'
      // });
      // this.historyList = response.data;
      
      // 目前使用模拟数据
      this.historyList = generateMockData();
      await this.saveToStorage();
      
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 搜索和筛选历史记录
   */
  searchHistory(filters = {}) {
    let filteredList = [...this.historyList];
    
    // 按任务类型筛选
    if (filters.taskTypes && filters.taskTypes.length > 0) {
      filteredList = filteredList.filter(item => 
        filters.taskTypes.includes(item.type)
      );
    }
    
    // 按客户姓名筛选
    if (filters.customerName) {
      filteredList = filteredList.filter(item => 
        item.customerName && item.customerName.includes(filters.customerName)
      );
    }
    
    // 按任务状态筛选
    if (filters.taskResults && filters.taskResults.length > 0) {
      filteredList = filteredList.filter(item => 
        filters.taskResults.includes(item.result)
      );
    }
    
    // 按提交时间范围筛选
    if (filters.submitTimeRange && filters.submitTimeRange.length === 2) {
      const [startDate, endDate] = filters.submitTimeRange;
      filteredList = filteredList.filter(item => {
        const submitDate = item.submitTime ? item.submitTime.split(' ')[0] : '';
        return submitDate >= startDate && submitDate <= endDate;
      });
    }
    
    // 按结束时间范围筛选
    if (filters.endTimeRange && filters.endTimeRange.length === 2) {
      const [startDateEnd, endDateEnd] = filters.endTimeRange;
      filteredList = filteredList.filter(item => {
        if (!item.endTime) return false;
        const itemEndDate = item.endTime.split(' ')[0];
        return itemEndDate >= startDateEnd && itemEndDate <= endDateEnd;
      });
    }
    
    return filteredList;
  }
  
  /**
   * 取消任务
   */
  async cancelTask(taskId) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在实际应用中调用真实API
      // await wx.request({
      //   url: `https://api.example.com/tasks/${taskId}/cancel`,
      //   method: 'POST'
      // });
      
      // 更新本地数据
      const taskIndex = this.historyList.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        this.historyList[taskIndex].result = '已取消';
        this.historyList[taskIndex].endTime = new Date().toLocaleString('zh-CN');
        this.historyList[taskIndex].content = `${this.historyList[taskIndex].type}任务已被用户取消`;
        await this.saveToStorage();
      }
      
      return true;
    } catch (error) {
      console.error('取消任务失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取任务统计信息
   */
  getTaskStats() {
    const stats = {
      total: this.historyList.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };
    
    this.historyList.forEach(task => {
      if (task.result.includes('排队中')) {
        stats.pending++;
      } else if (task.result.includes('进行中')) {
        stats.processing++;
      } else if (task.result.includes('已出结果')) {
        stats.completed++;
      } else if (task.result.includes('失败')) {
        stats.failed++;
      } else if (task.result.includes('取消')) {
        stats.cancelled++;
      }
    });
    
    return stats;
  }
  
  /**
   * 获取单个任务详情
   */
  getTaskById(taskId) {
    return this.historyList.find(task => task.id === taskId);
  }
  
  /**
   * 清除本地缓存
   */
  clearCache() {
    try {
      wx.removeStorageSync(STORAGE_KEYS.HISTORY_LIST);
      wx.removeStorageSync(STORAGE_KEYS.LAST_UPDATE);
      this.historyList = [];
      this.lastUpdate = 0;
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  /**
   * 获取模拟历史数据（不保存到本地存储）
   */
  getMockHistoryData() {
    // 直接返回生成的模拟数据
    const mockData = generateMockData();
    
    // 添加状态标签信息
    return mockData.map(item => {
      const statusConfig = getStatusConfig(item.result);
      return {
        ...item,
        taskType: item.type, // 为了兼容新的筛选逻辑
        customer: item.customerName, // 为了兼容新的筛选逻辑
        statusText: STATUS_TEXT_MAPPING[item.result] || item.result,
        statusTagType: statusConfig.tagType,
        statusTagColor: statusConfig.tagColor
      };
    });
  }
}

// 创建单例实例
const historyService = new HistoryService();

export default historyService;
