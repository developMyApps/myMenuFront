<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect modal-editor-card">
        <header class="modal-header">
          <h3>Editar {{ tipoEdicion }}</h3>
          <button class="btn-close-x" @click="$emit('close')">✕</button>
        </header>
        <p class="modal-subtitle">📅 {{ dia?.nombre }} - {{ dia?.fechaFormateada }}</p>

        <div class="editor-scroll-area">
          <!-- SECCIÓN 1: Menú Compartido / General del Grupo -->
          <div class="form-section">
            <label class="section-label">🍲 Menú Compartido (Grupo):</label>
            <div class="input-recipe-group">
              <input 
                v-model="localSharedMenu" 
                type="text" 
                placeholder="Ej: Macarrones con tomate"
                class="modal-input"
                @keyup.enter="onGuardar"
                :disabled="guardando"
              />
              <button 
                type="button" 
                class="btn-recipe-trigger" 
                @click="toggleSelector('recetas', 'shared')"
                :class="{ 'btn-trigger-active': activeSelector === 'recetas' && targetField === 'shared' }"
                title="Elegir de mis recetas"
              >📖</button>
              <button 
                type="button" 
                class="btn-recipe-trigger" 
                @click="toggleSelector('tuppers', 'shared')"
                :class="{ 'btn-trigger-active': activeSelector === 'tuppers' && targetField === 'shared' }"
                title="Elegir de mis tuppers"
              >🍱</button>
            </div>
          </div>

          <!-- PANELES DESPLEGABLES DE SELECCIÓN -->
          <div v-if="activeSelector === 'recetas'" class="recipe-dropdown-panel glass-effect mt-2">
            <div class="dropdown-header-area">
              <h4>Mis Recetas Guardadas</h4>
              <input v-model="searchQueryDropdown" type="text" placeholder="🔍 Buscar receta..." class="dropdown-search-input" />
            </div>
            <div v-if="recetasFiltradas.length === 0" class="empty-dropdown">No se encontraron recetas.</div>
            <ul v-else class="recipe-dropdown-list">
              <li v-for="receta in recetasFiltradas" :key="receta.id" @click="seleccionarReceta(receta.title)">
                📖 {{ receta.title }}
              </li>
            </ul>
          </div>

          <div v-if="activeSelector === 'tuppers'" class="recipe-dropdown-panel glass-effect mt-2">
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

          <!-- SECCIÓN 2: Menús Individuales / Excepciones por Persona -->
          <div class="form-section mt-4">
            <div class="section-header-flex">
              <label class="section-label">👤 Menús Individuales / Excepciones:</label>
              <button type="button" @click="addIndividualRow" class="btn-add-individual">
                ➕ Añadir Persona
              </button>
            </div>

            <div v-if="localIndividuals.length === 0" class="empty-individuals-hint">
              ¿Alguien come algo distinto o se lleva tupper? Pulsa "+ Añadir Persona".
            </div>

            <div v-else class="individuals-rows-container mt-2">
              <div 
                v-for="(ind, index) in localIndividuals" 
                :key="ind.id" 
                class="individual-row-card"
              >
                <div class="row-inputs-grid">
                  <input 
                    v-model="ind.person" 
                    type="text" 
                    placeholder="Persona (ej: Laura)" 
                    class="modal-input person-input"
                  />
                  <div class="input-recipe-group">
                    <input 
                      v-model="ind.text" 
                      type="text" 
                      placeholder="Menú o tupper (ej: 🍱 Tupper Paella)" 
                      class="modal-input"
                    />
                    <button 
                      type="button" 
                      class="btn-recipe-trigger btn-sm-trigger" 
                      @click="toggleSelector('recetas', 'individual', index)"
                      :class="{ 'btn-trigger-active': activeSelector === 'recetas' && targetField === 'individual' && targetIndex === index }"
                      title="Asignar receta"
                    >📖</button>
                    <button 
                      type="button" 
                      class="btn-recipe-trigger btn-sm-trigger" 
                      @click="toggleSelector('tuppers', 'individual', index)"
                      :class="{ 'btn-trigger-active': activeSelector === 'tuppers' && targetField === 'individual' && targetIndex === index }"
                      title="Asignar tupper"
                    >🍱</button>
                    <button 
                      type="button" 
                      class="btn-remove-row" 
                      @click="removeIndividualRow(index)"
                      title="Eliminar excepción"
                    >🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions mt-4">
          <button class="btn btn-secondary" :disabled="guardando" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="onGuardar">
            {{ guardando ? 'Guardando...' : '💾 Guardar Menú' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { parseMeal, stringifyMeal } from '../../utils/mealParser'

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

const localSharedMenu = ref('')
const localIndividuals = ref([])

const activeSelector = ref(null) // 'recetas' | 'tuppers' | null
const targetField = ref('shared') // 'shared' | 'individual'
const targetIndex = ref(null)

const searchQueryDropdown = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    const parsed = parseMeal(props.textoMenuInicial)
    localSharedMenu.value = parsed.shared || ''
    localIndividuals.value = (parsed.individuals || []).map((ind, idx) => ({
      id: Date.now() + idx,
      person: ind.person || '',
      text: ind.text || ''
    }))
    activeSelector.value = null
    targetField.value = 'shared'
    targetIndex.value = null
    searchQueryDropdown.value = ''
  }
})

const recetasFiltradas = computed(() => {
  if (!searchQueryDropdown.value.trim()) return props.recetas || []
  return (props.recetas || []).filter(r => r.title.toLowerCase().includes(searchQueryDropdown.value.toLowerCase()))
})

const tuppersFiltrados = computed(() => {
  const activos = (props.tuppers || []).filter(t => t.servings > 0)
  if (!searchQueryDropdown.value.trim()) return activos
  return activos.filter(t => t.title.toLowerCase().includes(searchQueryDropdown.value.toLowerCase()))
})

