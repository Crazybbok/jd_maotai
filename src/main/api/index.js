/**
 * 京东相关接口
 */
import request from 'request-promise'
import URLS from './url'
import { handleResponse, getRandomArbitrary, encryptPayPassword } from './utils'
// import log from 'electron-log'

const UserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
const ContentType = 'application/x-www-form-urlencoded'

/**
 * 查询登录状态及是否为京东plus会员
 * @param Cookie
 * @returns {Promise<{isLogin: boolean}|{isLogin: boolean, isPlusMember: boolean}>}
 */
export function cookieCheck(Cookie) {
  return request({
    uri: URLS.CHECK_ACCOUNT,
    headers: {
      Cookie,
      'User-Agent': UserAgent
    },
    json: true,
    resolveWithFullResponse: true
  }).then((resp) => {
    const body = handleResponse(resp)
    return {
      isLogin: !!(body === true || body === false),
      isPlusMember: body === true
    }
  })
}

/**
 * 获取秒杀订单URL
 * @param skuId
 * @returns {Promise<any>}
 */
export function getSeckillUrl(skuId) {
  return request({
    uri: URLS.GET_SECKILL_URL,
    headers: {
      'User-Agent': UserAgent,
      Host: 'itemko.jd.com',
      Referer: `https://item.jd.com/${skuId}.html`
    },
    qs: {
      callback: `jQuery${getRandomArbitrary(1000000, 9999999)}`,
      skuId,
      from: 'pc',
      _: +new Date()
    },
    json: true,
    resolveWithFullResponse: true
  }).then((resp) => {
    return handleResponse(resp)
  })
}

/**
 * 获取下单信息
 * @param Cookie
 * @param skuId
 * @param buyNum
 * @returns {Promise<any>}
 */
