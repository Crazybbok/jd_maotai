import Vue from 'vue'
import router from '@/router'
import store from '@/store'
import App from '@/App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import '@/styles/index.less'
import '@/filters'
import '@/mixins'
import { message } from 'ant-design-vue'

global.vbus = new Vue()
Vue.config.productionTip = false

Vue.use(Antd)

// message全局配置
message.config({
  maxCount: 2
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  ...App
})
