export default {
  name: 'RenderSlot',
  functional: true,
  props: {
    vnode: Object
  },
  render: (h, ctx) => {
    return h('div', [ctx.props.vnode])
  }
}