export function getBuyInfo(Cookie, skuId, buyNum) {
  const params = {
    sku: skuId,
    num: buyNum,
    isModifyAddress: false
  }
  return request({
    method: 'POST',
    uri: URLS.GET_SECKILL_GOOD_INFO,
    form: params,
    headers: {
      Cookie,
      'User-Agent': UserAgent
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    return handleResponse(resp)
  })
}

/**
 * TODO: 没有试验成功过，需要修改
 * 提交秒杀订单
 * @param Cookie
 * @param skuId
 * @param buyNum
 * @param buyInfo
 * @returns {Promise<any>}
 */
export function seckillOrderSubmit(Cookie, skuId, buyNum, buyInfo) {
  const params = {
    skuId,
    num: buyNum,
    addressId: buyInfo['addressList'][0]['id'],
    yuShou: true,
    isModifyAddress: false,
    name: buyInfo['addressList'][0]['name'],
    provinceId: buyInfo['addressList'][0]['provinceId'],
    cityId: buyInfo['addressList'][0]['cityId'],
    countyId: buyInfo['addressList'][0]['countyId'],
    townId: buyInfo['addressList'][0]['townId'],
    addressDetail: buyInfo['addressList'][0]['addressDetail'],
    mobile: buyInfo['addressList'][0]['mobile'],
    mobileKey: buyInfo['addressList'][0]['mobileKey'],
    email: buyInfo['addressList'][0]['email'],
    postCode: buyInfo['addressList'][0]['postCode'],
    invoiceTitle: buyInfo['invoiceInfo']['invoiceTitle'],
    invoiceCompanyName: '',
    invoiceContent: buyInfo['invoiceInfo']['invoiceContentType'],
    invoiceTaxpayerNO: '',
    invoiceEmail: buyInfo['invoiceInfo']['invoiceEmail'],
    invoicePhone: buyInfo['invoiceInfo']['invoicePhone'],
    invoicePhoneKey: buyInfo['invoiceInfo']['invoicePhoneKey'],
    invoice: true,
    password: '',
    codTimeType: 3,
    paymentType: 4,
    areaCode: '',
    overseas: 0,
    phone: '',
    eid: '',
    fp: '',
    token: buyInfo['token'],
    pru: ''
  }
  return request({
    method: 'POST',
    uri: URLS.SECKILL_ORDER_SUBMIT,
    form: params,
    headers: {
      Cookie,
      'User-Agent': UserAgent,
      'Content-Type': ContentType
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const data = handleResponse(resp)
    if (data.indexOf('https://marathon.jd.com/koFail.html') > -1) {
      return false
    }
    return data
  })
}

/**
 * 全选购物车中的商品
 * @param Cookie
 * @returns {Promise<boolean>}
 */
export function cartSelectAll(Cookie) {
  return request({
    uri: URLS.CART_SELECT_ALL,
    headers: {
      Cookie,
      'User-Agent': UserAgent
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const result = handleResponse(resp)
    if (result && result.sortedWebCartResult) {
      return result.sortedWebCartResult
    }
    return false
  })
}

/**
 * 清空购物车
 * @param Cookie
 * @returns {Promise<boolean>}
 */
export function cartClearAll(Cookie) {
  return request({
    uri: URLS.CART_CLEAR_ALL,
    headers: {
      Cookie,
      'User-Agent': UserAgent
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const result = handleResponse(resp)
    if (result && result.sortedWebCartResult) {
      return result.sortedWebCartResult
    }
    return false
  })
}

/**
 * 添加商品到购物车
 * @param Cookie
 * @param skuId
 * @param buyNum
 * @returns {Promise<boolean>}
 */
export function cartAddGood(Cookie, skuId, buyNum) {
  return request({
    uri: URLS.CART_ADD_GOOD,
    qs: {
      pid: skuId,
      pcount: buyNum,
      ptype: 1
    },
    headers: {
      Cookie,
      'User-Agent': UserAgent,
      'Content-Type': ContentType
    },
    json: true,
    resolveWithFullResponse: true
  }).then((resp) => {
    const dom = handleResponse(resp)
    const isLogin = dom.querySelector('.success-top')
    return isLogin && isLogin.indexOf('成功') > -1
  })
}

/**
 * 结算购物车内商品
 * @param Cookie
 * @returns {Promise<boolean>}
 */
export function getOrderInfo(Cookie) {
  return request({
    uri: URLS.GET_ORDER_INFO,
    headers: {
      Cookie,
      'User-Agent': UserAgent,
      'Content-Type': ContentType
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const data = handleResponse(resp)
    return !(data instanceof Document)
  })
}

/**
 * 提交订单（当前购物车内所有商品）
 * @param Cookie
 * @returns {Promise<any>}
 */
export function orderSubmit(account) {
  const params = {
    overseaPurchaseCookies: '',
    vendorRemarks: '[]',
    'submitOrderParam.sopNotPutInvoice': 'false',
    'submitOrderParam.trackID': 'TestTrackId',
    'submitOrderParam.ignorePriceChange': '0',
    'submitOrderParam.btSupport': '0',
    'submitOrderParam.jxj': '1',
    'submitOrderParam.eid': account.eid || '',
    'submitOrderParam.fp': account.fp || '',
    ...(account.payPassword && {
      'submitOrderParam.payPassword': encryptPayPassword(account.payPassword)
    })
  }
  // 提交订单
  return request({
    method: 'POST',
    uri: URLS.ORDER_SUBMIT,
    form: params,
    headers: {
      Cookie: account.cookie,
      'User-Agent': UserAgent,
      Host: 'trade.jd.com',
      Referer: 'http://trade.jd.com/shopping/order/getOrderInfo.action'
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    return handleResponse(resp)
  })
}

/**
 * 请求商品详情页
 * @param skuId
 * @returns {Promise<any>}
 */
export function getGoodInfo(skuId) {
  return request({
    uri: `https://item.jd.com/${skuId}.html`,
    headers: {
      'User-Agent': UserAgent
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const dom = handleResponse(resp)
    const pageConfig = dom.querySelectorAll('script')[0].innerText
    const imageSrc = dom.querySelector('#spec-img').dataset.origin
    const name = pageConfig.match(/name: '(.*)'/)[1]
    const easyBuyUrl = pageConfig.match(/easyBuyUrl:"(.*)"/)[1]
    const cat = pageConfig.match(/cat: \[(.*)\]/)[1]
    const venderId = pageConfig.match(/venderId:(\d*)/)[1]
    return {
      name,
      imageSrc,
      cat,
      venderId,
      easyBuyUrl
    }
  })
}

/**
 * 查询某个商品的库存
 * @param skuId
 * @param buyNum
 * @param buyInfo
 * @returns {Promise<boolean>}
 */
export function getGoodStock(skuId, buyNum, area, cat, venderId) {
  return request({
    uri: URLS.GET_GOOD_STOCK,
    qs: {
      skuId,
      buyNum,
      area,
      ch: 1,
      callback: `jQuery${getRandomArbitrary(1000000, 9999999)}`,
      _: +new Date(),
      extraParam: '{"originid":"1"}',
      cat,
      venderId
    },
    headers: {
      'User-Agent': UserAgent,
      Referer: `https://item.jd.com/${skuId}.html`
    },
    resolveWithFullResponse: true
  }).then((resp) => {
    const result = handleResponse(resp)
    if (result && result.stock) {
      const skuState = result.stock.skuState // 商品是否上架
      const StockState = result.stock.StockState // 商品库存状态：33 -- 现货  0,34 -- 无货  36 -- 采购中  40 -- 可配货
      return skuState === 1 && [33, 40].includes(StockState)
    }
    return false
  })
}

/**
 * 查询京东服务器时间
 * @returns {Promise<any>}
 */
export function getServerTime() {
  return request({
    uri: URLS.GET_SERVER_TIME,
    resolveWithFullResponse: true
  }).then((resp) => {
    const { serverTime } = handleResponse(resp)
    return serverTime
  })
}

export function getGoodPrice(skuId) {
  return request({
    uri: URLS.GET_GOOD_PRICE,
    qs: {
      type: 1,
      pduid: +new Date(),
      skuIds: 'J_' + skuId
    },
    resolveWithFullResponse: true,
    json: true
  }).then((resp) => {
    const data = handleResponse(resp)
    if (data && data.length) {
      return data[0].p
    }
    return null
  })
}
