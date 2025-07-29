<template>
  <div>
    <h1>Заказы</h1>

    <!-- Фильтры -->
    <div class="table-filters">
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
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Обёртка таблицы -->
    <div class="table-container">
      <table class="data-table" v-if="paginatedOrders.length">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Артикул</th>
            <th class="text-right">Сумма</th>
            <th class="text-center">Скидка %</th>
            <th>Область</th>
            <th>Склад</th>
            <th class="text-center">Отменён</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.g_number + order.date">
            <td>{{ order.date }}</td>
            <td>{{ order.supplier_article }}</td>
            <td class="text-right">{{ formatPrice(order.total_price) }}</td>
            <td class="text-center">{{ order.discount_percent }}%</td>
            <td>{{ order.oblast }}</td>
            <td>{{ order.warehouse_name }}</td>
            <td class="text-center">{{ order.is_cancel ? 'Да' : 'Нет' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @prev="currentPage--"
      @next="currentPage++"
    />

    <!-- Комбинированный график -->
    <div class="chart-container" v-if="statsByDate.length">
      <h2>Заказы по датам</h2>
      <CombinedChart :stats-by-date="statsByDate" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import apiService from '@/services/apiService'
import CombinedChart from '@/components/CombinedChart.vue'
import Pagination from '@/components/Pagination.vue'
import '@/assets/styles/table-styles.css' // Подключаем общие стили таблиц

const orders = ref([])
const loading = ref(false)
const error = ref(null)

const dateFrom = ref('')
const dateTo = ref('')
const selectedRegion = ref('')
const selectedWarehouse = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

// Уникальные значения для фильтров
const uniqueRegions = computed(() =>
  [...new Set(orders.value.map(o => o.oblast))].filter(Boolean)
)

const uniqueWarehouses = computed(() =>
  [...new Set(orders.value.map(o => o.warehouse_name))].filter(Boolean)
)

// Фильтрация заказов
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

// Форматирование цены
const formatPrice = (price) => {
  return Number(price).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Загрузка данных
async function fetchOrders() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    orders.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    orders.value = await apiService.fetchData('orders', {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      page: 1,
      limit: 500
    })
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка загрузки: ' + e.message
  } finally {
    loading.value = false
  }
}

// Данные для графика
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

// Наблюдатели
watch([dateFrom, dateTo], ([from, to]) => {
  if (from && to) {
    fetchOrders()
  } else {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    orders.value = []
  }
})
</script>

