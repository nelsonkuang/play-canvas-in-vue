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
/*   {
    path: '/demo-3',
    name: 'Demo3',
    component: () => import('@/views/demo-3/index'),
    meta: {
      title: 'canvas 坐标轴上画网格'
    }
  },
  {
    path: '/demo-4',
    name: 'Demo4',
    component: () => import('@/views/demo-4/index'),
    meta: {
      title: 'canvas 坐标轴上画散点'
    }
  } */
]

const router = new VueRouter({
  routes
})

export default router
