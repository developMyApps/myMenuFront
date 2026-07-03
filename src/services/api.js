import axios from 'axios'

const API_URL = 'https://mymenu-t12v.onrender.com'

const api = axios.create({
  baseURL: API_URL,
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
  // itemData -> { ingredient_name, category, quantity, unit }
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
 */
export const updateItemQuantity = async (groupId, itemId, quantity) => {
  try {
    const response = await axios.patch(`${API_URL}/groups/${groupId}/shopping-list/${itemId}/quantity`, null, {
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
 */
export const clearShoppingList = async (groupId) => {
  try {
    const response = await axios.delete(`${API_URL}/groups/${groupId}/shopping-list`)
    return response.data
  } catch (error) {
    console.error('Error en servicio clearShoppingList:', error)
    throw error
  }
}

export default api
