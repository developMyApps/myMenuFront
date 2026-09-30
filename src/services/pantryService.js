import apiClient from './apiClient'

const BASE = (groupId) => `/groups/${groupId}/pantry`

export const getPantryItems = async (groupId) => {
  const { data } = await apiClient.get(BASE(groupId))
  return data
}

export const addPantryItem = async (groupId, item) => {
  const { data } = await apiClient.post(BASE(groupId), item)
  return data
}

export const updatePantryItem = async (groupId, itemId, updates) => {
  const { data } = await apiClient.patch(`${BASE(groupId)}/${itemId}`, updates)
  return data
}

export const deletePantryItem = async (groupId, itemId) => {
  await apiClient.delete(`${BASE(groupId)}/${itemId}`)
}

/**
 * Mueve un artículo de la lista de la compra a la despensa.
 * @param {number} groupId
 * @param {number} shoppingItemId
 * @param {string|null} purchasedAt - fecha ISO 'YYYY-MM-DD' o null (usa hoy)
 */
export const moveToPantryFromShopping = async (groupId, shoppingItemId, purchasedAt = null) => {
  const { data } = await apiClient.post(
    `${BASE(groupId)}/from-shopping/${shoppingItemId}`,
    { purchased_at: purchasedAt }
  )
  return data
}

/**
 * Llama a la IA para comparar ingredientes de la receta con la despensa.
 * @param {number} groupId
 * @param {string} recipeIngredients - texto libre de ingredientes
 * @param {string[]} pantryItems - lista de nombres de artículos en despensa
 * @returns {{ ok: string[], missing: {ingredient, reason}[], substitutes: {needed, substitute, note}[] }}
 */
export const checkPantryWithAI = async (groupId, recipeIngredients, pantryItems) => {
  const { data } = await apiClient.post(
    `/api/groups/${groupId}/ai/check-pantry`,
    { recipe_ingredients: recipeIngredients, pantry_items: pantryItems }
  )
  return data
}
