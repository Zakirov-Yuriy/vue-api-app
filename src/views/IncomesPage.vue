<template>
  <div>
    <h1>Поступления</h1>

    <!-- Фильтры -->
    <div class="table-filters">
      <label>Дата от: <input type="date" v-model="dateFrom" /></label>
      <label>Дата до: <input type="date" v-model="dateTo" /></label>

      <label>
        Склад:
        <select v-model="selectedWarehouse">
          <option value="">Все</option>
          <option v-for="w in uniqueWarehouses" :key="w" :value="w">{{ w }}</option>
        </select>
      </label>

      <label>
        Артикул:
        <select v-model="selectedArticle">
          <option value="">Все</option>
          <option v-for="a in uniqueArticles" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>

      <label>
        Группировка:
        <select v-model="chartField">
          <option value="date">По дате</option>
          <option value="warehouse_name">По складу</option>
          <option value="supplier_article">По артикулу</option>
        </select>
      </label>
    </div>

    <div v-if="loading">Загрузка данных...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Обёртка таблицы -->
    <div class="table-container">
      <table class="data-table" v-if="paginatedIncomes.length">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Артикул</th>
            <th>Размер</th>
            <th>Штрихкод</th>
            <th class="text-right">Количество</th>
            <th>Склад</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="income in paginatedIncomes" :key="`${income.barcode}-${income.date}`">
            <td>{{ formatDate(income.date) }}</td>
            <td>{{ income.supplier_article }}</td>
            <td>{{ income.tech_size }}</td>
            <td>{{ income.barcode }}</td>
            <td class="text-right">{{ income.quantity }}</td>
            <td>{{ income.warehouse_name }}</td>
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

    <!-- График -->
    <div class="chart-container" v-if="chartData.labels.length">
      <h2>График по: {{ chartFieldLabel }}</h2>
      <div class="chart-wrapper">
        <LineChart :chart-data="chartData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import apiService from '@/services/apiService'
import LineChart from '@/components/LineChart.vue'
import Pagination from '@/components/Pagination.vue'
import '@/assets/styles/table-styles.css' // Подключаем общие стили таблиц

const incomes = ref([])
const loading = ref(false)
const error = ref(null)

// Фильтры
const dateFrom = ref('')
const dateTo = ref('')
const selectedWarehouse = ref('')
const selectedArticle = ref('')
const chartField = ref('date')

// Пагинация
const currentPage = ref(1)
const itemsPerPage = 20

// Уникальные значения для фильтров
const uniqueWarehouses = computed(() =>
  [...new Set(incomes.value.map(i => i.warehouse_name))].filter(Boolean).sort()
)

const uniqueArticles = computed(() =>
  [...new Set(incomes.value.map(i => i.supplier_article))].filter(Boolean).sort()
)

// Фильтрация данных
const filteredIncomes = computed(() =>
  incomes.value.filter(item =>
    (!selectedWarehouse.value || item.warehouse_name === selectedWarehouse.value) &&
    (!selectedArticle.value || item.supplier_article === selectedArticle.value)
  )
)

// Пагинация
const totalPages = computed(() =>
  Math.ceil(filteredIncomes.value.length / itemsPerPage)
)

const paginatedIncomes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredIncomes.value.slice(start, start + itemsPerPage)
})

// Форматирование даты
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Загрузка данных
async function fetchIncomes() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    incomes.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    incomes.value = await apiService.fetchData('incomes', {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      page: 1,
      limit: 500
    })
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка при загрузке: ' + e.message
    incomes.value = []
  } finally {
    loading.value = false
  }
}

// График
const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Количество',
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: 'rgb(153, 102, 255)',
    borderWidth: 2,
    data: [],
  }]
})

const chartFieldLabel = computed(() => {
  const labels = {
    date: 'Дата',
    warehouse_name: 'Склад',
    supplier_article: 'Артикул'
  }
  return labels[chartField.value] || chartField.value
})

// Обновление графика
function updateChart() {
  const grouped = filteredIncomes.value.reduce((acc, item) => {
    const key = item[chartField.value] || '—'
    acc[key] = (acc[key] || 0) + Number(item.quantity)
    return acc
  }, {})

  const labels = Object.keys(grouped).sort()
  const data = labels.map(label => grouped[label])

  chartData.value = {
    labels,
    datasets: [{
      ...chartData.value.datasets[0],
      data
    }]
  }
}

// Наблюдатели
watch([dateFrom, dateTo], ([from, to]) => {
  if (from && to) fetchIncomes()
  else error.value = 'Пожалуйста, выберите даты "от" и "до".'
})

watch([filteredIncomes, chartField], updateChart, { immediate: true })
</script>

