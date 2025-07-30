import axios from 'axios'

// Для разработки - локальный прокси, для продакшена - абсолютный URL
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'http://109.73.206.144:6969/api'

const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

export default {
  async fetchData(endpoint, params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
        params: {
          ...params,
          key: API_KEY
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      return response.data.data || response.data
    } catch (error) {
      throw new Error(`API Error: ${error.message}`)
    }
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}