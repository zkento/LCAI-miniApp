import { ElMessage } from 'element-plus'

export default {
  namespaced: true,
  state: {
    userInfo: null
  },
  mutations: {
    SET_USER_INFO(state, info) {
      state.userInfo = info
      if (info) {
        localStorage.setItem('userInfo', JSON.stringify(info))
      } else {
        localStorage.removeItem('userInfo')
      }
    }
  },
  actions: {
    // 初始化用户信息
    initUserInfo({ commit }) {
      // 先尝试从localStorage获取
      const savedInfo = localStorage.getItem('userInfo')
      if (savedInfo) {
        commit('SET_USER_INFO', JSON.parse(savedInfo))
        return
      }

      // 如果没有，则模拟一个用户
      const mockUser = {
        userId: 'mock_001',
        username: '测试用户',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        token: 'mock_token_' + Date.now()
      }
      commit('SET_USER_INFO', mockUser)
    },
    // 退出登录
    logout({ commit }) {
      commit('SET_USER_INFO', null)
      ElMessage.success('您已退出登录，将引导你前往良策网络系统门户')
      // 这里模拟SSO登录页面
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  },
  getters: {
    isLoggedIn: state => !!state.userInfo
  }
} 