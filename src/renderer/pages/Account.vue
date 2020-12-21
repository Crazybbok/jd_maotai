<template>
  <div>
    <a-button type="primary" @click="login">
      添加账号
    </a-button>
    <a-button type="primary" class="mg-l10" @click="clear">
      清空账号
    </a-button>
    <a-table :columns="columns" :data-source="accountList" class="mg-t10" rowKey="pinId">
      <span slot="isLogin" slot-scope="text, record">
        {{ record.isLogin ? '已登录' : '未登录' }}
      </span>
      <span slot="isPlusMember" slot-scope="text, record">
        {{ record.isPlusMember ? '是' : '否' }}
      </span>
      <span slot="action" slot-scope="text, record">
        <a type="link" class="actions" @click="deleteAccount(record)">
          删除
        </a>
        <a type="link" class="actions" @click="configAccount(record)">
          配置
        </a>
      </span>
    </a-table>
    <AccountConfig ref="config" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import AccountConfig from './modal/AccountConfig'
const { BrowserWindow } = require('electron').remote
export default {
  name: 'account',
  components: {
    AccountConfig
  },
  data() {
    return {
      columns: [
        {
          title: '账号',
          dataIndex: 'name',
          key: 'name'
        },
        {
          title: '登录状态',
          dataIndex: 'isLogin',
          key: 'isLogin',
          scopedSlots: { customRender: 'isLogin' }
        },
        {
          title: 'plus会员',
          dataIndex: 'isPlusMember',
          key: 'isPlusMember',
          scopedSlots: { customRender: 'isPlusMember' }
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ]
    }
  },
  computed: {
    ...mapGetters('user', ['accountList'])
  },
  activated() {
    this.$store.dispatch('user/checkAccountList')
  },
  methods: {
    login() {
      const loginWin = new BrowserWindow({
        width: 800,
        height: 600
      })
      loginWin.loadURL('https://passport.jd.com/new/login.aspx?ReturnUrl=https%3A%2F%2Fwww.jd.com%2F')
      loginWin.webContents.on('did-navigate', (event, url) => {
        if (url !== 'https://www.jd.com/') {
          return
        }
        loginWin.webContents.session.cookies
          .get({ domain: '.jd.com' })
          .then((cookies) => {
            const cookieStr = cookies.reduce((str, cookie) => {
              const { name, value } = cookie
              str += `${name}=${value};`
              return str
            }, '')
            loginWin.destroy()
            this.$store.dispatch('user/saveAccount', cookieStr)
            this.$message.success('账号已添加！')
          })
          .catch(() => {
            this.$message.error('获取Cookie失败！')
          })
      })
    },
    clear() {
      this.$store.commit('user/CLEAR_ALL')
    },
    deleteAccount(record) {
      this.$store.commit('user/REMOVE', record.pinId)
    },
    configAccount(record) {
      this.$refs.config.show(record)
    }
  }
}
</script>
<style lang="less" scoped>
.actions {
  position: relative;
  padding: 0 8px;
  &:first-child {
    padding-left: 0;
  }
  &:not(:last-child) {
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 0;
      width: 1px;
      height: 14px;
      margin-top: -7px;
      background-color: #e8e8e8;
    }
  }
}
</style>
