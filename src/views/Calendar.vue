<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Calendario</h1>
      <div class="week-navigation">
        <button class="nav-btn" :disabled="loading" @click="cambiarSemana(-1)">◀</button>
        <div class="week-indicator">{{ textoSemanaActual }}</div>
        <button class="nav-btn" :disabled="loading" @click="cambiarSemana(1)">▶</button>
      </div>
    </header>

    <div v-if="loading && diasSemana.length === 0" class="text-center py-8">
      <p class="loading-text">Cargando calendario...</p>
    </div>

    <main v-else class="calendar-content" :class="{ 'loading-fade': loading }">
      <div 
        v-for="dia in diasSemana" 
        :key="dia.fechaISO" 
        class="card glass-effect day-card"
        :class="{ 'is-today': dia.esHoy }"
      >
        <div class="day-header">
          <h2>{{ dia.nombre }}</h2>
          <span class="day-date">{{ dia.fechaFormateada }}</span>
        </div>

        <div class="meals-container">
          <div class="meal-slot" @click="abrirEditor(dia, 'comida')">
            <div class="meal-meta">
              <span class="meal-icon">☀️</span>
              <span class="meal-label">Comida</span>
            </div>
            <p class="meal-text" :class="{ 'empty-text': !dia.comida }">
              {{ dia.comida || 'Añadir menú...' }}
            </p>
          </div>

          <div class="meal-slot" @click="abrirEditor(dia, 'cena')">
            <div class="meal-meta">
              <span class="meal-icon">🌙</span>
              <span class="meal-label">Cena</span>
            </div>
            <p class="meal-text" :class="{ 'empty-text': !dia.cena }">
              {{ dia.cena || 'Añadir menú...' }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Edición Mejorada -->
    <Transition name="fade">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="forzarCerrarModal">
        <div class="modal-content glass-effect">
          <h3>Editar {{ tipoEdicion }}</h3>
          <p class="modal-subtitle">{{ diaSeleccionado?.nombre }} - {{ diaSeleccionado?.fechaFormateada }}</p>
          
          <!-- Contenedor del Input + Botones de selección rápida -->
          <div class="input-recipe-group">
            <input 
              v-model="textoMenu" 
              type="text" 
              placeholder="Ej: Macarrones con tomate"
              class="modal-input"
              @keyup.enter="guardarMenu"
              :disabled="guardando"
            />
            <button 
              type="button" 
              class="btn-recipe-trigger" 
              @click="toggleSelectorRecetas"
              :class="{ 'btn-trigger-active': mostrarSelectorRecetas }"
              title="Elegir de mis recetas"
            >
              📖
            </button>
            <button 
              type="button" 
              class="btn-recipe-trigger" 
              @click="toggleSelectorTuppers"
              :class="{ 'btn-trigger-active': mostrarSelectorTuppers }"
              title="Elegir de mis tuppers"
            >
              🍱
            </button>
          </div>

          <!-- 1. Mini-desplegable de selección rápida de Recetas -->
          <div v-if="mostrarSelectorRecetas" class="recipe-dropdown-panel glass-effect">
            <div class="dropdown-header-area">
              <h4>Mis Recetas Guardadas</h4>
              <!-- Input de búsqueda interno -->
              <input 
                v-model="searchQueryDropdown" 
                type="text" 
                placeholder="🔍 Buscar receta..." 
                class="dropdown-search-input"
              />
            </div>
            
            <div v-if="recetasFiltradasDropdown.length === 0" class="empty-dropdown">
              No se encontraron recetas con ese nombre.
            </div>
            <ul v-else class="recipe-dropdown-list">
              <li 
                v-for="receta in recetasFiltradasDropdown" 
                :key="receta.id" 
                @click="seleccionarReceta(receta.title)"
              >
                🍳 {{ receta.title }}
              </li>
            </ul>
          </div>

          <!-- 2. Mini-desplegable de selección rápida de Tuppers -->
          <div v-if="mostrarSelectorTuppers" class="recipe-dropdown-panel glass-effect">
            <div class="dropdown-header-area">
              <h4>Comida en Nevera / Congelador</h4>
              <!-- Input de búsqueda interno -->
              <input 
                v-model="searchQueryDropdown" 
                type="text" 
                placeholder="🔍 Buscar tupper..." 
                class="dropdown-search-input"
              />
            </div>
            
            <div v-if="tuppersFiltradosDropdown.length === 0" class="empty-dropdown">
              No quedan tuppers disponibles con ese nombre.
            </div>
            <ul v-else class="recipe-dropdown-list">
              <li 
                v-for="tupper in tuppersFiltradosDropdown" 
                :key="tupper.id" 
                @click="seleccionarTupper(tupper.title)"
              >
                🍱 {{ tupper.title }} <span class="tupper-badge-servings">({{ tupper.servings }} {{ tupper.servings === 1 ? 'rac.' : 'racs.' }})</span>
              </li>
            </ul>
          </div>

          <div class="modal-actions mt-4">
            <button class="btn btn-secondary" :disabled="guardando" @click="forzarCerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardarMenu">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getMeals, saveMeal } from '../services/mealService'
