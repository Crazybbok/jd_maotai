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
    <a-list item-layout="horizontal" :data-source="taskList">
      <a-list-item slot="renderItem" slot-scope="item">
        <a-list-item-meta :description="`定时：${dateformat(item.startTime)} , 购买数量：${item.buyNum}`">
          <a slot="title">{{ item.detail.name }}</a>
          <a-spin slot="avatar" :spinning="isTaskRunning(item.id)">
            <a-icon slot="indicator" type="loading" spin />
            <a-avatar :src="`http:${item.detail.imageSrc}`" />
          </a-spin>
        </a-list-item-meta>
        <a v-if="isTaskRunning(item.id)" slot="actions" class="list-actions-btn" @click="stopTimer(item.id)">
          停止
        </a>
        <a v-else slot="actions" class="list-actions-btn" @click="createOrders(item)">
          开抢
        </a>
        <!-- 更多 -->
        <more-actions slot="actions">
          <a @click="addToCart(item)">加入购物车</a>
          <a @click="deleteTask(item.id)">删除任务</a>
        </more-actions>
      </a-list-item>
    </a-list>
    <add-task ref="addTask" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { CountTimer, dateformat } from '@/utils'
import { Logger } from '~/utils'
import dayjs from 'dayjs'
import AddTask from './modal/AddTask'
import createOrder from './methods/createOrder'
import MoreActions from '@/components/MoreActions'
const logger = new Logger('task').getInstance()
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
      timers: []
    }
  },
  computed: {
    ...mapGetters('user', ['accountList']),
    ...mapGetters('task', ['taskList']),
    ...mapGetters('system', ['config'])
  },
  activated() {
    this.$store.dispatch('task/checkTaskList')
  },
  methods: {
    dateformat,
    showAddTask() {
      this.$refs.addTask.show()
    },
    async createOrders(task) {
      const { id, taskType, isSetTime, startTime } = task
      this.$notification.open({
        message: '开始抢购',
        description: NOTIFIACTION[taskType],
        placement: 'bottomRight'
      })
      // eslint-disable-next-line prettier/prettier
      const begin = isSetTime ? dayjs(startTime).subtract(10, 'minute').toDate() : new Date() // 提前十分钟开始打日志
      const end = isSetTime ? new Date(startTime) : new Date()
      const basetime = await jd.getServerTime()
      let trytimes = 1
      logger.info('服务器时间:', dayjs(basetime).format('YYYY-MM-DD HH:mm:ss'))
      // 所有账号都加入抢购
      this.accountList.map((account) => {
        const count = new CountTimer({
          base: new Date(basetime),
          begin,
          end,
          delay: this.config.delay,
          every: ({ delta2 }) => {
            logger.info(`账号「${account.name}」抢购中，任务倒计时：${delta2}`)
          },
          finish: async () => {
            logger.info(`账号「${account.name}」抢购中，进行第${trytimes++}尝试`)
            const result = await createOrder(task, account)
            if (result.success) {
              this.stopTimer(task.id, account.pinId)
              logger.info(`恭喜,账号「${account.name}」已抢到，此账号不再参与本轮抢购~`)
              this.$notification.open({
                message: `恭喜,账号「${account.name}」已抢到`,
                description: '此账号不再参与本轮抢购~',
                placement: 'bottomRight'
              })
            } else if (result.resultCode === 600158) {
              this.stopTimer(task.id)
              logger.info(`商品库存已空，无法继续抢购。已清除当前任务相关的定时器。`)
              this.$notification.open({
                message: `商品库存已空，无法继续抢购`,
                description: '已清除当前任务相关的定时器',
                placement: 'bottomRight'
              })
            } else {
              this.$message.info(result.message)
            }
          }
        })
        count.run()
        this.timers.push({
          pinId: account.pinId,
          taskId: id,
          count
        })
      })
    },
    stopAll() {
      this.timers.map((timer) => {
        timer.count.clear()
      })
      this.timers = []
    },
    stopTimer(taskId, pinId) {
      this.timers = this.timers.filter((timer) => {
        if (timer.taskId === taskId && (!pinId || timer.pinId === pinId)) {
          timer.count.clear()
          return false
        }
        return true
      })
    },
    deleteTask(taskId) {
      this.stopTimer(taskId)
      this.$store.commit('task/REMOVE', taskId)
    },
    clearAll() {
      this.$store.commit('task/CLEAR_ALL')
    },
    isTaskRunning(taskId) {
      return this.timers.some((timer) => timer.taskId === taskId)
    },
    addToCart({ skuId, buyNum }) {
      this.accountList.map(async (account) => {
        const success = await jd.cartAddGood(account.cookie, skuId, buyNum)
        if (success) {
          this.$message.success(`商品已加入账号「${account.name}」的购物车`)
        } else {
          this.$message.error(`商品加入账号「${account.name}」的购物车失败`)
        }
      })
    }
  },
  destroyed() {
    this.stopAll()
    this.$message.info('定时器已全部清空')
  }
}
</script>
