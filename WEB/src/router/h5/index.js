// 最后修改时间: 2024-03-19

import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/h5/home/index.vue')
  },
  {
    path: '/personal-credit',
    name: 'PersonalCredit',
    component: () => import('@/pages/h5/personal-credit/index.vue')
  },
  {
    path: '/business-credit',
    name: 'BusinessCredit',
    component: () => import('@/pages/h5/business-credit/index.vue')
  },
  {
    path: '/property-advice',
    name: 'PropertyAdvice',
    component: () => import('@/pages/h5/property-advice/index.vue')
  },
  {
    path: '/financing-advice',
    name: 'FinancingAdvice',
    component: () => import('@/pages/h5/financing-advice/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 