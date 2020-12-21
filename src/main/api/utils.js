import { Logger } from '~/utils'
const logger = new Logger('request').getInstance()

export const getRandomArbitrary = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

export const encryptPayPassword = (value) => {
  return value
    .split('')
    .map((item) => 'u3' + item)
    .join('')
}

export const handleResponse = (resp) => {
  const { body, statusCode, request } = resp
  let result = body
  try {
    result = JSON.parse(parseJson(body))
  } catch (error) {
    if (typeof body === 'string' && body.indexOf('DOCTYPE') > -1) {
      const parser = new DOMParser()
      // 解析返回的HTML代码
      result = parser.parseFromString(body, 'text/html')
    }
  }
  const isSuc = statusCode === 200
  // request logs
  if (process.env.NODE_ENV !== 'production') {
    logger.info(
      `${request.href} %c${isSuc ? 'Success' : 'Failed'}:`,
      `color: ${isSuc ? 'green' : 'red'}`,
      isSuc ? result : statusCode
    )
  }
  return result
}

function parseJson(body) {
  if (typeof body === 'string') {
    const match = body.match(/\{(.*)\}/)
    return match && match.length ? match[0] : body
  }
  return body
}
