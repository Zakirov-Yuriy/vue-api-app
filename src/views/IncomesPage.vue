# IncomesPage.vue

<template>
  <div>
    <h1>Поступления</h1>

    <!-- Фильтры -->
    <div class="filters">
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
    </div>

    <div v-if="loading">Загрузка данных...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Таблица -->
    <table v-if="paginatedIncomes.length" border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Артикул</th>
          <th>Размер</th>
          <th>Штрихкод</th>
          <th>Количество</th>
          <th>Склад</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="income in paginatedIncomes" :key="income.barcode + income.date">
          <td>{{ income.date }}</td>
          <td>{{ income.supplier_article }}</td>
          <td>{{ income.tech_size }}</td>
          <td>{{ income.barcode }}</td>
          <td>{{ income.quantity }}</td>
          <td>{{ income.warehouse_name }}</td>
        </tr>
      </tbody>
    </table>



    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">←</button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">→</button>
    </div>

    <!-- График -->
    <div v-if="chartData.labels.length" class="chart-container">
      <h2>График по: {{ chartFieldLabel }}</h2>
      <div style="height: 400px;">
        <LineChart :chartData="chartData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import LineChart from '../components/LineChart.vue'

const incomes = ref([])
const loading = ref(false)
const error = ref(null)

const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const selectedWarehouse = ref('')
const selectedArticle = ref('')
const chartField = ref('date') // поле для группировки на графике

const API_URL = 'http://109.73.206.144:6969/api/incomes'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

// Уникальные значения для фильтров
const uniqueWarehouses = computed(() =>
  [...new Set(incomes.value.map(i => i.warehouse_name))].filter(Boolean)
)
const uniqueArticles = computed(() =>
  [...new Set(incomes.value.map(i => i.supplier_article))].filter(Boolean)
)

// Фильтрация по выбранным склад и артикулу
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

// Построение URL с параметрами даты
function buildUrl() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.append('dateFrom', dateFrom.value)
  if (dateTo.value) params.append('dateTo', dateTo.value)
  params.append('page', '1')
  params.append('limit', '500')
  params.append('key', API_KEY)
  return `${API_URL}?${params.toString()}`
}


// Загрузка данных
async function fetchIncomes() {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    incomes.value = []
    resetChart()
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await axios.get(buildUrl())
    incomes.value = res.data.data || []
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка при загрузке: ' + e.message
    incomes.value = []
  } finally {
    loading.value = false
  }
}

// Сброс данных графика
function resetChart() {
  chartData.value = {
    labels: [],
    datasets: [{
      label: 'Количество',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgb(153, 102, 255)',
      data: [],
    }]
  }
}

// Состояние графика
const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Количество',
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: 'rgb(153, 102, 255)',
    data: [],
  }],
})

// Название поля для графика
const chartFieldLabel = computed(() => {
  const labels = {
    date: 'Дата',
    warehouse_name: 'Склад',
    supplier_article: 'Артикул',
  }
  return labels[chartField.value] || chartField.value
})

// Автоматический вызов загрузки при смене дат
watch([dateFrom, dateTo], ([from, to]) => {
  if (from && to) {
    fetchIncomes()
  } else {
    error.value = 'Пожалуйста, выберите даты "от" и "до".'
    incomes.value = []
    resetChart()
  }
})


// Обновление графика при изменении фильтра или поля для группировки
watch(
  [filteredIncomes, chartField],
  ([filtered, field]) => {
    const grouped = {}

    filtered.forEach(item => {
      const key = item[field] || '—'
      grouped[key] = (grouped[key] || 0) + Number(item.quantity)
    })

    const labels = Object.keys(grouped).sort()
    const data = labels.map(label => grouped[label])

    chartData.value = {
      labels,
      datasets: [{
        label: 'Количество',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgb(153, 102, 255)',
        data,
      }]
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.filters {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.pagination {
  margin-top: 1rem;
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
.error {
  color: red;
  margin-bottom: 1rem;
}
.chart-container {
  margin-top: 2rem;
}
</style>
