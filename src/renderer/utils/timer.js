import dayjs from 'dayjs'
import setPromiseInterval, { clearPromiseInterval } from './setPromiseInterval'
const noop = function() {}

const multiple = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
}

const getDuration = function(time) {
  const daysRound = Math.floor(time / 1000 / 60 / 60 / 24)
  const hoursRound = Math.floor(time / 1000 / 60 / 60 - 24 * daysRound)
  const minutesRound = Math.floor(time / 1000 / 60 - 24 * 60 * daysRound - 60 * hoursRound)
  const seconds = Math.floor(time / 1000 - 24 * 60 * 60 * daysRound - 60 * 60 * hoursRound - 60 * minutesRound)
  return `${hoursRound}:${minutesRound}:${seconds}`
}

const formatFrep = function(frep) {
  const isN = Number.isNaN(+frep)
  if (!isN) {
    return frep
  }
  const match = frep.match(/(\d*)(s|m|h|d)$/)
  if (!match || match.length < 3) {
    throw new Error('frep format error')
  }
  return match[1] * multiple[match[2]]
}

class CountTimer {
  constructor(opt) {
    this.opt = opt || {}

    const now = new Date()
    // 客户端时间
    this.basenow = now
    // 服务器时间
    this.base = this.opt.base || now
    // 开始计时的时间
    this.begin = this.opt.begin || now
    // 结束时间
    this.end =
      this.opt.end ||
      dayjs(this.begin)
        .add(30, 'second')
        .toDate()

    // 以下精确到秒
    this.begin = new Date(Math.floor(this.begin / 1000) * 1000)
    this.end = new Date(Math.floor(this.end / 1000) * 1000)
    // 大概的网络延迟
    this.delay = this.opt.delay || 0
    // 刷新频率
    this.frep = formatFrep(this.opt.frep || 500)

    // 不同阶段的回调
    this.first = this.opt.first || noop
    this.every = this.opt.every || noop
    this.finish = this.opt.finish || noop
    // 定时器
    this.timer = null
    this.status = 'before'
    this.firstTriggered = false
  }

  async check(now) {
    now = new Date(+now - +this.basenow + +this.base + this.delay)

    if (!this.firstTriggered && now >= this.begin && now < this.end) {
      await this.first({
        delta1: getDuration(now - this.begin), // 开始了多久
        delta2: getDuration(this.end - now + 1000), // 距离结束还有多久
        now: now // 当前时间
      })
      this.firstTriggered = true
    }

    if (now >= this.begin && now < this.end) {
      await this.every({
        delta1: getDuration(now - this.begin), // 开始了多久
        delta2: getDuration(this.end - now + 1000), // 距离结束还有多久
        now: now // 当前时间
      })

      return 'downcounting'
    }

    if (now >= this.end) {
      await this.finish({
        delta1: getDuration(now - this.end + 1000) // 结束了多久
      })

      return 'finish'
    }

    return 'before'
  }

  run() {
    this.timer = setPromiseInterval(async () => {
      const now = new Date()
      this.status = await this.check(now)
    }, this.frep)
  }

  clear() {
    clearPromiseInterval(this.timer)
    this.status = 'stop'
  }
}

export default CountTimer
