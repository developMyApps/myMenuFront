<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleCerrar">
      <div class="modal-content glass-effect modal-card recipe-modal">
        
        <div class="modal-header">
          <h2 v-if="!editando">📖 {{ recipe?.title }}</h2>
          <div v-else class="form-group" style="width: 100%;">
            <label class="modal-label">Título de la receta</label>
            <input v-model="recetaEditable.title" type="text" class="modal-input" />
          </div>
        </div>
        
        <div class="modal-body">
          <!-- 🆕 MODO LECTURA: Etiquetas -->
          <div v-if="!editando" class="tags-read-container mb-3">
            <label class="modal-label">Etiquetas</label>
            <div v-if="recipe?.tags && recipe.tags.length > 0" class="tags-list">
              <span v-for="tagId in recipe.tags" :key="tagId" class="tag-badge">
                {{ getTagIcon(tagId) }} {{ getTagLabel(tagId) }}
              </span>
            </div>
            <p v-else class="empty-tags">Sin etiquetas asignadas.</p>
          </div>

          <!-- 🆕 MODO EDICIÓN: Selector de Etiquetas -->
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

          <label class="modal-label">Instrucciones de preparación</label>
          <div v-if="!editando" class="instructions-container">
            <p class="instructions-text">{{ recipe?.instructions || 'Sin instrucciones añadidas.' }}</p>
          </div>
          <textarea v-else v-model="recetaEditable.instructions" class="modal-textarea" rows="8"></textarea>
        </div>
        
        <div class="modal-actions">
          <template v-if="!editando">
            <button class="btn btn-edit" @click="activarEdicion">
              ✏️ Editar
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

const emit = defineEmits(['close', 'save'])

const editando = ref(false)
const recetaEditable = ref({ title: '', instructions: '', tags: [] })

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.recipe) {
    editando.value = false
    recetaEditable.value = { 
      title: props.recipe.title, 
      instructions: props.recipe.instructions || '',
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

.btn-edit {
  margin-right: auto; 
  background: rgba(255,193,7,0.15); 
  color: #ffc107; 
  border: 1px solid rgba(255,193,7,0.3);
}
.recipe-modal { max-width: 500px; width: 92%; text-align: left; background-color: #333; }
.mb-3 { margin-bottom: 0.85rem; }

/* Visualización en Modo Lectura */
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

/* Selector en Modo Edición */
.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-height: 130px;
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