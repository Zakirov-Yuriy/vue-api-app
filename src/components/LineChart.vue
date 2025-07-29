<script setup>
import { ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'   // заменили Line на Bar
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,           // импортируем BarElement вместо LineElement
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement)

const props = defineProps({
  chartData: Object,
})

const localChartData = ref({ ...props.chartData })

watch(
  () => props.chartData,
  (newData) => {
    localChartData.value = JSON.parse(JSON.stringify(newData))
  },
  { deep: true, immediate: true }
)

const options = {
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<template>
  <Bar :data="localChartData" :options="options" />  <!-- используем Bar вместо Line -->
</template>
