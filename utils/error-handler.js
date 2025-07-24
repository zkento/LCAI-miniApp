/**
 * 全局错误处理器
 * 专门处理小程序环境中的各种错误
 */

/**
 * 初始化错误处理器
 */
function initErrorHandler() {
  // 1. 处理未捕获的Promise拒绝
  if (typeof wx !== 'undefined' && wx.onUnhandledRejection) {
    wx.onUnhandledRejection(function(res) {
      const error = res.reason;
      const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      
      // 过滤掉环境相关的错误
      if (isEnvironmentError(errorMessage)) {
        console.warn('已拦截环境相关Promise错误:', errorMessage);
        return;
      }
      
      console.error('未处理的Promise拒绝:', errorMessage);
      
      // 可以在这里添加错误上报逻辑
      reportError('UnhandledPromiseRejection', errorMessage);
    });
  }
  
  // 2. 重写console.error以过滤特定错误
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.join(' ');
    
    if (isEnvironmentError(errorMessage)) {
      console.warn('已拦截环境相关错误:', errorMessage);
      return;
    }
    
    // 其他错误正常输出
    originalConsoleError.apply(console, args);
  };
  
  // 3. 重写console.warn以处理特定警告
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const warnMessage = args.join(' ');
    
    if (isEnvironmentError(warnMessage)) {
      // 静默处理环境相关警告
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
}

/**
 * 检查是否是环境相关的错误
 * @param {string} errorMessage 错误信息
 * @returns {boolean} 是否是环境相关错误
 */
function isEnvironmentError(errorMessage) {
  const environmentErrorPatterns = [
    'getActiveAppWindow',
    'getInstanceWindow',
    'window.__global',
    'window.getInstanceWindow',
    'window.__global.getActiveAppWindow',
    'window.__global.getInstanceWindow',
    'is not a function',
    'Cannot read property',
    'Cannot read properties of undefined',
    'ResizeObserver'
  ];
  
  return environmentErrorPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
}

/**
 * 错误上报函数
 * @param {string} type 错误类型
 * @param {string} message 错误信息
 * @param {Object} extra 额外信息
 */
function reportError(type, message, extra = {}) {
  // 这里可以实现错误上报逻辑
  // 例如发送到服务器或第三方错误监控服务
  
  const errorInfo = {
    type,
    message,
    timestamp: new Date().toISOString(),
    platform: 'wechat-miniprogram',
    extra
  };
  
  console.log('错误上报:', errorInfo);
  
  // 示例：发送到服务器
  // wx.request({
  //   url: 'https://your-error-reporting-endpoint.com/errors',
  //   method: 'POST',
  //   data: errorInfo,
  //   fail: (err) => {
  //     console.log('错误上报失败:', err);
  //   }
  // });
}

/**
 * 安全执行函数
 * @param {Function} fn 要执行的函数
 * @param {string} context 执行上下文
 * @param {*} defaultValue 默认返回值
 * @returns {*} 执行结果或默认值
 */
function safeExecute(fn, context = 'unknown', defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    const errorMessage = error.message || error;
    
    if (isEnvironmentError(errorMessage)) {
      console.warn(`[${context}] 已拦截环境相关错误:`, errorMessage);
      return defaultValue;
    }
    
    console.error(`[${context}] 执行错误:`, errorMessage);
    reportError('SafeExecuteError', errorMessage, { context });
    return defaultValue;
  }
}

/**
 * 创建安全的全局对象
 */
function createSafeGlobals() {
  // 创建安全的window对象替代
  const safeWindow = {
    __global: {
      getActiveAppWindow: () => {
        console.warn('getActiveAppWindow is not supported in WeChat MiniProgram');
        return null;
      },
      getInstanceWindow: () => {
        console.warn('getInstanceWindow is not supported in WeChat MiniProgram');
        return null;
      }
    },
    getInstanceWindow: () => {
      console.warn('getInstanceWindow is not supported in WeChat MiniProgram');
      return null;
    }
  };
  
  // 如果global存在，添加window属性
  if (typeof global !== 'undefined') {
    global.window = safeWindow;
  }
  
  return safeWindow;
}

/**
 * 页面错误处理装饰器
 * @param {Object} pageOptions 页面配置对象
 * @returns {Object} 包装后的页面配置对象
 */
function withErrorHandler(pageOptions) {
  const originalOnLoad = pageOptions.onLoad;
  const originalOnShow = pageOptions.onShow;
  const originalOnReady = pageOptions.onReady;
  
  return {
    ...pageOptions,
    
    onLoad: function(options) {
      safeExecute(() => {
        if (originalOnLoad) {
          originalOnLoad.call(this, options);
        }
      }, 'Page.onLoad');
    },
    
    onShow: function() {
      safeExecute(() => {
        if (originalOnShow) {
          originalOnShow.call(this);
        }
      }, 'Page.onShow');
    },
    
    onReady: function() {
      safeExecute(() => {
        if (originalOnReady) {
          originalOnReady.call(this);
        }
      }, 'Page.onReady');
    }
  };
}

module.exports = {
  initErrorHandler,
  isEnvironmentError,
  reportError,
  safeExecute,
  createSafeGlobals,
  withErrorHandler
};
