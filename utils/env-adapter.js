/**
 * 微信小程序环境适配器
 * 用于处理Web环境和小程序环境的差异
 */

// 检查当前运行环境
const isWeChatMiniProgram = typeof wx !== 'undefined' && wx.getSystemInfoSync;
const isBrowser = typeof window !== 'undefined';

/**
 * 环境适配器对象
 */
const EnvAdapter = {
  // 环境检测
  isWeChatMiniProgram,
  isBrowser,
  
  // 全局对象适配
  global: (() => {
    if (isWeChatMiniProgram) {
      // 小程序环境：创建一个安全的全局对象
      return {
        // 提供基本的全局方法
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        console: console,
        
        // 模拟window对象的部分功能（如果需要）
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
        
        // 提供window对象的替代方法
        getInstanceWindow: () => {
          console.warn('getInstanceWindow is not supported in WeChat MiniProgram');
          return null;
        }
      };
    } else if (isBrowser) {
      // 浏览器环境：返回window对象
      return window;
    } else {
      // Node.js或其他环境
      return global || {};
    }
  })(),
  
  // 存储适配
  storage: {
    setItem: (key, value) => {
      if (isWeChatMiniProgram) {
        try {
          wx.setStorageSync(key, value);
        } catch (e) {
          console.error('Storage setItem error:', e);
        }
      } else if (isBrowser) {
        localStorage.setItem(key, value);
      }
    },
    
    getItem: (key) => {
      if (isWeChatMiniProgram) {
        try {
          return wx.getStorageSync(key);
        } catch (e) {
          console.error('Storage getItem error:', e);
          return null;
        }
      } else if (isBrowser) {
        return localStorage.getItem(key);
      }
      return null;
    },
    
    removeItem: (key) => {
      if (isWeChatMiniProgram) {
        try {
          wx.removeStorageSync(key);
        } catch (e) {
          console.error('Storage removeItem error:', e);
        }
      } else if (isBrowser) {
        localStorage.removeItem(key);
      }
    }
  },
  
  // 网络请求适配
  request: (options) => {
    return new Promise((resolve, reject) => {
      if (isWeChatMiniProgram) {
        wx.request({
          url: options.url,
          method: options.method || 'GET',
          data: options.data,
          header: options.headers,
          success: (res) => {
            resolve({
              data: res.data,
              status: res.statusCode,
              headers: res.header
            });
          },
          fail: (err) => {
            reject(err);
          }
        });
      } else if (isBrowser && typeof fetch !== 'undefined') {
        fetch(options.url, {
          method: options.method || 'GET',
          headers: options.headers,
          body: options.data ? JSON.stringify(options.data) : undefined
        })
        .then(response => {
          return response.json().then(data => ({
            data,
            status: response.status,
            headers: response.headers
          }));
        })
        .then(resolve)
        .catch(reject);
      } else {
        reject(new Error('No suitable request method available'));
      }
    });
  },
  
  // 错误处理适配
  handleError: (error, context = '') => {
    const errorMessage = `[${context}] ${error.message || error}`;
    
    if (isWeChatMiniProgram) {
      console.error(errorMessage);
      // 可以添加小程序特定的错误上报
    } else {
      console.error(errorMessage);
      // 可以添加浏览器特定的错误处理
    }
  },
  
  // 显示提示信息
  showToast: (message, type = 'none') => {
    if (isWeChatMiniProgram) {
      wx.showToast({
        title: message,
        icon: type === 'success' ? 'success' : 'none',
        duration: 2000
      });
    } else if (isBrowser) {
      // 浏览器环境可以使用alert或自定义toast
      console.log(`Toast: ${message}`);
    }
  }
};

// 导出适配器
module.exports = EnvAdapter;

// 如果在小程序环境中，将适配器挂载到全局
if (isWeChatMiniProgram && typeof getApp !== 'undefined') {
  try {
    const app = getApp();
    if (app) {
      app.envAdapter = EnvAdapter;
    }
  } catch (e) {
    // 忽略getApp错误
  }
}
