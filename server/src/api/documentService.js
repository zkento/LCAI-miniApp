// 最后修改记录时间 -> 2024-06-06 12:30
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);

// 从环境变量获取OCR语言配置
const TESSERACT_LANG = process.env.TESSERACT_LANG || 'chi_sim+chi_tra';

/**
 * 文档处理服务
 * 用于本地提取PDF和图片中的中文文本
 */

/**
 * 从PDF文件中提取文本内容，针对中文进行优化
 * @param {Buffer} fileBuffer - PDF文件的Buffer数据
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} - 提取的文本内容
 */
async function extractTextFromPDF(fileBuffer, fileName) {
  console.log(`开始从PDF文件 ${fileName} 提取文本...`);
  
  try {
    // 检查文件Buffer是否有效
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('无效的PDF文件');
    }
    
    // 检查文件头，确保是PDF文件
    const pdfHeader = fileBuffer.slice(0, 5).toString();
    if (pdfHeader !== '%PDF-') {
      throw new Error('文件不是有效的PDF格式');
    }
    
    console.log(`PDF文件大小: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // 设置pdf-parse选项
    const options = {
      // 不限制页数
      max: 0,
      // 设置渲染选项
      pagerender: function(pageData) {
        // 使用默认渲染
        return Promise.resolve(pageData.getTextContent())
          .then(function(textContent) {
            let text = '';
            let lastY = -1;
            
            // 处理每个文本项
            for (let item of textContent.items) {
              if (lastY !== item.transform[5]) {
                text += '\n';
              }
              text += item.str;
              lastY = item.transform[5];
            }
            
            return text;
          });
      }
    };
    
    // 使用pdf-parse库解析PDF
    const data = await pdfParse(fileBuffer, options);
    
    // 提取文本内容
    const extractedText = data.text || '';
    
    console.log(`成功提取PDF文本，长度: ${extractedText.length}`);
    console.log(`PDF页数: ${data.numpages}`);
    
    return extractedText;
  } catch (error) {
    console.error('PDF解析错误:', error);
    
    // 检查是否是内存不足错误
    if (error.message.includes('memory') || error.message.includes('allocation failed')) {
      throw new Error('PDF文件过大，内存不足');
    }
    
    // 检查是否是文件损坏错误
    if (error.message.includes('Invalid') || error.message.includes('corrupt') || error.message.includes('malformed')) {
      throw new Error('PDF文件已损坏或格式无效');
    }
    
    throw new Error(`PDF文本提取失败: ${error.message}`);
  }
}

/**
 * 从图片中提取文本内容（OCR），针对中文进行优化
 * @param {Buffer} fileBuffer - 图片文件的Buffer数据
 * @param {string} fileName - 文件名
 * @param {string} language - OCR语言，默认使用环境变量中的配置
 * @returns {Promise<string>} - 提取的文本内容
 */
async function extractTextFromImage(fileBuffer, fileName, language = TESSERACT_LANG) {
  console.log(`开始从图片 ${fileName} 提取文本...`);
  console.log(`使用OCR语言: ${language}`);
  
  // 创建临时文件
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${fileName}`);
  
  try {
    // 检查文件Buffer是否有效
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('无效的图片文件');
    }
    
    console.log(`图片文件大小: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // 将buffer写入临时文件
    await writeFileAsync(tempFilePath, fileBuffer);
    
    // 创建单个Tesseract worker
    const worker = await createWorker();
    
    // 加载语言数据
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    // 设置OCR参数，优化中文识别
    await worker.setParameters({
      tessedit_char_whitelist: '', // 不限制字符
      preserve_interword_spaces: '1' // 保留词间空格
    });
    
    // 识别图片中的文本
    const { data } = await worker.recognize(tempFilePath);
    
    // 释放worker资源
    await worker.terminate();
    
    // 删除临时文件
    await unlinkAsync(tempFilePath);
    console.log(`临时文件已删除: ${tempFilePath}`);
    
    console.log(`成功提取图片文本，长度: ${data.text.length}`);
    
    return data.text;
  } catch (error) {
    // 确保临时文件被删除
    if (fs.existsSync(tempFilePath)) {
      await unlinkAsync(tempFilePath).catch(e => console.error('删除临时文件失败:', e));
      console.log(`临时文件已删除: ${tempFilePath}`);
    }
    
    console.error('图片OCR错误:', error);
    
    // 检查是否是内存不足错误
    if (error.message.includes('memory') || error.message.includes('allocation failed')) {
      throw new Error('图片文件过大，内存不足');
    }
    
    throw new Error(`图片文本提取失败: ${error.message}`);
  }
}

/**
 * 后处理提取的中文文本，改善格式和可读性
 * @param {string} text - 原始提取的文本
 * @returns {string} - 处理后的文本
 */
function postProcessChineseText(text) {
  if (!text) return '';
  
  try {
    // 1. 移除多余的空格（中文之间通常不需要空格）
    let processed = text.replace(/([一-龥])\s+([一-龥])/g, '$1$2');
    
    // 2. 修复常见的OCR错误
    const commonErrors = {
      '囗': '口',
      '囚': '回',
      '巳': '已',
      '己': '已',
      '卩': '印',
      '刂': '刀',
      '彳': '彼'
    };
    
    for (const [error, correction] of Object.entries(commonErrors)) {
      processed = processed.replace(new RegExp(error, 'g'), correction);
    }
    
    // 3. 合并多个连续的换行
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
  } catch (error) {
    console.error('文本后处理错误:', error);
    // 如果后处理失败，返回原始文本
    return text;
  }
}

module.exports = {
  extractTextFromPDF,
  extractTextFromImage,
  postProcessChineseText
}; 