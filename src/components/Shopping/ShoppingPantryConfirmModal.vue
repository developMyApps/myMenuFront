<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect confirm-card">
        <h3>🏪 ¿Añadir a Despensa?</h3>
        <p>¿Quieres añadir <strong>{{ itemName }}</strong> a tu despensa?</p>
        <div class="confirm-actions">
          <button @click="$emit('close')" class="btn btn-secondary">Cancelar</button>
          <button @click="$emit('confirm')" :disabled="loading" class="btn btn-primary">
            {{ loading ? 'Añadiendo...' : '✅ Añadir' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  itemName: String,
  loading: Boolean
})
defineEmits(['close', 'confirm'])
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; box-sizing: border-box; }
.confirm-card { padding: 1.5rem; border-radius: 16px; max-width: 360px; width: 100%; text-align: left; background: #222228; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
.confirm-card h3 { margin: 0 0 0.5rem; color: #f1b818; }
.confirm-card p { color: rgba(255,255,255,0.8); margin: 0 0 1.25rem; font-size: 0.95rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 0.9rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #ccc; }
.btn-primary { background: #f1b818; color: black; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
