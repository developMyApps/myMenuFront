<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect">
        <h3>Editar {{ tipoEdicion }}</h3>
        <p class="modal-subtitle">{{ dia?.nombre }} - {{ dia?.fechaFormateada }}</p>
        
        <div class="input-recipe-group">
          <input 
            v-model="localTextoMenu" 
            type="text" 
            placeholder="Ej: Macarrones con tomate"
            class="modal-input"
            @keyup.enter="onGuardar"
            :disabled="guardando"
          />
          <button 
            type="button" 
            class="btn-recipe-trigger" 
            @click="toggleSelector('recetas')"
            :class="{ 'btn-trigger-active': mostrarSelectorRecetas }"
            title="Elegir de mis recetas"
          >📖</button>
          <button 
            type="button" 
            class="btn-recipe-trigger" 
            @click="toggleSelector('tuppers')"
            :class="{ 'btn-trigger-active': mostrarSelectorTuppers }"
            title="Elegir de mis tuppers"
          >🍱</button>
        </div>

        <div v-if="mostrarSelectorRecetas" class="recipe-dropdown-panel glass-effect">
          <div class="dropdown-header-area">
            <h4>Mis Recetas Guardadas</h4>
            <input v-model="searchQueryDropdown" type="text" placeholder="🔍 Buscar receta..." class="dropdown-search-input" />
          </div>
          <div v-if="recetasFiltradas.length === 0" class="empty-dropdown">No se encontraron recetas.</div>
          <ul v-else class="recipe-dropdown-list">
            <li v-for="receta in recetasFiltradas" :key="receta.id" @click="seleccionarReceta(receta.title)">
              🍳 {{ receta.title }}
            </li>
          </ul>
        </div>

        <div v-if="mostrarSelectorTuppers" class="recipe-dropdown-panel glass-effect">
          <div class="dropdown-header-area">
            <h4>Comida en Nevera / Congelador</h4>
            <input v-model="searchQueryDropdown" type="text" placeholder="🔍 Buscar tupper..." class="dropdown-search-input" />
          </div>
          <div v-if="tuppersFiltrados.length === 0" class="empty-dropdown">No quedan tuppers disponibles.</div>
          <ul v-else class="recipe-dropdown-list">
            <li v-for="tupper in tuppersFiltrados" :key="tupper.id" @click="seleccionarTupper(tupper.title)">
              <span>🍱 {{ tupper.title }}</span>
              <span class="tupper-badge-servings">({{ tupper.servings }} {{ tupper.servings === 1 ? 'rac.' : 'racs.' }})</span>
            </li>
          </ul>
        </div>

        <div class="modal-actions mt-4">
          <button class="btn btn-secondary" :disabled="guardando" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="onGuardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  dia: Object,
  tipoEdicion: String,
  textoMenuInicial: String,
  recetas: Array,
  tuppers: Array,
  guardando: Boolean
})

const emit = defineEmits(['close', 'save'])

const localTextoMenu = ref('')
const mostrarSelectorRecetas = ref(false)
const mostrarSelectorTuppers = ref(false)
const searchQueryDropdown = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    localTextoMenu.value = props.textoMenuInicial || ''
    mostrarSelectorRecetas.value = false
    mostrarSelectorTuppers.value = false
    searchQueryDropdown.value = ''
  }
})

const recetasFiltradas = computed(() => {
  if (!searchQueryDropdown.value.trim()) return props.recetas
  return props.recetas.filter(r => r.title.toLowerCase().includes(searchQueryDropdown.value.toLowerCase()))
})

const tuppersFiltrados = computed(() => {
  const activos = props.tuppers.filter(t => t.servings > 0)
  if (!searchQueryDropdown.value.trim()) return activos
  return activos.filter(t => t.title.toLowerCase().includes(searchQueryDropdown.value.toLowerCase()))
})

const toggleSelector = (tipo) => {
  searchQueryDropdown.value = ''
  if (tipo === 'recetas') {
    mostrarSelectorTuppers.value = false
    mostrarSelectorRecetas.value = !mostrarSelectorRecetas.value
  } else {
    mostrarSelectorRecetas.value = false
    mostrarSelectorTuppers.value = !mostrarSelectorTuppers.value
  }
}

const seleccionarReceta = (title) => { 
  localTextoMenu.value = `📖 ${title}`; mostrarSelectorRecetas.value = false 
}

const seleccionarTupper = (title) => {
  if (!localTextoMenu.value.trim() || localTextoMenu.value === 'Añadir menú...') {
    localTextoMenu.value = `🍱 ${title}`
  } else {
    localTextoMenu.value += ` + 🍱 ${title}`
  }
}

const onGuardar = () => {
  emit('save', localTextoMenu.value)
}
</script>

<style scoped>
/* Fondo oscuro translúcido con blur */
.modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background: rgba(0, 0, 0, 0.7); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
  padding: 1.5rem; 
  box-sizing: border-box; 
}

/* Contenedor adaptado a la estética Cyberpunk / Glassmorphism original */
.modal-content { 
  width: 100%; 
  max-width: 440px; 
  padding: 1.5rem; 
  border-radius: 16px; 
  text-align: left;
}

/* Tipografía en colores corporativos dorados y claros */
.modal-content h3 { 
  margin: 0 0 0.25rem 0; 
  color: #e0b34b; 
  font-size: 1.3rem; 
  text-transform: capitalize;
}

.modal-subtitle { 
  font-size: 0.85rem; 
  color: rgba(255, 255, 255, 0.5); 
  margin-top: 0.25rem;
  margin-bottom: 1.25rem; 
}

.input-recipe-group { 
  display: flex; 
  gap: 0.5rem; 
  width: 100%; 
  align-items: center;
}

/* Inputs oscurecidos integrados con el fondo */
.modal-input { 
  flex: 1; 
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2); 
  border-radius: 10px; 
  color: #ffffff;
  padding: 0.75rem; 
  font-size: 0.95rem; 
  outline: none; 
  box-sizing: border-box; 
}

.modal-input:focus { 
  border-color: #ffd166; 
}

/* Botones selectores con bordes translúcidos */
.btn-recipe-trigger { 
  background: rgba(255, 255, 255, 0.05); 
  border: 1px solid rgba(255, 255, 255, 0.15); 
  border-radius: 10px; 
  width: 44px;
  height: 44px;
  font-size: 1.2rem; 
  cursor: pointer; 
  transition: all 0.2s; 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.btn-recipe-trigger:hover { 
  background: rgba(255, 255, 255, 0.15); 
  border-color: #ffd166;
}

.btn-trigger-active { 
  background: rgba(255, 209, 102, 0.2) !important; 
  border-color: #ffd166 !important; 
}

/* Paneles desplegables integrados en el ecosistema oscuro */
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
  text-transform: uppercase;
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

.modal-actions { 
  display: flex; 
  justify-content: flex-end; 
  gap: 0.75rem; 
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

.mt-4 { margin-top: 1rem; }
</style>