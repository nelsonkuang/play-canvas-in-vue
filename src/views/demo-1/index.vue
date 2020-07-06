<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" :class="{'hover' : isHover}" width="500" height="500"></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Path from '../../utils/classes/Path'
import { getDomOffset } from '../../utils/tools'
export default {
  data () {
    return {
      canvas: null,
      path: new Path(),
      p0: [150, 50],
      p1: [160, 100],
      p2: [200, 120],
      p3: [250, 90],
      r: 5,
      currentPos: {
        x: 0,
        y: 0
      }
    }
  },
  computed: {
    displayObjects () {
      const { p0, p1, p2, p3, r } = this
      return {
        p0: {
          x: p0[0] - r,
          y: p0[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 0
        },
        p1: {
          x: p1[0] - r,
          y: p1[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 1
        },
        p2: {
          x: p2[0] - r,
          y: p2[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 2
        },
        p3: {
          x: p3[0] - r,
          y: p3[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 3
        }
      }
    },
    isHover () {
      const { currentPos, displayObjects } = this
      const { p0, p1, p2, p3 } = displayObjects
      return (currentPos.x > p0.x && currentPos.x < p0.x + p0.width && currentPos.y > p0.y && currentPos.y < p0.y + p0.height) ||
        (currentPos.x > p1.x && currentPos.x < p1.x + p1.width && currentPos.y > p1.y && currentPos.y < p1.y + p1.height) ||
        (currentPos.x > p2.x && currentPos.x < p2.x + p2.width && currentPos.y > p2.y && currentPos.y < p2.y + p2.height) ||
        (currentPos.x > p3.x && currentPos.x < p3.x + p3.width && currentPos.y > p3.y && currentPos.y < p3.y + p3.height)
    }
  },
  mounted () {
    this.canvas = this.$refs.canvas
    this.draw()
    this.bindEvents()
  },
  methods: {
    draw () {
      const ctx = this.canvas.getContext('2d')
      ctx.strokeStyle = '#0000ff'
      const { p0, p1, p2, p3, r } = this
      const p = this.path
      p.beginPath(ctx)
      // 画线
      p.moveTo(p0[0], p0[1])
      p.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
      p.moveTo(p0[0], p0[1])
      p.lineTo(p1[0], p1[1])
      p.moveTo(p3[0], p3[1])
      p.lineTo(p2[0], p2[1])
      // 画点
      p.moveTo(p0[0] + r, p0[1])
      p.arc(p0[0], p0[1], r, 0, Math.PI * 2, false)
      p.moveTo(p3[0] + r, p3[1])
      p.arc(p3[0], p3[1], r, 0, Math.PI * 2, false)
      p.moveTo(p1[0] + r, p1[1])
      p.arc(p1[0], p1[1], r, 0, Math.PI * 2, false)
      p.moveTo(p2[0] + r, p2[1])
      p.arc(p2[0], p2[1], r, 0, Math.PI * 2, false)

      p.stroke(ctx)
      p.closePath()
    },
    bindEvents () {
      var This = this;
      var offset = getDomOffset(This.canvas)
      This.canvas.onmousemove = function (event) {
        This.currentPos = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        // console.log(This.currentPos)
      }
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
.canvas.hover {
  cursor: pointer;
}
</style>
