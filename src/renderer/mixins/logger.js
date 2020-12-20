import { Logger } from '~/utils'
import { message as $message, notification as $notification } from 'ant-design-vue'
const logger = new Logger('task').getInstance()

const messageColorMap = new Map([
  ['info', '#314659'],
  ['success', '#389e0d'],
  ['error', '#f5222d']
])

function createLoggerMessage({ message, label }, type) {
  type !== 'info' && $message[type](message)
  logger.info(`%c[${label}] %c${message}`, `color: #8c8c8c`, `color: ${messageColorMap.get(type)}`)
}

function createLoggerNotification({ message, description, label }, type) {
  $notification.open({
    message,
    description,
    placement: 'bottomRight'
  })
  logger.info(`%c[${label}] %c${message}, ${description}`, `color: #8c8c8c`, `color: ${messageColorMap.get(type)}`)
}

export default {
  data() {
    const logger_message = {}
    const logger_notification = {}
    ;[...messageColorMap.keys()].forEach((type) => {
      logger_message[type] = ({ message, label }) => {
        createLoggerMessage({ message, label }, type)
      }
    })
    ;[...messageColorMap.keys()].forEach((type) => {
      logger_notification[type] = ({ message, description, label }) => {
        createLoggerNotification({ message, description, label }, type)
      }
    })
    return {
      logger_message,
      logger_notification
    }
  }
}