import { getRecipes } from '../services/recipeService'
import { getTupperwares, updateTupperware, deleteTupperware } from '../services/tupperwareService'

const diasSemana = ref([])
const modalAbierto = ref(false)
const diaSeleccionado = ref(null)
const tipoEdicion = ref('')
const textoMenu = ref('')

// Estados para Recetas y Tuppers
const recetas = ref([])
const tuppers = ref([])
const mostrarSelectorRecetas = ref(false)
const mostrarSelectorTuppers = ref(false)
const searchQueryDropdown = ref('')

// Estados de carga
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

// Búsqueda filtrada en tiempo real para desplegables
const recetasFiltradasDropdown = computed(() => {
  if (!searchQueryDropdown.value.trim()) return recetas.value
  const query = searchQueryDropdown.value.toLowerCase()
  return recetas.value.filter(r => r.title.toLowerCase().includes(query))
})

const tuppersFiltradosDropdown = computed(() => {
  // Solo sugerimos tuppers que tengan raciones disponibles
  const tuppersActivos = tuppers.value.filter(t => t.servings > 0)
  if (!searchQueryDropdown.value.trim()) return tuppersActivos
  const query = searchQueryDropdown.value.toLowerCase()
  return tuppersActivos.filter(t => t.title.toLowerCase().includes(query))
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

    const año = fechaDia.getFullYear()
    const mes = String(fechaDia.getMonth() + 1).padStart(2, '0')
    const diaNum = String(fechaDia.getDate()).padStart(2, '0')
    const fechaISO = `${año}-${mes}-${diaNum}`
    
    const fechaFormateada = fechaDia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    const esHoy = fechaDia.toDateString() === hoy.toDateString()

    listaDias.push({
      nombre: nombresDias[i],
      fechaISO: fechaISO,
      fechaFormateada: fechaFormateada,
      comida: '',
      cena: '',
      esHoy: esHoy
    })
  }
  diasSemana.value = listaDias
}

const cargarMenusDesdeBD = async () => {
  if (!groupId.value || !diasSemana.value.length) return
  
  loading.value = true
  const fechaInicioSemana = diasSemana.value[0].fechaISO 
  
  try {
    const datosBD = await getMeals(groupId.value, fechaInicioSemana)

    diasSemana.value.forEach(dia => {
      if (datosBD && datosBD[dia.fechaISO]) {
        dia.comida = datosBD[dia.fechaISO].comida || ''
        dia.cena = datosBD[dia.fechaISO].cena || ''
      } else {
        dia.comida = ''
        dia.cena = ''
      }
    })
    return datosBD
  } catch (error) {
    console.error("Error al cargar los menús:", error)
    return {}
  } finally {
    loading.value = false
  }
}

// Carga las recetas disponibles del grupo
const cargarRecetas = async () => {
  if (!groupId.value) return
  try {
    const datosRecetas = await getRecipes(groupId.value)
    recetas.value = datosRecetas || []
  } catch (error) {
    console.warn("El servicio de recetas aún no está listo en el backend, se omiten recetas.")
    recetas.value = [] 
  }
}

// Carga los tupperwares disponibles en nevera/congelador
const cargarTuppers = async () => {
  if (!groupId.value) return
  try {
    const datosTuppers = await getTupperwares(groupId.value)
    tuppers.value = datosTuppers || []
  } catch (error) {
    console.warn("No se pudieron cargar los tupperwares.")
    tuppers.value = []
  }
}

