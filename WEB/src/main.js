import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 注入全局CSS变量，覆盖Element Plus默认主题
import './styles/element-theme.css'

// 全局错误处理 - 捕获ResizeObserver错误
window.addEventListener('error', (event) => {
  if (event && event.message && event.message.includes('ResizeObserver')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
}, true);

// 全局Promise拒绝错误处理
window.addEventListener('unhandledrejection', (event) => {
  if (event && event.reason && 
      event.reason.message && 
      event.reason.message.includes('ResizeObserver')) {
    event.preventDefault();
    return false;
  }
}, true);

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.use(store)
app.mount('#app') 