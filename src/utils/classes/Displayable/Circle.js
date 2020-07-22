import DisplayableObject from './Object'

class DisplayableCircle extends DisplayableObject {

  constructor({ fillStyle = '#ffffff', strokeStyle = '#000000', lineWidth = 1, x = 0, y = 0, radius = 10, zIndex = 0 }) {
    super(x, y, radius * 2, radius * 2, zIndex)
    this.fillStyle = fillStyle
    this.strokeStyle = strokeStyle
    this.lineWidth = lineWidth
    this.radius = radius
  }

  draw (ctx) {
    const { x, y, radius, fillStyle, strokeStyle, lineWidth } = this
    const m = this.getMatrix()
    ctx.save()
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
    ctx.fillStyle = fillStyle
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

export default DisplayableCircle