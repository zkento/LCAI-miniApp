// 最后修改时间: 2024-05-15

import axios from 'axios'
import dotenv from 'dotenv'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'
import { getPromptConfig } from '@/config/prompts'

// 创建基础axios实例
const deepseekApi = axios.create({
  baseURL: DEEPSEEK_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 90000 // 增加超时时间到90秒
})

// 添加请求拦截器，实时从.env获取API密钥
deepseekApi.interceptors.request.use(config => {
  // 重新加载.env文件
  const env = dotenv.config().parsed || {};
  const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY环境变量未设置，请在.env文件中配置')
  }
  
  // 设置最新的Authorization header
  config.headers.Authorization = `Bearer ${DEEPSEEK_API_KEY}`;
  return config;
});

// 简单的内存缓存实现
const cache = new Map()
const CACHE_EXPIRY = 30 * 60 * 1000 // 缓存30分钟

/**
 * 生成缓存key
 * @param {string} type - 对话类型
 * @param {string} content - 用户消息
 * @returns {string} - 缓存key
 */
function generateCacheKey(type, content) {
  return `${type}:${content}`
}

/**
 * 从缓存获取结果
 * @param {string} key - 缓存key
 * @returns {string|null} - 缓存的结果或null
 */
function getFromCache(key) {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * 将结果存入缓存
 * @param {string} key - 缓存key
 * @param {string} data - 要缓存的数据
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 预处理征信报告内容
 * @param {string} content - 原始报告内容
 * @returns {Object} - 预处理后的数据
 */
function preprocessCreditReport(content) {
  // 保存原始内容
  let result = {
    originalContent: content,
    sections: {}
  }
  
  try {
    // 基本信息提取
    const basicInfoMatch = content.match(/基本信息[\s\S]*?(?=贷款信息|$)/i)
    if (basicInfoMatch) {
      result.sections.basicInfo = cleanSection(basicInfoMatch[0])
    }
    
    // 贷款信息提取
    const loanInfoMatch = content.match(/贷款信息[\s\S]*?(?=信用卡信息|$)/i)
    if (loanInfoMatch) {
      result.sections.loanInfo = cleanSection(loanInfoMatch[0])
    }
    
    // 信用卡信息提取
    const creditCardMatch = content.match(/信用卡信息[\s\S]*?(?=担保信息|$)/i)
    if (creditCardMatch) {
      result.sections.creditCardInfo = cleanSection(creditCardMatch[0])
    }
    
    // 担保信息提取
    const guaranteeMatch = content.match(/担保信息[\s\S]*?(?=查询记录|$)/i)
    if (guaranteeMatch) {
      result.sections.guaranteeInfo = cleanSection(guaranteeMatch[0])
    }
    
    // 查询记录提取
    const queryMatch = content.match(/查询记录[\s\S]*?$/i)
    if (queryMatch) {
      result.sections.queryInfo = cleanSection(queryMatch[0])
    }
    
    // 数据清洗函数
    function cleanSection(text) {
      return text
        .replace(/^\s+|\s+$/g, '') // 去除首尾空白
        .replace(/\s{2,}/g, ' ') // 合并多个空格
        .replace(/[\r\n]+/g, '\n') // 统一换行符
        .trim()
    }
    
    // 验证数据完整性
    const requiredSections = ['basicInfo', 'loanInfo', 'creditCardInfo', 'guaranteeInfo', 'queryInfo']
    const missingSections = requiredSections.filter(section => !result.sections[section])
    
    if (missingSections.length > 0) {
      console.warn('Missing sections:', missingSections)
    }
    
    return result
    
  } catch (error) {
    console.error('Error preprocessing credit report:', error)
    // 发生错误时返回原始内容
    return {
      originalContent: content,
      sections: { rawContent: content }
    }
  }
}

/**
 * 构建更精确的AI提示词
 * @param {string} type - 分析类型
 * @param {Object} preprocessedData - 预处理后的数据
 * @returns {string} - 完整的提示词
 */
function buildPrecisePrompt(type, preprocessedData) {
  // 获取提示词配置
  const promptConfig = getPromptConfig(type);
  if (!promptConfig) {
    throw new Error(`未找到类型 ${type} 的提示词配置`);
  }

  // 如果有原始内容，优先使用原始内容
  const reportContent = preprocessedData.originalContent || JSON.stringify(preprocessedData.sections, null, 2);
  
  // 构建完整的提示词
  const fullPrompt = `${promptConfig.role}\n\n${promptConfig.basePrompt}\n\n征信报告原文：\n\`\`\`\n${reportContent}\n\`\`\``;
  
  return fullPrompt;
}

/**
 * 与 AI 进行对话
 * @param {string} content - 用户输入内容
 * @param {string} type - 分析类型
 * @returns {Promise<Object>} - AI 响应结果
 */
export async function chatWithAI(content, type = 'personal-credit') {
  // 获取缓存键
  const cacheKey = generateCacheKey(type, content)
  
  // 尝试从缓存获取
  const cachedResult = getFromCache(cacheKey)
  if (cachedResult) {
    console.log('从缓存中获取AI响应')
    return cachedResult
  }
  
  // 预处理数据
  let preprocessedData = content
  if (type === 'personal-credit') {
    preprocessedData = preprocessCreditReport(content)
  }
  
  // 构建提示词
  const prompt = buildPrecisePrompt(type, preprocessedData)
  
  try {
    // 检查内容是否为 PDF 文件内容（以 %PDF 开头）
    if (typeof content === 'string' && content.startsWith('%PDF')) {
      throw new Error('无法直接处理 PDF 文件内容，请提供文本格式的数据')
    }
    
    // 检查 base64 编码的 PDF 文件
    if (typeof content === 'string' && content.startsWith('data:application/pdf;base64,')) {
      throw new Error('无法直接处理 PDF 文件内容，请提供文本格式的数据')
    }

    // 获取提示词配置
    const promptConfig = getPromptConfig(type)
    if (!promptConfig) {
      throw new Error(`未找到类型 ${type} 的提示词配置`)
    }

    // 构建系统提示词
    const systemPrompt = promptConfig.role
    // 如果有基础提示词，添加到系统提示词中
    const fullPrompt = promptConfig.basePrompt 
      ? `${systemPrompt}\n\n${promptConfig.basePrompt}`
      : systemPrompt
    
    // 处理内容长度
    let processedContent = content
    if (typeof content === 'string' && content.length > 100000) {
      // 内容太长，截断处理
      processedContent = content.substring(0, 100000) + "\n[内容过长已截断]"
    }

    // 发送请求到 AI
    const response = await deepseekApi.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: fullPrompt
        },
        {
          role: 'user',
          content: processedContent
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
    
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('AI 响应为空')
    }
    
    const aiResponse = response.data.choices[0].message.content
    setCache(cacheKey, { data: aiResponse, timestamp: Date.now() })
    
    return {
      success: true,
      data: aiResponse
    }
    
  } catch (error) {
    console.error('AI 对话错误:', error)
    
    // 提供更详细的错误信息
    let errorMessage = error.message || '未知错误'
    
    // 处理特定的API错误
    if (error.response) {
      const status = error.response.status
      const responseData = error.response.data
      
      if (status === 400) {
        errorMessage = '请求格式错误，可能是内容过大或格式不正确'
        if (responseData && responseData.error) {
          errorMessage += `：${responseData.error.message || responseData.error}`
        }
      } else if (status === 401) {
        errorMessage = 'API密钥无效或已过期'
      } else if (status === 429) {
        errorMessage = 'API请求次数超限，请稍后再试'
      } else {
        errorMessage = `服务器错误(${status})：${responseData?.error?.message || '未知原因'}`
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * 格式化AI响应为HTML
 * @param {string} type - 对话类型
 * @param {string} response - AI原始响应
 * @returns {string} - 格式化后的HTML
 */
function formatAIResponse(type, response) {
  const promptConfig = getPromptConfig(type)
  const title = promptConfig.role

  return `
    <div class="ai-response">
      <h3>${title}分析报告</h3>
      <div class="content">
        ${response.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
    </div>
  `
}

/**
 * 验证 AI 响应的质量
 * @param {string} response - AI 的响应内容
 * @param {Object} originalData - 原始数据
 * @returns {Object} - 验证结果
 */
function validateAIResponse(response, originalData) {
  const result = {
    isValid: true,
    warnings: [],
    errors: []
  }
  
  try {
    // 检查基本结构
    if (!response.includes('<div class="credit-report">')) {
      result.errors.push('响应缺少必要的 HTML 结构')
      result.isValid = false
    }
    
    // 检查必需的部分
    const requiredSections = [
      'basic-info',
      'loan-info',
      'credit-card-info',
      'guarantee-info',
      'query-info',
      'summary'
    ]
    
    for (const section of requiredSections) {
      if (!response.includes(`<section class="${section}">`)) {
        result.warnings.push(`缺少 ${section} 部分`)
      }
    }
    
    // 检查数据引用
    const sections = originalData.sections
    for (const [key, content] of Object.entries(sections)) {
      if (content && content.length > 0) {
        // 提取关键数据点
        const dataPoints = extractDataPoints(content)
        
        // 检查这些数据点是否在响应中被引用
        for (const point of dataPoints) {
          if (!response.includes(point)) {
            result.warnings.push(`${key} 中的重要数据 "${point}" 未在分析中提及`)
          }
        }
      }
    }
    
    // 检查是否包含虚构信息（基于关键词）
    const suspiciousPatterns = [
      '可能',
      '推测',
      '建议',
      '预计',
      '估计'
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (response.includes(pattern)) {
        result.warnings.push(`发现可能的推测性表述: "${pattern}"`)
      }
    }
    
    return result
    
  } catch (error) {
    console.error('验证 AI 响应时出错:', error)
    return {
      isValid: false,
      warnings: [],
      errors: ['验证过程发生错误: ' + error.message]
    }
  }
}

/**
 * 从文本中提取关键数据点
 * @param {string} text - 原始文本
 * @returns {Array<string>} - 关键数据点数组
 */
function extractDataPoints(text) {
  const dataPoints = []
  
  // 提取数字相关的数据点
  const numberPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*[元万千亿美元]/g
  let match
  while ((match = numberPattern.exec(text)) !== null) {
    dataPoints.push(match[0])
  }
  
  // 提取日期相关的数据点
  const datePattern = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/g
  while ((match = datePattern.exec(text)) !== null) {
    dataPoints.push(match[0])
  }
  
  // 提取其他关键信息（可以根据需要扩展）
  const keywordPattern = /(逾期|欠款|担保|查询|贷款|信用卡)[^，。；\n]*[，。；\n]/g
  while ((match = keywordPattern.exec(text)) !== null) {
    dataPoints.push(match[0])
  }
  
  return [...new Set(dataPoints)] // 去重
}

// 导出其他可能需要的函数
export {
  preprocessCreditReport,
  buildPrecisePrompt,
  validateAIResponse,
  extractDataPoints
} 