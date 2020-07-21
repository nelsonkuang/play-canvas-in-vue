<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" width="500" height="500"></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DraggableImage from '../../utils/classes/Draggable/Image'
import img from '../../assets/logo.png'
export default {
  data () {
    return {
      animationID: null
    }
  },
  computed: {
  },
  mounted () {
    const canvas = this.$refs.canvas
    const ctx = canvas.getContext('2d')
    const myImage = new DraggableImage(img, 150, 150, 200, 200)
    const update = () => {
      myImage.draw(ctx)
      this.animationID = requestAnimationFrame(update)
    }
    update()
  },
  beforeDestroy () {
    cancelAnimationFrame(this.animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
