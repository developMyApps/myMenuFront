<template>
  <div class="tupper-card card glass-effect">
    <div class="tupper-card-header">
      <span class="tupper-icon">🍱</span>
      <div class="tupper-info">
        <h3 class="tupper-title">{{ tupper.title }}</h3>
        <span v-if="tupper.location" class="tupper-location">
          {{ tupper.location === 'Congelador' ? '❄️' : '🥦' }} {{ tupper.location }}
        </span>
      </div>
    </div>

    <div class="tupper-card-footer">
      <div class="tupper-date">
        <span class="date-lbl">Guardado el</span>
        <span class="date-val">{{ formatearFecha(tupper.frozen_at) }}</span>
      </div>

      <div class="servings-control">
        <button 
          class="btn-serving-minus" 
          @click="$emit('updateServings', tupper, -1)"
          :disabled="isSaving"
        >
          -
        </button>
        <div class="servings-badge">
          <span class="servings-count">{{ tupper.servings }}</span>
          <span class="servings-lbl">{{ tupper.servings === 1 ? 'rac.' : 'racs.' }}</span>
        </div>
        <button 
          class="btn-serving-plus" 
          @click="$emit('updateServings', tupper, 1)"
          :disabled="isSaving"
        >
          +
        </button>
      </div>
    </div>

    <button 
      v-if="tupper.servings === 0" 
      class="btn-consume-all"
      @click="$emit('deleteClick', tupper)"
    >
      🗑️ Quitar del inventario
    </button>
  </div>
</template>

<script setup>
defineProps({
  tupper: { type: Object, required: true },
  isSaving: { type: Boolean, default: false }
})

defineEmits(['updateServings', 'deleteClick'])

const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return ''
  const date = new Date(fechaRaw)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.tupper-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
}
.tupper-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.tupper-icon {
  font-size: 1.6rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.4rem;
  border-radius: 10px;
  line-height: 1;
}
.tupper-info { text-align: left; }
.tupper-title { margin: 0 0 0.2rem 0; font-size: 1.15rem; font-weight: 600; color: #ffffff; }
.tupper-location {
  font-size: 0.8rem; color: #a2d2ff; font-weight: 500;
  background: rgba(162, 210, 255, 0.1); padding: 0.2rem 0.5rem; border-radius: 6px; display: inline-block;
}
.tupper-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.75rem;
}
.tupper-date { display: flex; flex-direction: column; text-align: left; }
.date-lbl { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }
.date-val { font-size: 0.85rem; color: rgba(255, 255, 255, 0.85); font-weight: 500; }
.servings-control {
  display: flex; align-items: center; background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; padding: 2px;
}
.btn-serving-minus, .btn-serving-plus {
  background: transparent; border: none; color: #fff; width: 28px; height: 28px;
  font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;
}
.btn-serving-minus:hover:not(:disabled), .btn-serving-plus:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
.btn-serving-minus:disabled, .btn-serving-plus:disabled { opacity: 0.3; cursor: not-allowed; }
.servings-badge { display: flex; flex-direction: column; align-items: center; min-width: 36px; padding: 0 4px; }
.servings-count { font-size: 0.95rem; font-weight: bold; color: #ffd166; line-height: 1; }
.servings-lbl { font-size: 0.65rem; opacity: 0.5; }
.btn-consume-all {
  margin-top: 0.75rem; background: rgba(239, 71, 111, 0.15); border: 1px solid rgba(239, 71, 111, 0.3);
  color: #ef476f; border-radius: 8px; padding: 0.4rem; font-size: 0.85rem; cursor: pointer; font-weight: 500; transition: background 0.2s;
}
.btn-consume-all:hover { background: rgba(239, 71, 111, 0.25); }
</style>