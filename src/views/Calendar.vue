<template>
  <div class="view-container">
    <CalendarHeader 
      :textoSemanaActual="textoSemanaActual" 
      :loading="loading" 
      @navigate="cambiarSemana" 
    />

    <div v-if="loading && diasSemana.length === 0" class="text-center py-8">
      <p class="loading-text">Cargando calendario...</p>
    </div>

    <main v-else class="calendar-content" :class="{ 'loading-fade': loading }">
      <CalendarDayCard 
        v-for="dia in diasSemana" 
        :key="dia.fechaISO" 
        :dia="dia"
        @select-meal="abrirEditor"
      />
    </main>

    <CalendarModalEditor 
      :isOpen="modalAbierto"
      :dia="diaSeleccionado"
      :tipoEdicion="tipoEdicion"
      :textoMenuInicial="textoMenu"
      :recetas="recetas"
      :tuppers="tuppers"
      :guardando="guardando"
      @close="cerrarModal"
      @save="guardarMenu"
    />

    <!-- Modal de comprobación de ingredientes con IA -->
    <IngredientCheckModal
      :is-open="checkModalAbierto"
      :loading="checkLoading"
      :error="checkError"
      :result="checkResult"
      :recipe-name="checkRecipeName"
      :group-id="groupId"
      :default-category-id="1"
      @close="checkModalAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import CalendarHeader from '../components/calendar/CalendarHeader.vue'
import CalendarDayCard from '../components/calendar/CalendarDayCard.vue'
import CalendarModalEditor from '../components/calendar/CalendarModalEditor.vue'
import IngredientCheckModal from '../components/calendar/IngredientCheckModal.vue'
import { parseMeal } from '../utils/mealParser'

import { getMeals, saveMeal } from '../services/mealService'
import { getRecipes } from '../services/recipeService'
import { getTupperwares, updateTupperware, deleteTupperware } from '../services/tupperwareService'
import { getPantryItems, checkPantryWithAI } from '../services/pantryService'

const diasSemana = ref([])
const modalAbierto = ref(false)
const diaSeleccionado = ref(null)
const tipoEdicion = ref('')
const textoMenu = ref('')

const recetas = ref([])
const tuppers = ref([])
const pantryItems = ref([])
const loading = ref(true)
const guardando = ref(false)
const groupId = ref(null)
const desplazamientoSemanas = ref(0)

// Estado del modal de comprobación IA
const checkModalAbierto = ref(false)
const checkLoading = ref(false)
const checkError = ref(null)
const checkResult = ref(null)
const checkRecipeName = ref('')

const textoSemanaActual = computed(() => {
  if (desplazamientoSemanas.value === 0) return 'Esta Semana'
  if (desplazamientoSemanas.value === 1) return 'Próxima Semana'
  if (desplazamientoSemanas.value > 1) return `En +${desplazamientoSemanas.value} Semanas`
  return `Hace ${Math.abs(desplazamientoSemanas.value)} Semanas`
})

const calcularDiasSemana = () => {
  const hoy = new Date()
  const diaActualSemana = hoy.getDay()
  const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana
  
  const lunesBase = new Date(hoy)
  lunesBase.setDate(hoy.getDate() + distanciaAlLunes)

  const lunesSeleccionado = new Date(lunesBase)
  lunesSeleccionado.setDate(lunesBase.getDate() + (desplazamientoSemanas.value * 7))

  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const listaDias = []

  for (let i = 0; i < 7; i++) {
    const fechaDia = new Date(lunesSeleccionado)
    fechaDia.setDate(lunesSeleccionado.getDate() + i)

    const fechaISO = `${fechaDia.getFullYear()}-${String(fechaDia.getMonth() + 1).padStart(2, '0')}-${String(fechaDia.getDate()).padStart(2, '0')}`
    const fechaFormateada = fechaDia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

    listaDias.push({
      nombre: nombresDias[i],
      fechaISO,
      fechaFormateada,
      comida: '',
      cena: '',
      esHoy: fechaDia.toDateString() === hoy.toDateString()
    })
  }
  diasSemana.value = listaDias
}

const cargarTodo = async () => {
  if (!groupId.value || !diasSemana.value.length) return
  
  const lunesISO = diasSemana.value[0].fechaISO
  
  try {
    const [datosBD, resRecetas, resTuppers, resPantry] = await Promise.all([
      getMeals(groupId.value, lunesISO),
      getRecipes(groupId.value).catch(() => recetas.value),
      getTupperwares(groupId.value).catch(() => tuppers.value),
      getPantryItems(groupId.value).catch(() => [])
    ])

    diasSemana.value.forEach(dia => {
      dia.comida = datosBD?.[dia.fechaISO]?.comida || ''
      dia.cena = datosBD?.[dia.fechaISO]?.cena || ''
    })

    recetas.value = resRecetas || []
    tuppers.value = resTuppers || []
    pantryItems.value = resPantry || []

    await procesarConsumoTuppers()
  } catch (error) {
    console.error("Error sincronizando los datos del calendario:", error)
  } finally {
    loading.value = false
  }
}

