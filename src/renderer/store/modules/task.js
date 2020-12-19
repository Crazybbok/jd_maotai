import Vue from 'vue'
import { uuid } from '@/utils'

const jd = window.preload.jd

const state = {
  /**
   * 任务列表
   * @property skuId
   * @property taskType
   * @property isSetTime
   * @property startTime
   * @property buyNum
   * @property buyInfo
   */
  task: {}
}

const getters = {
  taskList: (state) => {
    let result = []
    for (const key in state.task) {
      result.push(state.task[key])
    }
    return result
  }
}

const mutations = {
  SAVE_OR_UPDATE(state, { id, skuId, taskType, isSetTime, startTime, buyNum, detail }) {
    const origin = state.task[id]
    let params = { id, skuId, taskType, isSetTime, startTime, buyNum, detail }
    params.id = id || origin.id
    params.skuId = skuId || origin.skuId
    params.taskType = taskType || origin.taskType
    params.buyNum = buyNum || origin.buyNum
    params.detail = detail || origin.detail
    if (isSetTime === undefined) {
      params.isSetTime = origin.isSetTime
    }
    if (params.isSetTime) {
      params.startTime = startTime || origin.startTime
    }
    Vue.set(state.task, id, params)
  },
  REMOVE(state, id) {
    Vue.delete(state.task, id)
  },
  CLEAR_ALL(state) {
    state.task = {}
  }
}

const actions = {
  /**
   * 添加任务
   * @param commit
   * @param form
   * @returns {Promise<void>}
   */
  async addTask({ commit }, { skuId, taskType, isSetTime, startTime, buyNum }) {
    const id = uuid()
    const detail = await jd.getGoodInfo(skuId)
    commit('SAVE_OR_UPDATE', {
      id,
      skuId,
      taskType,
      isSetTime,
      startTime,
      buyNum,
      detail
    })
  },
  /**
   * 更新商品信息
   * @param state
   * @param commit
   * @returns {Promise<void>}
   */
  async checkTaskList({ state, commit }) {
    for (const key in state.task) {
      const task = state.task[key]
      const detail = await jd.getGoodInfo(task.skuId)
      commit('SAVE_OR_UPDATE', {
        id: key,
        detail
      })
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
