<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleCerrar">
      <div class="modal-content glass-effect recipe-modal">
        
        <div class="modal-header">
          <h2 v-if="!editando">📖 {{ recipe?.title }}</h2>
          <div v-else class="form-group" style="width: 100%;">
            <label class="modal-label">Título de la receta</label>
            <input v-model="recetaEditable.title" type="text" class="modal-input" />
          </div>
        </div>
        
        <div class="modal-body">
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

const props = defineProps({
  isOpen: Boolean,
  recipe: Object,
  guardando: Boolean
})

const emit = defineEmits(['close', 'save'])

const editando = ref(false)
const recetaEditable = ref({ title: '', instructions: '' })

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.recipe) {
    editando.value = false
    recetaEditable.value = { title: props.recipe.title, instructions: props.recipe.instructions || '' }
  }
})

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
@import '../../assets/styles/modal-shared.css';.btn-edit {
  margin-right: auto; 
  background: rgba(255,193,7,0.15); 
  color: #ffc107; 
  border: 1px solid rgba(255,193,7,0.3);
}
</style>