Page({

  data: {

  },

  onLoad(options) {

  },
  
  navigateToService(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      // 添加轻微延迟，确保点击动画完成后再跳转
      setTimeout(() => {
        wx.navigateTo({
          url: url,
          fail: function(err) {
            console.error(`跳转失败: ${url}`, err);
            wx.showToast({
              title: '功能开发中',
              icon: 'none'
            });
          }
        });
      }, 100);
    }
  }
})