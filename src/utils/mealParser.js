/**
 * Parsea el texto del menú desde la base de datos.
 * Si es JSON con { shared, individuals }, extrae la estructura.
 * Si es texto plano (retrocompatibilidad), lo trata como menú compartido.
 * 
 * @param {string} rawText 
 * @returns {{ shared: string, individuals: Array<{ person: string, text: string }> }}
 */
export function parseMeal(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { shared: '', individuals: [] }
  }

  const trimmed = rawText.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        return {
          shared: parsed.shared || '',
          individuals: Array.isArray(parsed.individuals)
            ? parsed.individuals.map(item => ({
                person: item.person || '',
                text: item.text || ''
              }))
            : []
        }
      }
    } catch (e) {
      // Si falla la conversión a JSON, cae al texto plano
    }
  }

  return { shared: rawText, individuals: [] }
}

/**
 * Convierte el menú compartido y las excepciones individuales en una cadena para la BD.
 * Si no hay menúes individuales, devuelve simplemente el texto del menú compartido para no añadir JSON innecesario.
 * 
 * @param {string} shared 
 * @param {Array<{ person: string, text: string }>} individuals 
 * @returns {string}
 */
export function stringifyMeal(shared, individuals = []) {
  const cleanShared = (shared || '').trim()
  const cleanIndividuals = (individuals || [])
    .map(i => ({ person: (i.person || '').trim(), text: (i.text || '').trim() }))
    .filter(i => i.person || i.text)

  if (cleanIndividuals.length === 0) {
    return cleanShared
  }

  return JSON.stringify({
    shared: cleanShared,
    individuals: cleanIndividuals
  })
}

/**
 * Comprueba si un menú tiene algún contenido (compartido o individual).
 * @param {string} rawText 
 * @returns {boolean}
 */
export function hasMealContent(rawText) {
  const { shared, individuals } = parseMeal(rawText)
  if (shared && shared.trim()) return true
  return individuals.some(i => i.text && i.text.trim())
}
