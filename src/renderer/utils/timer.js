import dayjs from 'dayjs'
const noop = function() {}

const getDuration = function(time) {
  const daysRound = Math.floor(time / 1000 / 60 / 60 / 24)
  const hoursRound = Math.floor(time / 1000 / 60 / 60 - 24 * daysRound)
  const minutesRound = Math.floor(time / 1000 / 60 - 24 * 60 * daysRound - 60 * hoursRound)
  const seconds = Math.floor(time / 1000 - 24 * 60 * 60 * daysRound - 60 * 60 * hoursRound - 60 * minutesRound)
  return `${hoursRound}:${minutesRound}:${seconds}`
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

    // 不同阶段的回调
    this.first = this.opt.first || noop
    this.every = this.opt.every || noop
    this.finish = this.opt.finish || noop
    // 定时器
    this.timer = null
    this.status = 'before'
    this.firstTriggered = false
  }

  check(now) {
    now = new Date(+now - +this.basenow + +this.base + this.delay)

    if (!this.firstTriggered && now >= this.begin && now < this.end) {
      this.first({
        delta1: getDuration(now - this.begin), // 开始了多久
        delta2: getDuration(this.end - now + 1000), // 距离结束还有多久
        now: now // 当前时间
      })
      this.firstTriggered = true
    }

    if (now >= this.begin && now < this.end) {
      this.every({
        delta1: getDuration(now - this.begin), // 开始了多久
        delta2: getDuration(this.end - now + 1000), // 距离结束还有多久
        now: now // 当前时间
      })

      return 'downcounting'
    }

    if (now >= this.end) {
      this.finish({
        delta1: getDuration(now - this.end + 1000) // 结束了多久
      })

      return 'finish'
    }

    return 'before'
  }

  run() {
    this.timer = setInterval(() => {
      const now = new Date()
      this.status = this.check(now)
    }, 500)
  }

  clear() {
    clearInterval(this.timer)
    this.status = 'stop'
  }
}

export default CountTimer
