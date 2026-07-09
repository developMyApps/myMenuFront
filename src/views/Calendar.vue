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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import CalendarHeader from '../components/calendar/CalendarHeader.vue'
import CalendarDayCard from '../components/calendar/CalendarDayCard.vue'
import CalendarModalEditor from '../components/calendar/CalendarModalEditor.vue'

import { getMeals, saveMeal } from '../services/mealService'
import { getRecipes } from '../services/recipeService'
import { getTupperwares, updateTupperware, deleteTupperware } from '../services/tupperwareService'

const diasSemana = ref([])
const modalAbierto = ref(false)
const diaSeleccionado = ref(null)
const tipoEdicion = ref('')
const textoMenu = ref('')

const recetas = ref([])
const tuppers = ref([])
const loading = ref(true)
const guardando = ref(false)
const groupId = ref(null)
const desplazamientoSemanas = ref(0)

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
      fechaISO: fechaISO,
      fechaFormateada: fechaFormateada,
      comida: '',
      cena: '',
      esHoy: fechaDia.toDateString() === hoy.toDateString()
    })
  }
  diasSemana.value = listaDias
}

const cargarMenusDesdeBD = async () => {
  if (!groupId.value || !diasSemana.value.length) return
  loading.value = true
  try {
    const datosBD = await getMeals(groupId.value, diasSemana.value[0].fechaISO)
    diasSemana.value.forEach(dia => {
      dia.comida = datosBD?.[dia.fechaISO]?.comida || ''
      dia.cena = datosBD?.[dia.fechaISO]?.cena || ''
    })
  } catch (error) {
    console.error("Error al cargar los menús:", error)
  } finally {
    loading.value = false
  }
}

const cargarRecetas = async () => {
  if (!groupId.value) return
  try { recetas.value = await getRecipes(groupId.value) || [] } catch { recetas.value = [] }
}

const cargarTuppers = async () => {
  if (!groupId.value) return
  try { tuppers.value = await getTupperwares(groupId.value) || [] } catch { tuppers.value = [] }
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
    
    // Si el día ya ha transcurrido en el pasado
    if (fechaDia < hoy) {
      const slots = [
        { type: 'comida', valor: dia.comida },
        { type: 'cena', valor: dia.cena }
      ]
      
      for (const slot of slots) {
        if (!slot.valor) continue
        
        // Identificador único para este slot de comida/cena en este día específico
        const mealId = `${dia.fechaISO}-${slot.type}`
        
        // Si este slot ya fue procesado y descontado en el pasado, nos lo saltamos
        if (processed.includes(mealId)) continue

        // Detectamos si el slot contiene al menos un tupper
        if (slot.valor.includes('🍱')) {
          // Separamos por el símbolo "+" por si hay múltiples tuppers combinados
          // Ejemplo: "🍱 Arroz + 🍱 Lentejas" -> ["🍱 Arroz", "🍱 Lentejas"]
          const tuppersEnSlot = slot.valor.split('+')
          
          for (let tupperStr of tuppersEnSlot) {
            // Limpiamos espacios y emojis para quedarnos solo con el nombre exacto
            const tupperTitle = tupperStr.replace('🍱', '').trim()
            if (!tupperTitle) continue

            // Buscar si existe ese tupper en nuestro almacén con raciones disponibles
            const tupper = listadoActualTuppers.find(
              t => t.title.toLowerCase() === tupperTitle.toLowerCase() && t.servings > 0
            )
            
            if (tupper) {
              try {
                const nuevasRaciones = tupper.servings - 1
                if (nuevasRaciones > 0) {
                  // Actualizar raciones en PostgreSQL mediante el servicio
                  await updateTupperware(groupId.value, tupper.id, {
                    title: tupper.title,
                    servings: nuevasRaciones,
                    location: tupper.location
                  })
                  tupper.servings = nuevasRaciones
                } else {
                  // Si era la última ración, se elimina del inventario
                  await deleteTupperware(groupId.value, tupper.id)
                  listadoActualTuppers = listadoActualTuppers.filter(t => t.id !== tupper.id)
                }
                huboCambios = true
              } catch (err) {
                console.error(`Error al descontar ración de: ${tupperTitle}`, err)
              }
            }
          }
          
          // Una vez analizados todos los tuppers de este slot, lo marcamos como procesado
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

const guardarMenu = async (nuevoTexto) => {
  if (!diaSeleccionado.value || !groupId.value) return
  guardando.value = true
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
    await cargarMenusDesdeBD()
  } finally {
    guardando.value = false
  }
}

const cargarTodo = async () => {
  await Promise.all([cargarMenusDesdeBD(), cargarRecetas(), cargarTuppers()])
  await procesarConsumoTuppers()
}

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) groupId.value = JSON.parse(savedGroup).id
  calcularDiasSemana()
  cargarTodo()
})
</script>

<style scoped>
.calendar-content { padding: 1rem; display: flex; flex-direction: column; gap: 1.2rem; padding-bottom: 5rem; }
.loading-fade { opacity: 0.6; transition: opacity 0.2s ease; pointer-events: none; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.loading-text { opacity: 0.5; font-size: 0.95rem; }
</style>