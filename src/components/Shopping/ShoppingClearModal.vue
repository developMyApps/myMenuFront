<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect">
        <h3>¿Vaciar lista de la compra?</h3>
        <p class="modal-subtitle">
          Esta acción eliminará de forma permanente todos los artículos que tienes apuntados. No se puede deshacer.
        </p>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="loading" @click="$emit('close')">
            Cancelar
          </button>
          <button class="btn btn-danger" :disabled="loading" @click="$emit('confirm')">
            {{ loading ? 'Vaciando...' : 'Sí, vaciar todo' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  loading: Boolean
})
defineEmits(['close', 'confirm'])
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';

.modal-content { 
  width: 100%; 
  max-width: 400px; 
  padding: 1.5rem; 
  border-radius: 16px; 
  text-align: left;
  background-color: #333;
}
.modal-content h3 { 
  margin: 0 0 0.5rem 0; 
  color: #ff5252; 
  font-size: 1.25rem; 
}
.modal-subtitle { 
  font-size: 0.9rem; 
  color: rgba(255, 255, 255, 0.6); 
  line-height: 1.4;
  margin-bottom: 1.5rem; 
}
.modal-actions { 
  display: flex; 
  justify-content: flex-end; 
  gap: 0.75rem; 
}
</style>