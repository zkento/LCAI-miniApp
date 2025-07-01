Page({
  data: {},

  onLoad: function (options) {

  },

  goToAnalyse: function() {
    wx.switchTab({
      url: '/pages/analyse/analyse'
    });
  }
});
