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
  },
  {
    path: '/demo-9',
    name: 'Demo9',
    component: () => import('@/views/demo-9/index'),
    meta: {
      title: 'Webgl 教程 三维相机 + 3D 纹理的使用'
    }
  },
  {
    path: '/demo-10',
    name: 'Demo10',
    component: () => import('@/views/demo-10/index'),
    meta: {
      title: 'Webgl 教程 三维平行光源'
    }
  },
  {
    path: '/demo-11',
    name: 'Demo11',
    component: () => import('@/views/demo-11/index'),
    meta: {
      title: 'Webgl 教程 三维点光源'
    }
  },
  {
    path: '/demo-12',
    name: 'Demo12',
    component: () => import('@/views/demo-12/index'),
    meta: {
      title: 'Webgl 教程 三维聚光灯光源'
    }
  },
  {
    path: '/demo-13',
    name: 'Demo13',
    component: () => import('@/views/demo-13/index'),
    meta: {
      title: 'Webgl 教程 实现 drawImage 效果'
    }
  },
  {
    path: '/demo-14',
    name: 'Demo14',
    component: () => import('@/views/demo-14/index'),
    meta: {
      title: 'Webgl 教程 使用矩阵栈实现类似 ctx.save & ctx.store'
    }
  },
  {
    path: '/demo-15',
    name: 'Demo15',
    component: () => import('@/views/demo-15/index'),
    meta: {
      title: 'Webgl 教程 球坐标系构建球模型'
    }
  },
  {
    path: '/demo-16',
    name: 'Demo16',
    component: () => import('@/views/demo-16/index'),
    meta: {
      title: 'Webgl 教程 抽象与简化创建三角形的代码'
    }
  },
  {
    path: '/demo-17',
    name: 'Demo17',
    component: () => import('@/views/demo-17/index'),
    meta: {
      title: 'Webgl 教程 继续抽象与简化代码使用顶点索引'
    }
  },
  {
    path: '/demo-18',
    name: 'Demo18',
    component: () => import('@/views/demo-18/index'),
    meta: {
      title: 'Webgl 教程 使用文字作为纹理'
    }
  },
  {
    path: '/demo-19',
    name: 'Demo19',
    component: () => import('@/views/demo-19/index'),
    meta: {
      title: 'Webgl 教程 绘制多物体'
    }
  },
  {
    path: '/demo-20',
    name: 'Demo20',
    component: () => import('@/views/demo-20/index'),
    meta: {
      title: 'Webgl 教程 使用场景图制作简单太阳、地球、月亮'
    }
  }, 
  {
    path: '/demo-21',
    name: 'Demo21',
    component: () => import('@/views/demo-21/index'),
    meta: {
      title: 'Webgl 教程 简单方块人及关节'
    }
  }, 
  {
    path: '/demo-22',
    name: 'Demo22',
    component: () => import('@/views/demo-22/index'),
    meta: {
      title: 'Webgl 教程 使用文字作为纹理二 - 图片文字'
    }
  }, 
  {
    path: '/demo-23',
    name: 'Demo23',
    component: () => import('@/views/demo-23/index'),
    meta: {
      title: 'Webgl 教程 创建及使用纹理图集'
    }
  }, 
  {
    path: '/demo-24',
    name: 'Demo24',
    component: () => import('@/views/demo-24/index'),
    meta: {
      title: 'Webgl 教程 环境贴图（镜面反射）'
    }
  }, 
  {
    path: '/demo-25',
    name: 'Demo25',
    component: () => import('@/views/demo-25/index'),
    meta: {
      title: 'Webgl 教程 天空盒（盒子全景图）'
    }
  }, 
  {
    path: '/demo-26',
    name: 'Demo26',
    component: () => import('@/views/demo-26/index'),
    meta: {
      title: 'Webgl 教程 雾'
    }
  }, 
  {
    path: '/demo-27',
    name: 'Demo27',
    component: () => import('@/views/demo-27/index'),
    meta: {
      title: 'Webgl 教程 在纹理上宣染 3D 内容'
    }
  },
  {
    path: '/demo-28',
    name: 'Demo28',
    component: () => import('@/views/demo-28/index'),
    meta: {
      title: 'Webgl 教程 离屏渲染 1 像素近屏透视，实现点选物体'
    }
  },
  {
    path: '/demo-30',
    name: 'Demo30',
    component: () => import('@/views/demo-30/index'),
    meta: {
      title: 'Webgl 教程 加载 gltf 模型并渲染 Mesh 网格'
    }
  },
  {
    path: '/demo-29',
    name: 'Demo29',
    component: () => import('@/views/demo-29/index'),
    meta: {
      title: 'Webgl 教程 初步认识蒙皮、蒙皮网格'
    }
  },
  {
    path: '/demo-31',
    name: 'Demo31',
    component: () => import('@/views/demo-31/index'),
    meta: {
      title: 'Webgl 教程 平面/球面等 投影（像使用投影仪）'
    }
  },
  {
    path: '/demo-32',
    name: 'Demo32',
    component: () => import('@/views/demo-32/index'),
    meta: {
      title: 'Webgl 教程 点击光源阴影的实现'
    }
  },
  {
    path: '/demo-33',
    name: 'Demo33',
    component: () => import('@/views/demo-33/index'),
    meta: {
      title: 'Webgl 教程 平行光源阴影的实现'
    }
  },
  {
    path: '/demo-34',
    name: 'Demo34',
    component: () => import('@/views/demo-34/index'),
    meta: {
      title: 'Webgl 教程 环境贴图（镜面反射）II'
    }
  }, 
  {
    path: '/demo-35',
    name: 'Demo35',
    component: () => import('@/views/demo-35/index'),
    meta: {
      title: 'Webgl 教程 天空盒II'
    }
  }, 
  {
    path: '/demo-36',
    name: 'Demo36',
    component: () => import('@/views/demo-36/index'),
    meta: {
      title: 'Webgl 教程 球面贴图'
    }
  }, 
]

const router = new VueRouter({
  routes
})

export default router
