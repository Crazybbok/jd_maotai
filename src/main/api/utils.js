import { Logger } from '~/utils'
const logger = new Logger('request').getInstance()

export const getRandomArbitrary = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

export const handleResponse = (resp) => {
  const { body, statusCode, request } = resp
  logger.info(`接口 ${request.href} 请求结果：${statusCode}`)
  let result = parseJson(body)
  try {
    result = JSON.parse(result)
    logger.info('response result:', result)
    return result
  } catch (error) {
    if (typeof body === 'string' && body.indexOf('DOCTYPE') > -1) {
      const parser = new DOMParser()
      // 解析返回的HTML代码
      const dom = parser.parseFromString(body, 'text/html')
      logger.info('parser html:', dom)
      return dom
    }
    logger.info('response result:', body)
    return body
  }
}

function parseJson(body) {
  if (typeof body === 'string') {
    const match = body.match(/\{(.*)\}/)
    return match && match.length ? match[0] : body
  }
  return body
}
