<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" :class="{'hover' : hoverDisplayObject}" width="500" height="500"></canvas>
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
      },
      animationID: null
    }
  },
  computed: {
    displayObjects () {
      const { p0, p1, p2, p3, r } = this
      return {
        p0: {
          name: 'p0',
          x: p0[0] - r,
          y: p0[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 0
        },
        p1: {
          name: 'p1',
          x: p1[0] - r,
          y: p1[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 1
        },
        p2: {
          name: 'p2',
          x: p2[0] - r,
          y: p2[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 2
        },
        p3: {
          name: 'p3',
          x: p3[0] - r,
          y: p3[1] - r,
          width: 2 * r,
          height: 2 * r,
          zIndex: 3
        }
      }
    },
    hoverDisplayObject () {
      const { currentPos, displayObjects } = this
      const { p0, p1, p2, p3 } = displayObjects
      if (currentPos.x > p0.x && currentPos.x < p0.x + p0.width && currentPos.y > p0.y && currentPos.y < p0.y + p0.height) {
        return p0
      } else if (currentPos.x > p1.x && currentPos.x < p1.x + p1.width && currentPos.y > p1.y && currentPos.y < p1.y + p1.height) {
        return p1
      } else if (currentPos.x > p2.x && currentPos.x < p2.x + p2.width && currentPos.y > p2.y && currentPos.y < p2.y + p2.height) {
        return p2
      } else if (currentPos.x > p3.x && currentPos.x < p3.x + p3.width && currentPos.y > p3.y && currentPos.y < p3.y + p3.height) {
        return p3
      } else {
        return null
      }
    }
  },
  mounted () {
    this.canvas = this.$refs.canvas
    this.draw()
    this.bindEvents()
  },
  beforeDestroy () {
    cancelAnimationFrame(this.animationID)
  },
  methods: {
    draw () {
      const ctx = this.canvas.getContext('2d')
      const cWidth = Number(this.canvas.getAttribute('width'))
      const cHeight = Number(this.canvas.getAttribute('height'))
      ctx.clearRect(0, 0, cWidth, cHeight)
      ctx.strokeStyle = '#000000'
      const { p0, p1, p2, p3, r } = this
      const p = this.path
      p.beginPath(ctx)
      p.setLineDash([2, 2]) // 设置为虚线
      // 画线
      p.moveTo(p0[0], p0[1])
      p.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
      p.stroke(ctx)
      p.closePath()
      p.beginPath(ctx)
      p.setLineDash(null) // 设置为实线
      ctx.strokeStyle = '#cccccc'
      p.moveTo(p0[0], p0[1])
      p.lineTo(p1[0], p1[1])
      p.moveTo(p3[0], p3[1])
      p.lineTo(p2[0], p2[1])
      // 画点
      p.stroke(ctx)
      p.closePath()
      p.beginPath(ctx)
      ctx.strokeStyle = '#000000'
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
      // console.log(new Date())
      this.animationID = requestAnimationFrame(this.draw)
    },
    bindEvents () {
      const This = this
      const offset = getDomOffset(This.canvas)
      let isDraging = false
      let startPagePos = {
        pageX: 0,
        pageY: 0
      }
      This.canvas.onmousemove = function (event) {
        This.currentPos = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        This.$nextTick(() => {
          if (This.hoverDisplayObject && isDraging) {
            let p = [...This[This.hoverDisplayObject.name]]
            p[0] = p[0] + event.pageX - startPagePos.pageX
            p[1] = p[1] + event.pageY - startPagePos.pageY
            This[This.hoverDisplayObject.name] = p
          }
        })
      }
      This.canvas.onmousedown = function (event) {
        This.currentPos = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        This.$nextTick(() => {
          if (This.hoverDisplayObject) {
            isDraging = true
            startPagePos = {
              pageX: event.pageX,
              pageY: event.pageY
            }
          }
        })
      }
      This.canvas.onmouseup = function () {
        isDraging = false
        startPagePos = {
          pageX: 0,
          pageY: 0
        }
      }
      This.canvas.onmouseleave = function () {
        isDraging = false
        startPagePos = {
          pageX: 0,
          pageY: 0
        }
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
  cursor: move;
}
</style>
