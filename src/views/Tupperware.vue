<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Congelador y Tuppers</h1>
      <button @click="abrirModalNuevoTupper" class="btn btn-primary btn-add-tupper">
        ❄️ Congelar Tupper
      </button>
    </header>

    <main class="tupper-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para gestionar tus tupperwares.</p>
      </div>

      <template v-else>
        <div class="search-container mb-4 glass-effect">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar en el congelador o nevera... (ej: Lentejas)" 
            class="search-input"
          />
        </div>

        <div v-if="loading" class="text-center py-8">
          <p class="loading-text">Abriendo el congelador...</p>
        </div>

        <div v-else-if="tuppersFiltrados.length > 0" class="tuppers-grid">
          <div 
            v-for="tupper in tuppersFiltrados" 
            :key="tupper.id" 
            class="tupper-card card glass-effect"
          >
            <div class="tupper-card-header">
              <span class="tupper-icon">🍱</span>
              <div class="tupper-info">
                <h3 class="tupper-title">{{ tupper.title }}</h3>
                <span v-if="tupper.location" class="tupper-location">
                  {{ tupper.location === 'Congelador' ? '❄️' : '🥦' }} {{ tupper.location }}
                </span>
              </div>
            </div>

            <div class="tupper-card-footer">
              <div class="tupper-date">
                <span class="date-lbl">Guardado el</span>
                <span class="date-val">{{ formatearFecha(tupper.frozen_at) }}</span>
              </div>

              <div class="servings-control">
                <button 
                  class="btn-serving-minus" 
                  @click="cambiarRacionesLocal(tupper, -1)"
                  :disabled="guardandoId === tupper.id"
                >
                  -
                </button>
                <div class="servings-badge">
                  <span class="servings-count">{{ tupper.servings }}</span>
                  <span class="servings-lbl">{{ tupper.servings === 1 ? 'rac.' : 'racs.' }}</span>
                </div>
                <button 
                  class="btn-serving-plus" 
                  @click="cambiarRacionesLocal(tupper, 1)"
                  :disabled="guardandoId === tupper.id"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              v-if="tupper.servings === 0" 
              class="btn-consume-all"
              @click="abrirModalConfirmarEliminar(tupper)"
            >
              🗑️ Quitar del inventario
            </button>
          </div>
        </div>

        <div v-else class="card glass-effect text-center py-6">
          <p class="empty-state">
            {{ searchQuery ? 'No hay ningún tupper con ese nombre o ubicación.' : '¡Tu inventario está vacío! Dale al botón superior para guardar tu comida.' }}
          </p>
        </div>
      </template>
    </main>

    <Transition name="modal-fade">
      <div v-if="modalCrearAbierta" class="modal-overlay" @click.self="modalCrearAbierta = false">
        <div class="modal-content glass-effect tupper-modal">
          <div class="modal-header">
            <h2>🍱 Registrar Tupper</h2>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="modal-label">¿Qué comida es?</label>
              <input 
                v-model="nuevoTupper.title" 
                type="text" 
                placeholder="Ej: Lentejas con arroz" 
                class="modal-input"
                :disabled="modalCargando"
              />
            </div>

            <div class="form-row mt-4">
              <div class="form-group flex-1">
                <label class="modal-label">Raciones iniciales</label>
                <input 
                  v-model.number="nuevoTupper.servings" 
                  type="number" 
                  min="1" 
                  class="modal-input"
                  :disabled="modalCargando"
                />
              </div>
              
              <div class="form-group flex-2">
                <label class="modal-label">¿Dónde está guardado?</label>
                <select 
                  v-model="nuevoTupper.location" 
                  class="modal-select"
                  :disabled="modalCargando"
                >
                  <option value="Congelador">❄️ Congelador</option>
                  <option value="Nevera">🥦 Nevera</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" :disabled="modalCargando" @click="modalCrearAbierta = false">Cancelar</button>
            <button 
              class="btn btn-primary" 
              :disabled="modalCargando || !nuevoTupper.title.trim() || nuevoTupper.servings < 1" 
              @click="handleCrearTupper"
            >
              {{ modalCargando ? 'Guardando...' : 'Guardar Comida' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="modalEliminarAbierta" class="modal-overlay" @click.self="modalEliminarAbierta = false">
        <div class="modal-content glass-effect confirm-modal">
          <div class="modal-header">
            <h2>⚠️ ¿Eliminar tupperware?</h2>
          </div>
          
          <div class="modal-body">
            <p class="confirm-text">
              ¿Estás seguro de que quieres quitar el tupper de <strong>"{{ tupperAEliminar?.title }}"</strong> del inventario? Esta acción no se puede deshacer.
            </p>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" :disabled="modalCargando" @click="modalEliminarAbierta = false">Cancelar</button>
            <button 
              class="btn btn-danger" 
              :disabled="modalCargando" 
              @click="handleEliminarTupper"
            >
              {{ modalCargando ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getTupperwares, createTupperware, updateTupperware, deleteTupperware } from '../services/api'

const tuppers = ref([])
const loading = ref(true)
const modalCargando = ref(false)
const guardandoId = ref(null) 
const groupId = ref(null)
const searchQuery = ref('')

// Estados de ventanas modales
const modalCrearAbierta = ref(false)
const modalEliminarAbierta = ref(false)

// Datos reactivos
const nuevoTupper = ref({ title: '', servings: 1, location: 'Congelador' }) // Por defecto Congelador
const tupperAEliminar = ref(null)

// Filtro en tiempo real por título o ubicación
const tuppersFiltrados = computed(() => {
  let resultado = [...tuppers.value]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    resultado = resultado.filter(t => 
      t.title.toLowerCase().includes(query) || 
      (t.location && t.location.toLowerCase().includes(query))
    )
  }
  return resultado
})

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    cargarTuppers()
  } else {
    loading.value = false
  }
})

