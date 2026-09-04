<template>
  <div class="card glass-effect day-card" :class="{ 'is-today': dia.esHoy }">
    <div class="day-header">
      <div class="title-with-badge">
        <h2>{{ dia.nombre }}</h2>
        <span v-if="dia.esHoy" class="today-badge">HOY</span>
      </div>
      <span class="day-date">{{ dia.fechaFormateada }}</span>
    </div>

    <div class="meals-container">
      <div class="meal-slot" @click="$emit('select-meal', dia, 'comida')">
        <div class="meal-meta">
          <span class="meal-icon">☀️</span>
          <span class="meal-label">Comida</span>
        </div>
        <p class="meal-text" :class="{ 'empty-text': !dia.comida }">
          {{ dia.comida || 'Añadir menú...' }}
        </p>
      </div>

      <div class="meal-slot" @click="$emit('select-meal', dia, 'cena')">
        <div class="meal-meta">
          <span class="meal-icon">🌙</span>
          <span class="meal-label">Cena</span>
        </div>
        <p class="meal-text" :class="{ 'empty-text': !dia.cena }">
          {{ dia.cena || 'Añadir menú...' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  dia: { type: Object, required: true }
})
defineEmits(['select-meal'])
</script>

<style scoped>
.day-card { border-left: 4px solid transparent; transition: all 0.25s ease; text-align: left; padding: 1.25rem; border-radius: 16px; margin-bottom: 1rem; }

/* === RESALTADO MÁS LLAMATIVO PARA EL DÍA DE HOY (FONDO OSCURO/GLASS) === */
.day-card.is-today { 
  border-left: 6px solid #4caf50; 
  background: rgba(76, 175, 80, 0.12);
  /* Resplandor verde (Glow) */
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.25), inset 0 0 10px rgba(76, 175, 80, 0.1);
  transform: translateY(-2px);
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Badge brillante "HOY" */
.today-badge {
  background: #4caf50;
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 0.5px;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.day-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.5rem; margin-bottom: 0.8rem; }
.day-card.is-today .day-header { border-bottom-color: rgba(76, 175, 80, 0.3); }

.day-header h2 { font-size: 1.2rem; margin: 0; }
.day-card.is-today .day-header h2 { color: #81c784; font-weight: 700; }

.day-date { font-size: 0.85rem; color: #888; font-weight: 500; }
.day-card.is-today .day-date { color: #a5d6a7; }

.meals-container { display: flex; flex-direction: column; gap: 0.6rem; }
.meal-slot { display: flex; align-items: center; padding: 0.7rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; transition: background 0.2s; gap: 1rem; }
.meal-slot:hover { background: rgba(255, 255, 255, 0.1); }

.meal-meta { display: flex; align-items: center; gap: 0.4rem; width: 90px; flex-shrink: 0; }
.meal-label { font-size: 0.85rem; font-weight: 600; color: #aaa; }
.meal-text { margin: 0; font-size: 0.95rem; color: #e0e0e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 0.5rem; flex-grow: 1; }
.meal-text.empty-text { color: #777; font-style: italic; }
</style>