import Vue from 'vue'
import App from './App.vue'
import apolloProvider from './plugins/apollo'
import vuetify from './plugins/vuetify'
import router from './router'

Vue.config.productionTip = false

new Vue({
  router,
  data: {},
  vuetify,
  apolloProvider,
  render: (h) => h(App)
}).$mount('#app')
