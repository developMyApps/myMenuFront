import apiClient from './apiClient'

/**
 * Crea un nuevo grupo de cocina compartida
 * @param {string} name - Nombre del grupo
 */
export const createGroup = async (name) => {
    const response = await apiClient.post('/groups', { name })
    return response.data
}

/**
 * Une al usuario a un grupo existente usando el código de invitación
 * @param {string} inviteCode - Código de invitación de 6 caracteres
 */
export const joinGroup = async (inviteCode) => {
    const response = await apiClient.post('/groups/join', { invite_code: inviteCode })
    return response.data
}