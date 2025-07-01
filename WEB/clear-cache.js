// 最后修改记录时间 -> 2024-05-15

// 清除Node.js的模块缓存
console.log('清除Node.js的模块缓存...');
Object.keys(require.cache).forEach(function(key) {
  if (key.includes('prompts')) {
    delete require.cache[key];
    console.log(`已清除缓存: ${key}`);
  }
});

// 重新加载提示词配置
try {
  console.log('重新加载提示词配置...');
  const { getPromptConfig } = require('./src/config/prompts/index.js');
  const config = getPromptConfig('personal-credit');
  console.log('个人征信提示词配置:');
  console.log('角色:', config.role);
  console.log('版本号:', config.version);
  console.log('基础提示词前100个字符:', config.basePrompt.substring(0, 100));
  console.log('基础提示词长度:', config.basePrompt.length);
} catch (error) {
  console.error('加载提示词配置失败:', error);
} 