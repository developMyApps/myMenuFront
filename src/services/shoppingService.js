import apiClient from './apiClient'

/**
 * Obtiene la lista de la compra de un grupo
 * @param {number|string} groupId 
 */
// 3. Exportación de la LISTA DE LA COMPRA
export const getShoppingList = async (groupId) => {
    try {
        const response = await apiClient.get(`/groups/${groupId}/shopping-list`);
        return response.data || [];
    } catch (error) {
        console.error("Error crítico en getShoppingList:", error.message);
        return [];
    }
};

/**
 * Añade un nuevo elemento a la lista de la compra
 * @param {number|string} groupId 
 * @param {Object} itemData - Datos del ingrediente { ingredient_name, category_id, quantity, unit }
 */
export const addShoppingItem = async (groupId, itemData) => {
    // itemData debe ser: { ingredient_name, category_id, quantity, unit }
    const response = await apiClient.post(`/groups/${groupId}/shopping-list`, itemData);
    return response.data;
};

/**
 * Alterna el estado de comprado/pendiente de un elemento
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 * @param {boolean} isBought 
 */
export const toggleShoppingItem = async (groupId, itemId, isBought) => {
    const response = await apiClient.patch(`/groups/${groupId}/shopping-list/${itemId}`, {
        is_bought: isBought
    });
    return response.data;
};

/**
 * Modifica la cantidad y/o unidad de un artículo de la lista de la compra
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 * @param {number} quantity - Nueva cantidad numérica
 */
export const updateItemQuantity = async (groupId, itemId, quantity) => {
    const response = await apiClient.patch(`/groups/${groupId}/shopping-list/${itemId}/quantity?quantity=${quantity}`);
    return response.data;
};

/**
 * Elimina un elemento individual de la lista de la compra
 * @param {number|string} groupId 
 * @param {number|string} itemId 
 */
export const deleteShoppingItem = async (groupId, itemId) => {
    const response = await apiClient.delete(`/groups/${groupId}/shopping-list/${itemId}`);
    return response.data;
};

/**
 * Elimina todos los elementos de la lista de la compra del grupo
 * @param {number|string} groupId 
 */
export const clearShoppingList = async (groupId) => {
    const response = await apiClient.delete(`/groups/${groupId}/shopping-list`);
    return response.data;
};

// 2. Exportación de CATEGORÍAS (El nuevo servicio)
export const getCategories = async () => {
    try {
        const response = await apiClient.get('/categories');
        return response.data || [];
    } catch (error) {
        console.error("Error crítico en getCategories:", error.message);
        return []; // Retornamos un array vacío para que el frontend no rompa
    }
};