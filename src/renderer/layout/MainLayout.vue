<template>
  <a-layout class="layout">
    <a-layout-header class="layout__header">
      <a-menu
        :selectedKeys="[currentMenu]"
        mode="horizontal"
        theme="dark"
        :style="{ lineHeight: '64px' }"
        @click="handleMenuClick"
      >
        <a-menu-item key="account">
          <a-icon type="user" :style="iconStyle" />
          <span>账号管理</span>
        </a-menu-item>
        <a-menu-item key="task">
          <a-icon type="menu" :style="iconStyle" />
          <span>任务管理</span>
        </a-menu-item>
        <a-menu-item key="setting">
          <a-icon type="setting" :style="iconStyle" />
          <span>系统配置</span>
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content class="pd-30">
      <div class="layout__main">
        <keep-alive>
          <router-view />
        </keep-alive>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script>
export default {
  name: 'Main',
  computed: {
    currentMenu() {
      return this.$route.name
    },
    iconStyle() {
      return {
        fontSize: '16px'
      }
    }
  },
  methods: {
    handleMenuClick({ key }) {
      this.$router.push({ name: key })
    }
  }
}
</script>
<style lang="less" scoped>
.scroll(@width: 7px) {
  overflow: auto;
  &::-webkit-scrollbar {
    width: @width;
    height: @width;
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(255, 255, 255, 0.6);
  }
  &::-webkit-scrollbar-thumb {
    border-radius: @width;
    background-color: rgba(0, 0, 0, 0.2);
  }
}
.layout {
  width: 100%;
  height: 100%;

  &__main {
    background: #fff;
    padding: 15px;
    width: 100%;
    height: 100%;
    overflow: auto;
    .scroll();
  }
}
</style>
