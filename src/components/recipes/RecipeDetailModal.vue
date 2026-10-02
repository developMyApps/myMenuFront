<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" :class="{ 'overlay-fullscreen': esMaximizada }" @click.self="handleCerrar">
      <div 
        :class="[
          'modal-content glass-effect modal-card recipe-modal',
          { 'fullscreen-modal': esMaximizada }
        ]"
      >
        
        <!-- HEADER -->
        <div class="modal-header">
          <div class="header-title-container">
            <h2 v-if="!editando">📖 {{ recipe?.title }}</h2>
            <div v-else class="form-group" style="width: 100%;">
              <label class="modal-label">Título de la receta</label>
              <input v-model="recetaEditable.title" type="text" class="modal-input" />
            </div>
          </div>

          <!-- Botón Pantalla Completa / Restaurar -->
          <button 
            type="button" 
            class="btn-icon-expand" 
            :class="{ active: esMaximizada }"
            @click="esMaximizada = !esMaximizada" 
            :title="esMaximizada ? 'Salir de pantalla completa' : 'Ver en pantalla completa'"
          >
            {{ esMaximizada ? '🗗 Salir' : '⛶ Pantalla completa' }}
          </button>
        </div>
        
        <!-- BODY (Contenido desplazable) -->
        <div class="modal-body">
          <!-- MODO LECTURA: Link / URL externa -->
          <div v-if="!editando && recipe?.link" class="mb-3 link-read-container">
            <a :href="recipe.link" target="_blank" rel="noopener noreferrer" class="recipe-external-link">
              🔗 Enlace a la receta original / vídeo
            </a>
          </div>

          <!-- MODO EDICIÓN: Campo Enlace -->
          <div v-else-if="editando" class="form-group mb-3">
            <label class="modal-label">Enlace / Vídeo (URL opcional)</label>
            <input 
              v-model="recetaEditable.link" 
              type="url" 
              placeholder="https://youtube.com/... o https://recetas.com/..." 
              class="modal-input" 
            />
          </div>

          <!-- MODO LECTURA: Etiquetas -->
          <div v-if="!editando" class="tags-read-container mb-3">
            <label class="modal-label">Etiquetas</label>
            <div v-if="recipe?.tags && recipe.tags.length > 0" class="tags-list">
              <span v-for="tagId in recipe.tags" :key="tagId" class="tag-badge">
                {{ getTagIcon(tagId) }} {{ getTagLabel(tagId) }}
              </span>
            </div>
            <p v-else class="empty-tags">Sin etiquetas asignadas.</p>
          </div>

          <!-- MODO EDICIÓN: Selector de Etiquetas -->
          <div v-else class="form-group mb-3">
            <label class="modal-label">Etiquetas</label>
            <div class="tags-selector">
              <button
                v-for="tag in AVAILABLE_TAGS"
                :key="tag.id"
                type="button"
                class="tag-chip"
                :class="{ selected: recetaEditable.tags.includes(tag.id) }"
                @click="toggleTag(tag.id)"
              >
                {{ tag.icon }} {{ tag.label }}
              </button>
            </div>
          </div>

          <!-- SECCIÓN INGREDIENTES -->
          <div class="section-block mb-3">
            <label class="modal-label">🛒 Ingredientes</label>
            <div v-if="!editando" class="ingredients-container">
              <p class="recipe-text">{{ recipe?.ingredients || 'Sin ingredientes especificados.' }}</p>
            </div>
            <textarea 
              v-else 
              v-model="recetaEditable.ingredients" 
              class="modal-textarea" 
              :rows="esMaximizada ? 8 : 4"
              placeholder="• Ingrediente 1..."
            ></textarea>
          </div>

          <!-- SECCIÓN PREPARACIÓN -->
          <div class="section-block">
            <label class="modal-label">👨‍🍳 Preparación</label>
            <div v-if="!editando" class="instructions-container">
              <p class="recipe-text">{{ recipe?.instructions || 'Sin instrucciones añadidas.' }}</p>
            </div>
            <textarea 
              v-else 
              v-model="recetaEditable.instructions" 
              class="modal-textarea" 
              :rows="esMaximizada ? 14 : 6"
              placeholder="Paso 1..."
            ></textarea>
          </div>
        </div>
        
        <!-- ACTIONS (Barra inferior fija) -->
        <div class="modal-actions">
          <template v-if="!editando">
            <button class="btn btn-edit" @click="activarEdicion">
              ✏️ Editar
            </button>
            <button
              v-if="recipe?.ingredients"
              class="btn btn-check-pantry"
              @click="$emit('check-pantry', recipe)"
              title="Comprobar si tienes los ingredientes en la despensa"
            >
              🏪 Comprobar despensa
            </button>
            <button class="btn btn-secondary" @click="handleCerrar">Cerrar receta</button>
          </template>

          <template v-else>
            <button class="btn btn-secondary" :disabled="guardando" @click="editando = false">Cancelar</button>
            <button 
              class="btn btn-primary save-btn" 
              :disabled="guardando || !recetaEditable.title.trim()" 
              @click="handleGuardar"
            >
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </template>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AVAILABLE_TAGS } from '../../utils/tags'

