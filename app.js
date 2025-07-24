// app.js
const EnvAdapter = require('./utils/env-adapter.js');
const ErrorHandler = require('./utils/error-handler.js');

// 初始化错误处理器
ErrorHandler.initErrorHandler();

// 创建安全的全局对象
ErrorHandler.createSafeGlobals();

App({
  globalData: {
    envAdapter: EnvAdapter,
    userInfo: null
  },

  onLaunch: function() {
    console.log('小程序启动');

    // 初始化环境适配器
    this.globalData.envAdapter = EnvAdapter;

    // 检查更新
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });

      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function() {
        console.log('新版本下载失败');
      });
    }
  },

  onShow: function() {
    console.log('小程序显示');
  },

  onHide: function() {
    console.log('小程序隐藏');
  },

  onError: function(error) {
    console.error('小程序发生错误:', error);

    // 使用错误处理器处理错误
    const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));

    if (ErrorHandler.isEnvironmentError(errorMessage)) {
      console.warn('已拦截环境相关错误，不影响正常使用');
      return;
    }

    // 其他错误进行上报
    ErrorHandler.reportError('AppError', errorMessage, {
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
})
