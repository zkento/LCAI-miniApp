<template>
  <div class="page-container">
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #title>返回</template>
        <template #content>
          <span class="page-title">融资顾问报告</span>
        </template>
      </el-page-header>
    </div>
    
    <div class="page-content">
      <FinanceAdvisorReport @report-complete="handleReportComplete" />
    </div>
  </div>
</template>

<script>
import FinanceAdvisorReport from '../components/FinanceAdvisorReport.vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'FinanceAdvice',
  components: {
    FinanceAdvisorReport
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    handleReportComplete(data) {
      // 报告生成完成后的处理逻辑
      console.log('融资顾问报告生成完成:', data);
      ElMessage.success('融资顾问报告生成完成');
      // 此处可以添加保存报告、下载报告等功能
    }
  }
}
</script>

<style scoped>
.page-container {
  height: calc(100vh - 64px); /* 减去顶部导航栏高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.page-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  background: white;
  flex-shrink: 0;
  z-index: 10;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
}

.page-content {
  flex: 1;
  overflow: hidden;
  background-color: #f5f7fa;
  position: relative;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  display: flex; /* 添加flex布局 */
  flex-direction: column; /* 设置纵向排列 */
}
</style> 