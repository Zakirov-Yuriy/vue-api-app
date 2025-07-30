import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://109.73.206.144:6969/api'
const API_KEY = import.meta.env.VITE_API_KEY


export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default {
  async fetchData(endpoint, params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
        params: { ...params, key: API_KEY }
      })
      return response.data.data || response.data
    } catch (error) {
      throw new Error(`API Error: ${error.message}`)
    }
  }
}