// 最后修改时间: 2024-08-11 21:42:21
const axios = require('axios');

// 测试数据集
const testCases = [
  {
    name: "基本案例",
    description: "预算总价580-620万，首付3成（约180万），需按揭贷款。意向天河区珠江新城或海珠区琶洲地铁沿线，重点考察3房2卫户型。购房目的为自住及子女教育，需带省级学位。建面85-100㎡，优先中高楼层（15层以上），要求南向或东南向采光，接受10年内楼龄的房子。装修需精装以上标准，可接受局部翻新。必须满足地铁500米内（3/5/18号线），步行15分钟内有大型商场。医疗配套不作硬性要求，但需规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域。"
  },
  {
    name: "简短案例",
    description: "想在北京昌平区买一套100平米左右的三居室，预算400万，首付六成，需要地铁站附近的，最好是学区房。"
  },
  {
    name: "偏好强调案例",
    description: "本人打算购买一套高层江景房，要求必须是南北通透的3室2厅，最好是小区里的板楼，周边医院和商业配套齐全，交通也要方便，最好在二环内，价格在600-700万之间。"
  }
];

// 测试函数
async function testPropertyNeeds() {
  try {
    console.log('开始测试propertyNeedsAnalytics提示词...\n');
    
    for (const testCase of testCases) {
      console.log(`测试案例: ${testCase.name}`);
      console.log('描述: ', testCase.description);
      
      // 构建请求数据
      const requestData = {
        messages: [
          {
            role: 'user',
            content: testCase.description
          }
        ],
        chatType: 'property-needs-analytics'
      };
      
      // 发送请求
      console.log('发送请求...');
      const startTime = Date.now();
      const response = await axios.post('http://localhost:3000/api/chat', requestData);
      const endTime = Date.now();
      
      // 打印响应
      console.log(`响应时间: ${(endTime - startTime) / 1000}秒`);
      console.log('响应内容:');
      
      if (response.data && response.data.message && response.data.message.content) {
        try {
          // 尝试解析JSON
          const jsonMatch = response.data.message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonContent = JSON.parse(jsonMatch[0]);
            // 格式化输出 
            console.log(JSON.stringify(jsonContent, null, 2));
            
            // 简单验证
            if (jsonContent.categories && Array.isArray(jsonContent.categories)) {
              // 检查categories是否为数组
              console.log(`分析结果包含${jsonContent.categories.length}个类别`);
              
              // 检查categories结构
              let categoriesInfo = [];
              let infoFields = 0;
              
              jsonContent.categories.forEach((category, index) => {
                let categoryName = '';
                let categoryInfo = {};
                
                // 尝试从不同的字段获取类别名称
                if (category.name) {
                  categoryName = category.name;
                } else if (category.category) {
                  categoryName = category.category;
                } else {
                  categoryName = `类别${index + 1}`;
                }
                
                categoriesInfo.push(categoryName);
                
                // 根据不同的数据结构统计信息字段
                if (category.items && Array.isArray(category.items)) {
                  // 原始格式
                  infoFields += category.items.length;
                } else if (category.details && typeof category.details === 'object') {
                  // 详细信息对象格式
                  infoFields += Object.keys(category.details).length;
                } else if (category.requirements && Array.isArray(category.requirements)) {
                  // 需求列表格式
                  infoFields += category.requirements.length;
                } else {
                  // 其他键值对格式
                  const keys = Object.keys(category).filter(k => k !== 'name' && k !== 'category');
                  infoFields += keys.length;
                }
              });
              
              console.log(`分析包含的类别: ${categoriesInfo.join(', ')}`);
              console.log(`提取的信息字段数量: ${infoFields}`);
            } else {
              console.log('警告: categories字段不是数组或不存在');
            }
          } else {
            console.log('警告: 无法从响应中提取JSON');
            console.log(response.data.message.content);
          }
        } catch (parseError) {
          console.log('解析JSON失败:', parseError.message);
          console.log('原始响应内容:');
          console.log('```json');
          console.log(response.data.message.content);
          console.log('```');
        }
      } else {
        console.log('警告: 无效的响应格式');
        console.log(JSON.stringify(response.data, null, 2));
      }
      
      console.log('\n' + '-'.repeat(80) + '\n');
    }
    
    console.log('测试完成!');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
    if (error.response) {
      console.error('服务器响应错误:', error.response.status);
      console.error('错误详情:', error.response.data);
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
}

// 运行测试
testPropertyNeeds(); 