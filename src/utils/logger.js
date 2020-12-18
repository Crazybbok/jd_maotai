import log from 'electron-log'

class Logger {
  constructor(name) {
    // 新建一个log实例
    this.logger = log.create(name)
    this.logger.fileName = `${name}.log`
  }

  getInstance() {
    return this.logger
  }
}

export default Logger
