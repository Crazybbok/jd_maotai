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
      <a-form-model-item label="重试次数">
        <div>
          <a-input-number :min="0" v-model="formParams.trytimes" @change="saveConfig" />
          <span>次</span>
          <span class="pull-right">配置失败多少次之后自动停止任务(仅限预约抢购和秒杀)</span>
        </div>
      </a-form-model-item>
      <a-form-model-item label="area id">
        <div>
          <a-input
            v-model="formParams.area"
            style="width: 200px;"
            placeholder="格式: xx_xx_xx_xx"
            @change="saveConfig"
          />
          <span class="pull-right">收货地址的地区id，用于获取当地库存</span>
        </div>
      </a-form-model-item>
    </a-form-model>
    <!-- <a-table :columns="columns" :data-source="apiList" class="mg-t10" rowKey="name" :pagination="false">
      <span slot="action" slot-scope="text, record">
        <a type="link" @click="test(record)">
          测试接口
        </a>
      </span>
    </a-table> -->
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { CountTimer } from '@/utils'
import { apiList, testApis } from './methods/testApis'
import log from 'electron-log'
const jd = window.preload.jd

export default {
  name: 'Test',
  data() {
    return {
      labelCol: { span: 4 },
      wrapperCol: { span: 18 },
      formParams: {
        delay: 0,
        trytimes: 0,
        area: ''
      },
      formRules: {},
      delayLoading: false,
      apiList,
      columns: [
        {
          title: '接口',
          dataIndex: 'name',
          key: 'name'
        },
        {
          title: '操作',
          width: 100,
          dataIndex: 'action',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ]
    }
  },
  computed: {
    ...mapGetters('user', ['accountList']),
    ...mapGetters('task', ['taskList']),
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
    },
    async test(row) {
      const account = this.accountList[0]
      const task = this.taskList[0]
      const skuId = task.skuId
      const buyNum = task.buyNum
      let buyInfo = {}
      if (row.name === 'seckillOrderSubmit') {
        buyInfo = await jd.getBuyInfo(account.cookie, skuId, buyNum)
      }
      const params = {
        Cookie: account.cookie,
        skuId,
        buyNum,
        area: this.config.area,
        cat: task.detail.cat,
        venderId: task.detail.venderId,
        buyInfo
      }
      await testApis(row.name, params)
    }
  }
}
</script>
