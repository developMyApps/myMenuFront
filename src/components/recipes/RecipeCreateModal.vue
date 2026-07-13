<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
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
              @keyup.enter="handleCrear"
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
          <button class="btn btn-secondary cancel-btn" :disabled="guardando" @click="$emit('close')">Cancelar</button>
          <button 
            class="btn btn-primary save-btn" 
            :disabled="guardando || !nuevaReceta.title.trim()" 
            @click="handleCrear"
          >
            {{ guardando ? 'Guardando...' : 'Guardar Receta' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  guardando: Boolean
})

const emit = defineEmits(['close', 'create'])

const nuevaReceta = ref({ title: '', instructions: '' })

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nuevaReceta.value = { title: '', instructions: '' }
  }
})

const handleCrear = () => {
  if (nuevaReceta.value.title.trim()) {
    emit('create', { ...nuevaReceta.value })
  }
}
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';
</style>