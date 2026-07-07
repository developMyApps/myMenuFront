import apiClient from './apiClient'

/**
 * Obtiene el listado de recetas de un grupo por orden alfabético
 * @param {number|string} groupId 
 */
export const getRecipes = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/recipes`)
    return response.data
}

/**
 * Crea una nueva receta dentro de la colección del grupo
 * @param {number|string} groupId 
 * @param {Object} data - Datos de la receta { title, instructions }
 */
export const createRecipe = async (groupId, data) => {
    const response = await apiClient.post(`/groups/${groupId}/recipes`, data)
    return response.data
}

/**
 * Actualiza el título y las instrucciones de una receta existente
 * @param {number|string} groupId 
 * @param {number|string} recipeId 
 * @param {Object} data - Objeto modificado { title, instructions }
 */
export const updateRecipe = async (groupId, recipeId, data) => {
    const response = await apiClient.put(`/groups/${groupId}/recipes/${recipeId}`, data)
    return response.data
}

/**
 * Elimina una receta de forma permanente del grupo
 * @param {number|string} groupId 
 * @param {number|string} recipeId 
 */
export const deleteRecipe = async (groupId, recipeId) => {
    const response = await apiClient.delete(`/groups/${groupId}/recipes/${recipeId}`)
    return response.data
}