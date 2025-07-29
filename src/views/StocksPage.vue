<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Остатки на складах</h1>

    <!-- Фильтры -->
    <div class="filters">
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
    <div v-if="error" class="text-red-600">{{ error }}</div>

    <!-- Таблица -->
    <table v-if="paginatedStocks.length" class="w-full text-sm">
      <thead>
      <tr>
        <th>Артикул</th>
        <th>Размер</th>
        <th>ШК</th>
        <th>Склад</th>
        <th>В пути к клиенту</th>
        <th>В пути от клиента</th>
        <th>Кол-во всего</th>
        <th>Цена</th>
        <th>Скидка</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in paginatedStocks" :key="item.barcode + index">
        <td>{{ item.supplier_article }}</td>
        <td>{{ item.tech_size }}</td>
        <td>{{ item.barcode }}</td>
        <td>{{ item.warehouse_name }}</td>
        <td>{{ item.in_way_to_client }}</td>
        <td>{{ item.in_way_from_client }}</td>
        <td>{{ item.quantity_full }}</td>
        <td>{{ item.price }} ₽</td>
        <td>{{ item.discount }}%</td>
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
      <h2>График остатков по складам</h2>
      <div style="height: 400px;">
        <LineChart :chartData="chartData"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import axios from 'axios'
import LineChart from '../components/LineChart.vue'

const stocks = ref([])
const loading = ref(false)
const error = ref(null)

const selectedWarehouse = ref('')
const selectedArticle = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const API_URL = 'http://109.73.206.144:6969/api/stocks'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

// Форматирование текущей даты в YYYY-MM-DD
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function fetchStocks() {
  loading.value = true
  error.value = null

  try {
    const today = formatDate(new Date())
    const params = new URLSearchParams({
      key: API_KEY,
      dateFrom: today,
      dateTo: today,
    })
    const {data} = await axios.get(`${API_URL}?${params.toString()}`)
    stocks.value = data.data || data
    currentPage.value = 1
  } catch (e) {
    error.value = 'Ошибка загрузки: ' + e.message
  } finally {
    loading.value = false
  }
}

// Уникальные значения для фильтров
const uniqueWarehouses = computed(() =>
    [...new Set(stocks.value.map(s => s.warehouse_name))].filter(Boolean)
)
const uniqueArticles = computed(() =>
    [...new Set(stocks.value.map(s => s.supplier_article))].filter(Boolean)
)

// Фильтрация данных
const filteredStocks = computed(() =>
    stocks.value.filter(s =>
        (!selectedWarehouse.value || s.warehouse_name === selectedWarehouse.value) &&
        (!selectedArticle.value || s.supplier_article === selectedArticle.value)
    )
)

// Пагинация
const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage))
const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredStocks.value.slice(start, start + itemsPerPage)
})

// Обновление графика: сумма quantity_full по складам
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Общее количество',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgb(54, 162, 235)',
      data: [],
    },
  ],
})

function updateChart() {
  const grouped = filteredStocks.value.reduce((acc, item) => {
    acc[item.warehouse_name] = (acc[item.warehouse_name] || 0) + item.quantity_full
    return acc
  }, {})

  const labels = Object.keys(grouped).sort()
  const data = labels.map(label => grouped[label])

  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Общее количество',
        backgroundColor: 'rgba(200, 100, 255, 0.2)',
        borderColor: 'rgb(200, 100, 255)',


        data,
      },
    ],
  }
}

// Следим за изменениями фильтров и данных
watch([selectedWarehouse, selectedArticle], () => {
  currentPage.value = 1
  updateChart()
})
watch(stocks, () => updateChart())

onMounted(async () => {
  await fetchStocks()
  updateChart()
})
</script>

<style scoped>
.filters {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

th,
td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

thead {
  background-color: #f9fafb;
}

tbody tr:hover {
  background-color: #f3f4f6;
}

.pagination {
  margin-top: 1rem;
}

.chart-container {
  margin-top: 2rem;
}
</style>
