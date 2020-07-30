<template>
  <canvas id="canvas" ref="canvas" class="canvas" width="400" height="400"></canvas>
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
    const cWidth = window.innerWidth
    const cHeight = window.innerHeight
    canvas.setAttribute('width', `${cWidth}px`)
    canvas.setAttribute('height', `${cHeight}px`)
    const ctx = canvas.getContext('2d')
    const myRectParticleSystem = new RectParticleSystem(0, 0, 600, 400, { x: 0, y: 0, width: cWidth, height: cHeight })
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
  background-color: #000;
}
</style>
