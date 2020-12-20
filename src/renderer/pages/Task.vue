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
        <a-list-item-meta>
          <div slot="description">
            <span class="desc">任务类型: {{ taskMap.get(item.taskType).text }}</span>
            <span class="desc" v-if="[1, 2].includes(item.taskType)">定时: {{ item.startTime | dateformat }}</span>
            <span class="desc" v-if="item.taskType === 3">频率: {{ item.frep + item.unit }}</span>
            <span class="desc" v-if="item.taskType === 3">期望价格: ${{ item.price || '-' }}</span>
            <span class="desc">购买数量: {{ item.buyNum }}</span>
          </div>
          <a slot="title" @click="openExternal(item.skuId)">{{ item.detail.name }}</a>
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
          <a @click="editTask(item)">修改任务</a>
          <a @click="deleteTask(item.id)">删除任务</a>
        </more-actions>
      </a-list-item>
    </a-list>
    <add-task ref="addTask" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { shell } from 'electron'
import { CountTimer } from '@/utils'
import { taskMap } from './const'
import dayjs from 'dayjs'
import MoreActions from '@/components/MoreActions'
import AddTask from './modal/AddTask'
import createOrder from './methods/createOrder'

const jd = window.preload.jd

export default {
  name: 'Task',
  components: {
    AddTask,
    MoreActions
  },
  data() {
    return {
      timers: [],
      taskMap
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
    showAddTask() {
      this.$refs.addTask.show()
    },
    stopAll() {
      this.timers.map((timer) => {
        timer.count.clear()
      })
      this.timers = []
    },
    clearAll() {
      this.$store.commit('task/CLEAR_ALL')
    },
    openExternal(skuId) {
      shell.openExternal(`https://item.jd.com/${skuId}.html`)
    },
    addToCart({ skuId, buyNum }) {
      this.accountList.map(async (account) => {
        const success = await jd.cartAddGood(account.cookie, skuId, buyNum)
        if (success) {
          this.logger_message.success({
            message: `商品已加入账号「${account.name}」的购物车`,
            label: skuId
          })
        } else {
          this.logger_message.error({
            message: `商品加入账号「${account.name}」的购物车失败`,
            label: skuId
          })
        }
      })
    },
    editTask(item) {
      this.$refs.addTask.show(item)
    },
    deleteTask(taskId) {
      this.stopTimer(taskId)
      this.$store.commit('task/REMOVE', taskId)
    },
    isTaskRunning(taskId) {
      return this.timers.some((timer) => timer.taskId === taskId)
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
    async createOrders(task) {
      const { id, skuId, taskType, isSetTime, startTime, frep, unit } = task
      this.logger_notification.info({
        message: '开始抢购',
        description: this.taskMap.get(taskType).desc,
        label: skuId
      })
      // eslint-disable-next-line prettier/prettier
      const begin = isSetTime ? dayjs(startTime).subtract(10, 'minute').toDate() : new Date() // 提前十分钟开始打日志
      const end = isSetTime ? new Date(startTime) : new Date()
      const basetime = await jd.getServerTime()
      this.logger_message.info({
        message: `服务器时间: ${dayjs(basetime).format('YYYY-MM-DD HH:mm:ss')}`,
        label: skuId
      })

      let trytimes = 1
      // 所有账号都加入抢购
      this.accountList.map((account) => {
        const count = new CountTimer({
          base: new Date(basetime),
          begin,
          end,
          delay: this.config.delay,
          frep: taskType === 3 ? frep + unit : 500,
          first: async () => {
            // 倒计时开始的时候校验登录状态并提示
            const { isLogin } = await jd.cookieCheck(account.cookie)
            if (!isLogin) {
              this.logger_message.error({
                message: `账号「${account.name}」登录已失效，请尽快重新登录，避免影响抢购`,
                label: skuId
              })
            }
          },
          every: ({ delta2 }) => {
            this.logger_message.info({
              message: `账号「${account.name}」抢购中，任务倒计时：${delta2}`,
              label: skuId
            })
          },
          finish: async () => {
            this.logger_message.info({
              message: `账号「${account.name}」抢购中，进行第${trytimes++}尝试`,
              label: skuId
            })
            const result = await createOrder(task, account)
            if (result.success) {
              this.stopTimer(task.id, account.pinId)
              this.logger_notification.success({
                message: `恭喜,账号「${account.name}」已抢到`,
                description: `此账号不再参与本轮抢购~`,
                label: skuId
              })
            } else if (result.resultCode === 600158) {
              this.stopTimer(task.id)
              this.logger_notification.error({
                message: `商品库存已空，无法继续抢购`,
                description: `已清除当前任务相关的定时器`,
                label: skuId
              })
            } else {
              this.logger_message.error({ message: result.message, label: skuId })
              // 判断是否要自动停止任务
              if (this.config.trytimes && trytimes > this.config.trytimes && [1, 2].includes(taskType)) {
                this.stopTimer(task.id)
                this.logger_notification.error({
                  message: `抢购失败`,
                  description: `当前尝试次数已超过${this.config.trytimes}。自动停止当前任务。`,
                  label: skuId
                })
              }
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
    }
  },
  destroyed() {
    this.stopAll()
    this.logger_message.info({
      message: '定时器已全部清空',
      label: 'global'
    })
  }
}
</script>
<style lang="less" scoped>
.desc {
  position: relative;
  padding: 0 8px;
  &:first-child {
    padding-left: 0;
  }
  &:not(:last-child) {
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 0;
      width: 1px;
      height: 14px;
      margin-top: -7px;
      background-color: #e8e8e8;
    }
  }
}
</style>
