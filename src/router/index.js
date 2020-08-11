import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/index'),
    meta: {
      title: '主页'
    }
  },
  {
    path: '/demo-3',
    name: 'Demo3',
    component: () => import('@/views/demo-3/index'),
    meta: {
      title: 'Canvas 简单图片编辑'
    }
  },
  {
    path: '/demo-4',
    name: 'Demo4',
    component: () => import('@/views/demo-4/index'),
    meta: {
      title: 'Canvas 简单矩形粒子系统'
    }
  },
  {
    path: '/demo-1',
    name: 'Demo1',
    component: () => import('@/views/demo-1/index'),
    meta: {
      title: 'Canvas 可控贝塞尔曲线（Cubic Bézier Curves）'
    }
  },
  {
    path: '/demo-1-dash',
    name: 'Demo1Dash',
    component: () => import('@/views/demo-1/dash'),
    meta: {
      title: 'Canvas 可控贝塞尔曲线（Cubic Bézier Curves） - 虚线'
    }
  },
  {
    path: '/demo-2',
    name: 'Demo2',
    component: () => import('@/views/demo-2/index'),
    meta: {
      title: 'Canvas 坐标轴上画网格'
    }
  },
  {
    path: '/demo-5',
    name: 'Demo5',
    component: () => import('@/views/demo-5/index'),
    meta: {
      title: 'Webgl 教程 绘出一个绿色的长方形来填充整个画板'
    }
  },
  {
    path: '/demo-6',
    name: 'Demo6',
    component: () => import('@/views/demo-6/index'),
    meta: {
      title: 'Webgl 教程 绘画 50 个尺寸和颜色均随机的矩阵'
    }
  },
  {
    path: '/demo-7',
    name: 'Demo7',
    component: () => import('@/views/demo-7/index'),
    meta: {
      title: 'Webgl 教程 可用鼠标操控的 3D 立方体'
    }
  },
  {
    path: '/demo-8',
    name: 'Demo8',
    component: () => import('@/views/demo-8/index'),
    meta: {
      title: 'Webgl 教程 三维相机'
    }
  }
]

const router = new VueRouter({
  routes
})

export default router
