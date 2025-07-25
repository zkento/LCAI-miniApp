/**
 * 历史记录功能测试页面
 */

import historyService from '../../utils/historyService.js';
import { getStatusConfig, getTaskTypeIcon } from '../../utils/design-constants.js';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    testResults: [],
    testing: false,
    passedCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    await this.runTests();
  },

  /**
   * 运行测试
   */
  async runTests() {
    this.setData({ testing: true, testResults: [] });

    const tests = [
      { name: '初始化历史记录服务', test: this.testInitService },
      { name: '生成模拟数据', test: this.testGenerateMockData },
      { name: '获取历史记录列表', test: this.testGetHistoryList },
      { name: '搜索和筛选功能', test: this.testSearchAndFilter },
      { name: '取消任务功能', test: this.testCancelTask },
      { name: '获取任务统计', test: this.testGetTaskStats },
      { name: '状态配置功能', test: this.testStatusConfig },
      { name: '任务类型图标', test: this.testTaskTypeIcon }
    ];

    const results = [];

    for (const testCase of tests) {
      try {
        console.log(`开始测试: ${testCase.name}`);
        await testCase.test.call(this);
        results.push({ name: testCase.name, status: 'PASS', message: '测试通过' });
        console.log(`测试通过: ${testCase.name}`);
      } catch (error) {
        results.push({ name: testCase.name, status: 'FAIL', message: error.message });
        console.error(`测试失败: ${testCase.name}`, error);
      }
    }

    const passedCount = results.filter(item => item.status === 'PASS').length;

    this.setData({
      testing: false,
      testResults: results,
      passedCount: passedCount
    });
  },

  /**
   * 测试初始化服务
   */
  async testInitService() {
    await historyService.init();
    if (!historyService.historyList) {
      throw new Error('历史记录服务初始化失败');
    }
  },

  /**
   * 测试生成模拟数据
   */
  async testGenerateMockData() {
    await historyService.generateMockData();
    if (historyService.historyList.length === 0) {
      throw new Error('模拟数据生成失败');
    }
  },

  /**
   * 测试获取历史记录列表
   */
  async testGetHistoryList() {
    const list = await historyService.getHistoryList();
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('获取历史记录列表失败');
    }
  },

  /**
   * 测试搜索和筛选
   */
  async testSearchAndFilter() {
    const filters = {
      taskTypes: ['个人征信报告分析'],
      taskResults: ['已出结果']
    };

    const filteredList = historyService.searchHistory(filters);
    if (!Array.isArray(filteredList)) {
      throw new Error('搜索筛选功能失败');
    }
  },

  /**
   * 测试取消任务
   */
  async testCancelTask() {
    const list = await historyService.getHistoryList();
    const queueingTask = list.find(task => task.result.includes('排队中'));

    if (queueingTask) {
      await historyService.cancelTask(queueingTask.id);
      const updatedTask = historyService.getTaskById(queueingTask.id);
      if (!updatedTask.result.includes('已取消')) {
        throw new Error('取消任务功能失败');
      }
    }
  },

  /**
   * 测试获取任务统计
   */
  async testGetTaskStats() {
    const stats = historyService.getTaskStats();
    if (typeof stats.total !== 'number' || stats.total < 0) {
      throw new Error('获取任务统计失败');
    }
  },

  /**
   * 测试状态配置
   */
  async testStatusConfig() {
    const config = getStatusConfig('已出结果');
    if (!config || !config.text || !config.color) {
      throw new Error('状态配置功能失败');
    }
  },

  /**
   * 测试任务类型图标
   */
  async testTaskTypeIcon() {
    const icon = getTaskTypeIcon('个人征信报告分析');
    if (!icon || typeof icon !== 'string') {
      throw new Error('任务类型图标功能失败');
    }
  },

  /**
   * 重新运行测试
   */
  onRetryTests() {
    this.runTests();
  },

  /**
   * 跳转到历史记录页面
   */
  onGoToHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    });
  }
});