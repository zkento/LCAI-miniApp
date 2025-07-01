import { createStore } from 'vuex'
import user from './modules/user'
import history from './modules/history'

export default createStore({
  modules: {
    user,
    history
  }
}) 