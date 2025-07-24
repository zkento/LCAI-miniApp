/**
 * 历史记录数据服务
 */

const historyService = {
  /**
   * 获取历史任务列表
   */
  async getHistoryList(options) {
    const { page = 1, pageSize = 20, filters = {} } = options || {};
    
    try {
      const mockData = this.generateMockData();
      await this.delay(800);
      return this.filterAndPaginate(mockData, page, pageSize, filters);
    } catch (error) {
      console.error('获取历史列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId) {
    try {
      const data = this.generateMockData();
      const task = data.find(item => item.id === taskId);
      
      if (!task) {
        throw new Error('任务不存在');
      }
      
      return task;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      throw error;
    }
  },

  /**
   * 生成模拟数据
   */
  generateMockData() {
    const types = ['个人征信报告分析', '企业征信报告分析', '买家顾问报告', '融资顾问报告'];
    const results = ['已出结果', '进行中...', '排队中...', '任务失败', '已取消'];
    const customers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    
    const mockTasks = [];
    const now = Date.now();
    
    for (let i = 1; i <= 50; i++) {
      const submitTime = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const result = results[Math.floor(Math.random() * results.length)];
      const isCompleted = result === '已出结果';
      
      mockTasks.push({
        id: 'task_' + i.toString().padStart(3, '0'),
        type: types[Math.floor(Math.random() * types.length)],
        customerName: customers[Math.floor(Math.random() * customers.length)],
        result: result,
        submitTime: this.formatDateTime(submitTime),
        endTime: isCompleted ? this.formatDateTime(new Date(submitTime.getTime() + Math.random() * 2 * 60 * 60 * 1000)) : null,
        queuePosition: (result === '排队中...' || result === '进行中...') ? '第' + (Math.floor(Math.random() * 15) + 1) + '位' : '-'
      });
    }
    
    return mockTasks.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime));
  },

  /**
   * 筛选和分页数据
   */
  filterAndPaginate(data, page, pageSize, filters) {
    let filtered = data.slice();
    
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(task => {
        const customerName = task.customerName || '';
        return customerName.toLowerCase().indexOf(keyword) !== -1 || task.type.toLowerCase().indexOf(keyword) !== -1;
      });
    }
    
    if (filters.taskTypes && filters.taskTypes.length > 0) {
      filtered = filtered.filter(task => filters.taskTypes.indexOf(task.type) !== -1);
    }
    
    if (filters.taskResults && filters.taskResults.length > 0) {
      filtered = filtered.filter(task => filters.taskResults.indexOf(task.result) !== -1);
    }
    
    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const list = filtered.slice(startIndex, endIndex);
    
    return {
      list: list,
      total: total,
      page: page,
      pageSize: pageSize,
      hasMore: endIndex < total,
      stats: this.calculateStats(filtered)
    };
  },

  /**
   * 计算任务统计信息
   */
  calculateStats(tasks) {
    return {
      total: tasks.length,
      inProgress: tasks.filter(task => task.result === '进行中...').length,
      queuing: tasks.filter(task => task.result === '排队中...').length,
      completed: tasks.filter(task => task.result === '已出结果').length,
      failed: tasks.filter(task => task.result === '任务失败').length,
      cancelled: tasks.filter(task => task.result === '已取消').length
    };
  },

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 格式化日期时间 - iOS兼容版本
   */
  formatDateTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    // 使用iOS兼容的格式：yyyy/MM/dd HH:mm:ss
    return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
  },

  /**
   * 创建iOS兼容的日期对象
   */
  createCompatibleDate(dateString) {
    // 如果传入的是时间戳或Date对象，直接返回
    if (typeof dateString === 'number' || dateString instanceof Date) {
      return new Date(dateString);
    }

    // 将 "yyyy-MM-dd HH:mm" 格式转换为 "yyyy/MM/dd HH:mm:ss" 格式
    if (typeof dateString === 'string') {
      // 替换 - 为 /，确保iOS兼容
      const compatibleString = dateString.replace(/-/g, '/');
      // 如果没有秒数，添加 :00
      const finalString = compatibleString.includes(':') && !compatibleString.match(/:\d{2}:\d{2}/)
        ? compatibleString + ':00'
        : compatibleString;
      return new Date(finalString);
    }

    return new Date(dateString);
  }
};

module.exports = historyService;
