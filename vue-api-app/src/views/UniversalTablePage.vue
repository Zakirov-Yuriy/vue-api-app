<template>
  <div class="p-4 space-y-4">
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(filter, index) in filters"
        :key="index"
        class="flex flex-col"
      >
        <label class="text-sm font-medium mb-1">{{ filter.label }}</label>
        <select
          v-model="filter.value"
          class="border rounded px-2 py-1"
        >
          <option value="">Все</option>
          <option
            v-for="option in uniqueOptions(filter.key)"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <!-- График -->
    <div class="w-full h-64 bg-white shadow rounded p-4">
      <LineChart
        :width="600"
        :height="250"
      >
        <LineChartXAxis dataKey="x" />
        <LineChartYAxis />
        <LineChartTooltip />
        <LineChartLegend />
        <LineChartLine
          type="monotone"
          dataKey="y"
          stroke="#8884d8"
          stroke-width="2"
        />
        <LineChartData
          :data="chartData"
        />
      </LineChart>
    </div>

    <!-- Таблица -->
    <table class="min-w-full border">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col"
            class="border px-4 py-2 text-left bg-gray-100"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in paginatedData"
          :key="index"
          class="border-t"
        >
          <td
            v-for="col in columns"
            :key="col"
            class="px-4 py-2"
          >
            {{ row[col] }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Пагинация -->
    <div class="flex justify-between items-center mt-4">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Назад
      </button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Вперёд
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  LineChart,
  LineChartLine,
  LineChartXAxis,
  LineChartYAxis,
  LineChartTooltip,
  LineChartLegend,
  LineChartData,
} from 'vue3-chart-v2'
import { computed, ref, watch } from 'vue'

// Пропсы
const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  filters: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  chartX: {
    type: String,
    required: true,
  },
  chartY: {
    type: String,
    required: true,
  },
})

// Состояние пагинации
const currentPage = ref(1)
const itemsPerPage = 10

// Получение уникальных опций для фильтров
const uniqueOptions = (key) => {
  const allValues = props.rows.map(row => row[key])
  return [...new Set(allValues.filter(Boolean))]
}

// Фильтрация данных
const filteredData = computed(() => {
  return props.rows.filter(row => {
    return props.filters.every(filter => {
      return !filter.value || row[filter.key] === filter.value
    })
  })
})

// Пагинированные данные
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredData.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / itemsPerPage)
})

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

// График
const chartData = computed(() => {
  return filteredData.value.map(row => ({
    x: row[props.chartX],
    y: row[props.chartY],
  }))
})

// Сброс страницы при изменении фильтров
watch(filteredData, () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* Доп. стили при необходимости */
</style>
