/**
 * 设备检测工具
 * 用于检测设备类型和兼容性问题
 */

class DeviceDetector {
  constructor() {
    this.systemInfo = null;
    this.isIOS = false;
    this.isAndroid = false;
    this.needIconFallback = false;
    
    this.init();
  }

  /**
   * 初始化设备信息
   */
  init() {
    try {
      this.systemInfo = wx.getSystemInfoSync();
      this.isIOS = this.systemInfo.platform === 'ios';
      this.isAndroid = this.systemInfo.platform === 'android';
      
      // 判断是否需要图标降级方案
      this.needIconFallback = this.checkIconFallbackNeeded();
      
      console.log('设备信息:', {
        platform: this.systemInfo.platform,
        system: this.systemInfo.system,
        version: this.systemInfo.version,
        needIconFallback: this.needIconFallback
      });
    } catch (error) {
      console.error('获取设备信息失败:', error);
    }
  }

  /**
   * 检查是否需要图标降级方案
   */
  checkIconFallbackNeeded() {
    // iOS设备通常需要降级方案
    if (this.isIOS) {
      return true;
    }
    
    // 某些Android版本也可能需要
    if (this.isAndroid && this.systemInfo.system) {
      const androidVersion = this.parseAndroidVersion(this.systemInfo.system);
      // Android 5.0以下版本可能需要降级
      if (androidVersion && androidVersion < 5.0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 解析Android版本号
   */
  parseAndroidVersion(systemString) {
    const match = systemString.match(/Android\s+(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * 获取设备类型
   */
  getDeviceType() {
    if (this.isIOS) return 'ios';
    if (this.isAndroid) return 'android';
    return 'unknown';
  }

  /**
   * 是否为iOS设备
   */
  isIOSDevice() {
    return this.isIOS;
  }

  /**
   * 是否为Android设备
   */
  isAndroidDevice() {
    return this.isAndroid;
  }

  /**
   * 是否需要使用图标降级方案
   */
  shouldUseIconFallback() {
    return this.needIconFallback;
  }

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return this.systemInfo;
  }

  /**
   * 检查是否支持某个功能
   */
  checkFeatureSupport(feature) {
    switch (feature) {
      case 'webp':
        // 检查是否支持WebP格式
        return this.systemInfo.platform !== 'ios' || 
               (this.systemInfo.system && this.parseIOSVersion(this.systemInfo.system) >= 14);
      
      case 'font-face':
        // 检查是否支持@font-face
        return !this.isIOS || (this.systemInfo.system && this.parseIOSVersion(this.systemInfo.system) >= 10);
      
      default:
        return true;
    }
  }

  /**
   * 解析iOS版本号
   */
  parseIOSVersion(systemString) {
    const match = systemString.match(/iOS\s+(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * 添加设备类名到页面
   */
  addDeviceClass() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const deviceClass = this.getDeviceType() + '-device';
        
        // 这里可以通过setData添加设备类名
        if (currentPage.setData) {
          currentPage.setData({
            deviceClass: deviceClass,
            needIconFallback: this.needIconFallback
          });
        }
      }
    } catch (error) {
      console.error('添加设备类名失败:', error);
    }
  }
}

// 创建单例实例
const deviceDetector = new DeviceDetector();

export default deviceDetector;
