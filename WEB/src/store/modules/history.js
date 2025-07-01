// 最后修改记录时间 -> 2025-04-11 13:10:45
import { ElMessage } from 'element-plus'

// 生成高拟真的历史任务数据
const generateMockTasks = () => {
  // 任务类型列表
  const taskTypes = [
    '个人征信报告分析',
    '企业征信报告分析',
    '买家顾问报告',
    '融资顾问报告'
  ]
  
  // 真实的客户姓名
  const personalNames = [
    '陈明宇', '林嘉怡', '王思远', '黄雅婷', '赵俊杰', 
    '刘芳华', '杨子涵', '张伟诚', '吴婉婷', '孙建国',
    '郭宇航', '周思敏', '朱天磊', '徐若琳', '马志强',
    '胡雨桐', '唐嘉伟', '高晓梅', '范云龙', '曾嘉欣'
  ]
  
  // 真实的企业名称
  const companyNames = [
    '北京盛世联创科技有限公司', '上海同创数据技术有限公司', 
    '广州远景智能科技有限公司', '深圳领航信息技术有限公司',
    '杭州云策网络科技有限公司', '南京启航软件有限公司',
    '成都智创未来科技有限公司', '武汉光谷科技发展有限公司',
    '天津海创电子科技有限公司', '重庆巨能机械制造有限公司',
    '青岛海纳电子商务有限公司', '苏州新创元信息技术有限公司',
    '厦门海洋生物科技有限公司', '济南鑫创机械设备有限公司',
    '西安未来空间科技有限公司', '长沙智联网络科技有限公司',
    '大连海润商贸有限公司', '郑州恒基建设工程有限公司',
    '沈阳北方重工集团有限公司', '合肥创智电子科技有限公司'
  ]
  
  // 任务状态分布
  const taskStatusDistribution = {
    '已出结果': 25,  // 50%
    '进行中...': 12, // 24%
    '排队中...': 6,  // 12%
    '任务失败': 4,   // 8%
    '已取消': 3      // 6%
  }
  
  // 创建空数组用于存放生成的任务
  const tasks = []
  let taskId = 1
  
  // 将进行中和排队中的任务分开处理，以便后续设置队列位置
  const inProgressTasks = [] // 进行中的任务
  const queueingTasks = []   // 排队中的任务
  const completedTasks = []   // 已完成、失败和取消的任务
  
  // 为每种状态生成对应数量的任务
  Object.entries(taskStatusDistribution).forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      // 随机选择任务类型
      const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]
      
      // 确定合适的客户名称(个人/企业)
      const isPersonal = taskType === '个人征信报告分析' || 
                         (taskType === '买家顾问报告' && Math.random() > 0.3) ||
                         (taskType === '融资顾问报告' && Math.random() > 0.7)
      
      const customerName = isPersonal 
        ? personalNames[Math.floor(Math.random() * personalNames.length)]
        : companyNames[Math.floor(Math.random() * companyNames.length)]
        
      // 生成上传文件
      let uploadFiles = null
      let uploadFile = null
      
      // 报告类可能无文件或有多文件
      const isReportType = taskType === '买家顾问报告' || taskType === '融资顾问报告'
      
      if (isReportType) {
        if (taskType === '融资顾问报告' && Math.random() > 0.3) {
          // 融资顾问报告有70%可能有多个文件
          uploadFiles = [
            { 
              name: `${isPersonal ? customerName : '法人'}_个人征信报告_${Math.floor(Math.random() * 1000)}.pdf`, 
              type: '个人征信' 
            }
          ]
          
          // 如果客户是企业，则添加企业征信报告
          if (!isPersonal) {
            uploadFiles.push({
              name: `${customerName}_企业征信报告_${Math.floor(Math.random() * 1000)}.pdf`,
              type: '企业征信'
            })
          }
        } else if (Math.random() > 0.4) {
          // 60%概率有单个文件
          uploadFile = `${customerName}_需求资料_${Math.floor(Math.random() * 1000)}.pdf`
        }
        // 剩余40%概率无文件
      } else {
        // 征信类必有文件
        uploadFile = `${customerName}_征信报告_${Math.floor(Math.random() * 1000)}.pdf`
      }
      
      // 生成随机日期(近30天内)，但根据任务状态调整概率
      const now = new Date()
      
      // 任务日期的分布逻辑，调整为更合理的顺序
      let randomDays
      
      if (status === '排队中...') {
        // 排队中的任务应该更倾向于是最近提交的
        randomDays = Math.floor(Math.random() * 3) // 0-2天内
      } else if (status === '进行中...') {
        // 进行中的任务也应该较新，但比排队中的任务提交稍早
        randomDays = 2 + Math.floor(Math.random() * 3) // 2-4天内
      } else if (status === '已出结果') {
        // 已完成的任务可以分布在各个时间点
        randomDays = 5 + Math.floor(Math.random() * 25) // 5-29天内
      } else {
        // 失败和取消的任务通常时间跨度较大
        randomDays = 5 + Math.floor(Math.random() * 25) // 5-29天内
      }
      
      const randomHours = Math.floor(Math.random() * 24)
      const randomMinutes = Math.floor(Math.random() * 60)
      const randomSeconds = Math.floor(Math.random() * 60)
      
      const submitDate = new Date(now)
      submitDate.setDate(submitDate.getDate() - randomDays)
      submitDate.setHours(randomHours, randomMinutes, randomSeconds)
      
      // 格式化日期
      const formatDate = (date) => {
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
      }
      
      const submitTime = formatDate(submitDate)
      
      // 生成预计开始时间(排队中任务)
      let expectedStartTime = ''
      if (status === '排队中...') {
        const expectDate = new Date(submitDate)
        expectDate.setMinutes(expectDate.getMinutes() + 30 + Math.floor(Math.random() * 120)) // 30-150分钟后
        expectedStartTime = formatDate(expectDate)
      } else {
        expectedStartTime = submitTime
      }
      
      // 生成实际开始时间(除排队中外的任务)
      let actualStartTime = ''
      if (status !== '排队中...') {
        const actualStartDate = new Date(submitDate)
        actualStartDate.setMinutes(actualStartDate.getMinutes() + Math.floor(Math.random() * 30)) // 0-30分钟后
        actualStartTime = formatDate(actualStartDate)
      }
      
      // 生成结束时间(已完成和失败的任务)
      let endTime = ''
      if (status === '已出结果' || status === '任务失败' || status === '已取消') {
        const endDate = new Date(actualStartTime ? new Date(actualStartTime) : submitDate)
        const processingTimeMinutes = Math.floor(Math.random() * 60) + 20 // 20-80分钟
        endDate.setMinutes(endDate.getMinutes() + processingTimeMinutes)
        endTime = formatDate(endDate)
      }
      
      // 生成处理耗时
      let processingTime = ''
      if (actualStartTime && (status === '已出结果' || status === '任务失败' || status === '已取消')) {
        const actualStartMs = new Date(actualStartTime).getTime()
        const endMs = new Date(endTime).getTime()
        const diffMs = endMs - actualStartMs
        const diffMinutes = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMinutes / 60)
        const remainingMinutes = diffMinutes % 60
        processingTime = `${diffHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`
      } else if (status === '进行中...') {
        // 对于进行中的任务，生成一个合理的处理耗时
        const randomMinutes = Math.floor(Math.random() * 40) + 5
        processingTime = `00:${randomMinutes.toString().padStart(2, '0')}:00`
      }
      
      // 生成总耗时
      let totalTime = ''
      if (submitTime && (status === '已出结果' || status === '任务失败' || status === '已取消')) {
        const submitMs = new Date(submitTime).getTime()
        const endMs = new Date(endTime).getTime()
        const diffMs = endMs - submitMs
        const diffMinutes = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMinutes / 60)
        const remainingMinutes = diffMinutes % 60
        totalTime = `${diffHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`
      } else if (status === '进行中...') {
        // 对于进行中的任务，总耗时大于处理耗时
        const processingMinutes = parseInt(processingTime.split(':')[1])
        const totalMinutes = processingMinutes + Math.floor(Math.random() * 30) + 5
        totalTime = `00:${totalMinutes.toString().padStart(2, '0')}:00`
      }
      
      // 初始设置队列位置为空，在后续处理中统一设置
      let queuePosition = '-'
      
      // 生成任务内容
      let content = ''
      if (status === '已出结果') {
        content = `${taskType}分析结果已生成。客户${customerName}的${taskType.includes('征信') ? '征信情况分析' : '顾问方案'}已完成。`
      } else if (status === '进行中...') {
        content = `${taskType}正在分析中，系统正在处理${customerName}的${taskType.includes('征信') ? '征信报告' : '顾问需求'}数据...`
      } else if (status === '排队中...') {
        content = `${taskType}任务已提交，当前排队中。`
      } else if (status === '任务失败') {
        content = `${taskType}分析失败，原因：${['文件格式不支持', '文件内容无法识别', '系统处理超时', '报告结构异常'][Math.floor(Math.random() * 4)]}。`
      } else {
        content = `${taskType}任务已被取消。`
      }
      
      // 确定任务分类
      const taskCategory = taskType.includes('报告') ? '报告类' : '分析类'
      
      // 创建任务对象
      const task = {
        id: `hist_${taskId.toString().padStart(3, '0')}`,
        userId: 'mock_001',
        type: taskType,
        uploadFile,
        uploadFiles,
        submitTime,
        queuePosition,
        expectedStartTime,
        actualStartTime,
        endTime,
        result: status,
        processingTime,
        totalTime,
        content,
        taskCategory,
        customerName,
        submitDateObj: submitDate // 添加日期对象用于排序，最终数据中不会包含此字段
      }
      
      // 根据任务状态添加到不同数组
      if (status === '进行中...') {
        inProgressTasks.push(task)
      } else if (status === '排队中...') {
        queueingTasks.push(task)
      } else {
        completedTasks.push(task)
      }
      
      taskId++
    }
  })
  
  // 对进行中和排队中的任务分别按提交时间排序
  inProgressTasks.sort((a, b) => a.submitDateObj - b.submitDateObj)
  queueingTasks.sort((a, b) => a.submitDateObj - b.submitDateObj)
  
  // 确保进行中任务的提交时间一定早于排队中任务
  if (inProgressTasks.length > 0 && queueingTasks.length > 0) {
    // 找出进行中任务中提交时间最晚的和排队中任务提交时间最早的
    const latestInProgressTask = inProgressTasks[inProgressTasks.length - 1];
    const earliestQueueingTask = queueingTasks[0];
    
    // 如果存在进行中任务的提交时间晚于排队中任务，需要调整时间
    if (latestInProgressTask.submitDateObj > earliestQueueingTask.submitDateObj) {
      // 将进行中任务的提交时间调整为比排队中任务早
      const formatDate = (date) => {
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
      }
      
      // 创建一个比最早排队任务早1小时的时间作为基准
      const baseTime = new Date(earliestQueueingTask.submitDateObj.getTime() - 3600000);
      
      // 重新分配所有进行中任务的时间，保持相对顺序
      inProgressTasks.forEach((task, index) => {
        const newTime = new Date(baseTime.getTime() - (inProgressTasks.length - index) * 900000); // 每个任务间隔15分钟
        task.submitDateObj = newTime;
        task.submitTime = formatDate(newTime);
        
        // 相应调整其他时间
        if (task.actualStartTime) {
          const actualStartDate = new Date(newTime.getTime() + 10 * 60000); // 10分钟后
          task.actualStartTime = formatDate(actualStartDate);
        }
      });
      
      // 重新排序进行中任务
      inProgressTasks.sort((a, b) => a.submitDateObj - b.submitDateObj);
    }
  }
  
  // 合并所有活跃任务（进行中+排队中）按提交时间排序
  const allActiveTasks = [...inProgressTasks, ...queueingTasks];
  allActiveTasks.sort((a, b) => a.submitDateObj - b.submitDateObj);
  
  // 统一设置队列位置
  allActiveTasks.forEach((task, index) => {
    const position = index + 1;
    task.queuePosition = `第${position}位`;
    
    // 更新内容，包含队列位置
    if (task.result.includes('排队中')) {
      task.content = `${task.type}任务已提交，当前排队中。您的任务排在第${position}位。`;
    } else if (task.result.includes('进行中')) {
      task.content = `${task.type}正在分析中，系统正在处理${task.customerName}的${task.type.includes('征信') ? '征信报告' : '顾问需求'}数据...(队列位置：第${position}位)`;
    }
  });
  
  // 合并所有任务并移除临时的日期对象
  const allTasks = [...completedTasks, ...allActiveTasks]
  allTasks.forEach(task => {
    delete task.submitDateObj
  })
  
  // 按提交时间降序排序
  return allTasks.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
}

