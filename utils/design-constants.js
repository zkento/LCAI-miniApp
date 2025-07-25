/**
 * 设计规范常量
 * 统一小程序和Web版本的设计规范
 */

// 任务状态枚举
export const TASK_STATUS = {
  PENDING: 'pending',           // 排队中
  PROCESSING: 'processing',     // 进行中  
  COMPLETED: 'completed',       // 已完成
  FAILED: 'failed',            // 失败
  CANCELLED: 'cancelled'        // 已取消
};

// 状态配置映射
export const STATUS_CONFIG = {
  [TASK_STATUS.PENDING]: {
    text: '排队中',
    color: '#faad14',
    icon: 'friends-o',
    tagType: 'default',
    description: '任务排队中，即将开始处理'
  },
  [TASK_STATUS.PROCESSING]: {
    text: '进行中',
    color: '#1b68de',
    icon: 'clock-o',
    tagType: 'primary',
    description: '正在处理中，请耐心等待'
  },
  [TASK_STATUS.COMPLETED]: {
    text: '已完成',
    color: '#52c41a',
    icon: 'checked',
    tagType: 'success',
    description: '任务已完成，可查看详细结果'
  },
  [TASK_STATUS.FAILED]: {
    text: '失败',
    color: '#ff4d4f',
    icon: 'warning-o',
    tagType: 'danger',
    description: '任务处理失败，请重新提交'
  },
  [TASK_STATUS.CANCELLED]: {
    text: '已取消',
    color: '#faad14',
    icon: 'cross',
    tagType: 'warning',
    description: '任务已被取消'
  }
};

// 状态文本映射（兼容旧版本）
export const STATUS_TEXT_MAPPING = {
  '排队中...': TASK_STATUS.PENDING,
  '进行中...': TASK_STATUS.PROCESSING,
  '已出结果': TASK_STATUS.COMPLETED,
  '任务失败': TASK_STATUS.FAILED,
  '已取消': TASK_STATUS.CANCELLED
};

// 颜色规范
export const COLORS = {
  // 主色调
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a', 
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
  
  // 文本颜色
  TEXT_PRIMARY: '#262626',
  TEXT_SECONDARY: '#8c8c8c',
  TEXT_DISABLED: '#bfbfbf',
  
  // 背景颜色
  BACKGROUND: '#f5f7fa',
  CARD_BACKGROUND: '#ffffff',
  BORDER: '#f0f0f0',
  
  // 状态颜色
  STATUS_PENDING: '#faad14',
  STATUS_PROCESSING: '#1890ff',
  STATUS_COMPLETED: '#52c41a',
  STATUS_FAILED: '#ff4d4f',
  STATUS_CANCELLED: '#d9d9d9'
};

// 字体大小规范（小程序rpx单位）
export const FONT_SIZES = {
  TITLE: 36,      // 标题
  LARGE: 32,      // 大文本
  MEDIUM: 28,     // 中等文本
  SMALL: 24,      // 小文本
  MINI: 20        // 最小文本
};

// 间距规范（小程序rpx单位）
export const SPACING = {
  XS: 8,          // 极小间距
  SM: 16,         // 小间距
  MD: 24,         // 中等间距
  LG: 32,         // 大间距
  XL: 48          // 极大间距
};

// 圆角规范（小程序rpx单位）
export const BORDER_RADIUS = {
  SM: 8,          // 小圆角
  MD: 12,         // 中等圆角
  LG: 16,         // 大圆角
  XL: 24          // 极大圆角
};

// 阴影规范
export const SHADOWS = {
  LIGHT: '0 2rpx 8rpx rgba(0, 0, 0, 0.03)',
  MEDIUM: '0 4rpx 12rpx rgba(0, 0, 0, 0.05)',
  HEAVY: '0 8rpx 24rpx rgba(0, 0, 0, 0.08)'
};

// 任务类型配置
export const TASK_TYPES = {
  PERSONAL_CREDIT: '个人征信报告分析',
  BUSINESS_CREDIT: '企业征信报告分析', 
  BUYER_ADVISOR: '买家顾问报告',
  FINANCE_ADVISOR: '融资顾问报告'
};

// 操作类型枚举
export const ACTION_TYPES = {
  VIEW_REPORT: 'view_report',
  DOWNLOAD: 'download',
  SHARE: 'share',
  CANCEL: 'cancel',
  RETRY: 'retry',
  CONSULT: 'consult',
  CONTACT_SERVICE: 'contact_service'
};

// 根据状态获取配置
export function getStatusConfig(status) {
  // 先尝试直接匹配
  if (STATUS_CONFIG[status]) {
    return STATUS_CONFIG[status];
  }
  
  // 尝试通过文本映射匹配
  const mappedStatus = STATUS_TEXT_MAPPING[status];
  if (mappedStatus && STATUS_CONFIG[mappedStatus]) {
    return STATUS_CONFIG[mappedStatus];
  }
  
  // 模糊匹配
  if (status && typeof status === 'string') {
    if (status.includes('排队')) return STATUS_CONFIG[TASK_STATUS.PENDING];
    if (status.includes('进行')) return STATUS_CONFIG[TASK_STATUS.PROCESSING];
    if (status.includes('已出结果') || status.includes('完成')) return STATUS_CONFIG[TASK_STATUS.COMPLETED];
    if (status.includes('失败')) return STATUS_CONFIG[TASK_STATUS.FAILED];
    if (status.includes('取消')) return STATUS_CONFIG[TASK_STATUS.CANCELLED];
  }
  
  // 默认返回未知状态
  return {
    text: status || '未知',
    color: COLORS.TEXT_SECONDARY,
    icon: 'question-o',
    tagType: 'default',
    description: '状态未知'
  };
}

// 根据任务类型获取图标
export function getTaskTypeIcon(taskType) {
  switch(taskType) {
    case TASK_TYPES.PERSONAL_CREDIT:
      return 'contact';
    case TASK_TYPES.BUSINESS_CREDIT:
      return 'shop-o';
    case TASK_TYPES.BUYER_ADVISOR:
      return 'home-o';
    case TASK_TYPES.FINANCE_ADVISOR:
      return 'gold-coin-o';
    default:
      return 'description';
  }
}

// 格式化时间
export function formatTime(timestamp) {
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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 计算处理时长
export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return '';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end - start;
  
  if (diff < 60000) {
    return `${Math.floor(diff / 1000)}秒`;
  }
  
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟`;
  }
  
  return `${Math.floor(diff / 3600000)}小时${Math.floor((diff % 3600000) / 60000)}分钟`;
}
