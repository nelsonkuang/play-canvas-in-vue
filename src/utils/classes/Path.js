import * as curve from '../math/curve'
/**
 * 参照 SVG <path>
 * M = moveto(M X,Y)：将画笔移动到指定的坐标位置
 * L = lineto(L X,Y)：画直线到指定的坐标位置
 * H = horizontal lineto(H X)：画水平线到指定的X坐标位置
 * V = vertical lineto(V Y)：画垂直线到指定的Y坐标位置
 * C = curveto(C X1,Y1,X2,Y2,ENDX,ENDY)：三次贝赛曲线
 * S = smooth curveto(S X2,Y2,ENDX,ENDY)：平滑曲率
 * Q = quadratic Belzier curve(Q X,Y,ENDX,ENDY)：二次贝赛曲线
 * T = smooth quadratic Belzier curveto(T ENDX,ENDY)：映射
 * A = elliptical Arc(A RX,RY,XROTATION,FLAG1,FLAG2,X,Y)：弧线
 * Z = closepath()：关闭路径
 */
const CMD = {
  M: 1,
  L: 2,
  // H: xx, // to do
  // v: xx, // to do
  C: 3,
  // S: xx, // to do
  Q: 4,
  // T: xx, // to do
  A: 5,
  Z: 6,
  // Rect
  R: 7
}

const mathMin = Math.min
const mathMax = Math.max
const mathCos = Math.cos
const mathSin = Math.sin
const mathSqrt = Math.sqrt
const mathAbs = Math.abs

const hasFloat32Array = typeof Float32Array !== 'undefined'

let dpr = 1

// If in browser environment
if (typeof window !== 'undefined') {
  dpr = Math.max(window.devicePixelRatio || 1, 1)
}

