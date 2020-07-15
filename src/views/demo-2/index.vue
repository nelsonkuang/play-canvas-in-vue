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
import Axis from '../../utils/classes/Axis'
export default {
  data () {
    return {
    }
  },
  mounted () {
    let canvas = this.$refs.canvas
    let ctx = canvas.getContext('2d')
    const padding = 50 // canvas 四周 padding
    const strokeStyle = '#0000ff'
    const xGap = (canvas.width - 2 * padding) / 10 // 定义 x 轴刻度间隔
    const yGap = (canvas.height - 2 * padding) / 10 // 定义 y 轴刻度间隔
    const markWidth = 5 // 定义刻度长度
    const axis = new Axis(canvas, ctx, padding, xGap, yGap, markWidth, strokeStyle) // 坐标轴
    axis.init()
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
