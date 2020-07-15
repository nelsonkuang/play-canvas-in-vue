// 曲线辅助模块
// https://github.com/ecomfe/zrender/blob/master/src/core/curve.js
// https://www.zhihu.com/question/20192825/answer/26154120
// http://pomax.github.io/bezierinfo/#projections

import {
  create as v2Create,
  distanceSquare as v2DistSquare
} from './vector2'

const mathPow = Math.pow
const mathSqrt = Math.sqrt
const mathSin = Math.sin
const mathAcos = Math.acos
const EPSILON = 1e-8
const EPSILON_NUMERIC = 1e-4

const THREE_SQRT = mathSqrt(3)
const ONE_THIRD = 1 / 3

/*
* Quadratic Bézier curve 二次贝塞尔曲线效果，这里 p0，p1，p2
* @param  {number} p0
* @param  {number} p1
* @param  {number} p2
* @param  {number} t
* @return {number}
*/
export function quadraticBezier (p0, p1, p2, t) {
  // B(t)=(1-t)²P0+2t(1-t)P1+t²P2，t∈[0,1]
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2
}
/**
 * Quadratic Bézier Derivative 计算二次贝塞尔导数值，动画中可以表示当前对象运动的速度
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} t
 * @return {number}
 */
export function quadraticBezierDerivativeAt (p0, p1, p2, t) {
  // y`=2((1-t)(P1-P0)+t(P2-P1))，t∈[0,1]
  return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1))
}
/**
 * 要让二次贝塞尔曲线过Pt点，则控制点Pc应为 Pc=2Pt-(P0+P2)/2
 * @param {number} pt 
 * @param {number} p0 
 * @param {number} p2 
 * @return {number}
 */
export function quadraticBezierControlPointAt (pt, p0, p2) {
  // Pc=2Pt-(P0+P2)/2
  return 2 * pt - (p0 + p2) / 2
}

export function isAroundZero (val) {
  return val > -EPSILON && val < EPSILON
}
export function isNotAroundZero (val) {
  return val > EPSILON || val < -EPSILON
}

/**
 * 计算二次方贝塞尔方程根
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} t
 * @return {Array.<number>} 有效根
 */