const toggleSelector = (tipo, field = 'shared', index = null) => {
  if (activeSelector.value === tipo && targetField.value === field && targetIndex.value === index) {
    activeSelector.value = null
  } else {
    activeSelector.value = tipo
    targetField.value = field
    targetIndex.value = index
    searchQueryDropdown.value = ''
  }
}

const seleccionarReceta = (title) => {
  if (targetField.value === 'shared') {
    localSharedMenu.value = `📖 ${title}`
  } else if (targetField.value === 'individual' && targetIndex.value !== null && localIndividuals.value[targetIndex.value]) {
    localIndividuals.value[targetIndex.value].text = `📖 ${title}`
  }
  activeSelector.value = null
}

const seleccionarTupper = (title) => {
  if (targetField.value === 'shared') {
    if (!localSharedMenu.value.trim()) {
      localSharedMenu.value = `🍱 ${title}`
    } else {
      localSharedMenu.value += ` + 🍱 ${title}`
    }
  } else if (targetField.value === 'individual' && targetIndex.value !== null && localIndividuals.value[targetIndex.value]) {
    const current = localIndividuals.value[targetIndex.value].text || ''
    if (!current.trim()) {
      localIndividuals.value[targetIndex.value].text = `🍱 ${title}`
    } else {
      localIndividuals.value[targetIndex.value].text += ` + 🍱 ${title}`
    }
  }
  activeSelector.value = null
}

const addIndividualRow = () => {
  localIndividuals.value.push({
    id: Date.now() + Math.random(),
    person: '',
    text: ''
  })
}

const removeIndividualRow = (index) => {
  localIndividuals.value.splice(index, 1)
  if (targetField.value === 'individual' && targetIndex.value === index) {
    activeSelector.value = null
  }
}

const onGuardar = () => {
  const resultString = stringifyMeal(localSharedMenu.value, localIndividuals.value)
  emit('save', resultString)
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
  background: rgba(0, 0, 0, 0.75); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
  padding: 1rem; 
  box-sizing: border-box; 
}

.modal-editor-card { 
  width: 100%; 
  max-width: 520px; 
  padding: 1.5rem; 
  border-radius: 16px; 
  text-align: left;
  background-color: #222228;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { 
  margin: 0; 
  color: #ffd166; 
  font-size: 1.25rem; 
  text-transform: capitalize;
}

.btn-close-x {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
}
.btn-close-x:hover { color: white; }

.modal-subtitle { 
  font-size: 0.85rem; 
  color: rgba(255, 255, 255, 0.6); 
  margin-top: 0.2rem;
  margin-bottom: 1rem; 
}

.editor-scroll-area {
  overflow-y: auto;
  padding-right: 0.2rem;
  flex-grow: 1;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #ffd166;
}

.section-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-add-individual {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid #4caf50;
  color: #81c784;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-individual:hover {
  background: #4caf50;
  color: black;
}

.empty-individuals-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  padding: 0.4rem 0;
}

.input-recipe-group { 
  display: flex; 
  gap: 0.4rem; 
  width: 100%; 
  align-items: center;
}

.modal-input { 
  flex: 1; 
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15); 
  border-radius: 10px; 
  color: #ffffff;
  padding: 0.65rem 0.8rem; 
  font-size: 0.9rem; 
  outline: none; 
  box-sizing: border-box; 
}

.modal-input:focus { 
  border-color: #ffd166; 
}

.btn-recipe-trigger { 
  background: rgba(255, 255, 255, 0.05); 
  border: 1px solid rgba(255, 255, 255, 0.15); 
  border-radius: 10px; 
  width: 40px;
  height: 40px;
  font-size: 1.1rem; 
  cursor: pointer; 
  transition: all 0.2s; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  flex-shrink: 0;
}

.btn-recipe-trigger:hover { 
  background: rgba(255, 255, 255, 0.15); 
  border-color: #ffd166;
}

.btn-trigger-active { 
  background: rgba(255, 209, 102, 0.2) !important; 
  border-color: #ffd166 !important; 
}

.individuals-rows-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.individual-row-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.6rem;
  border-radius: 10px;
}

.row-inputs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.person-input {
  max-width: 100%;
  font-weight: 600;
  color: #a2d2ff;
}

.btn-remove-row {
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  width: 38px;
  height: 38px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-remove-row:hover {
  background: #ff6b6b;
}

.recipe-dropdown-panel { 
  margin-top: 0.5rem; 
  border-radius: 12px; 
  border: 1px solid rgba(255, 255, 255, 0.1); 
  overflow: hidden;
  max-height: 200px; 
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.4);
}

.dropdown-header-area { 
  padding: 0.6rem; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.06); 
  background: rgba(0, 0, 0, 0.2);
}

.dropdown-header-area h4 { 
  margin: 0 0 0.4rem 0; 
  font-size: 0.8rem; 
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

.recipe-dropdown-list { 
  list-style: none; 
  padding: 0; 
  margin: 0; 
  overflow-y: auto;
  flex-grow: 1;
}

.recipe-dropdown-list li { 
  padding: 0.6rem 0.8rem; 
  font-size: 0.88rem; 
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.8rem;
}

.btn { 
  padding: 0.6rem 1.2rem; 
  border-radius: 8px; 
  font-weight: 600; 
  border: none; 
  cursor: pointer; 
  font-size: 0.9rem;
}

.btn-secondary { 
  background: rgba(255, 255, 255, 0.1); 
  color: #ccc; 
}

.btn-primary { 
  background: #f1b818; 
  color: black; 
}

.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.25s ease; 
}

.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
</style>