<template>
  <div>
    <h1>Продажи</h1>

    <!-- Фильтры -->
    <div class="table-filters">
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
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Загрузка -->
    <div v-if="loading">Загрузка данных...</div>

    <!-- Контент -->
    <div :class="{ 'opacity-50': loading, 'pointer-events-none': loading }">
      <!-- Обёртка таблицы -->
      <div class="table-container">
        <table class="data-table" v-if="filteredSales.length">
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
              <td class="text-right">{{ roundDown(sale.total_price, 3) }}</td>
              <td class="text-center">{{ sale.discount_percent }}%</td>
              <td>{{ sale.warehouse_name }}</td>
              <td>{{ sale.region_name }}</td>
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

      <div class="chart-container" v-if="chartData.labels.length">
        <h2>График продаж по дате</h2>
        <div class="chart-wrapper">
          <LineChart :chartData="chartData"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import apiService from '../services/apiService'
import LineChart from '../components/LineChart.vue'
import Pagination from '../components/Pagination.vue'
import '@/assets/styles/table-styles.css' // Подключаем общие стили таблиц

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
  datasets: [{
    label: 'Сумма продаж',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgb(75, 192, 192)',
    data: [],
  }],
})

// Вспомогательная функция
function roundDown(num, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces)
  return Math.floor(num * factor) / factor
}

// Основная функция загрузки данных
async function fetchSales() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    return
  }

  loading.value = true
  error.value = null

  try {
    sales.value = await apiService.fetchData('sales', {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      warehouse: selectedWarehouse.value,
      region: selectedRegion.value,
      page: 1,
      limit: 500
    })
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка при загрузке данных: ' + e.message
  } finally {
    loading.value = false
  }
}

// Вычисляемые свойства
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

// Наблюдатели
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

  chartData.value = {
    labels: Object.keys(grouped).sort(),
    datasets: [{
      ...chartData.value.datasets[0],
      data: Object.keys(grouped).sort().map(date => roundDown(grouped[date], 2))
    }]
  }
})
</script>

