<template>
  <div>
    <h1>Продажи</h1>

    <!-- Фильтры -->
    <div style="margin-bottom: 1rem;">
      <label>Дата от: <input type="date" v-model="dateFrom"/></label>
      <label>Дата до: <input type="date" v-model="dateTo"/></label>

      <label>
        Склад:
        <select v-model="selectedWarehouse">
          <option value="">Все</option>
          <option v-for="wh in uniqueWarehouses" :key="wh" :value="wh">{{ wh }}</option>
        </select>
      </label>

      <label>
        Регион:
        <select v-model="selectedRegion">
          <option value="">Все</option>
          <option v-for="reg in uniqueRegions" :key="reg" :value="reg">{{ reg }}</option>
        </select>
      </label>
    </div>

    <!-- Ошибка -->
    <div v-if="error" style="color: red; margin-bottom: 10px;">{{ error }}</div>

    <!-- Загрузка -->
    <div v-if="loading" style="margin-bottom: 10px;">Загрузка данных...</div>

    <!-- Таблица и график полупрозрачные при загрузке -->
    <div :style="{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }">
      <table v-if="filteredSales.length" border="1" cellspacing="0" cellpadding="5">
        <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма продажи</th>
          <th>Скидка %</th>
          <th>Склад</th>
          <th>Регион</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="sale in paginatedSales" :key="sale.g_number + sale.date">
          <td>{{ sale.date }}</td>
          <td>{{ roundDown(sale.total_price, 3) }}</td>
          <td>{{ sale.discount_percent }}</td>
          <td>{{ sale.warehouse_name }}</td>
          <td>{{ sale.region_name }}</td>
        </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" style="margin-top: 1rem;">
        <button :disabled="currentPage === 1" @click="currentPage--">←</button>
        <span>Страница {{ currentPage }} из {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">→</button>
      </div>

      <div v-if="chartData.labels.length" style="margin-top: 2rem;">
        <h2>График продаж по дате</h2>
        <div style="height: 400px;">
          <LineChart :chartData="chartData"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import LineChart from '../components/LineChart.vue'

const sales = ref([])
const loading = ref(false)
const error = ref(null)
const dateFrom = ref('')
const dateTo = ref('')
const selectedWarehouse = ref('')
const selectedRegion = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Сумма продаж',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgb(75, 192, 192)',
      data: [],
    },
  ],
})

const API_BASE_URL = 'http://109.73.206.144:6969/api/sales'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

function roundDown(num, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces)
  return Math.floor(num * factor) / factor
}

function buildUrl() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.append('dateFrom', dateFrom.value)
  if (dateTo.value) params.append('dateTo', dateTo.value)
  if (selectedWarehouse.value) params.append('warehouse', selectedWarehouse.value)
  if (selectedRegion.value) params.append('region', selectedRegion.value)
  params.append('page', '1')
  params.append('limit', '500')
  params.append('key', API_KEY)
  return `${API_BASE_URL}?${params.toString()}`
}

async function fetchSales() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    // НЕ очищаем sales и chartData, чтобы не было мигания
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(buildUrl())
    sales.value = response.data.data || []
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка при загрузке данных: ' + e.message
  } finally {
    loading.value = false
  }
}

const uniqueWarehouses = computed(() =>
  [...new Set(sales.value.map(s => s.warehouse_name))].filter(Boolean)
)
const uniqueRegions = computed(() =>
  [...new Set(sales.value.map(s => s.region_name))].filter(Boolean)
)

const filteredSales = computed(() =>
  sales.value.filter(sale =>
    (!selectedWarehouse.value || sale.warehouse_name === selectedWarehouse.value) &&
    (!selectedRegion.value || sale.region_name === selectedRegion.value)
  )
)

const totalPages = computed(() =>
  Math.ceil(filteredSales.value.length / itemsPerPage)
)
const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredSales.value.slice(start, start + itemsPerPage)
})

// Дебаунс для фильтров (можно подключить lodash.debounce, если много запросов)
watch(
  [dateFrom, dateTo, selectedWarehouse, selectedRegion],
  async ([from, to]) => {
    if (!from || !to) {
      error.value = 'Пожалуйста, выберите даты "от" и "до".'
      return
    }
    await fetchSales()
  }
)

watch(filteredSales, (sales) => {
  const grouped = sales.reduce((acc, sale) => {
    if (!acc[sale.date]) acc[sale.date] = 0
    acc[sale.date] += parseFloat(sale.total_price)
    return acc
  }, {})

  const labels = Object.keys(grouped).sort()
  const data = labels.map(date => roundDown(grouped[date], 2))

  chartData.value.labels = labels
  chartData.value.datasets[0].data = data
})
</script>

<style scoped>
table {
  margin-top: 20px;
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
}
</style>
