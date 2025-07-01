// 最后修改记录时间 -> 2024-06-05 23:00
// 使用相对路径，依赖webpack代理
const API_BASE_URL = '';

export async function sendMessage(messages, chatType) {
  try {
    console.log('发送请求到:', `/api/chat`);
    console.log('请求数据:', { messages, chatType });
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时
    
    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ messages, chatType }),
        mode: 'cors', // 启用CORS
        credentials: 'omit', // 不发送cookies
        signal: controller.signal
      });
      
      // 清除超时计时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 处理HTTP错误状态
        if (response.status === 504) {
          throw new Error('请求超时，服务器处理时间过长。请尝试发送更简短的消息或稍后重试。');
        }
        
        const errorText = await response.text();
        console.error('服务器响应错误:', response.status, errorText);
        
        try {
          // 尝试解析JSON错误
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.details || `服务器响应错误: ${response.status}`);
        } catch (e) {
          // 如果不是JSON，直接使用文本
          throw new Error(`服务器响应错误: ${response.status} ${errorText.substring(0, 100)}`);
        }
      }

      const data = await response.json();
      console.log('服务器响应:', data);
      
      // 确保返回一个包含role和content属性的对象
      if (data.message) {
        return data.message;
      } else {
        return {
          role: 'assistant',
          content: '服务器返回了无效的响应格式。'
        };
      }
    } catch (fetchError) {
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      // 处理网络错误、超时等
      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时，服务器响应时间过长。请稍后重试。');
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error('API调用错误:', error);
    throw error;
  }
}

/**
 * 上传PDF文件并获取分析结果
 * @param {File} file - 要上传的PDF文件
 * @param {string} chatType - 聊天类型
 * @returns {Promise<Object>} - 服务器响应
 */
export async function uploadPDFFile(file, chatType) {
  try {
    console.log('上传PDF文件:', file.name);
    console.log('聊天类型:', chatType);
    console.log('文件大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatType', chatType);
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时
    
    try {
      // 发送请求 - 使用相对路径
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      });
      
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // 处理HTTP错误状态
        if (response.status === 504) {
          throw new Error('请求超时，文件可能过大或服务器处理时间过长');
        }
        
        const errorText = await response.text();
        console.error('文件上传错误:', response.status, errorText);
        
        try {
          // 尝试解析JSON错误
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `文件上传错误: ${response.status}`);
        } catch (e) {
          // 如果不是JSON，直接使用文本
          throw new Error(`文件上传错误: ${response.status} ${errorText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('文件上传响应:', data);
      
      // 确保返回一个包含role和content属性的对象
      if (data.message && data.message.role && data.message.content) {
        return data.message;
      } else if (data.message && data.message.content) {
        return {
          role: 'assistant',
          content: data.message.content
        };
      } else if (data.message) {
        return {
          role: 'assistant',
          content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message)
        };
      } else {
        return {
          role: 'assistant',
          content: '文件已成功上传，但服务器未返回分析结果。'
        };
      }
    } catch (fetchError) {
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      // 处理网络错误、超时等
      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时，文件可能过大或网络连接不稳定');
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
}