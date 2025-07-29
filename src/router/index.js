import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('../views/SalesPage.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/OrdersPage.vue')
  },
  {
    path: '/stocks',
    name: 'Stocks',
    component: () => import('../views/StocksPage.vue')
  },
  {
    path: '/incomes',
    name: 'Incomes',
    component: () => import('../views/IncomesPage.vue')
  },
  {
    path: '/',
    redirect: '/sales'
  },
     {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
