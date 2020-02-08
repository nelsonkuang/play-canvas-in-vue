<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
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
import Path from '../../utils/classes/Path'
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Demo 1',
      path: new Path()
    }
  },
  mounted () {
    let canvas = this.$refs.canvas
    let ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#0000ff'
    const p = this.path
    p.beginPath(ctx)
    p.moveTo(150, 50)
    p.bezierCurveTo(160, 100, 200, 120, 250, 90)
    p.moveTo(150, 50)
    p.lineTo(160, 100)
    p.moveTo(250, 90)
    p.lineTo(200, 120)

    p.moveTo(155, 50)
    p.arc(150, 50, 5, 0, Math.PI * 2, false)
    p.moveTo(255, 90)
    p.arc(250, 90, 5, 0, Math.PI * 2, false)
    p.moveTo(165, 100)
    p.arc(160, 100, 5, 0, Math.PI * 2, false)
    p.moveTo(205, 120)
    p.arc(200, 120, 5, 0, Math.PI * 2, false)

    p.stroke(ctx)
    p.closePath()
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
