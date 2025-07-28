import { createRouter, createWebHistory } from 'vue-router'
import SalesPage from '../views/SalesPage.vue'
import OrdersPage from '../views/OrdersPage.vue'
import StocksPage from '../views/StocksPage.vue'
import IncomesPage from '../views/IncomesPage.vue'

const routes = [
  { path: '/sales', component: SalesPage },
  { path: '/orders', component: OrdersPage },
  { path: '/stocks', component: StocksPage },
  { path: '/incomes', component: IncomesPage },
  { path: '/', redirect: '/sales' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
