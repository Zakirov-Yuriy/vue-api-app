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
    <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @prev="currentPage--"
        @next="currentPage++"
    />

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
import apiService from '../services/apiService'
import {formatDate} from '../services/apiService' // Импортируйте напрямую
import LineChart from '../components/LineChart.vue'
import Pagination from '../components/Pagination.vue'

const stocks = ref([])
const loading = ref(false)
const error = ref(null)
const selectedWarehouse = ref('')
const selectedArticle = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

// Основная функция загрузки данных
async function fetchStocks() {
  loading.value = true
  error.value = null

  try {
    const today = formatDate(new Date())
    stocks.value = await apiService.fetchData('stocks', {
      dateFrom: today,
      dateTo: today
    })
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

// Обновление графика
const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Общее количество',
    backgroundColor: 'rgba(200, 100, 255, 0.2)',
    borderColor: 'rgb(200, 100, 255)',
    data: [],
  }],
})

function updateChart() {
  const grouped = filteredStocks.value.reduce((acc, item) => {
    acc[item.warehouse_name] = (acc[item.warehouse_name] || 0) + item.quantity_full
    return acc
  }, {})

  chartData.value = {
    labels: Object.keys(grouped).sort(),
    datasets: [{
      ...chartData.value.datasets[0],
      data: Object.keys(grouped).sort().map(label => grouped[label])
    }]
  }
}

// Наблюдатели
watch([selectedWarehouse, selectedArticle], () => {
  currentPage.value = 1
  updateChart()
})

watch(stocks, updateChart)

// Инициализация
onMounted(fetchStocks)
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

th, td {
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

.chart-container {
  margin-top: 2rem;
}
</style>