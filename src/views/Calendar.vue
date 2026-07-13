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
        v-v-slot:default
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

// 1. CARGA RÁPIDA: Intenta pintar la caché de la semana seleccionada
const cargarCacheSemana = () => {
  if (!diasSemana.value.length) return
  const lunesISO = diasSemana.value[0].fechaISO
  const cacheKey = `cache_calendar_${groupId.value}_${lunesISO}`
  const cacheLocal = localStorage.getItem(cacheKey)
  
  if (cacheLocal) {
    const datosBD = JSON.parse(cacheLocal)
    diasSemana.value.forEach(dia => {
      dia.comida = datosBD?.[dia.fechaISO]?.comida || ''
      dia.cena = datosBD?.[dia.fechaISO]?.cena || ''
    })
    loading.value = false // Quitamos loading porque ya hay contenido visual estable
  }
  
  // También cargamos recetas y tuppers del bolsillo si existen para que el modal no abra vacío
  const cacheRecetas = localStorage.getItem(`cache_recipes_${groupId.value}`)
  if (cacheRecetas) recetas.value = JSON.parse(cacheRecetas)
  
  const cacheTuppers = localStorage.getItem(`cache_tuppers_${groupId.value}`)
  if (cacheTuppers) tuppers.value = JSON.parse(cacheTuppers)
}

// 2. SINCRONIZACIÓN ASÍNCRONA: Descarga de red en paralelo sin colapsar el hilo principal
const cargarTodo = async () => {
  if (!groupId.value || !diasSemana.value.length) return
  
  const lunesISO = diasSemana.value[0].fechaISO
  
  try {
    // Solicitudes concurrentes mediante Promise.all
    const [datosBD, resRecetas, resTuppers] = await Promise.all([
      getMeals(groupId.value, lunesISO),
      getRecipes(groupId.value).catch(() => recetas.value),
      getTupperwares(groupId.value).catch(() => tuppers.value)
    ])

    // Actualizamos las celdas reactivamente
    diasSemana.value.forEach(dia => {
      dia.comida = datosBD?.[dia.fechaISO]?.comida || ''
      dia.cena = datosBD?.[dia.fechaISO]?.cena || ''
    })

    recetas.value = resRecetas || []
    tuppers.value = resTuppers || []

    // Guardamos las instantáneas en sus respectivas cachés locales
    localStorage.setItem(`cache_calendar_${groupId.value}_${lunesISO}`, JSON.stringify(datosBD || {}))
    localStorage.setItem(`cache_recipes_${groupId.value}`, JSON.stringify(recetas.value))
    localStorage.setItem(`cache_tuppers_${groupId.value}`, JSON.stringify(tuppers.value))

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
    localStorage.setItem(`cache_tuppers_${groupId.value}`, JSON.stringify(listadoActualTuppers))
  }
}

const cambiarSemana = (direccion) => {
  desplazamientoSemanas.value += direccion
  loading.value = true // Mostramos transparencia intermedia si se requiere descargar otra semana
  calcularDiasSemana()
  cargarCacheSemana() // Carga la caché local de esa semana al instante
  cargarTodo()        // Sincroniza con la base de datos
}

const abrirEditor = (dia, tipo) => {
  diaSeleccionado.value = dia
  tipoEdicion.value = tipo
  textoMenu.value = tipo === 'comida' ? dia.comida : dia.cena
  modalAbierto.value = true
}

const cerrarModal = () => { if (!guardando.value) modalAbierto.value = false }

// 3. OPTIMISTIC UI: Guardado inmediato en pantalla sin bloqueos de red
const guardarMenu = async (nuevoTexto) => {
  if (!diaSeleccionado.value || !groupId.value) return
  
  const tipo = tipoEdicion.value
  const diaRef = diaSeleccionado.value
  const fallbackTexto = tipo === 'comida' ? diaRef.comida : diaRef.cena

  // Actualización visual reactiva instantánea
  if (tipo === 'comida') diaRef.comida = nuevoTexto
  else diaRef.cena = nuevoTexto
  
  modalAbierto.value = false // Cerramos el modal inmediatamente para dar sensación de velocidad

  // Actualizar la caché de la semana en curso de inmediato
  const lunesISO = diasSemana.value[0].fechaISO
  const cacheKey = `cache_calendar_${groupId.value}_${lunesISO}`
  const estructuraCache = diasSemana.value.reduce((acc, d) => {
    acc[d.fechaISO] = { comida: d.comida, cena: d.cena }
    return acc
  }, {})
  localStorage.setItem(cacheKey, JSON.stringify(estructuraCache))

  try {
    await saveMeal(groupId.value, diaRef.fechaISO, tipo, nuevoTexto)
    await procesarConsumoTuppers()
  } catch (error) {
    // Si la API falla por falta de internet, revertimos con gracia
    if (tipo === 'comida') diaRef.comida = fallbackTexto
    else diaRef.cena = fallbackTexto
    console.error("Error al guardar el menú de forma remota, revertido.", error)
    
    // Sincronizar de nuevo el almacenamiento local con el fallback
    estructuraCache[diaRef.fechaISO][tipo] = fallbackTexto
    localStorage.setItem(cacheKey, JSON.stringify(estructuraCache))
  }
}

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) groupId.value = JSON.parse(savedGroup).id
  calcularDiasSemana()
  cargarCacheSemana() // 1º Carga local instantánea
  cargarTodo()        // 2º Petición de fondo
})
</script>

<style scoped>
.calendar-content { padding: 1rem; display: flex; flex-direction: column; gap: 1.2rem; padding-bottom: 5rem; }
.loading-fade { opacity: 0.75; transition: opacity 0.2s ease; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.loading-text { opacity: 0.5; font-size: 0.95rem; }
</style>