const cargarTuppers = async () => {
  try {
    const response = await getTupperwares(groupId.value)
    tuppers.value = response.data || response
  } catch (error) {
    console.error("Error cargando el inventario de tuppers:", error)
  } finally {
    loading.value = false
  }
}

const abrirModalNuevoTupper = () => {
  nuevoTupper.value = { title: '', servings: 1, location: 'Congelador' }
  modalCrearAbierta.value = true
}

const handleCrearTupper = async () => {
  if (!nuevoTupper.value.title.trim() || !groupId.value) return
  modalCargando.value = true
  
  try {
    const response = await createTupperware(groupId.value, {
      title: nuevoTupper.value.title,
      servings: nuevoTupper.value.servings,
      location: nuevoTupper.value.location
    })
    tuppers.value.unshift(response.data || response)
    modalCrearAbierta.value = false
  } catch (error) {
    console.error("Error al registrar el tupperware:", error)
    alert("No se pudo guardar el tupperware.")
  } finally {
    modalCargando.value = false
  }
}

// Cambiar raciones en caliente (+ / -)
const cambiarRacionesLocal = async (tupper, cambio) => {
  const nuevasRaciones = tupper.servings + cambio
  if (nuevasRaciones < 0) return 
  
  guardandoId.value = tupper.id
  
  try {
    const response = await updateTupperware(groupId.value, tupper.id, {
      title: tupper.title,
      servings: nuevasRaciones,
      location: tupper.location
    })
    
    const index = tuppers.value.findIndex(t => t.id === tupper.id)
    if (index !== -1) {
      tuppers.value[index] = response.data || response
    }
  } catch (error) {
    console.error("Error modificando raciones:", error)
  } finally {
    guardandoId.value = null
  }
}

// Control de la modal de confirmación
const abrirModalConfirmarEliminar = (tupper) => {
  tupperAEliminar.value = { ...tupper }
  modalEliminarAbierta.value = true
}

