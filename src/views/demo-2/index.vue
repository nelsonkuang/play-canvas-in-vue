<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas
        id="canvas"
        ref="canvas"
        class="canvas"
        width="500"
        height="500"
      ></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
export default {
  data () {
    return {
    }
  },
  mounted () {
    let canvas = this.$refs.canvas
    let ctx = canvas.getContext('2d')
    const padding = 50 // canvas 四周 padding
    ctx.strokeStyle = '#0000ff'
    // reference from: https://www.cnblogs.com/OrochiZ-/p/11647705.html
    const x0 = 0 + padding // 原点 x
    const y0 = canvas.height - padding // 原点 y
    const space = 50 // 定义刻度间隔
    const markWidth = 5 // 定义刻度长度
    // 绘制 x 轴
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(canvas.width - padding, y0)
    ctx.stroke()

    // 绘制 x 轴的刻度
    for (let x = x0 + space; x < canvas.width - padding; x += space) {
      ctx.beginPath()
      ctx.moveTo(x, y0)
      ctx.lineTo(x, y0 - markWidth)
      ctx.stroke()
    }

    // 绘制 y 轴
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0, 0 + padding)
    ctx.stroke()

    // 绘制 y 轴的刻度
    for (let y = y0 - space; y > padding; y -= space) {
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x0 + markWidth, y)
      ctx.stroke()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
