import apiClient from './apiClient'

/**
 * Obtiene los menús semanales de un grupo a partir de una fecha de inicio
 * @param {number|string} groupId 
 * @param {string} startDate - Fecha ISO del lunes de la semana (YYYY-MM-DD)
 */
export const getMeals = async (groupId, startDate) => {
    const response = await apiClient.get(`/groups/${groupId}/meals`, {
        params: { fecha_inicio: startDate }
    })
    return response.data
}

/**
 * Guarda o actualiza el menú de un día y tipo específicos
 * @param {number|string} groupId 
 * @param {string} date - Fecha ISO del día (YYYY-MM-DD)
 * @param {string} mealType - 'comida' o 'cena'
 * @param {string} menuText - Nombre de la comida elegida o receta
 */
export const saveMeal = async (groupId, date, mealType, menuText) => {
    const response = await apiClient.post(`/groups/${groupId}/meals`, null, {
        params: {
            fecha: date,
            meal_type: mealType,
            texto_menu: menuText
        }
    })
    return response.data
}

/**
 * Obtiene el historial completo de menús de un grupo
 * @param {number|string} groupId 
 */
export const getHistoricalMeals = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/meals/history`)
    return response.data
}