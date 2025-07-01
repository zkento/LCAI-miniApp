<template>
  <div class="page-container">
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #title>返回</template>
        <template #content>
          <span class="page-title">个人征信分析</span>
        </template>
      </el-page-header>
    </div>
    
    <div class="page-content">
      <creditAnalyseReport chat-type="personal-credit" />
    </div>
  </div>
</template>

<script>
import creditAnalyseReport from '../components/creditAnalyseReport.vue'

export default {
  name: 'PersonalCredit',
  components: {
    creditAnalyseReport
  },
  methods: {
    goBack() {
      this.$router.push('/')
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