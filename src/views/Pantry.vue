<template>
  <div class="view-container">
    <!-- Encabezado con botón de añadir -->
    <header class="top-header">
      <h1>Recetas</h1>
      <button @click="abrirModalNuevaReceta" class="btn btn-primary btn-add-recipe">
        ➕ Nueva Receta
      </button>
    </header>

    <main class="recipes-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para ver tus recetas.</p>
      </div>

      <template v-else>
        <!-- Buscador Estilizado -->
        <div class="search-container mb-4 glass-effect">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar receta por título..." 
            class="search-input"
          />
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="text-center py-8">
          <p class="loading-text">Cargando tu libro de recetas...</p>
        </div>

        <!-- Grid de Tarjetas de Recetas -->
        <div v-else-if="recetasFiltradas.length > 0" class="recipes-grid">
          <div 
            v-for="receta in recetasFiltradas" 
            :key="receta.id" 
            class="recipe-card card glass-effect"
            @click="abrirDetalle(receta)"
          >
            <div class="recipe-card-body">
              <span class="recipe-icon">🍳</span>
              <h3 class="recipe-title">{{ receta.title }}</h3>
            </div>
            <div class="recipe-card-footer">
              <span class="view-recipe-lbl">Ver receta</span>
              <span class="arrow-icon">▶</span>
            </div>
          </div>
        </div>

        <!-- Estado Vacío -->
        <div v-else class="card glass-effect text-center py-6">
          <p class="empty-state">
            {{ searchQuery ? 'No se encontraron recetas con ese nombre.' : 'Tu libro de recetas está vacío. ¡Añade la primera!' }}
          </p>
        </div>
      </template>
    </main>

    <!-- 1. MODAL DETALLE DE RECETA (VENTANA EMERGENTE REAL) -->
    <Transition name="modal-fade">
      <div v-if="modalDetalleAbierta" class="modal-overlay" @click.self="modalDetalleAbierta = false">
        <div class="modal-content glass-effect recipe-modal">
          <div class="modal-header">
            <h2>🍳 {{ recetaSeleccionada?.title }}</h2>
          </div>
          
          <div class="modal-body">
            <label class="modal-label">Instrucciones de preparación</label>
            <div class="instructions-container">
              <p class="instructions-text">{{ recetaSeleccionada?.instructions || 'Sin instrucciones añadidas.' }}</p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="modalDetalleAbierta = false">Cerrar receta</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. MODAL PARA CREAR RECETA (VENTANA EMERGENTE REAL) -->
    <Transition name="modal-fade">
      <div v-if="modalCrearAbierta" class="modal-overlay" @click.self="modalCrearAbierta = false">
        <div class="modal-content glass-effect recipe-modal">
          <div class="modal-header">
            <h2>Añadir Nueva Receta</h2>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="modal-label">Título de la receta</label>
              <input 
                v-model="nuevaReceta.title" 
                type="text" 
                placeholder="Ej: Lasaña de carne" 
                class="modal-input"
                :disabled="guardando"
                @keyup.enter="handleCrearReceta"
              />
            </div>

            <div class="form-group mt-4">
              <label class="modal-label">Instrucciones / Pasos de preparación</label>
              <textarea 
                v-model="nuevaReceta.instructions" 
                placeholder="Paso 1. Hervir la pasta...&#10;Paso 2. Preparar el relleno..." 
                class="modal-textarea"
                rows="8"
                :disabled="guardando"
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary cancel-btn" :disabled="guardando" @click="modalCrearAbierta = false">Cancelar</button>
            <button 
              class="btn btn-primary save-btn" 
              :disabled="guardando || !nuevaReceta.title.trim()" 
              @click="handleCrearReceta"
            >
              {{ guardando ? 'Guardando...' : 'Guardar Receta' }}
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

const recetas = ref([])
const loading = ref(true)
const guardando = ref(false)
const groupId = ref(null)
const searchQuery = ref('')

// Control de ventanas modales
const modalDetalleAbierta = ref(false)
const modalCrearAbierta = ref(false)
const recetaSeleccionada = ref(null)

const nuevaReceta = ref({ title: '', instructions: '' })

// Filtro y ordenación alfabética
const recetasFiltradas = computed(() => {
  let resultado = [...recetas.value]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    resultado = resultado.filter(r => r.title.toLowerCase().includes(query))
  }
  return resultado.sort((a, b) => a.title.localeCompare(b.title))
})

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    cargarRecetas()
  } else {
    loading.value = false
  }
})