export function quadraticRootAt (p0, p1, p2, val) {
  let roots = []
  const a = p0 - 2 * p1 + p2
  const b = 2 * (p1 - p0)
  const c = p0 - val

  let n = 0
  if (isAroundZero(a)) {
    if (isNotAroundZero(b)) {
      let t1 = -c / b
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
  }
  else {
    let disc = b * b - 4 * a * c;
    if (isAroundZero(disc)) {
      let t1 = -b / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
    else if (disc > 0) {
      let discSqrt = mathSqrt(disc)
      let t1 = (-b + discSqrt) / (2 * a)
      let t2 = (-b - discSqrt) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2
      }
    }
  }
  return roots
}

/**
 * 计算二次贝塞尔方程极限值
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @return {number}
 */
export function quadraticExtremum (p0, p1, p2) {
  const divider = p0 + p2 - 2 * p1
  if (divider === 0) {
    // p1 is center of p0 and p2
    return 0.5
  }
  else {
    return (p0 - p1) / divider
  }
}

/**
 * 细分二次贝塞尔曲线
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} t
 * @return  {Array.<number>}
 */
export function quadraticSubdivide (p0, p1, p2, t) {
  let roots = []
  let p01 = (p1 - p0) * t + p0
  let p12 = (p2 - p1) * t + p1
  let p012 = (p12 - p01) * t + p01

  // Seg0
  roots[0] = p0
  roots[1] = p01
  roots[2] = p012

  // Seg1
  roots[3] = p012
  roots[4] = p12
  roots[5] = p2

  return roots
}
/**
 * 投射点到二次贝塞尔曲线上，返回投射距离。
 * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x
 * @param {number} y
 * @param {Array.<number>} out 投射点
 * @return {number}
 */
export function quadraticProjectPoint (
  x0, y0, x1, y1, x2, y2,
  x, y, out
) {
  // http://pomax.github.io/bezierinfo/#projections
  let t
  let interval = 0.005
  let d = Infinity

  let _v0 = v2Create()
  let _v1 = v2Create()
  let _v2 = v2Create()

  _v0[0] = x
  _v0[1] = y

  // 先粗略估计一下可能的最小距离的 t 值
  // PENDING
  for (let _t = 0; _t < 1; _t += 0.05) {
    _v1[0] = quadraticBezier(x0, x1, x2, _t)
    _v1[1] = quadraticBezier(y0, y1, y2, _t)
    let d1 = v2DistSquare(_v0, _v1)
    if (d1 < d) {
      t = _t
      d = d1
    }
  }
  d = Infinity;

  // At most 32 iteration
  for (let i = 0; i < 32; i++) {
    if (interval < EPSILON_NUMERIC) {
      break
    }
    let prev = t - interval
    let next = t + interval
    // t - interval
    _v1[0] = quadraticBezier(x0, x1, x2, prev)
    _v1[1] = quadraticBezier(y0, y1, y2, prev)

    let d1 = v2DistSquare(_v1, _v0)

    if (prev >= 0 && d1 < d) {
      t = prev
      d = d1
    }
    else {
      // t + interval
      _v2[0] = quadraticBezier(x0, x1, x2, next)
      _v2[1] = quadraticBezier(y0, y1, y2, next)
      let d2 = v2DistSquare(_v2, _v0)
      if (next <= 1 && d2 < d) {
        t = next
        d = d2
      }
      else {
        interval *= 0.5
      }
    }
  }
  // t
  if (out) {
    out[0] = quadraticBezier(x0, x1, x2, t)
    out[1] = quadraticBezier(y0, y1, y2, t)
  }
  // console.log(interval, i)
  return mathSqrt(d)
}
/*
* Cubic Bézier curve 三次贝塞尔曲线效果，这里 p0，p1，p2，p3
* reference from: https://www.zhihu.com/question/20192825/answer/26154120
* @param  {number} p0
* @param  {number} p1
* @param  {number} p2
* @param  {number} p3
* @param  {number} t
* @return {number}
*/
export function cubicBezier (p0, p1, p2, p3, t) {
  // B(t) = (1 - t)³ x p0 + 3 x (1 - t)² x t x p1 + 3 x (1 - t) x t² x p2 + t³ x p3，t∈[0,1]
  return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
}
/**
 * Cubic Bézier Derivative 计算三次贝塞尔导数值，动画中可以表示当前对象运动的速度
* @param  {number} p0
* @param  {number} p1
* @param  {number} p2
* @param  {number} p3
* @param  {number} t
* @return {number}
 */
export function cubicBezierDerivativeAt (p0, p1, p2, p3, t) {
  // y`=3(((1-t)(P1-P0)+2(P2-P1)t)(1-t)+(P3-P2)t²)，t∈[0,1]
  return 3 * (
    ((p1 - p0) * (1 - t) + 2 * (p2 - p1) * t) * (1 - t)
    + (p3 - p2) * t * t
  )
}

/**
 * 计算三次贝塞尔方程根，使用盛金公式
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} p3
 * @param  {number} val
 * @param  {Array.<number>} roots
 * @return {number} 有效根数目
 */
export function cubicRootAt (p0, p1, p2, p3, val, roots) {
  // Evaluate roots of cubic functions
  const a = p3 + 3 * (p1 - p2) - p0
  const b = 3 * (p2 - p1 * 2 + p0)
  const c = 3 * (p1 - p0)
  const d = p0 - val

  const A = b * b - 3 * a * c
  const B = b * c - 9 * a * d
  const C = c * c - 3 * b * d

  let n = 0

  if (isAroundZero(A) && isAroundZero(B)) {
    if (isAroundZero(b)) {
      roots[0] = 0
    }
    else {
      let t1 = -c / b;  //t1, t2, t3, b is not zero
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
  }
  else {
    let disc = B * B - 4 * A * C

    if (isAroundZero(disc)) {
      let K = B / A
      let t1 = -b / a + K  // t1, a is not zero
      let t2 = -K / 2  // t2, t3
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2
      }
    }
    else if (disc > 0) {
      let discSqrt = mathSqrt(disc);
      let Y1 = A * b + 1.5 * a * (-B + discSqrt)
      let Y2 = A * b + 1.5 * a * (-B - discSqrt)
      if (Y1 < 0) {
        Y1 = -mathPow(-Y1, ONE_THIRD)
      }
      else {
        Y1 = mathPow(Y1, ONE_THIRD)
      }
      if (Y2 < 0) {
        Y2 = -mathPow(-Y2, ONE_THIRD)
      }
      else {
        Y2 = mathPow(Y2, ONE_THIRD)
      }
      let t1 = (-b - (Y1 + Y2)) / (3 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
    else {
      let T = (2 * A * b - 3 * a * B) / (2 * mathSqrt(A * A * A))
      let theta = mathAcos(T) / 3
      let ASqrt = mathSqrt(A)
      let tmp = Math.cos(theta)

      let t1 = (-b - 2 * ASqrt * tmp) / (3 * a)
      let t2 = (-b + ASqrt * (tmp + THREE_SQRT * mathSin(theta))) / (3 * a)
      let t3 = (-b + ASqrt * (tmp - THREE_SQRT * mathSin(theta))) / (3 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2
      }
      if (t3 >= 0 && t3 <= 1) {
        roots[n++] = t3
      }
    }
  }
  return n
}
/**
 * 计算三次贝塞尔方程极限值的位置
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} p3
 * @param  {Array.<number>} extrema
 * @return {number} 有效数目
 */
export function cubicExtrema (p0, p1, p2, p3, extrema) {
  const b = 6 * p2 - 12 * p1 + 6 * p0
  const a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2
  const c = 3 * p1 - 3 * p0

  let n = 0
  if (isAroundZero(a)) {
    if (isNotAroundZero(b)) {
      let t1 = -c / b
      if (t1 >= 0 && t1 <= 1) {
        extrema[n++] = t1
      }
    }
  }
  else {
    let disc = b * b - 4 * a * c
    if (isAroundZero(disc)) {
      extrema[0] = -b / (2 * a)
    }
    else if (disc > 0) {
      let discSqrt = mathSqrt(disc);
      let t1 = (-b + discSqrt) / (2 * a)
      let t2 = (-b - discSqrt) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        extrema[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        extrema[n++] = t2
      }
    }
  }
  return n
}
/**
 * 细分三次贝塞尔曲线
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @param  {number} p3
 * @param  {number} t
 * @param  {Array.<number>}
 */
export function cubicSubdivide (p0, p1, p2, p3, t) {
  let out = []
  const p01 = (p1 - p0) * t + p0
  const p12 = (p2 - p1) * t + p1
  const p23 = (p3 - p2) * t + p2

  const p012 = (p12 - p01) * t + p01
  const p123 = (p23 - p12) * t + p12

  const p0123 = (p123 - p012) * t + p012
  // Seg0
  out[0] = p0
  out[1] = p01
  out[2] = p012
  out[3] = p0123
  // Seg1
  out[4] = p0123
  out[5] = p123
  out[6] = p23
  out[7] = p3
  return out
}
/**
 * 投射点到三次贝塞尔曲线上，返回投射距离。
 * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} x
 * @param {number} y
 * @param {Array.<number>} [out] 投射点
 * @return {number}
 */
export function cubicProjectPoint (
  x0, y0, x1, y1, x2, y2, x3, y3,
  x, y, out
) {
  // http://pomax.github.io/bezierinfo/#projections
  let t
  let interval = 0.005
  let d = Infinity
  let prev
  let next
  let d1
  let d2

  let _v0 = v2Create()
  let _v1 = v2Create()
  let _v2 = v2Create()

  _v0[0] = x
  _v0[1] = y

  // 先粗略估计一下可能的最小距离的 t 值
  // PENDING
  for (let _t = 0; _t < 1; _t += 0.05) {
    _v1[0] = cubicBezier(x0, x1, x2, x3, _t)
    _v1[1] = cubicBezier(y0, y1, y2, y3, _t)
    d1 = v2DistSquare(_v0, _v1)
    if (d1 < d) {
      t = _t
      d = d1
    }
  }
  d = Infinity

  // At most 32 iteration
  for (let i = 0; i < 32; i++) {
    if (interval < EPSILON_NUMERIC) {
      break
    }
    prev = t - interval
    next = t + interval
    // t - interval
    _v1[0] = cubicBezier(x0, x1, x2, x3, prev)
    _v1[1] = cubicBezier(y0, y1, y2, y3, prev)

    d1 = v2DistSquare(_v1, _v0)

    if (prev >= 0 && d1 < d) {
      t = prev
      d = d1
    }
    else {
      // t + interval
      _v2[0] = cubicBezier(x0, x1, x2, x3, next)
      _v2[1] = cubicBezier(y0, y1, y2, y3, next)
      d2 = v2DistSquare(_v2, _v0)

      if (next <= 1 && d2 < d) {
        t = next
        d = d2
      }
      else {
        interval *= 0.5
      }
    }
  }
  // t
  if (out) {
    out[0] = cubicBezier(x0, x1, x2, x3, t)
    out[1] = cubicBezier(y0, y1, y2, y3, t)
  }
  // console.log(interval, i)
  return mathSqrt(d)
}