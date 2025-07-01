// 最后修改时间: 2025-04-30 10:40:15
const personalCredit = require('./personal-credit');
const businessCredit = require('./business-credit');
const propertyAdvice = require('./property-advice');
const financingAdvice = require('./financing-advice');
const followupChat = require('./followup-chat');
const loanKeywordExtractor = require('./loanKeywordExtractor');
const propertyNeedsAnalytics = require('./propertyNeedsAnalytics');
const chatWithAiMini = require('./chatWithAi-mini');

const promptsConfig = {
  'personal-credit': personalCredit,
  'business-credit': businessCredit,
  'property-advice': propertyAdvice,
  'financing-advice': financingAdvice,
  'followup-chat': followupChat,
  'loan-keywords': loanKeywordExtractor,
  'property-needs-analytics': propertyNeedsAnalytics,
  'chat': chatWithAiMini
};

function getPromptConfig(chatType) {
  const config = promptsConfig[chatType];
  if (!config) {
    throw new Error(`未找到类型 ${chatType} 的提示词配置`);
  }
  return config;
}

module.exports = {
  promptsConfig,
  getPromptConfig
}; 