export function linear (t) {
  return t // y = x
}
export function easeInSine (t) {
  return Math.sin((Math.PI / 2) * (t - 1)) + 1 // y = sin(π/2 (x - 1)) + 1
}
export function easeOutSine (t) {
  return Math.sin((Math.PI / 2) * t) // y = sin(π/2 * x)
}
export function easeInOutSine (t) {
  return 0.5 * Math.sin(Math.PI * (t - 0.5)) + 0.5 // y = 0.5sin(πx - π/2) + 0.5
}
export function easeInQuad (t) {
  return t * t // y = x²
}
export function easeOutQuad (t) {
  return -1 * Math.pow(t - 1, 2) + 1 // y = -(x-1)² + 1 
}
export function easeInOutQuad (t) {
  if (t < 0.5) {
    return 2 * t * t // y = 2x² 
  }
  return -2 * Math.pow(t - 1, 2) + 1 // y = -2(x-1)²+1 
}
export function easeInCubic (t) {
  return t * t * t // y = x³
}
export function easeOutCubic (t) {
  return Math.pow(t - 1, 3) + 1 // y = (x-1)³+1
}
export function easeInOutCubic (t) {
  if (t < 0.5) {
    return 4 * t * t * t  // y = 4x³
  }
  return 4 * Math.pow(t - 1, 3) + 1 // y = 4(x-1)³ + 1
}
export function easeInQuart (t) {
  return t * t * t * t // y = x⁴
}
export function easeOutQuart (t) {
  return -1 * Math.pow(t - 1, 4) + 1 // y = -(x-1)⁴+1
}
export function easeInOutQuart (t) {
  if (t < 0.5) {
    return 8 * t * t * t * t  // y = 8x⁴
  }
  return -8 * Math.pow(t - 1, 4) + 1 // y = -8(x-1)⁴+1
}
export function easeInQuint (t) {
  return t * t * t * t * t // y = x⁵
}
export function easeOutQuint (t) {
  return Math.pow(t - 1, 5) + 1 // y = (x-1)⁵ + 1
}
export function easeInOutQuint (t) {
  if (t < 0.5) {
    return 16 * t * t * t * t * t  // y = 16x⁵
  }
  return 16 * Math.pow(t - 1, 5) + 1 // y = 16(x-1)⁵ + 1
}
export function easeInExpo (t) {
  return t === 0 ? 0 : Math.pow(1024, t - 1) // y = 1024^(x-1), 数字1024 reference from: https://github.com/tweenjs/tween.js/blob/master/src/Tween.js
}
export function easeOutExpo (t) {
  return t === 1 ? 1 : -1 * Math.pow(1024, -1 * t) + 1 // y = -1024^(-x) + 1
}
export function easeInOutExpo (t) {
  if (t < 0.5) {
    return t === 0 ? 0 : 0.5 * Math.pow(1024, 2 * t - 1)  // y = 0.5 * 1024^(2x-1)
  }
  return t === 1 ? 1 : -0.5 * Math.pow(1024, -2 * t + 1) + 1 // y = -0.5 * 1024^(-2x+1) + 1
}
export function easeInCirc (t) {
  return -1 * Math.pow(1 - t * t, 0.5) + 1 // y = -(1-x²)^0.5 + 1
}
export function easeOutCirc (t) {
  return Math.pow(1 - (t - 1) * (t - 1), 0.5) // y = (1-(x-1)²)^0.5
}
export function easeInOutCirc (t) {
  if (t < 0.5) {
    return -1 * Math.pow(0.25 - t * t, 0.5) + 0.5  // y = -(0.25-x²)^0.5 + 0.5
  }
  return Math.pow(0.25 - (t - 1) * (t - 1), 0.5) + 0.5 // y = (0.25-(x-1)²)^0.5 + 0.5
}
export function easeInBack (t) {
  const s = 1.70158 // 把弓往后拉开10%, 即overshoot = 1.70158 reference from: https://github.com/tweenjs/tween.js/blob/master/src/Tween.js, s值可以自由调整
  return (s + 1) * t * t * t - s * t * t // y = (s+1)x³-sx²
}
export function easeOutBack (t) {
  const s = 1.70158
  return (s + 1) * Math.pow((t - 1), 3) + s * Math.pow((t - 1), 2) + 1 // y = (s+1)(x-1)³ + s(x-1)² + 1
}
export function easeInOutBack (t) {
  const s = 1.70158 * 1.525 // 把弓往后拉开10%, 即overshoot = 1.70158 reference from: https://github.com/tweenjs/tween.js/blob/master/src/Tween.js, s值可以自由调整
  if (t < 0.5) {
    return 0.5 * ((s + 1) * Math.pow(2 * t, 3) - s * Math.pow(2 * t, 2))
  }
  return 0.5 * ((s + 1) * Math.pow((2 * t - 2), 3) + s * Math.pow((2 * t - 2), 2) + 1) + 0.5
}
export function easeInElastic (t) {
  // reference from: https://github.com/tweenjs/tween.js/blob/master/src/Tween.js
  if (t === 0) {
    return 0
  }
  if (t === 1) {
    return 1
  }
  const a = 2 // 越大波幅越大
  const b = 10 // 越小震感越强烈
  const c = 5 // 运动两个半左右周期
  return -1 * Math.pow(a, b * (t - 1)) * Math.sin((t - 1.1) * c * Math.PI) // y = -2^(10(x-1))*sin((x - 1.1) * 5 * π)
}
export function easeOutElastic (t) {
  if (t === 0) {
    return 0
  }
  if (t === 1) {
    return 1
  }
  const a = 2 // 越大波幅越大
  const b = 10 // 越小震感越强烈
  const c = 5 // 运动两个半左右周期
  return Math.pow(a, -1 * b * t) * Math.sin((-1 * t - 2.1) * c * Math.PI) + 1 // y = 2^(-10x)*sin((-x-2.1) * 5 * π) + 1
}
export function easeInOutElastic (t) {
  if (t === 0) {
    return 0
  }
  if (t === 0.5) {
    return 0.5
  }
  if (t === 1) {
    return 1
  }

  const a = 2 // 越大波幅越大
  const b = 10 // 越小震感越强烈
  const c = 5 // 运动两个半左右周期

  if (t < 0.5) {
    return -0.5 * Math.pow(a, 2 * b * (t - 1 + 0.5)) * Math.sin(2 * (t - 1.1 + 0.5) * c * Math.PI) // y =  0.5(-2^(20(x-0.5))*sin(2(x - 0.6) * 5 * π))
  }

  return Math.pow(a, -2 * b * (t - 0.5)) * Math.sin((-2 * (t - 0.5) - 4.1) * c * Math.PI) + 1 // y = 2^(-20(x-0.5))*sin((-2(x-0.5)-4.1) * 5 * π) + 1
}
/*
* Bounce 反弹效果
* reference from: https://github.com/tweenjs/tween.js/blob/master/src/Tween.js
*/
export function easeInBounce (t) {
  return 1 - easeOutBounce(1 - t)
}
export function easeOutBounce (t) {
  if (t < (1 / 2.75)) {
    return 7.5625 * t * t
  } else if (t < (2 / 2.75)) {
    return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75
  } else if (t < (2.5 / 2.75)) {
    return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375
  } else {
    return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375
  }
}
export function easeInOutBounce (t) {
  if (t < 0.5) {
    return easeInBounce(t * 2) * 0.5
  }

  return easeOutBounce(t * 2 - 1) * 0.5 + 0.5
}