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
          
          <!-- Contenedor del Input + Botón de buscar recetas -->
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
              title="Elegir de mis recetas"
            >
              📖
            </button>
          </div>

          <!-- Mini-desplegable de selección rápida de Recetas -->
          <div v-if="mostrarSelectorRecetas" class="recipe-dropdown-panel glass-effect">
            <h4>Mis Recetas Guardadas</h4>
            <div v-if="recetas.length === 0" class="empty-dropdown">
              No tienes recetas guardadas todavía.
            </div>
            <ul v-else class="recipe-dropdown-list">
              <li 
                v-for="receta in recetas" 
                :key="receta.id" 
                @click="seleccionarReceta(receta.title)"
              >
                🍳 {{ receta.title }}
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
import api from '../services/api' 

const diasSemana = ref([])
const modalAbierto = ref(false)
const diaSeleccionado = ref(null)
const tipoEdicion = ref('')
const textoMenu = ref('')

// Estados para Recetas
const recetas = ref([])
const mostrarSelectorRecetas = ref(false)

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
    const respuesta = await api.get(`/groups/${groupId.value}/meals`, {
      params: { fecha_inicio: fechaInicioSemana }
    })
    
    const datosBD = respuesta.data

    diasSemana.value.forEach(dia => {
      if (datosBD && datosBD[dia.fechaISO]) {
        dia.comida = datosBD[dia.fechaISO].comida || ''
        dia.cena = datosBD[dia.fechaISO].cena || ''
      } else {
        dia.comida = ''
        dia.cena = ''
      }
    })
  } catch (error) {
    console.error("Error al cargar los menús:", error)
  } finally {
    loading.value = false
  }
}

// Carga las recetas disponibles del grupo
const cargarRecetas = async () => {
  if (!groupId.value) return
  try {
    const respuesta = await api.get(`/groups/${groupId.value}/recipes`)
    recetas.value = respuesta.data || respuesta
  } catch (error) {
    // Silenciamos el error si es un 404 (porque aún no está creado en el back)
    console.warn("El servicio de recetas aún no está listo en el backend, se omiten recetas.")
    recetas.value = [] 
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
  mostrarSelectorRecetas.value = false // Reseteamos panel de recetas
  modalAbierto.value = true
}

const cerrarModal = () => {
  if (guardando.value) return 
  modalAbierto.value = false
  diaSeleccionado.value = null
}

// 🛠️ FUNCIÓN NUEVA: Permite cerrar el modal en cualquier momento (incluso si está guardando en background)
const forzarCerrarModal = () => {
  modalAbierto.value = false
  diaSeleccionado.value = null
  mostrarSelectorRecetas.value = false
}

const toggleSelectorRecetas = () => {
  mostrarSelectorRecetas.value = !mostrarSelectorRecetas.value
}

const seleccionarReceta = (tituloReceta) => {
  textoMenu.value = tituloReceta
  mostrarSelectorRecetas.value = false // Ocultamos el panel tras seleccionar
}

const guardarMenu = async () => {
  if (!diaSeleccionado.value || !groupId.value) return

  guardando.value = true
  const nuevoTexto = textoMenu.value 
  const tipo = tipoEdicion.value
  
  // 🌟 GUARDAMOS LAS VARIABLES ANTES DE CERRAR LA MODAL
  const fechaISO = diaSeleccionado.value.fechaISO
  const diaRef = diaSeleccionado.value 

  // 1. Actualización optimista instantánea en local
  if (tipo === 'comida') {
    diaRef.comida = nuevoTexto
  } else {
    diaRef.cena = nuevoTexto
  }
  
  // 2. Ahora sí cerramos la modal seguros de que no romperá nada
  forzarCerrarModal()

  try {
    // 3. Enviamos al backend usando las variables guardadas
    await api.post(`/groups/${groupId.value}/meals`, null, {
      params: {
        fecha: fechaISO,
        meal_type: tipo,
        texto_menu: nuevoTexto
      }
    })
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
  await Promise.all([cargarMenusDesdeBD(), cargarRecetas()])
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
  margin-top: -0.5rem;
  margin-bottom: 1.2rem;
}
.modal-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
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