const handleEliminarTupper = async () => {
  if (!tupperAEliminar.value || !groupId.value) return
  modalCargando.value = true
  
  try {
    await deleteTupperware(groupId.value, tupperAEliminar.value.id)
    tuppers.value = tuppers.value.filter(t => t.id !== tupperAEliminar.value.id)
    modalEliminarAbierta.value = false
    tupperAEliminar.value = null
  } catch (error) {
    console.error("Error al eliminar tupperware:", error)
    alert("No se pudo borrar el elemento.")
  } finally {
    modalCargando.value = false
  }
}

const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return ''
  const date = new Date(fechaRaw)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.tupper-content {
  padding: 1rem;
}

/* Buscador Glassmorphic */
.search-container {
  padding: 0.5rem 1rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.797);
}

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 1rem;
  padding: 0.4rem 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Grid de Tuppers */
.tuppers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* Tarjeta Estilizada */
.tupper-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
}

.tupper-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.tupper-icon {
  font-size: 1.6rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.4rem;
  border-radius: 10px;
  line-height: 1;
}

.tupper-info {
  text-align: left;
}

.tupper-title {
  margin: 0 0 0.2rem 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
}

.tupper-location {
  font-size: 0.8rem;
  color: #a2d2ff;
  font-weight: 500;
  background: rgba(162, 210, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
}

/* Footer y selectores de raciones */
.tupper-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.75rem;
}

.tupper-date {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.date-lbl {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
}

.date-val {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

/* Controles de ración */
.servings-control {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  padding: 2px;
}

.btn-serving-minus,
.btn-serving-plus {
  background: transparent;
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-serving-minus:hover:not(:disabled),
.btn-serving-plus:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.btn-serving-minus:disabled,
.btn-serving-plus:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.servings-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
  padding: 0 4px;
}

.servings-count {
  font-size: 0.95rem;
  font-weight: bold;
  color: #ffd166;
  line-height: 1;
}

.servings-lbl {
  font-size: 0.65rem;
  opacity: 0.5;
}

/* Botón quitar tupper */
.btn-consume-all {
  margin-top: 0.75rem;
  background: rgba(239, 71, 111, 0.15);
  border: 1px solid rgba(239, 71, 111, 0.3);
  color: #ef476f;
  border-radius: 8px;
  padding: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-consume-all:hover {
  background: rgba(239, 71, 111, 0.25);
}

/* Modal Estilos uniformes */
.tupper-modal, .confirm-modal {
  max-width: 420px;
  width: 92%;
  text-align: left;
}

.modal-header h2 {
  font-size: 1.35rem;
  color: #ffd166;
  margin: 0;
}

.modal-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.4rem;
  font-weight: 500;
}

.modal-input, .modal-select {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  appearance: none; /* Elimina estilos nativos del select */
}

.modal-select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2rem;
}

.modal-input:focus, .modal-select:focus {
  border-color: #ffd166;
}

.modal-select option {
  background: #1e1e24; /* Color de fondo oscuro para las opciones del desplegable */
  color: white;
}

.confirm-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

/* Botón Danger para la modal de confirmación */
.btn-danger {
  background: #ef476f;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-danger:hover {
  opacity: 0.9;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
  margin-top: 1.25rem;
}
.btn {
  font-weight: bold;
  border-radius: 10px;
  border: 0;
  vertical-align: middle;
  padding: 0.8em 1.2em;
  cursor: pointer;
  box-shadow: 0 5px 5px 0px rgba(0, 0, 0, 0.06);
}
.btn-consume-all:hover {
  background: rgba(239, 71, 111, 0.25);
}

/* Modal Estilos uniformes */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Asegura que esté por encima de todo */
}

.tupper-modal, .confirm-modal {
  max-width: 420px;
  width: 92%;
  text-align: left;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

/* Transiciones de Modal */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .tupper-modal, .modal-fade-leave-active .tupper-modal,
.modal-fade-enter-active .confirm-modal, .modal-fade-leave-active .confirm-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from .tupper-modal, .modal-fade-leave-to .tupper-modal,
.modal-fade-enter-from .confirm-modal, .modal-fade-leave-to .confirm-modal { transform: scale(0.95); }

/* Helpers */
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.loading-text, .empty-state { opacity: 0.5; font-size: 0.95rem; }
</style>