// Algoritmo de consumo automático de tuppers de días pasados
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
    
    // Si la fecha del calendario es anterior a hoy (Día ya transcurrido en el pasado)
    if (fechaDia < hoy) {
      const slots = [
        { type: 'comida', valor: dia.comida },
        { type: 'cena', valor: dia.cena }
      ]
      
      for (const slot of slots) {
        // Si el menú tiene el prefijo de tupperware
        if (slot.valor && slot.valor.startsWith('🍱 ')) {
          const mealId = `${dia.fechaISO}-${slot.type}`
          
          // Si no ha sido descontado previamente
          if (!processed.includes(mealId)) {
            const tupperTitle = slot.valor.replace('🍱 ', '').trim()
            
            // Buscar si existe ese tupper todavía con raciones disponibles
            const tupper = listadoActualTuppers.find(
              t => t.title.toLowerCase() === tupperTitle.toLowerCase() && t.servings > 0
            )
            
            if (tupper) {
              try {
                const nuevasRaciones = tupper.servings - 1
                if (nuevasRaciones > 0) {
                  await updateTupperware(groupId.value, tupper.id, {
                    title: tupper.title,
                    servings: nuevasRaciones,
                    location: tupper.location
                  })
                  tupper.servings = nuevasRaciones
                } else {
                  // Si se consumió la última ración, se elimina de la base de datos
                  await deleteTupperware(groupId.value, tupper.id)
                  listadoActualTuppers = listadoActualTuppers.filter(t => t.id !== tupper.id)
                }
                processed.push(mealId)
                huboCambios = true
              } catch (err) {
                console.error("Error al descontar ración de tupper de forma automática:", err)
              }
            } else {
              // Si no existe, lo marcamos como procesado igualmente para evitar peticiones redundantes
              processed.push(mealId)
              huboCambios = true
            }
          }
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
  cargarMenusBasedeDatosYRecetas()
}

const abrirEditor = (dia, tipo) => {
  diaSeleccionado.value = dia
  tipoEdicion.value = tipo
  textoMenu.value = tipo === 'comida' ? dia.comida : dia.cena
  mostrarSelectorRecetas.value = false 
  mostrarSelectorTuppers.value = false
  searchQueryDropdown.value = ''
  modalAbierto.value = true
}

const cerrarModal = () => {
  if (guardando.value) return 
  modalAbierto.value = false
  diaSeleccionado.value = null
}

const forzarCerrarModal = () => {
  modalAbierto.value = false
  diaSeleccionado.value = null
  mostrarSelectorRecetas.value = false
  mostrarSelectorTuppers.value = false
  searchQueryDropdown.value = ''
}

const toggleSelectorRecetas = () => {
  mostrarSelectorTuppers.value = false
  searchQueryDropdown.value = ''
  mostrarSelectorRecetas.value = !mostrarSelectorRecetas.value
}

const toggleSelectorTuppers = () => {
  mostrarSelectorRecetas.value = false
  searchQueryDropdown.value = ''
  mostrarSelectorTuppers.value = !mostrarSelectorTuppers.value
}

const seleccionarReceta = (tituloReceta) => {
  textoMenu.value = tituloReceta
  mostrarSelectorRecetas.value = false 
}

const seleccionarTupper = (tituloTupper) => {
  // Añadimos el identificador de tupper al inicio para controlarlo en la sincronización
  textoMenu.value = `🍱 ${tituloTupper}`
  mostrarSelectorTuppers.value = false
}

const guardarMenu = async () => {
  if (!diaSeleccionado.value || !groupId.value) return

  guardando.value = true
  const nuevoTexto = textoMenu.value 
  const tipo = tipoEdicion.value
  
  const fechaISO = diaSeleccionado.value.fechaISO
  const diaRef = diaSeleccionado.value 

  // 1. Actualización optimista instantánea en local
  if (tipo === 'comida') {
    diaRef.comida = nuevoTexto
  } else {
    diaRef.cena = nuevoTexto
  }
  
  forzarCerrarModal()

  try {
    await saveMeal(groupId.value, fechaISO, tipo, nuevoTexto)
    // Tras guardar, volvemos a procesar el consumo de tuppers por si se programó en el pasado
    await procesarConsumoTuppers()
  } catch (error) {
    console.error("Error al guardar el menú:", error)
    alert("Error de red. No se pudo sincronizar el menú.")
    
    // Rollback en caso de fallo
    if (tipo === 'comida') {
      diaRef.comida = ''
    } else {
      diaRef.cena = ''
    }
    await cargarMenusDesdeBD()
  } finally {
    guardando.value = false
  }
}

const cargarMenusBasedeDatosYRecetas = async () => {
  await Promise.all([cargarMenusDesdeBD(), cargarRecetas(), cargarTuppers()])
  await procesarConsumoTuppers()
}

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
  }
  
  calcularDiasSemana()
  cargarMenusBasedeDatosYRecetas()
})
</script>

<style scoped>
.calendar-content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1rem;
}

.day-card {
  text-align: left;
  padding: 1.25rem;
  border-radius: 16px;
  position: relative;
  transition: transform 0.2s;
}

.day-card.is-today {
  border: 1px solid #ffd166;
  background: rgba(255, 209, 102, 0.05);
  box-shadow: 0 0 15px rgba(255, 209, 102, 0.15);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.5rem;
}

.day-header h2 {
  font-size: 1.2rem;
  color: #ffffff;
  margin: 0;
  font-weight: 700;
}

.day-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.meals-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meal-slot {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  gap: 1rem;
}

.meal-slot:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.meal-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 90px;
  flex-shrink: 0;
}

