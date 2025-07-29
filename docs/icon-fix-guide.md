# Vant Weapp 图标修复指南

## 问题描述
在iOS真机设备上，Vant Weapp的van-icon组件显示为空白方框（□）而非正确图标。

## 问题原因
1. **字体文件加载失败**：iOS设备对在线字体文件的加载有安全限制
2. **网络问题**：字体文件托管在阿里云CDN，可能存在网络访问问题
3. **缓存问题**：字体文件缓存失效或损坏

## 解决方案

### 方案1：本地字体文件（推荐）
1. 下载Vant图标字体文件到本地
2. 修改@font-face声明，优先使用本地文件
3. 在app.wxss中引入修复样式

```css
@font-face {
  font-family: vant-icon;
  src: url('./assets/fonts/vant-icon.woff2') format("woff2"),
       url('./assets/fonts/vant-icon.woff') format("woff"),
       url(https://at.alicdn.com/t/c/font_2553510_kfwma2yq1rs.woff2) format("woff2");
}
```

### 方案2：图标降级组件
使用`icon-fallback`组件自动检测并降级到图片图标：

```xml
<!-- 替换原来的van-icon -->
<icon-fallback name="search" size="22px" />
```

### 方案3：设备检测
使用`device-detector`工具检测设备类型：

```javascript
import deviceDetector from '../../utils/device-detector.js';

// 检查是否需要降级方案
if (deviceDetector.shouldUseIconFallback()) {
  // 使用图片图标
} else {
  // 使用字体图标
}
```

## Toast层级修复

### 问题
Toast被detail-popup面板遮挡，需要关闭面板才能看到。

### 解决方案
1. 设置Toast的z-index为10000
2. 在显示Toast前先关闭弹窗
3. 使用正确的Toast调用方式

```javascript
// 修复前
Toast('文件预览功能开发中...');

// 修复后
this.setData({
  showDetailPopup: false
}, () => {
  Toast({
    message: '文件预览功能开发中...',
    zIndex: 10000,
    duration: 2000
  });
});
```

## 验证方法

### iOS真机测试
1. 使用真实iOS设备进行测试
2. 检查图标是否正常显示
3. 验证Toast是否能正常显示在最上层

### 开发者工具测试
1. 在开发者工具中切换到iOS模拟器
2. 检查控制台是否有字体加载错误
3. 验证降级方案是否正常工作

## 文件结构
```
├── assets/
│   ├── fonts/
│   │   ├── vant-icon.woff2    # 字体文件
│   │   ├── vant-icon.woff     # 字体文件
│   │   └── vant-icon.wxss     # 字体样式
│   └── icons/
│       ├── search.png         # 降级图标
│       ├── filter.png         # 降级图标
│       └── ...
├── components/
│   └── icon-fallback/         # 图标降级组件
├── styles/
│   └── icon-fix.wxss          # 修复样式
└── utils/
    └── device-detector.js     # 设备检测工具
```

## 注意事项
1. 字体文件需要放在正确的路径下
2. 图片图标需要准备完整的图标集
3. 测试时需要使用真实iOS设备
4. 注意版本兼容性问题
