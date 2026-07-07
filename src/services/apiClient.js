import axios from 'axios'

// 1. Leemos la variable de entorno de Vite o usamos localhost por defecto
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 2. Creamos la instancia única de Axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

export default apiClient