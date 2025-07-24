<template>
  <div class="property-advisor-form">
    <div class="form-container">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2 class="panel-title">填写客户购房需求</h2>
        </div>
        <div class="panel-content">
          <p class="description-hint">请参照右侧的需求描述要点输入客户的购房需求，要点覆盖得越全面越好。</p>
          
          <el-form ref="propertyFormRef" :model="formData">
            <el-form-item prop="requirements" :rules="[
              { required: true, message: '请输入需求描述', trigger: 'blur' },
              { min: 30, message: '需求描述不得少于30个字', trigger: 'blur' }
            ]">
              <el-input 
                v-model="formData.requirements"
                type="textarea"
                :rows="12"
                :autosize="{ minRows: 12, maxRows: 21 }"
                placeholder="请用不少于30个字详细地描述客户的购房需求"
                @input="handleRequirementsInput"
                @focus="handleInputFocus"
                maxlength="600"
                show-word-limit
                :disabled="isAnalyzing || hasAnalysisResult"
              ></el-input>
            </el-form-item>
            
            <!-- 添加客户姓名输入框 -->
            <div class="customer-name-input">
              <el-form-item prop="customerName" :rules="customerNameRules">
                <el-input 
                  v-model="formData.customerName"
                  placeholder="请输入客户姓名（必填，方便你查询结果）"
                  clearable
                  :disabled="isAnalyzing"
                  @keydown.enter.prevent="handleNameEnter"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          
            <div class="form-actions">
              <template v-if="!hasAnalysisResult">
                <el-button 
                  @click="resetForm" 
                  plain
                  :disabled="!formData.requirements"
                >重置</el-button>
                <el-button 
                  type="primary" 
                  @click="analyzeRequirements"
                  :loading="isAnalyzing"
                  :disabled="!formData.requirements || formData.requirements.length < 30"
                >
                  <template v-if="!isAnalyzing">
                    让AI分析客户需求
                    <!-- <span class="button-hint">Shift+Enter</span> -->
                  </template>
                  <template v-else>
                    AI正在分析需求
                    <span class="button-hint">用时{{currentAnalysisTime}}秒</span>
                  </template>
                </el-button>
              </template>
              <template v-else>
                <el-button 
                  @click="resetForm" 
                  plain
                >新的需求</el-button>
                <el-button 
                  type="primary" 
                  @click="startMatchingHouses"
                  :disabled="isAnalyzing"
                ><el-icon><CaretRight /></el-icon> 让AI生成购房建议报告</el-button>
              </template>
            </div>
          </el-form>
        </div>
      </div>
      
      <!-- 右侧参考/结果区 -->
      <div class="content-panel">
        <template v-if="!hasAnalysisResult">
          <div class="reference-content">
            <div class="panel-header">
              <h3 class="panel-title">购房需求描述要点</h3>
            </div>
            <div class="panel-content">
              <div class="reference-grid">
                <div v-for="(group, index) in requirementGuide" :key="index" class="reference-group">
                  <h4>{{ group.title }}</h4>
                  <div class="reference-items">
                    <span v-for="(item, idx) in group.items" :key="idx" class="reference-item" :class="getItemClass(group.title, item.label)">
                      <span class="item-label">{{ item.label }}：</span><em>{{ item.example }}</em>
                    </span>
                  </div>
                </div>
              </div>

              <div class="example-section">
                <div class="example-block">
                  <h4>购房需求描述参考示例：</h4>
                  <blockquote 
                    class="example-quote" 
                    @click="copyExampleText"
                    v-html="'预算总价800-1000万，首付3成（约240万），需按揭贷款。意向天河区珠江新城或海珠区琶洲地铁沿线，重点考察3房2卫户型。购房目的为自住及子女教育，需带省级学位。<br>建面85-100㎡，优先中高楼层（15层以上），要求南向或东南向采光，接受10年内楼龄的房子。装修需精装以上标准，可接受局部翻新。<br>必须满足地铁500米内（3/5/18号线），步行15分钟内有大型商场。医疗配套不作硬性要求，但需规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域。'">
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="analysis-content">
            <div class="panel-header">
              <h3 class="panel-title">
                需求AI分析结果
                <span class="analysis-time" v-if="analysisTime">
                  用时{{ analysisTime }}秒
                </span>
              </h3>
              <!-- 增加重新分析按钮 -->
              <el-button 
                class="reanalyze-button" 
                @click="analyzeRequirements" 
                :loading="isAnalyzing"
              >
                <template v-if="!isAnalyzing">
                  重新分析 <span class="button-hint">Shift+Enter</span>
                </template>
                <template v-else>
                  分析中 <span class="button-hint">用时{{currentAnalysisTime}}秒</span>
                </template>
              </el-button>
            </div>
            <div class="panel-content">
              <div class="reference-grid">
                <div v-for="(group, index) in requirementGuide" :key="index" class="reference-group">
                  <h4>{{ group.title }}</h4>
                  <div class="reference-items">
                    <span v-for="(item, idx) in group.items" :key="idx" class="reference-item" :class="getItemClass(group.title, item.label)">
                      <span class="item-label">{{ item.label }}：</span>
                      
                      <!-- 金融服务-按揭贷款：使用单选框 -->
                      <template v-if="group.title === '5. 金融服务' && item.label === '按揭贷款'">
                        <div class="radio-options">
                          <el-radio-group v-model="editableResults[group.title][item.label]" @change="handleMortgageChange" :disabled="isAnalyzing">
                            <el-radio label="需要">需要</el-radio>
                            <el-radio label="不需要">不需要</el-radio>
                          </el-radio-group>
                        </div>
                      </template>
                      
                      <!-- 金融服务-购房后融资：根据按揭贷款选择显示不同内容 -->
                      <template v-else-if="group.title === '5. 金融服务' && item.label === '购房后融资'">
                        <div v-if="editableResults[group.title]['按揭贷款'] === '不需要'" class="radio-options finance-option">
                          <span>若全款购房，
                          <el-radio-group v-model="editableResults[group.title][item.label]" @change="handleFinancingChange" :disabled="isAnalyzing">
                            <el-radio label="是">是</el-radio>
                            <el-radio label="否">否</el-radio>
                          </el-radio-group>
                          需要抵押融资</span>
                        </div>
                        <div v-else-if="editableResults[group.title]['按揭贷款'] === '需要'" class="finance-dash item-found">-</div>
                        <div v-else class="finance-dash">请先选择按揭贷款选项</div>
                      </template>
                      
                      <!-- 其他所有字段：使用输入框 -->
                      <template v-else>
                        <div class="editable-field" @mouseenter="showEditIcon[group.title + item.label] = true" @mouseleave="showEditIcon[group.title + item.label] = false">
                          <span v-if="!isEditing[group.title + item.label]" class="field-text" @click="!isAnalyzing && startEditing(group.title, item.label)" :class="{ 'empty-value': editableResults[group.title][item.label] === '无此信息，建议补充', 'disabled': isAnalyzing }">
                            {{ editableResults[group.title][item.label] }}
                            <el-icon v-show="showEditIcon[group.title + item.label] && !isAnalyzing" class="edit-icon"><EditPen /></el-icon>
                          </span>
                          <el-input 
                            v-else
                            v-model="editableResults[group.title][item.label]" 
                            :class="{ 'empty-value': editableResults[group.title][item.label] === '无此信息，建议补充' }"
                            size="small"
                            :placeholder="item.example"
                            @blur="finishEditing(group.title, item.label)"
                            @keyup.enter="finishEditing(group.title, item.label)"
                            @input="handleInputChange(group.title, item.label)"
                            ref="editInputRefs"
                            :disabled="isAnalyzing"
                            maxlength="50"
                            show-word-limit
                          />
                        </div>
                      </template>
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="analysis-suggestion-section">
                <h4 class="result-title">AI分析结果建议
                  <span class="advice-hint">
                    你可在上方直接修改AI的分析结果，再让AI生成建议报告
                  </span>
                </h4>                  
                <div class="user-requirement-suggestion" ref="requirementSuggestionRef">
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendMessage } from '../api/chat'  // 添加导入sendMessage API
import { User, CaretRight, EditPen } from '@element-plus/icons-vue'  // 导入User和CaretRight图标

