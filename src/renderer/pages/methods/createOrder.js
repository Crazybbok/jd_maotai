/* eslint-disable no-unused-vars */
import $store from '@/store'

/**
 * 抢购taskType对应的下单操作
 */

const jd = window.preload.jd

/**
 * 预约抢购商品
 * 1.点击抢购会加入购物车中，在购物车中无法选中
 * 2.到时间才可以选中提交结算
 */
const createReserveOrder = async function(task, account) {
  let result
  // 请求全选购物车内所有商品
  result = await jd.cartSelectAll(account.cookie)
  if (!result) {
    return {
      success: false,
      message: '全选购物车失败'
    }
  }
  // 结算购物车内选中的商品
  result = await jd.getOrderInfo(account.cookie)
  if (!result) {
    return {
      success: false,
      message: '提交结算失败，购物车内没有可以提交的商品'
    }
  }
  // 提交订单
  result = await jd.orderSubmit(account.cookie)
  return result
}

/**
 * 秒杀
 * 1.直接提交订单，但是目前没有找到合适的商品测试过
 */
const createKillOrder = async function(task, account) {
  const { skuId, buyNum } = task
  // 获取商品订单
  const buyInfo = await jd.getBuyInfo(account.cookie, skuId, buyNum)
  const result = await jd.seckillOrderSubmit(account.cookie, skuId, buyNum, buyInfo)
  if (!result) {
    return {
      success: false,
      message: '抢购失败，还未到抢购时间'
    }
  }
  return result
}

/**
 * 查询库存自动下单
 * 1.查询库存，满足有库存以及低于预期价格时，会加到购物车中结算
 */
const getStockAndOrder = async function(task, account) {
  const { skuId, buyNum } = task
  const { cat, venderId } = task.detail
  const area = $store.getters['system/config'].area
  if (!area) {
    return {
      success: false,
      message: '未配置area id，无法获取库存情况'
    }
  }
  const hasStock = await jd.getGoodStock(skuId, buyNum, area, cat, venderId)
  if (!hasStock) {
    return {
      success: false,
      message: '库存为空，无法购买'
    }
  }
  if (task.price) {
    const price = await jd.getGoodPrice(skuId)
    if (price && task.price < +price) {
      return {
        succsee: false,
        message: `当前价格为${price}，超出期望价格`
      }
    }
  }

  let result
  // 请求全选购物车内所有商品
  result = await jd.cartSelectAll(account.cookie)
  if (!result) {
    return {
      success: false,
      message: '全选购物车失败'
    }
  }
  // 清空购物车,防止有其他可提交商品（需要全选之后才可以清空）
  result = await jd.cartClearAll(account.cookie)
  if (!result) {
    return {
      success: false,
      message: '清空购物车失败'
    }
  }
  // 将商品加入购物车
  result = await jd.cartAddGood(account.cookie, skuId, buyNum)
  if (!result) {
    return {
      success: false,
      message: '加入购物车失败'
    }
  }
  // 下单
  result = await createReserveOrder(task, account)
  return result
}

const createOrderMap = new Map([
  [1, createReserveOrder],
  [2, createKillOrder],
  [3, getStockAndOrder]
])

const createOrder = function(task, account) {
  return createOrderMap.get(task.taskType).call(this, task, account)
}

export default createOrder
