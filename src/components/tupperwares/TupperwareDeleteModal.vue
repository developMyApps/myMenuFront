<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect confirm-modal">
        <div class="modal-header">
          <h2>⚠️ ¿Eliminar tupperware?</h2>
        </div>
        
        <div class="modal-body">
          <p class="confirm-text">
            ¿Estás seguro de que quieres quitar el tupper de <strong>"{{ tupper?.title }}"</strong> del inventario? Esta acción no se puede deshacer.
          </p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="loading" @click="$emit('close')">Cancelar</button>
          <button 
            class="btn btn-danger" 
            :disabled="loading" 
            @click="$emit('confirm')"
          >
            {{ loading ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  tupper: Object,
  loading: Boolean
})
defineEmits(['close', 'confirm'])
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';
.confirm-modal { max-width: 420px; width: 92%; text-align: left; background-color: #333; }
</style>