const cargarRecetas = async () => {
  try {
    const response = await api.get(`/groups/${groupId.value}/recipes`)
    recetas.value = response.data || response
  } catch (error) {
    console.error("Error cargando las recetas:", error)
  } finally {
    loading.value = false
  }
}

const abrirDetalle = (receta) => {
  recetaSeleccionada.value = receta
  modalDetalleAbierta.value = true
}

const abrirModalNuevaReceta = () => {
  nuevaReceta.value = { title: '', instructions: '' }
  modalCrearAbierta.value = true
}

const handleCrearReceta = async () => {
  if (!nuevaReceta.value.title.trim() || !groupId.value) return
  guardando.value = true
  
  try {
    const response = await api.post(`/groups/${groupId.value}/recipes`, {
      title: nuevaReceta.value.title,
      instructions: nuevaReceta.value.instructions
    })
    // Guardamos la nueva receta en local y cerramos la modal, volviendo a la lista limpia
    recetas.value.push(response.data || response)
    modalCrearAbierta.value = false
  } catch (error) {
    console.error("Error guardando la receta:", error)
    alert("No se pudo guardar la receta.")
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.recipes-content {
  padding: 1rem;
}

/* Buscador Glassmorphic */
.search-container {
  padding: 0.5rem 1rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
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

/* Grid adaptativo moderno */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

/* Tarjetas de Receta */
.recipe-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.2rem;
  min-height: 115px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.recipe-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.recipe-card-body {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.recipe-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.recipe-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
}

.recipe-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.view-recipe-lbl {
  font-size: 0.8rem;
  color: #ffd166;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.arrow-icon {
  font-size: 0.7rem;
  opacity: 0.4;
  transition: transform 0.2s;
}

.recipe-card:hover .arrow-icon {
  transform: translateX(2px);
  opacity: 0.8;
}

/* =========================================
   ESTILOS DE LAS VENTANAS MODALES (CORREGIDO)
   ========================================= */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65); /* Fondo oscuro */
  backdrop-filter: blur(8px);      /* Efecto desenfoque */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;                    /* Por encima de toda la web */
  padding: 1.5rem;
  box-sizing: border-box;
}

.recipe-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  text-align: left;
  display: flex;
  flex-direction: column;
}

.modal-header {
  margin-bottom: 1.25rem;
}

.modal-header h2 {
  font-size: 1.4rem;
  color: #ffd166;
  margin: 0;
}

.modal-body {
  flex: 1;
  margin-bottom: 1.5rem;
}

.modal-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* Campos de Formulario Glassmorphic */
.modal-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.modal-input:focus {
  border-color: #ffd166;
}

.modal-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.modal-textarea:focus {
  border-color: #ffd166;
}

.instructions-container {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  max-height: 280px;
  overflow-y: auto;
}

.instructions-text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
}

/* =========================================
   ANIMACIONES DE TRANSICIÓN (FADE-POP)
   ========================================= */

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Efecto Pop de escala suave en la tarjeta interior al abrirse */
.modal-fade-enter-active .recipe-modal,
.modal-fade-leave-active .recipe-modal {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .recipe-modal,
.modal-fade-leave-to .recipe-modal {
  transform: scale(0.94);
}

.btn-add-recipe {
   color: black;
  background-color: #f1b818;
  font-weight: bold;
  border-radius: 10px;
  border: 0;
  vertical-align: middle;
  padding: 0.8em 1.2em;
  cursor: pointer;
  box-shadow: 0 5px 5px 0px rgba(0, 0, 0, 0.06);
}

.cancel-btn {
  color: white;
  background-color: gray;
  font-weight: bold;
  border-radius: 10px;
  border: 0;
  vertical-align: middle;
  padding: 0.8em 1.2em;
  cursor: pointer;
  box-shadow: 0 5px 5px 0px rgba(0, 0, 0, 0.06);
}

.save-btn {
  color: black;
  background-color: #f1b818;
  font-weight: bold;
  border-radius: 10px;
  border: 0;
  vertical-align: middle;
  padding: 0.8em 1.2em;
  cursor: pointer;
  box-shadow: 0 5px 5px 0px rgba(0, 0, 0, 0.06);
}

/* Auxiliares */
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.loading-text, .empty-state { opacity: 0.6; font-size: 0.95rem; }
</style>
```eof

