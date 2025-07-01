import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import PersonalCredit from '../pages/PersonalCredit.vue'
import BusinessCredit from '../pages/BusinessCredit.vue'
import PropertyAdvice from '../pages/PropertyAdvice.vue'
import FinanceAdvice from '../pages/FinanceAdvice.vue'
import LoanCalculator from '../components/LoanCalculator.vue'
import TaskResultViewer from '../components/TaskResultViewer.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/personal-credit',
    name: 'PersonalCredit',
    component: PersonalCredit
  },
  {
    path: '/business-credit',
    name: 'BusinessCredit',
    component: BusinessCredit
  },
  {
    path: '/property-advice',
    name: 'PropertyAdvice',
    component: PropertyAdvice
  },
  {
    path: '/finance-advice',
    name: 'FinanceAdvice',
    component: FinanceAdvice
  },
  {
    path: '/loan-calculator',
    name: 'LoanCalculator',
    component: LoanCalculator
  },
  {
    path: '/task-result',
    name: 'TaskResult',
    component: TaskResultViewer
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 