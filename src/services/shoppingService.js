import apiClient from './apiClient'

/**
 * Obtiene la lista de la compra de un grupo
 * @param {number|string} groupId 
 */
export const getShoppingList = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/shopping-list`)
    return response.data
}

/**
 * Añade un nuevo elemento a la lista de la compra
 * @param {number|string} groupId 
 * @param {Object} itemData - Datos del ingrediente { ingredient_name, category, quantity, unit }
 */
export const addShoppingItem = async (groupId, itemData) => {
    const response = await apiClient.post(`/groups/${groupId}/shopping-list`, itemData)
    return response.data
}

/**
 * Alterna el estado de comprado/pendiente de un elemento
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 * @param {boolean} isBought 
 */
export const toggleShoppingItem = async (groupId, itemId, isBought) => {
    const response = await apiClient.patch(`/groups/${groupId}/shopping-list/${itemId}`, {
        is_bought: isBought
    })
    return response.data
}

/**
 * Modifica la cantidad y/o unidad de un artículo de la lista de la compra
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 * @param {number} quantity - Nueva cantidad numérica
 */
export const updateItemQuantity = async (groupId, itemId, quantity) => {
    try {
        const response = await apiClient.patch(`/groups/${groupId}/shopping-list/${itemId}/quantity`, null, {
            params: { quantity: quantity }
        })
        return response.data
    } catch (error) {
        console.error('Error en servicio updateItemQuantity:', error)
        throw error
    }
}

/**
 * Elimina un elemento individual de la lista de la compra
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 */
export const deleteShoppingItem = async (groupId, itemId) => {
    const response = await apiClient.delete(`/groups/${groupId}/shopping-list/${itemId}`)
    return response.data
}

/**
 * Elimina todos los elementos de la lista de la compra del grupo
 * @param {number|string} groupId 
 */
export const clearShoppingList = async (groupId) => {
    try {
        const response = await apiClient.delete(`/groups/${groupId}/shopping-list`)
        return response.data
    } catch (error) {
        console.error('Error en servicio clearShoppingList:', error)
        throw error
    }
}