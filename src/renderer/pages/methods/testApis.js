import { get } from 'lodash'
const jd = window.preload.jd

const apiMap = new Map([
  ['cookieCheck', ['Cookie']],
  ['getSeckillUrl', ['skuId']],
  ['getBuyInfo', ['Cookie', 'skuId', 'buyNum']],
  ['seckillOrderSubmit', ['Cookie', 'skuId', 'buyNum', 'buyInfo']],
  ['cartSelectAll', ['Cookie']],
  ['cartClearAll', ['Cookie']],
  ['cartAddGood', ['Cookie', 'skuId', 'buyNum']],
  ['getOrderInfo', ['Cookie']],
  ['orderSubmit', ['Cookie']],
  ['getGoodInfo', ['skuId']],
  ['getGoodStock', ['skuId', 'buyNum', 'area', 'cat', 'venderId']],
  ['getServerTime', []],
  ['getGoodPrice', ['skuId']]
])

export const apiList = [...apiMap.keys()].map((name) => {
  return {
    name
  }
})

export function testApis(name, obj) {
  const params = apiMap.get(name)
  return jd[name](
    get(obj, get(params, 0)),
    get(obj, get(params, 1)),
    get(obj, get(params, 2)),
    get(obj, get(params, 3)),
    get(obj, get(params, 4))
  )
}
