<template>
  <a-modal title="账号配置" :visible="visible" :confirm-loading="confirmLoading" @ok="handleOk" @cancel="handleCancel">
    <a-form-model ref="form" :model="formParams" :rules="formRules" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-model-item label="支付密码" prop="payPassword">
        <a-input-password v-model="formParams.payPassword" />
      </a-form-model-item>
      <a-form-model-item label="eid" prop="eid">
        <a-input v-model="formParams.eid" />
      </a-form-model-item>
      <a-form-model-item label="fp" prop="fp">
        <a-input v-model="formParams.fp" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'AddTask',
  data() {
    return {
      visible: false,
      labelCol: { span: 4 },
      wrapperCol: { span: 18 },
      formParams: {
        payPassword: '',
        eid: '',
        fp: ''
      },
      formRules: {
        payPassword: [{ pattern: /^\d{6}$/, required: true, message: '请输入6位数字的密码' }]
      },
      confirmLoading: false
    }
  },
  computed: {
    ...mapGetters('user', ['accountList'])
  },
  methods: {
    handleOk() {
      this.confirmLoading = true
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.$store.commit('user/SAVE_OR_UPDATE', this.formParams)
          this.$message.success('配置已更新！')
          this.handleCancel()
        }
        this.confirmLoading = false
      })
    },
    handleCancel() {
      this.$refs.form.clearValidate()
      this.hide()
    },
    // public methods
    show(formParams) {
      this.formParams = {
        ...formParams
      }
      this.visible = true
    },
    hide() {
      this.visible = false
    }
  }
}
</script>
