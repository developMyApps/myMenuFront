<template>
  <section class="card glass-effect">
    <h2>🍽️ Menú de Hoy</h2>
    <p class="current-date-label">{{ fechaVisualHoy }}</p>
    
    <div v-if="loading" class="text-center py-4">Cargando...</div>
    <template v-else>
      <div class="menu-item">
        <span class="meal-type">☀️ Comida</span>
        <span class="meal-name" :class="{ 'empty-text': !menuHoy.comida }">
          {{ menuHoy.comida || '---' }}
        </span>
      </div>
      <div class="menu-item">
        <span class="meal-type">🌙 Cena</span>
        <span class="meal-name" :class="{ 'empty-text': !menuHoy.cena }">
          {{ menuHoy.cena || '---' }}
        </span>
      </div>
    </template>
  </section>
</template>

<script setup>
defineProps({
  menuHoy: { type: Object, default: () => ({ comida: '', cena: '' }) },
  fechaVisualHoy: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.current-date-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: capitalize;
  margin-top: -0.4rem;
  margin-bottom: 1rem;
}
.menu-item {
  display: flex;
  margin-top: 1rem;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  /* CAMBIO: flex-start para que el tipo de comida se alinee arriba si el texto es largo */
  align-items: flex-start;
  gap: 0.75rem;
}
.meal-type {
  font-weight: 600;
  color: #ffd166;
  width: 30%;
  flex-shrink: 0;
  text-align: left;
  /* Extra: un pequeño padding superior para cuadrar perfectamente con la primera línea de texto */
  padding-top: 0.05rem; 
}
.meal-name {
  font-size: 0.95rem;
  color: #ffffff;
  text-align: left;
  /* SOLUCIÓN: Permitimos el salto de línea y aseguramos la rotura de palabras si fuera necesario */
  white-space: normal;
  word-break: break-word;
  flex-grow: 1;
}
.meal-name.empty-text {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.text-center { text-align: center; }
</style>