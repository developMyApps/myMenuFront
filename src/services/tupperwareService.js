import apiClient from './apiClient'

/**
 * Obtiene todo el inventario de tupperwares del grupo
 * @param {number|string} groupId 
 */
export const getTupperwares = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/tupperwares`)
    return response.data
}

/**
 * Registra un nuevo tupperware en la base de datos
 * @param {number|string} groupId 
 * @param {Object} data - Objeto { title, servings, location }
 */
export const createTupperware = async (groupId, data) => {
    const response = await apiClient.post(`/groups/${groupId}/tupperwares`, data)
    return response.data
}

/**
 * Modifica las raciones o ubicación de un tupperware
 * @param {number|string} groupId 
 * @param {number|string} tupperId 
 * @param {Object} data - Objeto actualizado { title, servings, location }
 */
export const updateTupperware = async (groupId, tupperId, data) => {
    const response = await apiClient.put(`/groups/${groupId}/tupperwares/${tupperId}`, data)
    return response.data
}

/**
 * Elimina definitivamente un tupperware del congelador
 * @param {number|string} groupId 
 * @param {number|string} tupperId 
 */
export const deleteTupperware = async (groupId, tupperId) => {
    const response = await apiClient.delete(`/groups/${groupId}/tupperwares/${tupperId}`)
    return response.data
}