export default {
  name: 'PropertyAdvisorForm',
  components: {
    User, // 注册User图标组件
    CaretRight, // 注册CaretRight图标组件
    EditPen // 注册EditPen图标组件
  },
  emits: ['submit'],
  
  setup(props, { emit }) {
    // 表单引用
    const propertyFormRef = ref(null)
    
    // 表单数据对象
    const formData = reactive({
      requirements: '',  // 需求描述
      customerName: '',  // 客户姓名
    })
    
    // 分析状态
    const isAnalyzing = ref(false)
    const hasAnalysisResult = ref(false)
    const analysisTime = ref(0)
    const analysisStartTime = ref(0)
    const timerInterval = ref(null)
    const currentAnalysisTime = ref(0)
    // 添加变量控制是否忽略返回的结果 - 用于重置按钮和新的需求按钮
    const shouldIgnoreResult = ref(false)
    
    // AI分析结果
    const analysisResult = ref([])
    
    // 结果建议的DOM引用
    const requirementSuggestionRef = ref(null)
    
    // 添加可编辑的分析结果数据结构
    const editableResults = reactive({
      '1. 核心需求': {
        '预算范围': '',
        '购房目的': '',
        '意向区域': '',
        '户型需求': ''
      },
      '2. 居住偏好': {
        '面积区间': '',
        '楼层要求': '',
        '朝向要求': '',
        '装修标准': ''
      },
      '3. 配套要求': {
        '交通便利': '',
        '教育资源': '',
        '商圈覆盖': '',
        '医疗条件': '',
        '景观要求': ''
      },
      '4. 特殊关注': {
        '产权性质': '',
        '楼龄要求': '',
        '交易周期': '',
        '抗性因素': ''
      },
      '5. 金融服务': {
        '按揭贷款': '', 
        '购房后融资': ''
      }
    })
    
    // 计算客户姓名的验证规则 - 只有分析结果后才是必填
    const customerNameRules = computed(() => {
      return [
        { required: hasAnalysisResult.value, message: '请输入客户姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
      ]
    })
    
    // 辅助方法 - 获取分析结果中特定标签的值
    const originalGetItemValue = (groupTitle, itemLabel) => {
      if (!hasAnalysisResult.value) return ''
      
      // 将组标题映射到分析结果的类别 - 添加更多可能的映射关系
      const categoryMapping = {
        '1. 核心需求': ['核心需求', '预算', '预算信息', '基本信息', '核心信息', '主要需求', '区位偏好', '购房用途', '附加需求', '预算', '区域偏好', '购房目的'],
        '2. 居住偏好': ['居住偏好', '房源要求', '户型需求', '房屋属性', '居住要求', '房型偏好', '房源要求', '户型需求', '房屋条件'],
        '3. 配套要求': ['配套要求', '周边配套', '区位偏好', '区位要求', '配套设施', '地段要求', '附加需求', '区位偏好', '配套设施', '周边配套'],
        '4. 特殊关注': ['特殊关注', '附加需求', '特殊要求', '其他要求', '附加条件', '物业属性', '房源要求', '物业属性', '房屋条件'],
        '5. 金融服务': ['金融服务', '金融需求', '贷款信息', '融资需求', '按揭信息', '贷款需求'] // 添加金融服务相关的映射
      }
      
      // 标签映射 - 匹配不同名称的相似字段
      const labelMappings = {
        '预算范围': ['预算范围', '总价范围', '总价', '预算', '总预算', '价格范围', '价格区间'],
        '购房目的': ['购房目的', '购房用途', '用途', '主要用途', '购买目的'],
        '意向区域': ['意向区域', '区域', '位置', '地点', '行政区', '区位', '首选区域'],
        '户型需求': ['户型需求', '户型', '户型结构', '房型', '房屋类型', '户型偏好'],
        '面积区间': ['面积区间', '面积范围', '面积', '建筑面积', '使用面积', '建面'],
        '楼层要求': ['楼层要求', '楼层', '楼层偏好', '所在楼层', '楼层需求'],
        '朝向要求': ['朝向要求', '朝向', '朝向偏好', '采光方向', '朝向需求'],
        '装修标准': ['装修标准', '装修要求', '装修程度', '装修', '装修情况', '装修水平'],
        '交通便利': ['交通便利', '交通', '交通要求', '交通配套', '出行', '地铁要求'],
        '教育资源': ['教育资源', '学位要求', '学区', '学位', '教育', '学校'],
        '商圈覆盖': ['商圈覆盖', '商业配套', '商场', '商业', '购物'],
        '医疗条件': ['医疗条件', '医疗配套', '医院', '诊所', '医疗'],
        '景观要求': ['景观要求', '景观', '视野', '景色', '风景'],
        '产权性质': ['产权性质', '产权', '房屋产权', '产权年限', '产权要求'],
        '楼龄要求': ['楼龄要求', '楼龄', '房龄', '建筑年代', '房屋年龄', '楼龄限制'],
        '交易周期': ['交易周期', '交易时间', '交易要求', '交易限制'],
        '抗性因素': ['抗性因素', '避嫌设施', '避免区域', '规避设施', '禁忌因素'],
        '按揭贷款': ['按揭贷款', '按揭', '贷款', '贷款需求', '按揭需求', '是否需要贷款'],
        '购房后融资': ['购房后融资', '抵押融资', '购房融资', '房产抵押', '抵押贷款', '是否需要抵押融资']
      }
      
      // 打印全部分析结果，帮助调试
      if (groupTitle === '5. 金融服务' && itemLabel === '按揭贷款') {
        console.log('完整分析结果:', JSON.stringify(analysisResult.value));
      }
      
      // 获取匹配的类别列表
      const categoryNames = categoryMapping[groupTitle] || []
      if (categoryNames.length === 0) return '无此信息，建议补充'
      
      // 在分析结果中查找对应的类别 - 使用多种可能的字段名和类别名称进行匹配
      let foundCategory = null
      
      // 尝试精确匹配
      for (const categoryName of categoryNames) {
        const exactMatch = analysisResult.value.find(c => 
          (c.category === categoryName) || (c.name === categoryName)
        )
        if (exactMatch) {
          foundCategory = exactMatch
          break
        }
      }
      
      // 如果没找到精确匹配，尝试模糊匹配
      if (!foundCategory) {
        for (const categoryName of categoryNames) {
          const fuzzyMatch = analysisResult.value.find(c => {
            const catName = (c.category || c.name || '').toString()
            return catName.toLowerCase().includes(categoryName.toLowerCase()) ||
                  categoryName.toLowerCase().includes(catName.toLowerCase())
          })
          if (fuzzyMatch) {
            foundCategory = fuzzyMatch
            break
          }
        }
      }
      
      if (!foundCategory) return '无此信息，建议补充'
      
      // 根据不同的数据结构查找对应的值
      if (foundCategory.items && Array.isArray(foundCategory.items)) {
        // 原始预期格式：使用items数组，每个项有label和value
        const matchLabels = labelMappings[itemLabel] || [itemLabel]
        
        for (const matchLabel of matchLabels) {
          const foundItem = foundCategory.items.find(item => {
            if (!item || !item.label || typeof item.label !== 'string') return false;
            return item.label === matchLabel || 
              item.label.toLowerCase().includes(matchLabel.toLowerCase()) || 
              matchLabel.toLowerCase().includes(item.label.toLowerCase())
          })
          if (foundItem) {
            let value = foundItem.value;
            // 确保值不超过50个字符
            if (value && value.length > 50) {
              value = value.substring(0, 50);
            }
            return value;
          }
        }
      } 
      else if (foundCategory.details && typeof foundCategory.details === 'object') {
        // 详细信息对象格式：使用details对象，直接以键值对方式存储
        const matchLabels = labelMappings[itemLabel] || [itemLabel]
        
        // 尝试使用映射的标签名称查找
        for (const matchLabel of matchLabels) {
          if (matchLabel && foundCategory.details[matchLabel] !== undefined) {
            const value = foundCategory.details[matchLabel]
            let result = Array.isArray(value) ? value.join('、') : String(value);
            // 确保值不超过50个字符
            if (result && result.length > 50) {
              result = result.substring(0, 50);
            }
            return result;
          }
          
          // 尝试模糊匹配键名
          if (matchLabel) {
            const matchingKey = Object.keys(foundCategory.details).find(key => {
              if (!key || typeof key !== 'string') return false;
              return key.toLowerCase().includes(matchLabel.toLowerCase()) ||
                matchLabel.toLowerCase().includes(key.toLowerCase())
            })
            if (matchingKey) {
              const value = foundCategory.details[matchingKey]
              let result = Array.isArray(value) ? value.join('、') : String(value);
              // 确保值不超过50个字符
              if (result && result.length > 50) {
                result = result.substring(0, 50);
              }
              return result;
            }
          }
        }
      }
      else if (foundCategory.requirements && Array.isArray(foundCategory.requirements)) {
        // 需求列表格式：尝试从数组中找到与itemLabel相关的项
        const relevantRequirements = foundCategory.requirements.join('、')
        if (relevantRequirements) {
          // 确保值不超过50个字符
          return relevantRequirements.length > 50 ? relevantRequirements.substring(0, 50) : relevantRequirements;
        }
      }
      else {
        // 其他键值对格式：直接检查category对象中是否有匹配的键
        const matchLabels = labelMappings[itemLabel] || [itemLabel]
        
        for (const matchLabel of matchLabels) {
          if (!matchLabel) continue; // 跳过无效的标签
          
          const keys = Object.keys(foundCategory).filter(k => {
            if (!k || typeof k !== 'string') return false;
            return k !== 'name' && k !== 'category' && (
              k.toLowerCase().includes(matchLabel.toLowerCase()) ||
              matchLabel.toLowerCase().includes(k.toLowerCase())
            )
          })
          if (keys.length > 0) {
            const value = foundCategory[keys[0]]
            let result = Array.isArray(value) ? value.join('、') : String(value);
            // 确保值不超过50个字符
            if (result && result.length > 50) {
              result = result.substring(0, 50);
            }
            return result;
          }
        }
      }
      
      return '无此信息，建议补充'
    }
    
    // 辅助方法 - 获取项目的CSS类
    const getItemClass = (groupTitle, itemLabel) => {
      if (!hasAnalysisResult.value) return ''
      
      // 直接使用editableResults中的值来决定样式
      const value = editableResults[groupTitle][itemLabel]
      return value && value !== '无此信息，建议补充' ? 'item-found' : 'item-not-found'
    }
    
    // AI分析结果建议内容的生成算法
    const generateRequirementSuggestion = () => {
      if (!hasAnalysisResult.value) return '需求建议内容稍后提供'
      
      // 需求项权重配置 - 分级权重体系
      const weightConfig = {
        // T0级 - 核心需求（权重最高）
        T0: {
          '预算范围': 10,
          '购房目的': 9,
          '意向区域': 9,
          '户型需求': 8
        },
        // T1级 - 居住偏好（次高权重）
        T1: {
          '面积区间': 7,
          '楼层要求': 5,
          '朝向要求': 5,
          '装修标准': 6
        },
        // T2级 - 配套要求（中等权重）
        T2: {
          '交通便利': 6,
          '教育资源': 7,
          '商圈覆盖': 5,
          '医疗条件': 4,
          '景观要求': 3
        },
        // T3级 - 特殊关注（低权重，但数量多时需要关注）
        T3: {
          '产权性质': 5,
          '楼龄要求': 6,
          '交易周期': 4,
          '抗性因素': 6
        },
        // T4级 - 金融服务（补充权重）
        T4: {
          '按揭贷款': 7,
          '购房后融资': 4
        }
      }
      
      // 匹配需求指南与权重配置
      const weightMapping = {
        '1. 核心需求': 'T0',
        '2. 居住偏好': 'T1',
        '3. 配套要求': 'T2',
        '4. 特殊关注': 'T3',
        '5. 金融服务': 'T4'
      }
      
      // 收集缺失项和已有项
      let missingItems = []
      let existingItems = []
      
      requirementGuide.forEach(group => {
        const groupTitle = group.title
        const weightLevel = weightMapping[groupTitle]
        
        group.items.forEach(item => {
          // 特殊处理金融服务
          if (groupTitle === '5. 金融服务') {
            if (item.label === '按揭贷款') {
              const value = editableResults[groupTitle][item.label]
              const itemInfo = {
                group: groupTitle,
                label: item.label,
                example: item.example,
                weight: weightConfig[weightLevel][item.label] || 1,
                weightLevel,
                value: value
              }
              
              if (!value || value === '无此信息，建议补充') {
                missingItems.push(itemInfo)
              } else {
                existingItems.push(itemInfo)
              }
            } 
            else if (item.label === '购房后融资') {
              // 只有当按揭贷款为"不需要"时才检查购房后融资
              if (editableResults[groupTitle]['按揭贷款'] === '不需要') {
                const value = editableResults[groupTitle][item.label]
                const itemInfo = {
                  group: groupTitle,
                  label: item.label,
                  example: item.example,
                  weight: weightConfig[weightLevel][item.label] || 1,
                  weightLevel,
                  value: value
                }
                
                if (!value || value === '无此信息，建议补充') {
                  missingItems.push(itemInfo)
                } else {
                  existingItems.push(itemInfo)
                }
              }
              // 如果按揭贷款未选择或为"需要"，购房后融资不计入统计
            }
          } else {
            // 其他非金融服务项目的处理保持不变
            const value = editableResults[groupTitle][item.label]
            const itemInfo = {
              group: groupTitle,
              label: item.label,
              example: item.example,
              weight: weightConfig[weightLevel][item.label] || 1,
              weightLevel,
              value: value
            }
            
            if (value === '无此信息，建议补充') {
              missingItems.push(itemInfo)
            } else {
              existingItems.push(itemInfo)
            }
          }
        })
      })
      
      // 如果没有缺失项，直接返回完整评价
      if (missingItems.length === 0) {
        return '客户的需求描述非常完整！已包含所有描述要点，马上让AI为客户生成购房建议报告吧~'
      }
      
      // 缺失项按权重排序
      missingItems.sort((a, b) => b.weight - a.weight)
      
      // 统计各级别缺失项数量
      const missingStats = {
        T0: missingItems.filter(item => item.weightLevel === 'T0').length,
        T1: missingItems.filter(item => item.weightLevel === 'T1').length,
        T2: missingItems.filter(item => item.weightLevel === 'T2').length,
        T3: missingItems.filter(item => item.weightLevel === 'T3').length,
        T4: missingItems.filter(item => item.weightLevel === 'T4').length,
        total: missingItems.length
      }
      
      // 检查已有项中的简单描述，如果字数过少，也提示可以补充
      const briefDescriptionItems = existingItems.filter(item => {
        const description = item.value.trim()
        // 简单描述的判断标准：字数少于4个字符或不包含具体数字和详细地点
        return description.length < 4 || 
              (item.label === '预算范围' && !description.match(/\d{3,}/)) || // 预算范围应包含至少三位数字
              (item.label === '意向区域' && !description.match(/[区县市镇]|[城]/)) // 区域应包含"区县市镇"或"城"字
      })
      
      // 按权重对简单描述的项进行排序
      briefDescriptionItems.sort((a, b) => b.weight - a.weight)
      
      // 计算综合缺失得分
      const missingScore = missingItems.reduce((score, item) => score + item.weight, 0)
      
      // 建议模板选择
      let suggestionTemplate = ''
      let detailSuggestions = []
      // let enhancementSuggestions = []
      
      // // 处理已有项但描述不够详细的情况
      // if (briefDescriptionItems.length > 0) {
      //   // 取前3个权重最高的项提示完善
      //   const topBriefItems = briefDescriptionItems.slice(0, 3)
      //   enhancementSuggestions.push('以下信息可以更详细描述：')
        
      //   topBriefItems.forEach(item => {
      //     enhancementSuggestions.push(`• ${item.label}：当前为"${item.value}"，建议具体到${item.example}`)
      //   })
      // }
      
      // T0级缺失项处理（最高优先级）
      if (missingStats.T0 > 0) {
        const t0Items = missingItems.filter(item => item.weightLevel === 'T0')
        suggestionTemplate = '客户的需求缺少重要的核心信息，建议补充：'
        
        t0Items.forEach(item => {
          detailSuggestions.push(`• ${item.label}：${item.example}`)
        })
        
        // 如果只有1-2个T0项缺失，添加其他高权重的T1项
        if (missingStats.T0 <= 2 && missingStats.T1 > 0) {
          const highT1Items = missingItems
            .filter(item => item.weightLevel === 'T1' && item.weight >= 6)
            .slice(0, 2)
          
          if (highT1Items.length > 0) {
            detailSuggestions.push('同时建议也考虑提供：')
            highT1Items.forEach(item => {
              detailSuggestions.push(`• ${item.label}：${item.example}`)
            })
          }
        }
      }
      // 没有T0缺失但T1缺失较多
      else if (missingStats.T1 >= 3 || (missingStats.T1 >= 2 && missingStats.T2 >= 3)) {
        suggestionTemplate = '客户的核心需求已明确，但居住偏好信息不足，建议补充：'
        
        const t1Items = missingItems
          .filter(item => item.weightLevel === 'T1')
          .slice(0, 3)
        
        t1Items.forEach(item => {
          detailSuggestions.push(`• ${item.label}：${item.example}`)
        })
        
        // 如果有高权重的T2项，也提示补充
        const highT2Items = missingItems
          .filter(item => item.weightLevel === 'T2' && item.weight >= 6)
          .slice(0, 2)
        
        if (highT2Items.length > 0) {
          detailSuggestions.push('为提高匹配精度，也请考虑：')
          highT2Items.forEach(item => {
            detailSuggestions.push(`• ${item.label}：${item.example}`)
          })
        }
      }
      // T2/T3/T4级缺失较多
      else if (missingScore > 25) {
        // 选择权重最高的5个项目提示
        const topItems = missingItems.slice(0, 5)
        
        suggestionTemplate = '客户的需求基本明确，为提高房源匹配精度，建议补充以下信息：'
        
        topItems.forEach(item => {
          detailSuggestions.push(`• ${item.label}：${item.example}`)
        })
      }
      // 缺失较少
      else {
        suggestionTemplate = '客户的需求描述已相当完整，如有以下补充将更有助于精准匹配：'
        
        // 选择权重最高的3个项目提示
        const topItems = missingItems.slice(0, 3)
        
        topItems.forEach(item => {
          detailSuggestions.push(`• ${item.label}：${item.example}`)
        })
      }
      
      // 情况概述
      const summaryText = `客户的需求描述中共有${missingStats.total}项信息缺失：核心需求${missingStats.T0}项、居住偏好${missingStats.T1}项、配套要求${missingStats.T2}项、特殊关注${missingStats.T3}项、金融服务${missingStats.T4}项。`
      
      // 使用HTML格式组织输出，保持紧凑格式
      let htmlOutput = `<div class="suggestion-summary">${summaryText}</div>`
      htmlOutput += `<div class="suggestion-main">${suggestionTemplate}</div>`
      
      // 转换列表项为HTML格式
      let inSubSection = false
      
      detailSuggestions.forEach(item => {
        if (item.startsWith('同时') || item.startsWith('为提高')) {
          // 处理小标题
          htmlOutput += `<div class="suggestion-subtitle">${item}</div>`
          inSubSection = true
        } else {
          // 处理常规列表项
          htmlOutput += `<div class="suggestion-item">${item}</div>`
        }
      })
      
      // // 处理增强建议部分
      // if (enhancementSuggestions.length > 0) {
      //   htmlOutput += `<div class="enhancement-title">${enhancementSuggestions[0]}</div>`
      //   enhancementSuggestions.slice(1).forEach(item => {
      //     htmlOutput += `<div class="suggestion-item">${item}</div>`
      //   })
      // }
      
      return htmlOutput
    }
    
    // 需求描述指南
    const requirementGuide = [
      {
        title: '1. 核心需求',
        items: [
          { label: '预算范围', example: '如总价600万左右，首付3成' },
          { label: '购房目的', example: '自住/投资/改善/养老/子女教育' },
          { label: '意向区域', example: '如天河区珠江新城、海珠区琶洲' },
          { label: '户型需求', example: '如3房2卫' },
        ]
      },
      {
        title: '2. 居住偏好',
        items: [
          
          { label: '面积区间', example: '如建面80-100㎡' },
          { label: '楼层要求', example: '低楼层/中楼层/高楼层/顶楼带露台' },
          { label: '朝向要求', example: '南北通透/东向/西向/南向/北向' },
          { label: '装修标准', example: '翻新/简装/精装/豪装' }
        ]
      },
      {
        title: '3. 配套要求',
        items: [
          { label: '交通便利', example: '如地铁步行10分钟内' },
          { label: '教育资源', example: '如省级学位小学' },
          { label: '商圈覆盖', example: '商场/超市/菜市场需求' },
          { label: '医疗条件', example: '三甲医院车程要求' },
          { label: '景观要求', example: '江景/公园/无硬性要求' }
        ]
      },
      {
        title: '4. 特殊关注',
        items: [
          { label: '产权性质', example: '商品房/公寓/法拍房' },
          { label: '楼龄要求', example: '次新房/5-10年/10-20年/20年以上' },
          { label: '交易周期', example: '急需/可等合适房源' },
          { label: '抗性因素', example: '临高架/加油站/殡仪馆等' }
        ]
      },
      {
        title: '5. 金融服务',
        items: [
          { label: '按揭贷款', example: '是否需要按揭贷款' },
          { label: '购房后融资', example: '若全款购房是否需要抵押融资' }
        ]
      }
    ]
    
    // 方法 - 输入框焦点处理
    const handleInputFocus = (event) => {
      if (event && event.target) {
        setTimeout(() => {
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select()
          }
        }, 0)
      }
    }
    
    // 方法 - 需求输入处理
    const handleRequirementsInput = () => {
      if (hasAnalysisResult.value) {
        hasAnalysisResult.value = false
        analysisResult.value = []
      }
    }
    
    // 判断用户是否编辑过AI分析结果
    const hasUserEdited = () => {
      // 检查每个分类和字段
      for (const groupTitle in editableResults) {
        for (const itemLabel in editableResults[groupTitle]) {
          // 获取当前编辑值和原始AI值
          const currentValue = editableResults[groupTitle][itemLabel];
          const originalValue = originalAIResults[groupTitle] && 
                               originalAIResults[groupTitle][itemLabel] !== undefined ? 
                               originalAIResults[groupTitle][itemLabel] : '';
          
          // 特殊情况处理：空字符串和"无此信息，建议补充"视为等价
          if ((currentValue === '' && originalValue === '无此信息，建议补充') || 
              (currentValue === '无此信息，建议补充' && originalValue === '')) {
            continue; // 这种情况不视为编辑
          }
          
          // 如果值不同，说明用户编辑过
          if (currentValue !== originalValue) {
            console.log('检测到用户编辑:', {
              组别: groupTitle,
              字段: itemLabel,
              原始值: originalValue,
              当前值: currentValue
            });
            return true;
          }
        }
      }
      
      // 所有值都相同，用户未编辑
      return false;
    };
    
    // 方法 - 分析需求
    const analyzeRequirements = async () => {
      // 先检查用户是否编辑过AI分析结果
      if (hasAnalysisResult.value && hasUserEdited()) {
        console.log('检测到用户编辑过AI分析结果，显示确认对话框');
        
        // 如果用户编辑过，弹出确认框
        try {
          await ElMessageBox.confirm(
            '重新分析将丢弃你之前的修改结果，请确认。',
            '操作提示',
            {
              confirmButtonText: '继续分析',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          // 用户确认继续，执行分析
          console.log('用户确认继续分析');
        } catch (error) {
          // 用户取消，中止分析
          console.log('用户取消分析');
          return
        }
      } else if (hasAnalysisResult.value) {
        console.log('用户未编辑AI分析结果，直接执行分析');
      }
      
      if (!formData.requirements || formData.requirements.trim().length < 30) {
        ElMessage.warning('需求描述内容过短，无法进行分析')
        return
      }
      
      try {
        // 保存当前的editableResults
        const previousResults = JSON.parse(JSON.stringify(editableResults))
        
        isAnalyzing.value = true
        analysisStartTime.value = Date.now()
        currentAnalysisTime.value = 0
        
        // 启动计时器
        clearInterval(timerInterval.value)
        timerInterval.value = setInterval(() => {
          currentAnalysisTime.value = Math.round((Date.now() - analysisStartTime.value) / 1000)
        }, 1000)
        
        // 构建用户输入消息
        const messages = [
          {
            role: 'user',
            content: formData.requirements.trim()
          }
        ]
        
        // 调用API，使用property-needs-analytics作为chatType
        const response = await sendMessage(messages, 'property-needs-analytics')
        
        // 如果在等待返回结果过程中用户取消了分析，则忽略这个结果
        if (shouldIgnoreResult.value) {
          console.log('用户已取消分析，忽略返回的结果')
          shouldIgnoreResult.value = false
          return
        }
        
        // 检查响应是否包含错误
        if (response.error) {
          console.error('API返回错误:', response.error)
          // 恢复之前的结果
          Object.keys(previousResults).forEach(groupTitle => {
            Object.keys(previousResults[groupTitle]).forEach(itemLabel => {
              editableResults[groupTitle][itemLabel] = previousResults[groupTitle][itemLabel]
            })
          })
          throw new Error(response.message || '需求分析失败')
        }
        
        try {
          // 解析API返回的内容
          const responseText = response.content
          
          if (!responseText || responseText.trim() === '') {
            throw new Error('AI返回了空响应，请重试')
          }
          
          // 使用正则表达式从响应中提取JSON部分
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          
          if (!jsonMatch) {
            console.warn('无法从AI响应中提取JSON:', responseText)
            throw new Error('无法解析AI分析结果，请修改描述后重试')
          }
          
          // 解析JSON
          const jsonData = JSON.parse(jsonMatch[0])
          
          // 验证JSON结构是否符合预期
          if (!jsonData.categories || !Array.isArray(jsonData.categories)) {
            console.warn('AI返回的JSON结构不符合预期:', jsonData)
            throw new Error('AI分析结果格式不正确，请重试')
          }
          
          // 将API返回的数据规范化为内部统一格式
          analysisResult.value = jsonData.categories.map(category => {
            // 确定类别名称 - 尝试从多个可能的字段中获取
            const categoryName = category.name || category.category || '未命名类别'
            
            // 根据不同的数据结构创建统一的内部表示
            let items = []
            
            if (category.items && Array.isArray(category.items)) {
              // 原始预期格式
              items = category.items
            } 
            else if (category.details && typeof category.details === 'object') {
              // 详细信息对象格式
              items = Object.entries(category.details).map(([key, value]) => ({
                label: key,
                value: Array.isArray(value) ? value.join(', ') : String(value)
              }))
            }
            else if (category.requirements && Array.isArray(category.requirements)) {
              // 需求列表格式
              items = [{
                label: categoryName,
                value: category.requirements.join(', ')
              }]
            }
            else {
              // 其他键值对格式 - 将非标准字段作为items
              const itemKeys = Object.keys(category).filter(k => 
                k !== 'name' && k !== 'category'
              )
              
              items = itemKeys.map(key => ({
                label: key,
                value: Array.isArray(category[key]) ? 
                  category[key].join(', ') : 
                  String(category[key])
              }))
            }
            
            return {
              category: categoryName,
              items: items
            }
          })
          
        // 计算分析用时
        analysisTime.value = Math.round((Date.now() - analysisStartTime.value) / 100) / 10
        hasAnalysisResult.value = true
        
        // 保存原始AI分析结果以便恢复
        if (!shouldIgnoreResult.value) {
          // 清空原始AI分析结果
          Object.keys(originalAIResults).forEach(groupTitle => {
            delete originalAIResults[groupTitle];
          });
        }
        
        // 初始化editableResults和原始AI分析结果
        requirementGuide.forEach(group => {
          const groupTitle = group.title
          group.items.forEach(item => {
            const value = originalGetItemValue(groupTitle, item.label)
            
            // 特殊字段处理
            if (groupTitle === '5. 金融服务' && item.label === '按揭贷款') {
              // 修复判断逻辑：先检查是否明确表示"不需要"，再判断是否需要
              const isExplicitlyNotNeeded = value.includes('不需要') || 
                                           value.includes('无需') || 
                                           value.includes('全款') ||
                                           value.includes('无按揭');
              
              const isExplicitlyNeeded = value.includes('需要按揭') || 
                                        value.includes('需按揭') || 
                                        (value.includes('贷款') && !value.includes('不') && !value.includes('无'));
              
              // 修改：如果明确表达了需要或不需要，则设置相应的值，否则保持为空或默认值
              if (isExplicitlyNotNeeded) {
                editableResults[groupTitle][item.label] = '不需要';
              } else if (isExplicitlyNeeded) {
                editableResults[groupTitle][item.label] = '需要';
              } else if (value === '无此信息，建议补充' || !value.trim()) {
                // 未明确提及时保持原值不变，这样不会误判为编辑
                // 不要设置为空字符串，这会导致与原值"无此信息，建议补充"不同
                // 如果是第一次设置，则保持为原值
                if (originalAIResults[groupTitle] && originalAIResults[groupTitle][item.label] !== undefined) {
                  // 不做改变，保持原值
                } else {
                  // 如果没有原始值，则设置为"无此信息，建议补充"
                  editableResults[groupTitle][item.label] = '无此信息，建议补充';
                }
              }
              
              // 输出调试信息
              console.log('按揭贷款值解析:', {
                原始值: value,
                明确不需要: isExplicitlyNotNeeded,
                明确需要: isExplicitlyNeeded,
                最终设置: editableResults[groupTitle][item.label]
              });
            }
            // 购房后融资特殊处理
            else if (groupTitle === '5. 金融服务' && item.label === '购房后融资') {
              // 如果按揭贷款是"不需要"，则不自动设置值，让用户自己选择
              if (editableResults[groupTitle]['按揭贷款'] === '不需要') {
                // 只有在明确表示需要时才设置为"是"，明确不需要时才设置为"否"
                if (value.toLowerCase().includes('是') || (value.includes('需要') && !value.includes('不需要'))) {
                  editableResults[groupTitle][item.label] = '是';
                } else if (value.toLowerCase().includes('否') || value.includes('不需要')) {
                  editableResults[groupTitle][item.label] = '否';
                } else if (value === '无此信息，建议补充' || !value.trim()) {
                  // 未明确提及时保持原值不变
                  if (originalAIResults[groupTitle] && originalAIResults[groupTitle][item.label] !== undefined) {
                    // 不做改变，保持原值
                  } else {
                    // 如果没有原始值，则设置为"无此信息，建议补充"
                    editableResults[groupTitle][item.label] = '无此信息，建议补充';
                  }
                }
              }
            }
            else {
              editableResults[groupTitle][item.label] = value
            }
            
            // 保存为原始AI分析结果
            if (!originalAIResults[groupTitle]) {
              originalAIResults[groupTitle] = {};
            }
            originalAIResults[groupTitle][item.label] = value;
          })
        })
        
        // 停止计时器
        clearInterval(timerInterval.value)
        timerInterval.value = null
        
        ElMessage.success('需求分析完成')
        
        // 生成并更新建议内容
        nextTick(() => {
          updateSuggestionContent();
        });
        
        } catch (parseError) {
          console.error('解析AI响应时出错:', parseError)
          // 恢复之前的结果
          Object.keys(previousResults).forEach(groupTitle => {
            Object.keys(previousResults[groupTitle]).forEach(itemLabel => {
              editableResults[groupTitle][itemLabel] = previousResults[groupTitle][itemLabel]
            })
          })
          throw new Error('解析分析结果时出错: ' + parseError.message)
        }
      } catch (error) {
        console.error('需求分析失败:', error)
        ElMessage.error(error.message || '需求分析失败，请重试')
      } finally {
        isAnalyzing.value = false
        // 确保计时器停止
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }
    
    // 方法 - 重置表单
    const resetForm = () => {
      if (isAnalyzing.value) {
        ElMessageBox.confirm('正在进行需求分析，确认要中止分析过程么？', '操作提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
          // 设置忽略标志，丢弃即将返回的结果
          shouldIgnoreResult.value = true
          
          // 中止分析
          isAnalyzing.value = false
          // 停止计时器
          clearInterval(timerInterval.value)
          timerInterval.value = null
          
          // 重置表单
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
        }).catch(() => {
          // 用户取消了重置操作
        })
      } else if (hasAnalysisResult.value) {
        ElMessageBox.confirm('确定放弃当前分析结果，开始新的需求分析么？', '操作提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 如果处于重新分析过程中，设置忽略标志
          if (isAnalyzing.value) {
            shouldIgnoreResult.value = true
          }
          
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
        }).catch(() => {
          // 用户取消了重置操作
        })
      } else {
        ElMessageBox.confirm('确定要清空所有已填写的内容么？', '操作提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
      }).catch(() => {
        // 用户取消了重置操作
      })
      }
    }
    
    // 键盘快捷键处理
    const handleKeyDown = (e) => {
      // Shift+Enter 快捷键分析需求
      if (e.key === 'Enter' && e.shiftKey && formData.requirements && formData.requirements.length >= 30 && !isAnalyzing.value) {
        analyzeRequirements()
        e.preventDefault()
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown)
      
      // 监听右侧内容区域的滚动事件
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.addEventListener('scroll', handleContentScroll)
      }
    })
    
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown)
      
      // 移除滚动事件监听
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.removeEventListener('scroll', handleContentScroll)
      }
      
      // 确保计时器停止
      clearInterval(timerInterval.value)
    })
    
    // 处理内容滚动
    const handleContentScroll = (e) => {
      const header = document.querySelector('.content-panel .panel-header')
      if (header) {
        // 当滚动位置大于0时添加scrolled类
        if (e.target.scrollTop > 0) {
          header.classList.add('scrolled')
        } else {
          header.classList.remove('scrolled')
        }
      }
    }
    
    // 开始匹配房源
    const startMatchingHouses = () => {
      // 使用表单验证
      propertyFormRef.value.validate((valid, fields) => {
        if (valid) {
          // 创建组合后的数据，包含原始表单数据和编辑后的分析结果
          const combinedData = {
            ...formData,
            analysisResults: {...editableResults}
          }
          
          // 触发提交事件，传递组合数据给父组件
          emit('submit', combinedData)
        } else {
          // 验证失败，检查是否是客户姓名字段验证失败
          if (fields && fields.customerName) {
            // 延迟一帧执行，确保DOM更新完成
            nextTick(() => {
              // 找到el-input组件并聚焦
              const inputEl = document.querySelector('.customer-name-input .el-input__inner')
              if (inputEl) {
                inputEl.focus()
              }
            })
          }
          return false
        }
      })
    }
    
    // 监听分析结果状态变化
    watch(hasAnalysisResult, (newValue) => {
      if (newValue) {
        // 当有分析结果后，重新验证表单
        // 延迟一帧执行，确保UI更新后再验证
        nextTick(() => {
          propertyFormRef.value?.clearValidate()
        })
      }
    })
    
    // 示例文本复制功能
    const copyExampleText = () => {
      const exampleText = '预算总价800-1000万，首付3成（约240万），需按揭贷款。意向天河区珠江新城或海珠区琶洲地铁沿线，重点考察3房2卫户型。购房目的为自住及子女教育，需带省级学位。\n建面85-100㎡，优先中高楼层（15层以上），要求南向或东南向采光，接受10年内楼龄的房子。装修需精装以上标准，可接受局部翻新。\n必须满足地铁500米内（3/5/18号线），步行15分钟内有大型商场。医疗配套不作硬性要求，但需规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域。'
      
      // 使用navigator.clipboard API复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(exampleText)
          .catch(err => {
            console.error('无法复制文本:', err)
          })
      } else {
        // 兼容性处理 - 创建临时textarea元素
        const textarea = document.createElement('textarea')
        textarea.value = exampleText
        textarea.style.position = 'fixed'
        textarea.style.opacity = 0
        document.body.appendChild(textarea)
        textarea.select()
        
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('复制失败:', err)
        }
        
        document.body.removeChild(textarea)
      }
    }
    
    // 处理按揭贷款选项变化
    const handleMortgageChange = (value) => {
      // 如果选择"不需要"，不再自动设置购房后融资的默认值
      // 注释掉原代码，让用户自己选择
      // if (value === '不需要' && editableResults['5. 金融服务']['购房后融资'] === '') {
      //   editableResults['5. 金融服务']['购房后融资'] = '否'
      // }
      
      // 选项变化后更新建议内容
      nextTick(() => {
        updateSuggestionContent();
      });
    }
    
    // 添加处理购房后融资选项变化的函数
    const handleFinancingChange = () => {
      // 购房后融资选项变化后更新建议内容
      nextTick(() => {
        updateSuggestionContent();
      });
    }
    
    // 编辑状态管理
    const isEditing = reactive({});
    const showEditIcon = reactive({});
    const editInputRefs = ref([]);

    // 添加一个对象存储原始AI分析结果
    const originalAIResults = reactive({});
    
    // 新增方法：更新建议内容
    const updateSuggestionContent = () => {
      if (requirementSuggestionRef.value) {
        requirementSuggestionRef.value.innerHTML = generateRequirementSuggestion();
      }
    };
    
    // 开始编辑
    const startEditing = (groupTitle, itemLabel) => {
      // 保存原始AI分析结果，仅在第一次编辑时保存
      if (!originalAIResults[groupTitle]) {
        originalAIResults[groupTitle] = {};
      }
      if (originalAIResults[groupTitle][itemLabel] === undefined) {
        originalAIResults[groupTitle][itemLabel] = editableResults[groupTitle][itemLabel];
      }
      
      isEditing[groupTitle + itemLabel] = true;
      // 等待DOM更新
      nextTick(() => {
        // 聚焦输入框
        const input = editInputRefs.value[editInputRefs.value.length - 1];
        if (input) {        
          // 先聚焦
          input.focus();
          
          // 确保在UI更新后执行全选操作
          setTimeout(() => {
            // 全选输入框内的文本
            input.select();
          }, 0);
        }
      });
    };

    // 完成编辑
    const finishEditing = (groupTitle, itemLabel) => {
      // 获取用户输入的当前值，去除前后空格
      let currentValue = editableResults[groupTitle][itemLabel].trim();
      
      // 确保不超过50个字符
      if (currentValue.length > 50) {
        currentValue = currentValue.substring(0, 50);
      }
      
      // 如果用户清空了内容或输入的全是空格
      if (!currentValue) {
        // 恢复到AI原始分析结果
        if (originalAIResults[groupTitle] && originalAIResults[groupTitle][itemLabel] !== undefined) {
          editableResults[groupTitle][itemLabel] = originalAIResults[groupTitle][itemLabel];
        } else {
          // 作为后备，如果没有原始分析结果，则使用"无此信息，建议补充"
          editableResults[groupTitle][itemLabel] = '无此信息，建议补充';
        }
      } else {
        // 确保去除前后空格后的值被保存
        editableResults[groupTitle][itemLabel] = currentValue;
      }
      
      isEditing[groupTitle + itemLabel] = false;
      
      // 强制更新建议内容 - 仅在失焦或回车时触发
      nextTick(() => {
        updateSuggestionContent();
      });
    };

    // 处理输入时的更新
    const handleInputChange = (groupTitle, itemLabel) => {
      // 输入过程中不做任何操作
    };
    
    // 方法 - 处理客户姓名输入框按下Enter键
    const handleNameEnter = () => {
      // 处理按下Enter键时的操作
      if (hasAnalysisResult.value) {
        // 已有分析结果，提交生成建议报告
        startMatchingHouses()
      } else if (formData.requirements && formData.requirements.length >= 30 && !isAnalyzing.value) {
        // 未有分析结果但需求已输入足够内容且不在分析中，提交分析需求
        analyzeRequirements()
      }
    }
    
    return {
      propertyFormRef,
      formData,
      isAnalyzing,
      hasAnalysisResult,
      analysisTime,
      analysisResult,
      requirementGuide,
      handleInputFocus,
      handleRequirementsInput,
      analyzeRequirements,
      resetForm,
      getItemClass,
      currentAnalysisTime,
      analysisStartTime,
      startMatchingHouses,
      customerNameRules,
      copyExampleText,
      shouldIgnoreResult,
      generateRequirementSuggestion,
      editableResults,
      handleMortgageChange,
      handleFinancingChange,
      isEditing,
      showEditIcon,
      startEditing,
      finishEditing,
      editInputRefs,
      handleInputChange,
      originalAIResults,
      requirementSuggestionRef,
      updateSuggestionContent,
      handleNameEnter
    }
  }
}
</script>