.meal-icon {
  font-size: 1.2rem;
}

.meal-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffd166;
}

.meal-text {
  margin: 0;
  font-size: 0.95rem;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.meal-text.empty-text {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

/* Modales y Controles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 440px;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: left;
}

.modal-content h3 {
  margin: 0 0 0.25rem 0;
  color: #e0b34b;
  font-size: 1.3rem;
}

/* .modal-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  /* margin-bottom: 1.25rem; 
  margin-top: 10rem;
} */

.input-recipe-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* .modal-input {
  flex-grow: 1;
  background-color: #a2d2ff;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.468);
  border-radius: 10px;
  color: #ffffff;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
} */

.modal-input:focus {
  border-color: #ffd166;
}

.btn-recipe-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-recipe-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #ffd166;
}

.btn-trigger-active {
  background: rgba(255, 209, 102, 0.2) !important;
  border-color: #ffd166 !important;
}

/* Panel Desplegable */
.recipe-dropdown-panel {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  max-height: 240px;
  display: flex;
  flex-direction: column;
}

.dropdown-header-area {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
}

.dropdown-header-area h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #ffd166;
  font-weight: 600;
}

.dropdown-search-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
}

.dropdown-search-input:focus {
  border-color: #ffd166;
}

.empty-dropdown {
  padding: 1.2rem;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
}

.recipe-dropdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.recipe-dropdown-list li {
  padding: 0.7rem 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  text-align: left;
  display: flex;
  justify-content: space-between;
}

.recipe-dropdown-list li:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffd166;
}

.tupper-badge-servings {
  font-size: 0.75rem;
  color: #a2d2ff;
  font-weight: 500;
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.week-indicator {
  font-weight: 600;
  font-size: 0.95rem;
  color: #ffd166;
  min-width: 120px;
  text-align: center;
}

.loading-fade {
  opacity: 0.4;
  pointer-events: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.mt-4 { margin-top: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.loading-text { opacity: 0.5; font-size: 0.95rem; }
</style>

<style scoped>
/* Estilos para el selector de recetas integrado en la modal */
.input-recipe-group {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.modal-input {
  flex: 1;
}

.btn-recipe-trigger {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  font-size: 1.2rem;
  padding: 0 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  align-items: center;
}

.btn-recipe-trigger:hover {
  background: rgba(255, 255, 255, 0.3);
}

.recipe-dropdown-panel {
  margin-top: 0.7rem;
  background: rgba(30, 30, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
  text-align: left;
}

.recipe-dropdown-panel h4 {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recipe-dropdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recipe-dropdown-list li {
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.15s;
}

.recipe-dropdown-list li:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffd166;
}

.empty-dropdown {
  font-size: 0.9rem;
  opacity: 0.5;
  padding: 0.5rem;
}

.mt-4 { margin-top: 1rem; }
</style>

<style scoped>
/* Opcional: Una clase de transición suave para cuando cambies de semana */
.loading-fade {
  opacity: 0.6;
  transition: opacity 0.2s ease;
  pointer-events: none; /* Evita clics extraños mientras recarga */
}
</style>

<style scoped>
.calendar-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding-bottom: 5rem;
}
.week-indicator {
  font-size: 0.9rem;
  background: #4caf50;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
}
.day-card {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}
.day-card.is-today {
  border-left: 4px solid #4caf50;
  background: rgba(76, 175, 80, 0.05);
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
}
.day-header h2 {
  font-size: 1.2rem;
  margin: 0;
}
.day-date {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
}
.meals-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.meal-slot {
  display: flex;
  align-items: center;
  padding: 0.7rem;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.meal-slot:hover {
  background: #f0f0f0;
}
.meal-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 90px;
  flex-shrink: 0;
}
.meal-icon {
  font-size: 1.1rem;
}
.meal-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}
.meal-text {
  margin: 0;
  font-size: 0.95rem;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0.5rem;
}
.meal-text.empty-text {
  color: #bbb;
  font-style: italic;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}
.modal-content {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
.modal-content h3 {
  margin-top: 0;
  text-transform: capitalize;
  font-size: 1.3rem;
}
.modal-subtitle {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 1.2rem;
}
.modal-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccccccd7;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  outline: none;
  box-sizing: border-box;
}
.modal-input:focus {
  border-color: #4caf50;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-secondary {
  background: #e0e0e0;
  color: #333;
}
.btn-primary {
  background: #4caf50;
  color: white;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.week-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0f0f0;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  color: #333;
  padding: 0.2rem 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:active {
  transform: scale(0.85);
}

.week-indicator {
  font-size: 0.85rem;
  font-weight: 700;
  color: #4caf50;
  min-width: 120px;
  text-align: center;
  background: none;
  padding: 0;
}

</style>
