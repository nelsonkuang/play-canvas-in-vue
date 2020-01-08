import * as vec2 from '../math/vector2'
import * as matrix from '../math/matrix'

const v2ApplyTransform = vec2.applyTransform
const mathMin = Math.min
const mathMax = Math.max

class BoundingRect {
  constructor(x, y, width, height) {
    if (width < 0) {
      x = x + width
      width = -width
    }
    if (height < 0) {
      y = y + height
      height = -height
    }
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  /**
   * @param {BoundingRect} other
   */
  union (other) {
    const x = mathMin(other.x, this.x)
    const y = mathMin(other.y, this.y)

    this.width = mathMax(
      other.x + other.width,
      this.x + this.width
    ) - x
    this.height = mathMax(
      other.y + other.height,
      this.y + this.height
    ) - y
    this.x = x
    this.y = y
  }

  /**
   * @param {Array.<number>} m
   * @methods
   */
  applyTransform (m) {
    if (!m) {
      return
    }
    let lt = []
    let rb = []
    let lb = []
    let rt = []
    lt[0] = lb[0] = this.x
    lt[1] = rt[1] = this.y
    rb[0] = rt[0] = this.x + this.width
    rb[1] = lb[1] = this.y + this.height

    lt = v2ApplyTransform(lt, m)
    rb = v2ApplyTransform(rb, m)
    lb = v2ApplyTransform(lb, m)
    rt = v2ApplyTransform(rt, m)

    this.x = mathMin(lt[0], rb[0], lb[0], rt[0])
    this.y = mathMin(lt[1], rb[1], lb[1], rt[1])
    const maxX = mathMax(lt[0], rb[0], lb[0], rt[0])
    const maxY = mathMax(lt[1], rb[1], lb[1], rt[1])
    this.width = maxX - this.x
    this.height = maxY - this.y
  }

  /**
   * Calculate matrix of transforming from self to target rect
   * @param  {BoundingRect} b
   * @return {Array.<number>}
   */
  calculateTransform (b) {
    const sx = b.width / this.width
    const sy = b.height / this.height

    let m = matrix.create()

    // 矩阵右乘
    m = matrix.translate(m, [-this.x, -this.y])
    m = matrix.scale(m, [sx, sy])
    m = matrix.translate(m, [this.x, this.y])

    return m
  }

  /**
   * @param {(BoundingRect|Object)} b
   * @return {boolean}
   */
  intersect (b) {
    if (!b) {
      return false
    }

    if (!(b instanceof BoundingRect)) {
      // Normalize negative width/height.
      b = BoundingRect.create(b)
    }

    const ax0 = this.x
    const ax1 = this.x + this.width
    const ay0 = this.y
    const ay1 = this.y + this.height

    const bx0 = b.x
    const bx1 = b.x + b.width
    const by0 = b.y
    const by1 = b.y + b.height

    return !(ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0)
  }

  contain (x, y) {
    return x >= this.x
      && x <= (this.x + this.width)
      && y >= this.y
      && y <= (this.y + this.height)
  }

  /**
   * @return {BoundingRect}
   */
  clone () {
    return new BoundingRect(this.x, this.y, this.width, this.height);
  }

  /**
   * Copy from another rect
   */
  copy (other) {
    this.x = other.x
    this.y = other.y
    this.width = other.width
    this.height = other.height
  }

  plain () {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }
}
/**
 * @param {Object|BoundingRect} rect
 * @param {number} rect.x
 * @param {number} rect.y
 * @param {number} rect.width
 * @param {number} rect.height
 * @return {BoundingRect}
 */
BoundingRect.create = function (rect) {
  return new BoundingRect(rect.x, rect.y, rect.width, rect.height)
}

export default BoundingRect