class Path {
  constructor(cached) {
    this.cached = cached
    if (cached) {
      this._cachedData = []
    }
    this._ctx = null
    this._x0 = 0
    this._y0 = 0
    this._xi = 0
    this._yi = 0
    // Unit x, Unit y. Provide for avoiding drawing that too short line segment
    this._ux = 0
    this._uy = 0

    this._len = 0
    this._lineDash = null
    this._dashOffset = 0
    this._dashIdx = 0
    this._dashSum = 0
    this._prevCmd = null
  }
  getContext () {
    return this._ctx
  }
  /**
   * @readOnly
   */
  setScale (sx, sy, segmentIgnoreThreshold) {
    // Compat. Previously there is no segmentIgnoreThreshold.
    segmentIgnoreThreshold = segmentIgnoreThreshold || 0
    this._ux = mathAbs(segmentIgnoreThreshold / dpr / sx) || 0
    this._uy = mathAbs(segmentIgnoreThreshold / dpr / sy) || 0
  }
  /**
   * @param  {CanvasRenderingContext2D} ctx
   * @return {Path}
   */
  beginPath (ctx) {

    this._ctx = ctx

    ctx && ctx.beginPath()

    ctx && (this.dpr = ctx.dpr)

    // Reset
    if (this._saveData) {
      this._len = 0
    }

    if (this._lineDash) {
      this._lineDash = null

      this._dashOffset = 0
    }

    return this
  }
  /**
   * @param  {number} x
   * @param  {number} y
   * @return {module:zrender/core/PathProxy}
   */
  moveTo (x, y) {
    this.addData(CMD.M, x, y)
    this._ctx && this._ctx.moveTo(x, y)

    // x0, y0, xi, yi 是记录在 _dashedXXXXTo 方法中使用
    // xi, yi 记录当前点, x0, y0 在 closePath 的时候回到起始点。
    // 有可能在 beginPath 之后直接调用 lineTo，这时候 x0, y0 需要
    // 在 lineTo 方法中记录，这里先不考虑这种情况，dashed line 也只在 IE10- 中不支持
    this._x0 = x
    this._y0 = y

    this._xi = x
    this._yi = y

    return this
  }
  /**
 * @param  {number} x
 * @param  {number} y
 * @return {Path}
 */
  lineTo (x, y) {
    const exceedUnit = mathAbs(x - this._xi) > this._ux
      || mathAbs(y - this._yi) > this._uy
      // Force draw the first segment
      || this._len < 5

    this.addData(CMD.L, x, y)

    if (this._ctx && exceedUnit) {
      this._needsDash() ? this._dashedLineTo(x, y)
        : this._ctx.lineTo(x, y)
    }
    if (exceedUnit) {
      this._xi = x
      this._yi = y
    }

    return this
  }
  /**
   * @param  {number} x1
   * @param  {number} y1
   * @param  {number} x2
   * @param  {number} y2
   * @param  {number} x3
   * @param  {number} y3
   * @return {Path}
   */
  bezierCurveTo (x1, y1, x2, y2, x3, y3) {
    this.addData(CMD.C, x1, y1, x2, y2, x3, y3)
    if (this._ctx) {
      this._needsDash() ? this._dashedBezierTo(x1, y1, x2, y2, x3, y3)
        : this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3)
    }
    this._xi = x3
    this._yi = y3
    return this
  }
  /**
   * @param  {number} x1
   * @param  {number} y1
   * @param  {number} x2
   * @param  {number} y2
   * @return {Path}
   */
  quadraticCurveTo (x1, y1, x2, y2) {
    this.addData(CMD.Q, x1, y1, x2, y2)
    if (this._ctx) {
      this._needsDash() ? this._dashedQuadraticTo(x1, y1, x2, y2)
        : this._ctx.quadraticCurveTo(x1, y1, x2, y2)
    }
    this._xi = x2
    this._yi = y2
    return this
  }
  /**
   * @param  {number} cx
   * @param  {number} cy
   * @param  {number} r
   * @param  {number} startAngle
   * @param  {number} endAngle
   * @param  {boolean} anticlockwise
   * @return {Path}
   */
  arc (cx, cy, r, startAngle, endAngle, anticlockwise) {
    this.addData(
      CMD.A, cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1
    )
    this._ctx && this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise)

    this._xi = mathCos(endAngle) * r + cx
    this._yi = mathSin(endAngle) * r + cy
    return this
  }
  // TODO
  arcTo (x1, y1, x2, y2, radius) {
    if (this._ctx) {
      this._ctx.arcTo(x1, y1, x2, y2, radius)
    }
    return this
  }

  // TODO
  rect (x, y, w, h) {
    this._ctx && this._ctx.rect(x, y, w, h)
    this.addData(CMD.R, x, y, w, h)
    return this
  }
  /**
   * @return {Path}
   */
  closePath () {
    this.addData(CMD.Z)

    const ctx = this._ctx
    const x0 = this._x0
    const y0 = this._y0
    if (ctx) {
      this._needsDash() && this._dashedLineTo(x0, y0)
      ctx.closePath()
    }

    this._xi = x0
    this._yi = y0
    return this
  }
  /**
   * Context 从外部传入，因为有可能是 rebuildPath 完之后再 fill。
   * stroke 同样
   * @param {CanvasRenderingContext2D} ctx
   * @return {Path}
   */
  fill (ctx) {
    ctx && ctx.fill()
    this.toStatic()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @return {Path}
   */
  stroke (ctx) {
    ctx && ctx.stroke()
    this.toStatic()
  }

  /**
   * 必须在其它绘制命令前调用
   * Must be invoked before all other path drawing methods
   * @return {Path}
   */
  setLineDash (lineDash) {
    if (lineDash instanceof Array) {
      this._lineDash = lineDash

      this._dashIdx = 0

      let lineDashSum = 0
      for (let i = 0; i < lineDash.length; i++) {
        lineDashSum += lineDash[i]
      }
      this._dashSum = lineDashSum
    }
    return this
  }

  /**
   * 必须在其它绘制命令前调用
   * Must be invoked before all other path drawing methods
   * @return {Path}
   */
  setLineDashOffset (offset) {
    this._dashOffset = offset
    return this
  }

  /**
   *
   * @return {Number}
   */
  len () {
    return this._len
  }
  /**
  * 直接设置 Path 数据
  */
  setData (data) {

    const len = data.length

    if (!(this._cachedData && this._cachedData.length === len) && hasFloat32Array) {
      this._cachedData = new Float32Array(len)
    }

    for (let i = 0; i < len; i++) {
      this._cachedData[i] = data[i]
    }

    this._len = len
  }
  /**
   * 填充 Path 数据。
   * 尽量复用而不申明新的数组。大部分图形重绘的指令数据长度都是不变的。
   */
  addData (cmd) {
    if (!this.cached) {
      return
    }

    let data = this._cachedData
    if (this._len + arguments.length > data.length) {
      // 因为之前的数组已经转换成静态的 Float32Array
      // 所以不够用时需要扩展一个新的动态数组
      this._expandData()
      data = this._cachedData
    }
    for (let i = 0; i < arguments.length; i++) {
      data[this._len++] = arguments[i]
    }

    this._prevCmd = cmd
  }
  /**
   * 转成静态的 Float32Array 减少堆内存占用
   * Convert dynamic array to static Float32Array
   */
  toStatic () {
    let data = this._cachedData
    if (data instanceof Array) {
      data.length = this._len
      if (hasFloat32Array) {
        this._cachedData = new Float32Array(data)
      }
    }
  }
  _expandData () {
    // Only if data is Float32Array
    if (!(this._cachedData instanceof Array)) {
      let newData = []
      for (let i = 0; i < this._len; i++) {
        newData[i] = this._cachedData[i]
      }
      this._cachedData = newData
    }
  }
  /**
   * If needs js implemented dashed line
   * @return {boolean}
   * @private
   */
  _needsDash () {
    return this._lineDash
  }

  _dashedLineTo (x1, y1) {
    let dashSum = this._dashSum
    let offset = this._dashOffset
    let lineDash = this._lineDash
    const ctx = this._ctx

    let x0 = this._xi
    let y0 = this._yi
    let dx = x1 - x0
    let dy = y1 - y0
    let dist = mathSqrt(dx * dx + dy * dy)
    let x = x0
    let y = y0
    let dash
    let nDash = lineDash.length
    let idx
    dx /= dist
    dy /= dist

    if (offset < 0) {
      // Convert to positive offset
      offset = dashSum + offset
    }
    offset %= dashSum
    x -= offset * dx
    y -= offset * dy

    while ((dx > 0 && x <= x1) || (dx < 0 && x >= x1)
      || (dx === 0 && ((dy > 0 && y <= y1) || (dy < 0 && y >= y1)))) {
      idx = this._dashIdx
      dash = lineDash[idx]
      x += dx * dash
      y += dy * dash
      this._dashIdx = (idx + 1) % nDash
      // Skip positive offset
      if ((dx > 0 && x < x0) || (dx < 0 && x > x0) || (dy > 0 && y < y0) || (dy < 0 && y > y0)) {
        continue
      }
      ctx[idx % 2 ? 'moveTo' : 'lineTo'](
        dx >= 0 ? mathMin(x, x1) : mathMax(x, x1),
        dy >= 0 ? mathMin(y, y1) : mathMax(y, y1)
      )
    }
    // Offset for next lineTo
    dx = x - x1
    dy = y - y1
    this._dashOffset = -mathSqrt(dx * dx + dy * dy)
  }
  // Not accurate dashed line to
  _dashedBezierTo (x1, y1, x2, y2, x3, y3) {
    let dashSum = this._dashSum
    let offset = this._dashOffset
    let lineDash = this._lineDash
    let ctx = this._ctx

    let x0 = this._xi
    let y0 = this._yi
    let t
    let dx
    let dy
    let cubicAt = curve.cubicBezier
    let bezierLen = 0
    let idx = this._dashIdx
    let nDash = lineDash.length

    let x
    let y

    let tmpLen = 0

    if (offset < 0) {
      // Convert to positive offset
      offset = dashSum + offset
    }
    offset %= dashSum
    // Bezier approx length
    for (t = 0; t < 1; t += 0.1) {
      dx = cubicAt(x0, x1, x2, x3, t + 0.1)
        - cubicAt(x0, x1, x2, x3, t)
      dy = cubicAt(y0, y1, y2, y3, t + 0.1)
        - cubicAt(y0, y1, y2, y3, t)
      bezierLen += mathSqrt(dx * dx + dy * dy)
    }

    // Find idx after add offset
    for (; idx < nDash; idx++) {
      tmpLen += lineDash[idx]
      if (tmpLen > offset) {
        break
      }
    }
    t = (tmpLen - offset) / bezierLen

    while (t <= 1) {

      x = cubicAt(x0, x1, x2, x3, t)
      y = cubicAt(y0, y1, y2, y3, t)

      // Use line to approximate dashed bezier
      // Bad result if dash is long
      idx % 2 ? ctx.moveTo(x, y)
        : ctx.lineTo(x, y)

      t += lineDash[idx] / bezierLen

      idx = (idx + 1) % nDash
    }

    // Finish the last segment and calculate the new offset
    (idx % 2 !== 0) && ctx.lineTo(x3, y3)
    dx = x3 - x
    dy = y3 - y
    this._dashOffset = -mathSqrt(dx * dx + dy * dy)
  }
  _dashedQuadraticTo (x1, y1, x2, y2) {
    // Convert quadratic to cubic using degree elevation
    let x3 = x2
    let y3 = y2
    x2 = (x2 + 2 * x1) / 3
    y2 = (y2 + 2 * y1) / 3
    x1 = (this._xi + 2 * x1) / 3
    y1 = (this._yi + 2 * y1) / 3

    this._dashedBezierTo(x1, y1, x2, y2, x3, y3)
  }
}
export default Path