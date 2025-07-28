<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Legend, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Legend, Tooltip)

const props = defineProps({
  statsByDate: {
    type: Array,
    required: true,
  }
})

const canvas = ref(null)
let chartInstance = null

watch(() => props.statsByDate, (newData) => {
  if (!canvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const labels = newData.map(d => d.date)
  const counts = newData.map(d => d.count)
  const totals = newData.map(d => d.total)

  chartInstance = new Chart(canvas.value.getContext('2d'), {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Кол-во заказов',
          data: counts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Выручка (₽)',
          data: totals,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 4,
          fill: false,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Количество заказов',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Выручка (₽)',
          },
        },
      }
    }
  })
}, { immediate: true })
</script>
