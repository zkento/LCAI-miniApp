// 图标降级组件
Component({
  properties: {
    name: {
      type: String,
      value: ''
    },
    size: {
      type: String,
      value: '24px'
    },
    color: {
      type: String,
      value: '#323233'
    },
    customClass: {
      type: String,
      value: ''
    },
    customStyle: {
      type: String,
      value: ''
    },
    // 是否强制使用降级方案
    forceFallback: {
      type: Boolean,
      value: false
    }
  },

  data: {
    useFallback: false,
    // 图标映射表
    iconMap: {
      'search': '/assets/icons/search.png',
      'filter-o': '/assets/icons/filter.png',
      'delete': '/assets/icons/delete.png',
      'delete-o': '/assets/icons/delete-outline.png',
      'cross': '/assets/icons/close.png',
      'close': '/assets/icons/close.png',
      'arrow-left': '/assets/icons/arrow-left.png',
      'arrow-down': '/assets/icons/arrow-down.png',
      'arrow-up': '/assets/icons/arrow-up.png',
      'plus': '/assets/icons/plus.png',
      'minus': '/assets/icons/minus.png',
      'success': '/assets/icons/success.png',
      'fail': '/assets/icons/fail.png',
      'warning': '/assets/icons/warning.png',
      'info': '/assets/icons/info.png',
      'question': '/assets/icons/question.png',
      'checked': '/assets/icons/checked.png',
      'clear': '/assets/icons/clear.png',
      'eye': '/assets/icons/eye.png',
      'eye-o': '/assets/icons/eye-outline.png',
      'edit': '/assets/icons/edit.png',
      'share': '/assets/icons/share.png',
      'share-o': '/assets/icons/share-outline.png',
      'setting': '/assets/icons/setting.png',
      'setting-o': '/assets/icons/setting-outline.png'
    }
  },

  lifetimes: {
    attached() {
      // 检测是否为iOS设备，如果是则直接使用降级方案
      const systemInfo = wx.getSystemInfoSync();
      const isIOS = systemInfo.platform === 'ios';
      
      this.setData({
        useFallback: this.data.forceFallback || isIOS
      });
    }
  },

  methods: {
    // 字体图标加载失败时的回调
    onFontIconError() {
      console.warn('字体图标加载失败，切换到图片图标');
      this.setData({
        useFallback: true
      });
    },

    // 获取图片图标路径
    getImageSrc(iconName) {
      return this.data.iconMap[iconName] || '/assets/icons/default.png';
    }
  },

  computed: {
    imageStyle() {
      let style = '';
      if (this.data.color && this.data.color !== '#323233') {
        // 对于彩色图标，可以使用filter来改变颜色（有限支持）
        style += `filter: brightness(0) saturate(100%) ${this.hexToFilter(this.data.color)};`;
      }
      return style;
    }
  },

  methods: {
    // 将十六进制颜色转换为CSS filter（简化版）
    hexToFilter(hex) {
      // 这是一个简化的实现，实际项目中可能需要更复杂的颜色转换
      const colorMap = {
        '#323233': 'invert(20%)',
        '#1890ff': 'invert(50%) sepia(100%) saturate(200%) hue-rotate(200deg)',
        '#52c41a': 'invert(50%) sepia(100%) saturate(200%) hue-rotate(90deg)',
        '#ff4d4f': 'invert(50%) sepia(100%) saturate(200%) hue-rotate(0deg)',
        '#faad14': 'invert(50%) sepia(100%) saturate(200%) hue-rotate(45deg)'
      };
      return colorMap[hex] || 'invert(20%)';
    }
  }
});