const procesarConsumoTuppers = async () => {
  if (!groupId.value || !tuppers.value.length) return
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const processedKey = `processed_tuppers_${groupId.value}`
  let processed = JSON.parse(localStorage.getItem(processedKey) || '[]')
  let listadoActualTuppers = [...tuppers.value]
  let huboCambios = false
  
  for (const dia of diasSemana.value) {
    const [y, m, d] = dia.fechaISO.split('-').map(Number)
    const fechaDia = new Date(y, m - 1, d)
    
    if (fechaDia < hoy) {
      const slots = [
        { type: 'comida', valor: dia.comida },
        { type: 'cena', valor: dia.cena }
      ]
      
      for (const slot of slots) {
        if (!slot.valor) continue
        const mealId = `${dia.fechaISO}-${slot.type}`
        if (processed.includes(mealId)) continue

        if (slot.valor.includes('🍱')) {
          const tuppersEnSlot = slot.valor.split('+')
          
          for (let tupperStr of tuppersEnSlot) {
            const tupperTitle = tupperStr.replace('🍱', '').trim()
            if (!tupperTitle) continue

            const tupper = listadoActualTuppers.find(
              t => t.title.toLowerCase() === tupperTitle.toLowerCase() && t.servings > 0
            )
            
            if (tupper) {
              try {
                const nuevasRaciones = tupper.servings - 1
                if (nuevasRaciones > 0) {
                  await updateTupperware(groupId.value, tupper.id, {
                    title: tupper.title, servings: nuevasRaciones, location: tupper.location
                  })
                  tupper.servings = nuevasRaciones
                } else {
                  await deleteTupperware(groupId.value, tupper.id)
                  listadoActualTuppers = listadoActualTuppers.filter(t => t.id !== tupper.id)
                }
                huboCambios = true
              } catch (err) {
                console.error(`Error al descontar ración de: ${tupperTitle}`, err)
              }
            }
          }
          processed.push(mealId)
          huboCambios = true
        }
      }
    }
  }
  
  if (huboCambios) {
    localStorage.setItem(processedKey, JSON.stringify(processed))
    tuppers.value = listadoActualTuppers
  }
}

const cambiarSemana = (direccion) => {
  desplazamientoSemanas.value += direccion
  loading.value = true
  calcularDiasSemana()
  cargarTodo()
}

const abrirEditor = (dia, tipo) => {
  diaSeleccionado.value = dia
  tipoEdicion.value = tipo
  textoMenu.value = tipo === 'comida' ? dia.comida : dia.cena
  modalAbierto.value = true
}

const cerrarModal = () => { if (!guardando.value) modalAbierto.value = false }

/**
 * Extrae el nombre de la receta del texto del menú (quita el emoji 📖)
 * y la busca en la lista de recetas cargadas para obtener sus ingredientes.
 */
const obtenerRecetaDelTexto = (textoMenu) => {
  const parsed = parseMeal(textoMenu)
  // Comprueba el menú compartido primero
  const textoShared = parsed.shared || ''
  if (textoShared.includes('📖')) {
    const nombre = textoShared.replace('📖', '').trim()
    return recetas.value.find(r => r.title.toLowerCase() === nombre.toLowerCase()) || null
  }
  return null
}

const guardarMenu = async (nuevoTexto) => {
  if (!diaSeleccionado.value || !groupId.value) return
  
  const tipo = tipoEdicion.value
  const diaRef = diaSeleccionado.value
  const fallbackTexto = tipo === 'comida' ? diaRef.comida : diaRef.cena

  if (tipo === 'comida') diaRef.comida = nuevoTexto
  else diaRef.cena = nuevoTexto
  
  modalAbierto.value = false

  try {
    await saveMeal(groupId.value, diaRef.fechaISO, tipo, nuevoTexto)
    await procesarConsumoTuppers()
  } catch (error) {
    if (tipo === 'comida') diaRef.comida = fallbackTexto
    else diaRef.cena = fallbackTexto
    console.error("Error al guardar el menú de forma remota, revertido.", error)
    return
  }

  // --- Comprobación de despensa con IA ---
  // Solo si el texto contiene una receta con el emoji 📖
  if (nuevoTexto.includes('📖')) {
    const recetaEncontrada = obtenerRecetaDelTexto(nuevoTexto)
    if (recetaEncontrada && recetaEncontrada.ingredients) {
      await lanzarCheckDespensa(recetaEncontrada)
    }
  }
}

/**
 * Lanza la comprobación de la despensa contra la IA y abre el modal de resultado.
 * Se puede llamar desde el calendario (al guardar) o desde el modal de receta (manualmente).
 */
const lanzarCheckDespensa = async (receta) => {
  if (!groupId.value || !receta?.ingredients) return

  checkRecipeName.value = receta.title
  checkResult.value = null
  checkError.value = null
  checkLoading.value = true
  checkModalAbierto.value = true

  try {
    // Refrescar la despensa antes de consultar
    const despensaActual = await getPantryItems(groupId.value).catch(() => pantryItems.value)
    pantryItems.value = despensaActual || []

    const nombresEnDespensa = pantryItems.value.map(i => i.name)
    checkResult.value = await checkPantryWithAI(groupId.value, receta.ingredients, nombresEnDespensa)
  } catch (e) {
    console.error('Error en la comprobación de despensa:', e)
    checkError.value = 'No se pudo contactar con la IA. Inténtalo de nuevo.'
  } finally {
    checkLoading.value = false
  }
}

// Exponer función para que CalendarModalEditor pueda llamarla si se necesita
// (actualmente la llamada es interna tras guardar)

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) groupId.value = JSON.parse(savedGroup).id
  calcularDiasSemana()
  cargarTodo()
})
</script>

<style scoped>
.calendar-content { padding: 1rem; display: flex; flex-direction: column; gap: 1.2rem; padding-bottom: 5rem; }
.loading-fade { opacity: 0.75; transition: opacity 0.2s ease; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.loading-text { opacity: 0.5; font-size: 0.95rem; }
</style>