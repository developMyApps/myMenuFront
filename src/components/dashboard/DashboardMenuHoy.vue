<template>
  <section class="card glass-effect">
    <h2>🍽️ Menú de Hoy</h2>
    <p class="current-date-label">{{ fechaVisualHoy }}</p>
    
    <div v-if="loading" class="text-center py-4">Cargando...</div>
    <template v-else>
      <div class="menu-item">
        <span class="meal-type">☀️ Comida</span>
        <div class="meal-content-box">
          <div v-if="!getParsed(menuHoy.comida).shared && getParsed(menuHoy.comida).individuals.length === 0" class="meal-name empty-text">
            ---
          </div>
          <div v-else class="meal-details">
            <div v-if="getParsed(menuHoy.comida).shared" class="shared-meal-text">
              <span v-if="getParsed(menuHoy.comida).individuals.length > 0" class="badge-tag shared-tag">🍲 General:</span>
              <span>{{ getParsed(menuHoy.comida).shared }}</span>
            </div>
            <div v-if="getParsed(menuHoy.comida).individuals.length > 0" class="individuals-list">
              <div v-for="(ind, index) in getParsed(menuHoy.comida).individuals" :key="index" class="individual-item">
                <span class="person-tag">👤 {{ ind.person || 'Alguien' }}:</span>
                <span class="individual-text">{{ ind.text || 'Sin detalle' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="menu-item">
        <span class="meal-type">🌙 Cena</span>
        <div class="meal-content-box">
          <div v-if="!getParsed(menuHoy.cena).shared && getParsed(menuHoy.cena).individuals.length === 0" class="meal-name empty-text">
            ---
          </div>
          <div v-else class="meal-details">
            <div v-if="getParsed(menuHoy.cena).shared" class="shared-meal-text">
              <span v-if="getParsed(menuHoy.cena).individuals.length > 0" class="badge-tag shared-tag">🍲 General:</span>
              <span>{{ getParsed(menuHoy.cena).shared }}</span>
            </div>
            <div v-if="getParsed(menuHoy.cena).individuals.length > 0" class="individuals-list">
              <div v-for="(ind, index) in getParsed(menuHoy.cena).individuals" :key="index" class="individual-item">
                <span class="person-tag">👤 {{ ind.person || 'Alguien' }}:</span>
                <span class="individual-text">{{ ind.text || 'Sin detalle' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { parseMeal } from '../../utils/mealParser'

defineProps({
  menuHoy: { type: Object, default: () => ({ comida: '', cena: '' }) },
  fechaVisualHoy: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const getParsed = (rawText) => {
  return parseMeal(rawText || '')
}
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
  align-items: flex-start;
  gap: 0.75rem;
}
.meal-type {
  font-weight: 600;
  color: #ffd166;
  width: 30%;
  flex-shrink: 0;
  text-align: left;
  padding-top: 0.05rem; 
}
.meal-content-box {
  flex-grow: 1;
}
.meal-name {
  font-size: 0.95rem;
  color: #ffffff;
  text-align: left;
  white-space: normal;
  word-break: break-word;
}
.meal-name.empty-text {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}
.meal-details { display: flex; flex-direction: column; gap: 0.35rem; }
.shared-meal-text { font-size: 0.95rem; color: #e0e0e0; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; text-align: left; }
.badge-tag { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }
.shared-tag { background: rgba(241, 184, 24, 0.2); color: #ffd166; border: 1px solid rgba(241, 184, 24, 0.4); }

.individuals-list { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.2rem; }
.individual-item { font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; background: rgba(255, 255, 255, 0.05); padding: 0.25rem 0.5rem; border-radius: 6px; border-left: 3px solid #81c784; flex-wrap: wrap; text-align: left; }
.person-tag { font-weight: 600; color: #a2d2ff; }
.individual-text { color: #ddd; }

.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.text-center { text-align: center; }
</style>