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
      title: 'canvas 上画点 / 线'
    }
  },
  {
    path: '/demo-2',
    name: 'Demo2',
    component: () => import('@/views/demo-2/index'),
    meta: {
      title: 'canvas 上画 x 轴'
    }
  }
]

const router = new VueRouter({
  routes
})

export default router
