<template>
  <header class="top-header">
    <h1>Calendario</h1>
    <div class="week-navigation">
      <button class="nav-btn" :disabled="loading" @click="$emit('navigate', -1)">◀</button>
      <div class="week-indicator">{{ textoSemanaActual }}</div>
      <button class="nav-btn" :disabled="loading" @click="$emit('navigate', 1)">▶</button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  textoSemanaActual: { type: String, required: true },
  loading: { type: Boolean, default: false }
})
defineEmits(['navigate'])
</script>

<style scoped>
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.week-navigation { display: flex; align-items: center; gap: 0.5rem; background: #f0f0f0; padding: 0.4rem 0.8rem; border-radius: 20px; }
.nav-btn { background: none; border: none; font-size: 0.85rem; cursor: pointer; color: #333; padding: 0.2rem 0.4rem; display: flex; align-items: center; justify-content: center; }
.nav-btn:active { transform: scale(0.85); }
.week-indicator { font-size: 0.85rem; font-weight: 700; color: #4caf50; min-width: 120px; text-align: center; }
</style>