# LineChart.vue
<script setup>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
    validator: value => {
      return value.labels && value.datasets
    }
  },
  options: {
    type: Object,
    default: () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          padding: 12,
          usePointStyle: true,
        }
      }
    })
  }
})
</script>

<template>
  <Bar
    :data="chartData"
    :options="options"
    class="chart"
  />
</template>

<style scoped>
.chart {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>