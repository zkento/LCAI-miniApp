Page({
  data: {
    fileUploadType: 'pdf', // 'pdf' 或 'images'
    fileList: [], // 上传的文件列表
    customerName: '', // 客户姓名
    uploading: false, // 是否正在上传
    fileUploadCountText: '', // 用于显示的文件计数文本
    windowWidth: 0, // 窗口宽度
    windowHeight: 0, // 窗口高度
    scrollViewHeight: 'auto', // 滚动区域的高度
    isDragging: false, // 是否正在拖拽
    dragItemIndex: -1, // 当前拖拽的项索引
    dragStartX: 0, // 拖拽开始的X坐标
    dragStartY: 0, // 拖拽开始的Y坐标
    itemPositions: [], // 记录每个图片项的位置信息
    containerHeight: 0, // 容器高度
    grid: [], // 用于存储网格映射
  },

  onLoad(options) {
    // 页面加载时的初始化
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight
        });
        
        // 如果已有图片，初始化它们的位置
        if (this.data.fileList.length > 0) {
          this.initImagePositions();
        }
      }
    });
  },

  onShow() {
    // 每次页面显示时，确保图片正确布局
    if (this.data.fileList.length > 0) {
      this.forceLayout();
    }
  },

  onReady() {
    // 动态计算滚动区域高度
    const query = wx.createSelectorQuery();
    query.select('#nav-bar').boundingClientRect(navRect => {
      if (navRect) {
        const scrollViewHeight = this.data.windowHeight - navRect.height;
        this.setData({
          scrollViewHeight: `${scrollViewHeight}px`
        });
      }
    }).exec();
  },

  // 处理导航栏返回事件
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 每次文件列表更新时，初始化图片位置
  initImagePositions(fileList = this.data.fileList) {
    if (fileList.length === 0) return;
    
    // 获取屏幕宽度
    const screenWidth = this.data.windowWidth || wx.getSystemInfoSync().windowWidth;
    
    // 计算每行可以放置的图片数量和每个图片的宽度
    const itemWidth = 180; // rpx
    const itemHeight = 240; // rpx
    const margin = 20; // rpx
    
    // 转换rpx为px
    const pxRatio = screenWidth / 750;
    const itemWidthPx = itemWidth * pxRatio;
    const itemHeightPx = itemHeight * pxRatio;
    const marginPx = margin * pxRatio;
    
    // 计算一行可以放几个图片
    const containerPadding = 80; // 容器左右内边距总和 (rpx)
    const containerPaddingPx = containerPadding * pxRatio;
    const availableWidth = screenWidth - containerPaddingPx;
    const itemsPerRow = Math.max(1, Math.floor(availableWidth / (itemWidthPx + marginPx)));
    
    // 更新每个图片的位置
    const updatedFileList = fileList.map((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      return {
        ...item,
        x: col * (itemWidthPx + marginPx),
        y: row * (itemHeightPx + marginPx),
        index: index // 保存原始索引，方便排序后恢复
      };
    });
    
    // 计算容器需要的高度
    const rowCount = Math.ceil(fileList.length / itemsPerRow);
    const containerHeightPx = rowCount * (itemHeightPx + marginPx) + marginPx; // 添加底部边距
    const containerHeightRpx = containerHeightPx / pxRatio;
    
    // 更新容器高度和文件列表
    this.setData({
      fileList: updatedFileList,
      containerHeight: containerHeightRpx
    });
  },

  // 切换文件上传类型
  selectFileType(e) {
    const newType = e.currentTarget.dataset.type;

    // 如果点击的是当前已激活的类型，则不执行任何操作
    if (this.data.fileUploadType === newType) {
      return;
    }

    // 如果已有上传文件，此时点击另一个（被禁用的）类型，则弹出提示
    if (this.data.fileList.length > 0) {
      const message = newType === 'pdf' 
        ? '若要上传PDF文件，请先清除已上传的图片' 
        : '若要上传图片文件，请先清除已上传的PDF';
      
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2500 // 延长显示时间，确保用户能看清
      });
      return;
    }

    // 如果没有已上传文件，则正常切换类型
    this.setData({
      fileUploadType: newType
    });
  },

  // 选择文件
  chooseFile() {
    if (this.data.fileUploadType === 'pdf') {
      this.choosePdf();
    } else {
      this.chooseImages();
    }
  },

  // 选择PDF文件
  choosePdf() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        
        // 验证文件类型
        if (!/\.pdf$/i.test(tempFile.name)) {
          wx.showToast({
            title: '请上传PDF格式的文件',
            icon: 'none'
          });
          return;
        }
        
        // 验证文件大小（100MB限制）
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (tempFile.size > maxSize) {
          wx.showToast({
            title: '文件大小不能超过100MB',
            icon: 'none'
          });
          return;
        }
        
        // 自动从文件名填充客户姓名（如果客户姓名为空）
        const nameWithoutExt = tempFile.name.replace(/\.pdf$/i, "");
        
        this.setData({
          fileList: [tempFile],
          customerName: this.data.customerName || nameWithoutExt,
          fileUploadCountText: tempFile.name
        });
        
        // wx.showToast({
        //   title: '成功添加PDF文件',
        //   icon: 'success'
        // });
      }
    });
  },

  // 选择图片文件
  chooseImages() {
    const remainingCount = 100 - this.data.fileList.length;
    if (remainingCount <= 0) {
      wx.showToast({ 
        title: '已达到100张图片上限', 
        icon: 'none' 
      });
      return;
    }

    wx.showActionSheet({
      itemList: ['拍照', '从手机相册选择', '从微信聊天中选择'],
      success: (res) => {
        if (res.cancel) {
          return;
        }

        if (res.tapIndex === 2) { // 从微信聊天中选择
          wx.chooseMessageFile({
            count: remainingCount,
            type: 'image',
            success: (chooseRes) => {
              const tempFiles = chooseRes.tempFiles;
              const invalidFiles = [];
              const validFiles = [];

              tempFiles.forEach(file => {
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                  invalidFiles.push(file.path);
                } else {
                  // chooseMessageFile 直接返回 name 和 path
                  file.x = 0;
                  file.y = 0;
                  validFiles.push(file);
                }
              });

              if (invalidFiles.length > 0) {
                wx.showToast({
                  title: `${invalidFiles.length}个文件超过10MB限制`,
                  icon: 'none'
                });
              }

              if (validFiles.length > 0) {
                const newFileList = this.data.fileList.concat(validFiles);
                this.setData({
                  fileList: newFileList,
                  fileUploadCountText: `${newFileList.length}张图片`
                }, () => {
                  this.forceLayout();
                });
              }
            }
          });
          return; // 选择微信文件后结束函数
        }
        
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        
        wx.chooseMedia({
          count: remainingCount,
          mediaType: ['image'],
          sourceType: sourceType,
          sizeType: ['original', 'compressed'],
          success: (res) => {
            const tempFiles = res.tempFiles;
            const invalidFiles = [];
            const validFiles = [];
            
            tempFiles.forEach(file => {
              const maxSize = 10 * 1024 * 1024;
              if (file.size > maxSize) {
                invalidFiles.push(file.tempFilePath);
              } else {
                file.name = this.getFileName(file.tempFilePath);
                file.path = file.tempFilePath;
                file.x = 0;
                file.y = 0;
                validFiles.push(file);
              }
            });
            
            if (invalidFiles.length > 0) {
              wx.showToast({
                title: `${invalidFiles.length}个文件超过10MB限制`,
                icon: 'none'
              });
            }
            
            if (validFiles.length > 0) {
              const newFileList = this.data.fileList.concat(validFiles);
              
              // 先设置文件列表
              this.setData({
                fileList: newFileList,
                fileUploadCountText: `${newFileList.length}张图片`
              }, () => {
                // 强制立即计算布局
                this.forceLayout();
              });
            }
          }
        });
      }
    });
  },
  
  // 从路径获取文件名
  getFileName(filePath) {
    return filePath.substring(filePath.lastIndexOf('/') + 1);
  },

  // 清空文件列表
  resetFileList() {
    this.setData({
      fileList: [],
      fileUploadCountText: ''
    });
  },
  
  // 预览图片
  showImagePreview(e) {
    const index = e.currentTarget.dataset.index;
    const currentUrl = this.data.fileList[index].path;
    const urls = this.data.fileList.map(file => file.path);

    wx.previewImage({
      current: currentUrl, // 设置当前显示图片
      urls: urls, // 所有图片列表
    });
  },

  // 删除单张图片
  removeImageAt(e) {
    const index = e.currentTarget.dataset.index;
    const newFileList = this.data.fileList.slice();
    newFileList.splice(index, 1);

    this.setData({
      fileList: newFileList,
      fileUploadCountText: newFileList.length > 0 ? `${newFileList.length}张图片` : ''
    }, () => {
      // 重新计算图片位置
      if (newFileList.length > 0) {
        this.forceLayout(); // 使用forceLayout代替initImagePositions
      }
    });
  },
  
  // 格式化文件大小
  formatFileSize(size) {
    if (!size) return '';
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  },
  
  // 校验输入
  validateInput() {
    // 可以在这里添加更复杂的客户姓名校验逻辑
    return this.data.customerName.trim().length > 0;
  },

  // 开始分析
  startAnalyse() {
    // 守卫：如果按钮是"禁用"状态（通过is-disabled类模拟），则不执行任何操作
    if (this.data.fileList.length === 0 || !this.data.customerName.trim()) {
      return;
    }

    // 姓名校验 - 虽然上面的守卫已经包含了姓名的检查，但为了逻辑清晰，可以保留单独的提示
    if (!this.data.customerName.trim()) {
      wx.showToast({ title: '请输入客户姓名', icon: 'none' });
      return;
    }

    this.setData({ uploading: true });

    // 准备表单数据
    const formData = {
      customerName: this.data.customerName,
      fileList: this.data.fileList,
      file: this.data.fileList[0],
      fileType: this.data.fileUploadType
    };

    // 将表单数据存储到全局，以便报告页面获取
    const app = getApp();
    if (!app.globalData) {
      app.globalData = {};
    }
    app.globalData.creditFormData = formData;

    // 跳转到报告页面
    wx.navigateTo({
      url: '/pages/personal-credit/creditAnalyseReport?fromForm=true',
      success: () => {
        this.setData({ uploading: false });
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        this.setData({ uploading: false });
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 开始拖拽
  dragStart(e) {
    const index = e.currentTarget.dataset.index;
    
    // 记录拖拽起始点
    this.setData({
      isDragging: true,
      dragItemIndex: index,
      dragStartX: e.touches[0].clientX,
      dragStartY: e.touches[0].clientY
    });
    
    // 记录所有图片项的位置
    this.calculateItemPositions();
  },

  dragMove(e) {
    if (!this.data.isDragging) return;
    
    const index = this.data.dragItemIndex;
    if (index < 0 || index >= this.data.fileList.length) return;
    
    const fileList = this.data.fileList.slice();
    
    // 计算拖拽位置
    const moveX = e.touches[0].clientX - this.data.dragStartX;
    const moveY = e.touches[0].clientY - this.data.dragStartY;
    
    // 更新拖拽元素的位置
    fileList[index] = {
      ...fileList[index],
      x: moveX,
      y: moveY
    };
    
    this.setData({ fileList });
    
    // 检测是否需要交换位置
    this.checkForSwap(e.touches[0].clientX, e.touches[0].clientY);
  },

  dragEnd() {
    if (!this.data.isDragging) return;
    
    // 清除拖拽状态
    this.setData({
      isDragging: false,
      dragItemIndex: -1
    });
    
    // 强制重新计算布局
    this.forceLayout();
  },

  // 计算所有图片项的位置
  calculateItemPositions() {
    const query = wx.createSelectorQuery();
    
    query.selectAll('.image-preview-item-wrapper').boundingClientRect(rects => {
      if (!rects || rects.length === 0) return;
      
      // 按照位置排序，先按y后按x
      const sortedRects = [...rects].sort((a, b) => {
        if (Math.abs(a.top - b.top) < 10) { // 如果y坐标接近，则按x坐标排序
          return a.left - b.left;
        }
        return a.top - b.top;
      });
      
      // 创建网格映射
      const grid = [];
      let currentRow = -1;
      let currentY = -1;
      
      sortedRects.forEach((rect, i) => {
        // 如果是新的一行
        if (currentY === -1 || Math.abs(rect.top - currentY) > 10) {
          currentY = rect.top;
          currentRow++;
          grid[currentRow] = [];
        }
        
        grid[currentRow].push({
          index: i,
          rect: rect,
          originalIndex: parseInt(rect.dataset.index),
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2
        });
      });
      
      // 将二维网格转换为一维数组
      const itemPositions = [];
      grid.forEach(row => {
        // 按照从左到右排序
        row.sort((a, b) => a.left - b.left);
        row.forEach(item => {
          itemPositions.push(item);
        });
      });
      
      this.data.itemPositions = itemPositions;
      this.data.grid = grid;
    }).exec();
  },

  // 检查是否需要交换位置
  checkForSwap(currentX, currentY) {
    const dragIndex = this.data.dragItemIndex;
    const positions = this.data.itemPositions;
    const grid = this.data.grid;
    
    if (!positions || positions.length === 0 || !grid || dragIndex < 0) return;
    
    // 找到当前拖拽图片所在的行和列
    let targetRowIndex = -1;
    let targetColIndex = -1;
    
    // 找到最接近的位置
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
      const row = grid[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const item = row[colIndex];
        if (currentX >= item.left && currentX <= item.right && 
            currentY >= item.top && currentY <= item.bottom) {
          targetRowIndex = rowIndex;
          targetColIndex = colIndex;
          break;
        }
      }
      if (targetRowIndex !== -1) break;
    }
    
    // 如果没找到，找最近的位置
    if (targetRowIndex === -1) {
      let minDistance = Infinity;
      for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const item = row[colIndex];
          const distance = Math.sqrt(
            Math.pow(currentX - item.centerX, 2) + 
            Math.pow(currentY - item.centerY, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            targetRowIndex = rowIndex;
            targetColIndex = colIndex;
          }
        }
      }
    }
    
    if (targetRowIndex === -1 || targetColIndex === -1) return;
    
    // 获取目标位置的图片索引
    const targetItem = grid[targetRowIndex][targetColIndex];
    const targetIndex = targetItem.originalIndex;
    
    // 如果拖拽的不是自己，则交换位置
    if (targetIndex !== dragIndex) {
      // 获取当前文件列表
      const fileList = this.data.fileList.slice();
      
      // 保存拖拽的图片
      const draggedItem = fileList[dragIndex];
      
      // 如果拖拽向后移动
      if (dragIndex < targetIndex) {
        // 将中间的图片向前移动一位
        for (let i = dragIndex; i < targetIndex; i++) {
          fileList[i] = fileList[i + 1];
        }
      } else {
        // 将中间的图片向后移动一位
        for (let i = dragIndex; i > targetIndex; i--) {
          fileList[i] = fileList[i - 1];
        }
      }
      
      // 将拖拽的图片放到目标位置
      fileList[targetIndex] = draggedItem;
      
      // 更新数据
      this.setData({
        fileList: fileList,
        dragItemIndex: targetIndex
      });
      
      // 更新拖拽起始位置
      this.setData({
        dragStartX: currentX,
        dragStartY: currentY
      });
      
      // 重新计算位置信息
      setTimeout(() => {
        this.calculateItemPositions();
      }, 50);
    }
  },

  // 强制重新计算布局
  forceLayout() {
    // 初始化图片位置
    this.initImagePositions();
    
    // 确保DOM更新后重新计算容器高度
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select('.image-preview-list').boundingClientRect(rect => {
        if (rect) {
          const screenWidth = this.data.windowWidth || wx.getSystemInfoSync().windowWidth;
          const pxRatio = screenWidth / 750;
          
          // 计算容器高度并转换为rpx
          const containerHeightRpx = rect.height / pxRatio;
          
          this.setData({
            containerHeight: containerHeightRpx
          }, () => {
            // 再次初始化图片位置，确保布局正确
            setTimeout(() => {
              this.initImagePositions();
              this.calculateItemPositions();
            }, 100);
          });
        }
      }).exec();
    });
  },
});
