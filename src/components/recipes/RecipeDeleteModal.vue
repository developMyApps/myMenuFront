<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect recipe-modal confirm-delete-modal">
        <div class="modal-header">
          <h2>⚠️ ¿Eliminar receta?</h2>
        </div>
        
        <div class="modal-body">
          <p class="confirm-text">
            ¿Seguro que deseas eliminar la receta de <strong>"{{ recipe?.title }}"</strong>? 
            Se eliminará del catálogo compartido del grupo de forma permanente.
          </p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="guardando" @click="$emit('close')">Cancelar</button>
          <button 
            class="btn btn-danger" 
            :disabled="guardando" 
            @click="$emit('confirm')"
          >
            {{ guardando ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  recipe: Object,
  guardando: Boolean
})
defineEmits(['close', 'confirm'])
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';
.confirm-delete-modal { max-width: 420px; }
</style>