// 初始化模拟数据
const mockHistoryData = generateMockTasks()

export default {
  namespaced: true,
  state: {
    historyList: [],
    currentHistory: null,
    historyPanelVisible: false,
    isTableView: false
  },
  mutations: {
    SET_HISTORY_LIST(state, list) {
      state.historyList = list
    },
    SET_CURRENT_HISTORY(state, history) {
      state.currentHistory = history
    },
    SET_HISTORY_PANEL_VISIBLE(state, visible) {
      state.historyPanelVisible = visible
    },
    SET_TABLE_VIEW(state, isTable) {
      state.isTableView = isTable
    },
    ADD_HISTORY(state, history) {
      state.historyList.unshift(history)
    },
    CANCEL_TASK(state, historyId) {
      const index = state.historyList.findIndex(h => h.id === historyId)
      if (index !== -1) {
        const task = state.historyList[index]
        const wasQueueing = task.result.includes('排队中')
        const oldPosition = wasQueueing ? task.queuePosition : null
        
        // 更新任务状态
        task.result = '已取消'
        
        // 设置结束时间为当前时间
        const now = new Date()
        const formatDate = (date) => {
          return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        }
        task.endTime = formatDate(now)
        
        // 清空相关字段
        task.actualStartTime = ''
        task.processingTime = ''
        task.totalTime = ''
        
        // 如果是排队中的任务，需要清空队列位置和预计开始时间，并调整其他任务的队列位置
        if (wasQueueing) {
          // 清空当前任务的队列信息
          task.queuePosition = '-'
          task.expectedStartTime = ''
          
          // 获取当前排队中的任务，并根据位置排序
          if (oldPosition) {
            // 提取位置数字（例如从"第3位"中提取3）
            const positionNumber = parseInt(oldPosition.replace(/[^0-9]/g, ''))
            
            // 更新其他排队中任务的位置
            state.historyList.forEach(otherTask => {
              if (otherTask.id !== historyId && otherTask.result.includes('排队中') && otherTask.queuePosition) {
                // 提取其他任务的位置数字
                const otherPosition = parseInt(otherTask.queuePosition.replace(/[^0-9]/g, ''))
                
                // 如果其他任务的位置大于被取消的任务，则位置前移一位
                if (otherPosition > positionNumber) {
                  otherTask.queuePosition = `第${otherPosition - 1}位`
                  
                  // 同时更新任务内容中的队列位置信息
                  if (otherTask.content && otherTask.content.includes('排队中')) {
                    otherTask.content = `${otherTask.type}任务已提交，当前排队中。您的任务排在第${otherPosition - 1}位。`
                  }
                }
              }
            })
          }
        }
      }
    }
  },
  actions: {
    // 获取用户历史记录
    fetchHistoryList({ commit, rootState }) {
      // 在实际应用中，这里应该调用API获取数据
      // 这里使用模拟数据
      const userId = rootState.user.userInfo?.userId
      if (!userId) {
        return []
      }

      // 模拟API调用延迟
      return new Promise(resolve => {
        setTimeout(() => {
          const filteredHistory = mockHistoryData.filter(h => h.userId === userId)
          commit('SET_HISTORY_LIST', filteredHistory)
          resolve(filteredHistory)
        }, 500)
      })
    },
    // 根据ID获取历史详情
    getHistoryDetail({ state, commit }, historyId) {
      const history = state.historyList.find(h => h.id === historyId)
      if (history) {
        commit('SET_CURRENT_HISTORY', history)
        return history
      }
      return null
    },
    // 显示历史面板
    showHistoryPanel({ commit, dispatch }) {
      commit('SET_HISTORY_PANEL_VISIBLE', true)
      return dispatch('fetchHistoryList')
    },
    // 隐藏历史面板
    hideHistoryPanel({ commit }) {
      commit('SET_HISTORY_PANEL_VISIBLE', false)
    },
    // 切换表格视图
    toggleTableView({ commit, state }) {
      commit('SET_TABLE_VIEW', !state.isTableView)
    },
    // 取消任务
    cancelTask({ commit }, historyId) {
      // 实际应用中应调用API取消任务
      return new Promise(resolve => {
        setTimeout(() => {
          commit('CANCEL_TASK', historyId)
          ElMessage.success('任务已取消')
          resolve(true)
        }, 500)
      })
    }
  },
  getters: {
    sortedHistoryList: state => {
      return [...state.historyList].sort((a, b) => {
        // 按提交时间倒序排列
        return new Date(b.submitTime) - new Date(a.submitTime)
      })
    },
    // 计算活跃任务数量（排队中和进行中的任务）
    activeTaskCount: state => {
      return state.historyList.filter(task => 
        task.result.includes('排队中') || task.result.includes('进行中')
      ).length
    }
  }
} 