const props = defineProps({
  isOpen: Boolean,
  recipe: Object,
  guardando: Boolean
})

const emit = defineEmits(['close', 'save', 'check-pantry'])

const editando = ref(false)
const esMaximizada = ref(false)
const recetaEditable = ref({ title: '', ingredients: '', instructions: '', link: '', tags: [] })

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.recipe) {
    editando.value = false
    esMaximizada.value = false
    recetaEditable.value = { 
      title: props.recipe.title, 
      ingredients: props.recipe.ingredients || '',
      instructions: props.recipe.instructions || '',
      link: props.recipe.link || '',
      tags: props.recipe.tags ? [...props.recipe.tags] : []
    }
  }
})

const toggleTag = (tagId) => {
  const index = recetaEditable.value.tags.indexOf(tagId)
  if (index === -1) {
    recetaEditable.value.tags.push(tagId)
  } else {
    recetaEditable.value.tags.splice(index, 1)
  }
}

const getTagIcon = (tagId) => {
  const tag = AVAILABLE_TAGS.find(t => t.id === tagId)
  return tag ? tag.icon : '🏷️'
}

const getTagLabel = (tagId) => {
  const tag = AVAILABLE_TAGS.find(t => t.id === tagId)
  return tag ? tag.label : tagId
}

const activarEdicion = () => {
  editando.value = true
}

const handleCerrar = () => {
  if (!props.guardando) emit('close')
}

const handleGuardar = () => {
  emit('save', { ...recetaEditable.value })
}
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';

/* Botones de acción */
.btn-edit {
  margin-right: auto; 
  background: rgba(255,193,7,0.15); 
  color: #ffc107; 
  border: 1px solid rgba(255,193,7,0.3);
}
.btn-check-pantry {
  background: rgba(76,175,80,0.15);
  color: #81c784;
  border: 1px solid rgba(76,175,80,0.3);
  font-size: 0.85rem;
}
.btn-check-pantry:hover {
  background: rgba(76,175,80,0.35);
  color: #fff;
}

/* Base Modal */
.recipe-modal { 
  max-width: 520px; 
  width: 92%; 
  text-align: left; 
  background-color: #222; 
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* --- ESTILOS MODO PANTALLA COMPLETA --- */
.overlay-fullscreen {
  padding: 0 !important;
}

.fullscreen-modal {
  max-width: 100vw !important;
  width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  border: none !important;
  margin: 0 !important;
  background-color: #1a1a1a !important;
}

.fullscreen-modal .modal-header {
  padding: 1.2rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fullscreen-modal .modal-body {
  padding: 1.5rem;
  font-size: 1.05rem;
}

.fullscreen-modal .recipe-text {
  font-size: 1.1rem;
  line-height: 1.7;
}

.fullscreen-modal .modal-actions {
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Header & Botón Expandir */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.header-title-container {
  flex: 1;
}

.btn-icon-expand {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-icon-expand:hover {
  background: rgba(255, 255, 255, 0.22);
}

.btn-icon-expand.active {
  background: #f1b818;
  color: #000;
  border-color: #f1b818;
}

.mb-3 { margin-bottom: 0.85rem; }

.modal-body {
  flex: 1;
  overflow-y: auto;
}

.ingredients-container, .instructions-container {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.8rem 1rem;
}

.recipe-text {
  white-space: pre-line;
  line-height: 1.6;
  margin: 0;
  color: #e2e8f0;
}

.recipe-external-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #60a5fa;
  font-weight: 500;
  text-decoration: underline;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.tag-badge {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-tags {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0.2rem 0 0 0;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.4rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tag-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #d1d5db;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-chip.selected {
  background: #f1b818;
  color: #000;
  font-weight: bold;
  border-color: #f1b818;
}
</style>