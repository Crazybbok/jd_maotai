<template>
  <a-dropdown :trigger="['click']">
    <a class="ant-dropdown-link">更多<a-icon type="down" /> </a>
    <a-menu slot="overlay">
      <a-menu-item v-for="(item, key) in $slots.default" :key="key">
        <render-slot :vnode="item" />
      </a-menu-item>
    </a-menu>
  </a-dropdown>
</template>
<script>
import RenderSlot from './render'
export default {
  name: 'MoreActions',
  components: {
    RenderSlot
  }
}
</script>
<style lang="less">
.ant-dropdown-menu-item {
  padding: 0px;
  a {
    display: block;
    width: auto;
    padding: 5px 12px;
  }
}
</style>
