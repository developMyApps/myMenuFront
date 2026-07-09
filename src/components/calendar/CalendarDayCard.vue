<template>
  <div class="card glass-effect day-card" :class="{ 'is-today': dia.esHoy }">
    <div class="day-header">
      <h2>{{ dia.nombre }}</h2>
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
.day-card { border-left: 4px solid transparent; transition: all 0.2s ease; text-align: left; padding: 1.25rem; border-radius: 16px; margin-bottom: 1rem; }
.day-card.is-today { border-left: 4px solid #4caf50; background: rgba(76, 175, 80, 0.05); }
.day-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.8rem; }
.day-header h2 { font-size: 1.2rem; margin: 0; }
.day-date { font-size: 0.85rem; color: #888; font-weight: 500; }
.meals-container { display: flex; flex-direction: column; gap: 0.6rem; }
.meal-slot { display: flex; align-items: center; padding: 0.7rem; background: #f9f9f9; border-radius: 8px; cursor: pointer; transition: background 0.2s; gap: 1rem; }
.meal-slot:hover { background: #f0f0f0; }
.meal-meta { display: flex; align-items: center; gap: 0.4rem; width: 90px; flex-shrink: 0; }
.meal-label { font-size: 0.85rem; font-weight: 600; color: #555; }
.meal-text { margin: 0; font-size: 0.95rem; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 0.5rem; flex-grow: 1; }
.meal-text.empty-text { color: #bbb; font-style: italic; }
</style>