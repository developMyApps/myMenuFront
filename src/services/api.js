import axios from 'axios'

// 1. Leemos la variable de entorno de Vite o usamos localhost por defecto
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 2. Creamos la instancia única de Axios usando 'API_BASE_URL'
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Grupos
export const createGroup = async (name) => {
  const response = await api.post('/groups', { name })
  return response.data
}

// Lista de la Compra
export const getShoppingList = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/shopping-list`)
  return response.data
}

export const addShoppingItem = async (groupId, itemData) => {
  const response = await api.post(`/groups/${groupId}/shopping-list`, itemData)
  return response.data
}

export const toggleShoppingItem = async (groupId, itemId, isBought) => {
  const response = await api.patch(`/groups/${groupId}/shopping-list/${itemId}`, {
    is_bought: isBought
  })
  return response.data
}

/**
 * Modifica la cantidad de un artículo de la lista de la compra.
 * CORREGIDO: Ahora usa 'api' para respetar el entorno local/producción automáticamente
 */
export const updateItemQuantity = async (groupId, itemId, quantity) => {
  try {
    const response = await api.patch(`/groups/${groupId}/shopping-list/${itemId}/quantity`, null, {
      params: { quantity: quantity }
    })
    return response.data
  } catch (error) {
    console.error('Error en servicio updateItemQuantity:', error)
    throw error
  }
}

/**
 * Elimina todos los elementos de la lista de la compra.
 * CORREGIDO: Ahora usa 'api' en lugar de axios directo
 */
export const clearShoppingList = async (groupId) => {
  try {
    const response = await api.delete(`/groups/${groupId}/shopping-list`)
    return response.data
  } catch (error) {
    console.error('Error en servicio clearShoppingList:', error)
    throw error
  }
}

export default api