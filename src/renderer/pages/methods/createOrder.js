const jd = window.preload.jd

// 预约抢购调用的方法
const createReserveOrder = async function(task, account) {
  let result
  // 请求全选购物车内所有商品
  result = await jd.selectAllCart(account.cookie)
  if (!result) {
    return {
      success: false,
      message: '全选购物车失败'
    }
  }
  // 结算购物车内选中的商品
  result = await jd.clearingGoods(account.cookie)
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

// 秒杀商品调用的方法
const createKillOrder = async function(task, account) {
  const { skuId, buyNum } = task
  // 获取商品订单
  const buyInfo = await jd.getBuyInfo(account.cookie, skuId, buyNum)
  const result = await jd.killOrderSubmit(account.cookie, skuId, buyNum, buyInfo)
  if (!result.success) {
    return {
      success: false,
      message: '抢购失败，还未到抢购时间'
    }
  }
  return result
}

const createOrderMap = new Map([
  [1, createReserveOrder],
  [2, createKillOrder]
])

const createOrder = function(task, account) {
  return createOrderMap.get(task.taskType).call(this, task, account)
}

export default createOrder
