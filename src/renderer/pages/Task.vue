<template>
  <div>
    <a-button type="primary" @click="showAddTask">
      添加任务
    </a-button>
    <a-button type="primary" class="mg-l10" @click="clearAll">
      删除所有任务
    </a-button>
    <a-button type="primary" class="mg-l10" @click="stopAll">
      停止所有任务
    </a-button>
    <a-button type="primary" class="mg-l10" @click="testDelay" :loading="delayLoading">
      测试网络延迟
    </a-button>
    <a-list item-layout="horizontal" :data-source="taskList">
      <a-list-item slot="renderItem" slot-scope="item">
        <a-list-item-meta :description="`定时：${formatDate(item.startTime)} , 购买数量：${item.buyNum}`">
          <a slot="title">{{ item.detail.name }}</a>
          <a-avatar slot="avatar" :src="`http:${item.detail.imageSrc}`" />
        </a-list-item-meta>
        <a v-if="isTaskRunning(item.skuId)" slot="actions" @click="stopTaskBySku(item.skuId)">
          停止
        </a>
        <a v-else slot="actions" @click="createOrders(item)">
          开抢
        </a>
        <!-- 更多 -->
        <more-actions slot="actions">
          <a @click="addToCart(item)">加入购物车</a>
          <a @click="deleteTask(item.skuId)">删除任务</a>
        </more-actions>
      </a-list-item>
    </a-list>
    <add-task ref="addTask" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { CountTimer } from '@/utils'
import dayjs from 'dayjs'
import AddTask from './modal/AddTask'
import MoreActions from '@/components/MoreActions'
import log from 'electron-log'
const jd = window.preload.jd
// 抢购提示语
const NOTIFIACTION = {
  1: '该商品是预约抢购商品，需要自行加入到购物车，并确保购物车里不含其他可提交商品',
  2: '该商品是秒杀商品，会自动提交订单'
}

export default {
  name: 'Task',
  components: {
    AddTask,
    MoreActions
  },
  data() {
    return {
      timers: [],
      actions: new Map([
        [1, 'orderSubmit'],
        [2, 'killOrderSubmit']
      ]),
      delay: 0,
      delayLoading: false
    }
  },
  computed: {
    ...mapGetters('user', ['accountList']),
    ...mapGetters('task', ['taskList'])
  },
  activated() {
    this.$store.dispatch('task/checkTaskList')
  },
  methods: {
    showAddTask() {
      this.$refs.addTask.show()
    },
    async createOrders({ skuId, buyNum, taskType, isSetTime, startTime }) {
      this.$notification.open({
        message: '开始抢购',
        description: NOTIFIACTION[taskType],
        placement: 'bottomRight'
      })
      // 所有账号都加入抢购
      const base = await jd.getServerTime()
      log.info('serverTime:', dayjs(base).format('YYYY-MM-DD HH:mm:ss'))
      this.accountList.map((account) => {
        const task = new CountTimer({
          base: new Date(base),
          // eslint-disable-next-line prettier/prettier
          begin: isSetTime ? dayjs(startTime).subtract(3, 'minute').toDate() : new Date(),
          end: isSetTime ? new Date(startTime) : new Date(),
          delay: this.delay,
          every: ({ delta2 }) => {
            log.info(`账号「${account.name}」抢购中，倒计时：${delta2}`)
          },
          finish: async () => {
            // const base = await jd.getServerTime()
            // log.info('delay:', base - startTime)
            // log.info('serverTime:', dayjs(base).format('YYYY-MM-DD HH:mm:ss'))
            this.createOrder(account, skuId, buyNum, taskType)
          }
        })
        task.run()
        this.timers.push({
          pinId: account.pinId,
          skuId,
          task
        })
      })
    },
    async createOrder(account, skuId, buyNum, taskType) {
      const buyInfo = await jd.getBuyInfo(account.cookie, skuId, buyNum)
      const submitResult = await jd[this.actions.get(taskType)](account.cookie, skuId, buyNum, buyInfo)
      if (submitResult && submitResult.success) {
        this.stopTaskByAccount(account.pinId, skuId)
        this.$notification.open({
          message: `恭喜,账号「${account.name}」已抢到`,
          description: '此账号不再参与本轮抢购~',
          placement: 'bottomRight'
        })
      } else if (submitResult && submitResult.resultCode === 600158) {
        this.stopTaskBySku(skuId)
        this.$notification.open({
          message: `商品库存已空，无法继续抢购`,
          description: '已清除当前任务相关的定时器',
          placement: 'bottomRight'
        })
      } else {
        this.$message.info(submitResult.message)
      }
    },
    stopAll() {
      this.timers.map((timer) => {
        timer.task.clear()
      })
      this.timers = []
    },
    stopTaskByAccount(pinId, skuId) {
      this.timers = this.timers.filter((timer) => {
        if (timer.pinId === pinId && timer.skuId === skuId) {
          timer.task.clear()
          return false
        }
        return true
      })
    },
    stopTaskBySku(skuId) {
      this.timers = this.timers.filter((timer) => {
        if (timer.skuId === skuId) {
          timer.task.clear()
          return false
        }
        return true
      })
    },
    deleteTask(skuId) {
      this.stopTaskBySku(skuId)
      this.$store.commit('task/REMOVE', skuId)
    },
    clearAll() {
      this.$store.commit('task/CLEAR_ALL')
    },
    formatDate(value) {
      if (!value) {
        return '-'
      }
      return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    },
    isTaskRunning(skuId) {
      return this.timers.some((timer) => timer.skuId === skuId)
    },
    addToCart({ skuId, buyNum }) {
      this.accountList.map(async (account) => {
        const success = await jd.addGoodsToCart(account.cookie, skuId, buyNum)
        if (success) {
          this.$message.success(`商品已加入账号「${account.name}」的购物车`)
        }
      })
    },
    async testDelay() {
      this.delayLoading = true
      const base = await jd.getServerTime()
      const task = new CountTimer({
        base: new Date(base),
        finish: async () => {
          task.clear()
          const base = await jd.getServerTime()
          this.delay = base - +task.end
          log.info('delay:', this.delay)
          log.info('serverTime:', dayjs(base).format('YYYY-MM-DD HH:mm:ss'))
          log.info('endTime:', dayjs(task.end).format('YYYY-MM-DD HH:mm:ss'))
          this.delayLoading = false
          this.$notification.open({
            message: `网络延迟为${this.delay}ms`,
            description: '将自动调整定时器的网络延时配置',
            placement: 'bottomRight'
          })
        }
      })
      task.run()
    }
  },
  destroyed() {
    this.stopAll()
    this.$message.info('定时器已全部清空')
  }
}
</script>
