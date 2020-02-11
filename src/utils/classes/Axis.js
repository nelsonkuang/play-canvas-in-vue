class Axis {
  constructor(canvas, ctx, padding, gap, markWidth, strokeStyle) {
    this.canvas = canvas
    this.ctx = ctx || canvas.getContext('2d')
    this.padding = padding
    this.x0 = 0 + padding // 原点 x
    this.y0 = canvas.height - padding // 原点 y
    this.gap = gap // 定义刻度间隔
    this.markWidth = markWidth // 定义刻度长度
    this.strokeStyle = strokeStyle // 线的样式
  }
  init () {
    this.ctx.strokeStyle = this.strokeStyle // 线的样式
    this.drawGrid() // 绘制网格
    this.drawXAxis() // 绘制 x 轴
    this.drawYAxis() // 绘制 y 轴
  }
  drawXAxis () {
    const { canvas, ctx, padding, x0, y0, gap, markWidth } = this
    // 绘制 x 轴
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(canvas.width - padding, y0)
    ctx.stroke()
    // 绘制 x 轴的刻度
    for (let x = x0 + gap; x < canvas.width - padding; x += gap) {
      ctx.beginPath()
      ctx.moveTo(x, y0)
      ctx.lineTo(x, y0 - markWidth)
      ctx.stroke()
    }
  }
  drawYAxis () {
    const { ctx, padding, x0, y0, gap, markWidth } = this
    // 绘制 y 轴
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0, 0 + padding)
    ctx.stroke()

    // 绘制 y 轴的刻度
    for (let y = y0 - gap; y > padding; y -= gap) {
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x0 + markWidth, y)
      ctx.stroke()
    }
  }
  drawGrid () {
    const { canvas, ctx, padding, x0, y0, gap } = this
    ctx.save()
    // 设置虚线
    ctx.setLineDash([5, 10])
    // 绘制水平方向的网格线
    for (let y = y0 - padding; y >= padding; y -= gap) {
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }
    // 绘制垂直方向的网格线
    for (let x = x0 + padding; x <= canvas.width - padding; x += gap) {
      ctx.beginPath()
      ctx.moveTo(x, y0)
      ctx.lineTo(x, padding)
      ctx.stroke()
    }
    ctx.restore()
  }
}
export default Axis
