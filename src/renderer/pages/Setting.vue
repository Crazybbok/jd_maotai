<template>
  <div>
    <a-form-model ref="form" :model="formParams" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-model-item label="网络延迟">
        <div>
          <a-input-number :min="0" v-model="formParams.delay" @change="saveConfig" />
          <span>ms</span>
          <span class="pull-right">可以配置大概的网络延迟，以便更准确地请求服务器</span>
        </div>
        <div>
          <a-button type="primary" @click="testDelay" :loading="delayLoading">
            测试网络延迟
          </a-button>
        </div>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { CountTimer } from '@/utils'
import log from 'electron-log'
const jd = window.preload.jd

export default {
  name: 'Test',
  data() {
    return {
      labelCol: { span: 4 },
      wrapperCol: { span: 18 },
      formParams: {
        delay: 0
      },
      formRules: {},
      delayLoading: false
    }
  },
  computed: {
    ...mapGetters('system', ['config'])
  },
  activated() {
    this.formParams = { ...this.config }
  },
  methods: {
    async testDelay() {
      this.delayLoading = true
      const base = await jd.getServerTime()
      const timer = new CountTimer({
        base: new Date(base),
        finish: async () => {
          timer.clear()
          const base = await jd.getServerTime()
          this.formParams.delay = base - +timer.end
          this.saveConfig()
          this.$notification.open({
            message: `当前网络延迟为${this.formParams.delay}ms`,
            description: '已自动配置，可自行手动调整',
            placement: 'bottomRight'
          })
          this.delayLoading = false
        }
      })
      timer.run()
    },
    saveConfig() {
      log.info('保存系统配置：', this.formParams)
      this.$store.commit('system/SAVE_CONFIG', this.formParams)
    }
  }
}
</script>
