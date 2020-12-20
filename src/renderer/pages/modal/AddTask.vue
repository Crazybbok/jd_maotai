<template>
  <a-modal :title="title" :visible="visible" :confirm-loading="confirmLoading" @ok="handleOk" @cancel="handleCancel">
    <a-form-model ref="form" :model="formParams" :rules="formRules" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-model-item label="抢购类型" prop="taskType">
        <a-select v-model="formParams.taskType" @change="handleTaskTypeChange">
          <a-select-option v-for="item in taskMap" :key="item[0]" :value="item[0]">
            {{ item[1].text }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <template v-if="[1, 2].includes(formParams.taskType)">
        <a-form-model-item label="定时" prop="isSetTime">
          <a-switch v-model="formParams.isSetTime" />
        </a-form-model-item>
        <a-form-model-item v-if="formParams.isSetTime" label="抢购时间" prop="startTime">
          <a-date-picker
            v-model="formParams.startTime"
            show-time
            type="date"
            placeholder="选择抢购时间"
            style="width: 100%;"
          />
        </a-form-model-item>
      </template>
      <template v-if="formParams.taskType === 3">
        <a-form-model-item label="轮询频率" prop="frep">
          <a-input v-model="formParams.frep">
            <a-select slot="addonAfter" v-model="formParams.unit" style="width: 80px">
              <a-select-option value="d">
                天
              </a-select-option>
              <a-select-option value="h">
                小时
              </a-select-option>
              <a-select-option value="m">
                分钟
              </a-select-option>
              <a-select-option value="s">
                秒
              </a-select-option>
            </a-select>
          </a-input>
        </a-form-model-item>
        <a-form-model-item label="期望价格">
          <a-input-number :min="0" v-model="formParams.price" />
          <span>元</span>
          <span class="pull-right">不填默认不校验价格自动下单</span>
        </a-form-model-item>
      </template>
      <a-form-model-item label="商品ID" prop="skuId">
        <a-input v-model="formParams.skuId" :disabled="isEdit" />
      </a-form-model-item>
      <a-form-model-item label="购买数量" prop="buyNum">
        <a-input-number :min="1" v-model="formParams.buyNum" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>
<script>
import { mapGetters } from 'vuex'
import { taskMap } from '../const'
export default {
  name: 'AddTask',
  data() {
    return {
      visible: false,
      labelCol: { span: 4 },
      wrapperCol: { span: 18 },
      isEdit: false,
      formParams: {
        taskType: 1,
        isSetTime: true,
        startTime: null,
        skuId: '',
        buyNum: 1,
        frep: 10,
        unit: 'm'
      },
      formRules: {
        taskType: [{ required: true, message: '必填' }],
        startTime: [{ required: true, message: '必填' }],
        skuId: [{ required: true, message: '必填' }],
        frep: [{ pattern: /^[0-9]*?$/, required: true, message: '请填入整数' }]
      },
      confirmLoading: false,
      taskMap
    }
  },
  computed: {
    ...mapGetters('user', ['accountList']),
    title() {
      return this.isEdit ? '修改任务' : '添加任务'
    }
  },
  methods: {
    handleOk() {
      this.confirmLoading = true
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.$store.dispatch('task/addTask', {
            ...this.formParams,
            startTime: this.formParams.isSetTime ? this.formParams.startTime : null
          })
          this.$message.success('任务已添加！')
          this.handleCancel()
        }
        this.confirmLoading = false
      })
    },
    handleCancel() {
      this.$refs.form.clearValidate()
      this.hide()
    },
    handleTaskTypeChange(value) {
      this.$refs.form.clearValidate()
      this.formParams.isSetTime = value !== 3
    },
    // public methods
    show(formParams) {
      if (formParams) {
        this.isEdit = true
        this.formParams = {
          ...formParams
        }
      } else {
        // 重置
        this.isEdit = false
        this.formParams = {
          taskType: 1,
          isSetTime: true,
          startTime: null,
          skuId: '',
          buyNum: 1,
          frep: 10,
          unit: 'm'
        }
      }
      this.visible = true
    },
    hide() {
      this.visible = false
    }
  }
}
</script>
