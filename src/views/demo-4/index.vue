<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" width="400" height="400"></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import RectParticleSystem from '../../utils/classes/ParticleSystem/Rect'
let animationID = null
export default {
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    const canvas = this.$refs.canvas
    const cWidth = Number(canvas.getAttribute('width'))
    const cHeight = Number(canvas.getAttribute('height'))
    const ctx = canvas.getContext('2d')
    const myRectParticleSystem = new RectParticleSystem(0, 0, 300, 300, { x: 0, y: 0, width: 400, height: 400 })
    const update = () => {
      ctx.clearRect(0, 0, cWidth, cHeight)
      myRectParticleSystem.update()
      myRectParticleSystem.draw(ctx)
      animationID = requestAnimationFrame(update)
    }
    update()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  border: 1px dashed #ddd;
  display: block;
  margin: 0 auto;
  background-color: #000;
}
</style>
