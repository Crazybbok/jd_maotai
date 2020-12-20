<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
  methods: {
    attachEvents() {
      global.vbus.$on('global.$message.error', (msg) => {
        this.$message.error({
          content: msg,
          duration: 3
        })
      })
      global.vbus.$on('global.$message.success', (msg) => {
        this.$message.success(msg)
      })
      global.vbus.$on('global.$message.info', (msg) => {
        this.$message.info(msg)
      })
      global.vbus.$on('global.$message.destroy', () => {
        this.$message.destroy()
      })
      global.vbus.$on('global.$notification.open', (opt) => {
        this.$notification.open({
          ...opt,
          placement: 'bottomRight'
        })
      })
    }
  },
  created() {
    this.attachEvents()
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
  height: 100%;
}

#app {
  background: radial-gradient(ellipse at center, rgba(229, 229, 229, 1) 40%, rgba(200, 200, 200, 0.9) 100%);
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}
</style>
