/*
* Quadratic Bézier curve 二次贝塞尔曲线效果，这里 p0，p1，p2
* reference from: https://www.zhihu.com/question/20192825/answer/26154120
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