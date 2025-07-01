// 最后更改时间: 2025-05-13 15:46:32
/**
 * PDF处理相关API服务
 */
import axios from 'axios';

/**
 * 使用TextIn API将PDF文件转换为Markdown文本
 * @param {File} file - PDF文件对象
 * @param {Function} progressCallback - 进度回调函数，接收一个0-100的数字表示进度
 * @returns {Promise} - 包含提取结果的Promise
 */
export async function extractTextFromPDF(file, progressCallback) {
  // API配置
  const API_URL = 'https://api.textin.com/ai/service/v1/pdf_to_markdown';
  const APP_ID = 'a8412915281d0adb33699d6cf3115c85';
  const SECRET_CODE = 'dbb46085ac91be5fe315bca6c508be3b';
  
  // 验证文件类型
  if (!file || !(file instanceof File)) {
    console.error('无效的文件对象:', file);
    return {
      success: false,
      error: '无效的文件对象',
      errorCode: 'INVALID_FILE'
    };
  }

  // 验证文件格式
  if (file.type !== 'application/pdf') {
    console.error('文件不是PDF格式:', file.type);
    return {
      success: false,
      error: '只支持PDF格式的文件',
      errorCode: 'INVALID_FILE_TYPE'
    };
  }
  
  // 创建FormData对象，用于发送文件
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // 发送API调用前设置进度为20%，表示准备阶段
    if (typeof progressCallback === 'function') {
      progressCallback(20);
    }

    // 发送请求到TextIn API
    const response = await axios.post(API_URL, formData, {
      headers: {
        'x-ti-app-id': APP_ID,
        'x-ti-secret-code': SECRET_CODE,
        'Content-Type': 'multipart/form-data'
      }
      // 移除上传进度监听，避免假进度信息
    });
    
    // 上传完成，服务器处理阶段
    console.log('上传完成，服务器处理中');
    if (typeof progressCallback === 'function') {
      // 上传完成后将进度设为80%，表示后端处理阶段
      progressCallback(80);
    }
    
    // 检查响应状态
    if (response.data && response.data.code === 200) {
      console.log('PDF提取成功:', response.data);
      
      // 成功完成后才将进度设为100%
      if (typeof progressCallback === 'function') {
        progressCallback(100);
      }
      
      // 返回提取的文本和其他可能需要的信息
      return {
        success: true,
        text: response.data.result.markdown || '',
        fullResult: response.data.result,
        totalPages: response.data.result.total_page_number || 0,
        characterCount: response.data.result.character_number || 0
      };
    } else {
      // API请求成功但处理失败
      const errorMsg = response.data.message || '未知错误';
      console.error('PDF提取失败:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        errorCode: response.data.code
      };
    }
  } catch (error) {
    // 网络或其他错误
    console.error('PDF提取过程中发生错误:', error);
    
    // 提取API响应错误信息（如果存在）
    let errorMsg = '网络错误，请稍后重试';
    let errorCode = null;
    
    if (error.response && error.response.data) {
      errorMsg = error.response.data.message || errorMsg;
      errorCode = error.response.data.code;
    }
    
    return {
      success: false,
      error: errorMsg,
      errorCode: errorCode,
      originalError: error.toString()
    };
  }
} 