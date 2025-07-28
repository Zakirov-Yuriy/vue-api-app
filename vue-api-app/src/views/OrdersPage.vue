<template>
  <div>
    <h1>Заказы</h1>

    <!-- Фильтры -->
    <div class="filters">
      <label>Дата от: <input type="date" v-model="dateFrom" /></label>
      <label>Дата до: <input type="date" v-model="dateTo" /></label>
      <label>
        Область:
        <select v-model="selectedRegion">
          <option value="">Все</option>
          <option v-for="r in uniqueRegions" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label>
        Склад:
        <select v-model="selectedWarehouse">
          <option value="">Все</option>
          <option v-for="w in uniqueWarehouses" :key="w" :value="w">{{ w }}</option>
        </select>
      </label>
    </div>

    <!-- Загрузка и ошибка -->
    <div v-if="loading">Загрузка данных...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Таблица -->
    <table v-if="paginatedOrders.length" border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Артикул</th>
          <th>Сумма</th>
          <th>Скидка %</th>
          <th>Область</th>
          <th>Склад</th>
          <th>Отменён</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in paginatedOrders" :key="order.g_number + order.date">
          <td>{{ order.date }}</td>
          <td>{{ order.supplier_article }}</td>
          <td>{{ Number(order.total_price).toFixed(2) }}</td>
          <td>{{ order.discount_percent }}%</td>
          <td>{{ order.oblast }}</td>
          <td>{{ order.warehouse_name }}</td>
          <td>{{ order.is_cancel ? 'Да' : 'Нет' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">←</button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">→</button>
    </div>

    <!-- Комбинированный график -->
    <div v-if="statsByDate.length" class="chart-container">
      <h2>Заказы по датам</h2>
      <CombinedChart :statsByDate="statsByDate" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import CombinedChart from '../components/CombinedChart.vue'

const orders = ref([])
const loading = ref(false)
const error = ref(null)

const dateFrom = ref('')
const dateTo = ref('')
const selectedRegion = ref('')
const selectedWarehouse = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const API_URL = 'http://109.73.206.144:6969/api/orders'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

// Уникальные значения для фильтров
const uniqueRegions = computed(() =>
  [...new Set(orders.value.map(o => o.oblast))].filter(Boolean)
)
const uniqueWarehouses = computed(() =>
  [...new Set(orders.value.map(o => o.warehouse_name))].filter(Boolean)
)

// Фильтрация заказов по выбранным фильтрам
const filteredOrders = computed(() =>
  orders.value.filter(order =>
    (!selectedRegion.value || order.oblast === selectedRegion.value) &&
    (!selectedWarehouse.value || order.warehouse_name === selectedWarehouse.value)
  )
)

// Пагинация
const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredOrders.value.slice(start, start + itemsPerPage)
})

// Формируем URL запроса с параметрами
function buildUrl() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.append('dateFrom', dateFrom.value)
  if (dateTo.value) params.append('dateTo', dateTo.value)
  params.append('page', '1')
  params.append('limit', '500')
  params.append('key', API_KEY)
  return `${API_URL}?${params.toString()}`
}

// Получаем данные с сервера
async function fetchOrders() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    orders.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(buildUrl())
    orders.value = response.data.data || []
    currentPage.value = 1 // Сбрасываем страницу при новой загрузке
  } catch (e) {
    error.value = 'Ошибка загрузки: ' + e.message
  } finally {
    loading.value = false
  }
}

// При изменении дат подгружаем данные
watch([dateFrom, dateTo], ([from, to]) => {
  if (from && to) {
    fetchOrders()
  } else {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    orders.value = []
  }
})


// Данные для графика — считаем количество заказов и сумму по датам
const statsByDate = computed(() => {
  const map = {}

  filteredOrders.value.forEach(order => {
    const date = order.date.split(' ')[0]
    if (!map[date]) {
      map[date] = { count: 0, total: 0 }
    }
    map[date].count++
    map[date].total += parseFloat(order.total_price)
  })

  return Object.entries(map)
    .map(([date, stats]) => ({
      date,
      count: stats.count,
      total: Number(stats.total.toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})
</script>

<style scoped>
.filters {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

table {
  margin-top: 20px;
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  gap: 10px;
  align-items: center;
}

.error {
  color: red;
  margin-bottom: 1rem;
}

.chart-container {
  margin-top: 2rem;
}
</style>