<style scoped>
/* ----------------- 基础布局 ----------------- */
.property-advisor-form {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.form-container {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

/* ----------------- 左侧输入面板 ----------------- */
.input-panel {
  width: 400px; 
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
}

.description-hint {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.el-form {
  display: flex;
  flex-direction: column;
}

.el-form-item {
  margin-bottom: 12px;
}

/* Textarea滚动条样式 */
:deep(.el-textarea__inner::-webkit-scrollbar) {
  width: 4px;
}

:deep(.el-textarea__inner::-webkit-scrollbar-thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

:deep(.el-textarea__inner::-webkit-scrollbar-track) {
  background-color: transparent;
}

/* 姓名输入框样式 */
.customer-name-input {
  margin: 10px 0 20px 0;
}

.customer-name-input .el-form-item {
  margin-bottom: 0;
}

.customer-name-input .el-input {
  width: 100%;
}

.customer-name-input .el-input__prefix {
  color: #909399;
  padding-left: 4px;
}

/* 按钮区域 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
  margin-bottom: 16px;
}

.button-hint {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.7;
}

/* 重新分析按钮样式 */
.reanalyze-button {
  height: 30px;
  padding: 0 15px;
  border-radius: 4px;
  font-size: 14px;
  border: 1px solid #1b68de;
  color: #1b68de;
  background-color: transparent;
  transition: all 0.3s;
}

.reanalyze-button:hover {
  background-color: #ecf5ff;
}

.reanalyze-button:active {
  background-color: #e6f1ff;
}

.reanalyze-button .button-hint {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.7;
}

/* ----------------- 面板通用样式 ----------------- */
.panel-header {
  padding: 0;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  height: 50px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
}

.panel-title {
  padding: 0;
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  line-height: 60px;
  margin: 0;
  display: flex;
  align-items: center;
}

.panel-content {
  padding: 0 20px 15px 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 transparent;
  flex: 1;
}

/* ----------------- 右侧内容面板 ----------------- */
.content-panel {
  flex: 1;
  overflow-y: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-panel .panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
  transition: box-shadow 0.3s ease;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-panel .panel-header.scrolled {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.reference-content,
.analysis-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 分析时间显示 */
.analysis-time {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
  font-weight: normal;
}

.advice-hint {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
  font-weight: normal;
}

/* ----------------- 需求参考部分 ----------------- */
.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}

.reference-group {
  min-width: 0;
}

.reference-group h4 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.reference-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reference-item {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  display: flex;
  align-items: baseline;
  word-break: break-all;
  overflow-wrap: break-word;
}

.reference-item em {
  color: #a0a9b6;
  font-style: normal;
  flex: 1;
  word-break: break-all;
  overflow-wrap: break-word;
}

.item-found {
  color: #303133 !important;
  font-weight: 500;  
}

.item-found em {
  color: #303133 !important;
  font-weight: 500;
}

.item-not-found {
  color: rgb(184, 129.6, 48, 0.8);
}

.item-not-found em {
  color: rgb(184, 129.6, 48, 0.8);
}

.item-label {
  color: #606266;
  font-weight: 500;
  min-width: 70px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 示例部分 */
.example-section {
  padding-top: 16px;
}

.example-block {
  margin-top: 16px;
}

.example-block h4 {
  font-size: 14px;
  color: #a0a9b6;
  margin-bottom: 8px;
}

/* 分析建议部分 */
.analysis-suggestion-section {
  padding-top: 16px;
}

.analysis-suggestion-section h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 500;
}

.example-quote {
  margin: 0;
  padding: 12px 16px;
  background-color: #f8f9fb;
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
  transition: background-color 0.2s;
  cursor: pointer;
}

.example-quote:hover {
  background-color: #ecf5ff80;
}

/* ----------------- 分析结果样式 ----------------- */
.user-requirement-suggestion {
  margin: 0;
  padding: 12px 16px;
  background-color: #fbf8d2;
  border-radius: 4px;
  color: #6b6204;
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
  scrollbar-width: thin;
  white-space: pre-line;
}

.user-requirement-suggestion::-webkit-scrollbar {
  width: 4px;
}

.user-requirement-suggestion::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 2px;
}

/* 建议内容样式 */
.user-requirement-suggestion .suggestion-summary {
  margin-bottom: 8px;
  font-weight: 500;
}

.user-requirement-suggestion .suggestion-main {
  margin-bottom: 4px;
  font-weight: 500;
}

.user-requirement-suggestion .suggestion-subtitle {
  margin-top: 8px;
  margin-bottom: 3px;
  font-weight: 500;
}

.user-requirement-suggestion .suggestion-item {
  padding-left: 8px;
}

.user-requirement-suggestion .enhancement-title {
  margin-top: 8px;
  margin-bottom: 3px;
  font-weight: 500;
}

/* ----------------- 可编辑区域样式 ----------------- */
.reference-item .el-input {
  flex: 1;
  width: 100%;
  min-width: 120px;
}

.reference-item .el-input input {
  word-break: break-all;
  overflow-wrap: break-word;
}

/* 可编辑字段样式 */
.editable-field {
  position: relative;
  flex: 1;
  min-width: 120px;
}

.field-text {
  display: block;
  width: 100%;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
  line-height: 1.3;
  box-sizing: border-box;
  word-break: break-all;
  overflow-wrap: break-word;
}

.field-text:hover {
  background-color: #f8fafd;
  border-color: #dcdfe6;
}

.field-text.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.edit-icon {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
  vertical-align: middle;
}

/* ----------------- 金融服务相关样式 ----------------- */
.radio-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.radio-options .el-radio {
  margin-right: 10px;
  display: inline-flex;
  align-items: center;
  height: 18px;
}

.radio-options span {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.finance-option {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.finance-dash {
  font-weight: normal;
  padding: 0 8px;
  color: rgb(184, 129.6, 48, 0.8);
}

/* ----------------- 分析结果专用样式 ----------------- */
.analysis-content .reference-grid {
  gap: 5px 16px;
}

.analysis-content .reference-group h4 {
  margin-bottom: 8px;
}

.analysis-content .reference-items {
  gap: 0;
}

.analysis-content .reference-item {
  line-height: 2;
  word-break: break-all;
  overflow-wrap: break-word;
}

.analysis-content .editable-field {
  word-break: break-all;
  overflow-wrap: break-word;
}

.analysis-content .example-section {
  padding-top: 10px;
}

.analysis-content .example-block {
  margin-top: 10px;
}

.analysis-content .example-block h4 {
  margin-bottom: 8px;
}

/* ----------------- 响应式布局 ----------------- */
/* 中等屏幕：保持左右布局，但要点变为单列 */
@media (max-width: 1024px) {
  .reference-grid,
  .result-items {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .reference-group {
    margin-bottom: 4px;
  }
  
  .reference-group h4 {
    margin-bottom: 8px;
  }
  
  .reference-item {
    line-height: 1.5;
  }
}

/* 窄屏：切换为上下布局 */
@media (max-width: 768px) {
  .property-advisor-form {
    padding: 12px;
    height: auto;
    overflow-y: auto;
    display: block;
  }

  .form-container {
    height: auto;
    min-height: auto;
    display: block;
    overflow: visible;
  }

  .input-panel {
    width: 100%;
    border-right: none;
    height: auto;
    overflow: visible;
  }

  .content-panel {
    width: 100%;
    overflow: visible;
    height: auto;
  }

  .panel-content {
    padding: 12px 16px;
    overflow: visible;
  }
  
  .content-panel .panel-content {
    overflow: visible;
    height: auto;
  }

  .reference-content,
  .analysis-content {
    height: auto;
    overflow: visible;
  }

  .reference-content .panel-header,
  .analysis-content .panel-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #f8f9fa;
  }

  .reference-grid {
    gap: 4px;
  }

  .reference-group {
    margin-bottom: 0;
  }

  .reference-group h4 {
    margin-bottom: 6px;
    padding-bottom: 4px;
  }

  .reference-items {
    gap: 4px;
  }

  .reference-item {
    line-height: 1.4;
  }

  .example-block {
    margin-top: 8px;
  }

  .example-block h4 {
    margin-bottom: 6px;
  }

  .example-quote {
    padding: 10px 12px;
  }
  
  .radio-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .radio-options span {
    margin-bottom: 4px;
  }
}
</style>