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
      <!-- Slot Comida -->
      <div class="meal-slot" @click="$emit('select-meal', dia, 'comida')">
        <div class="meal-meta">
          <span class="meal-icon">☀️</span>
          <span class="meal-label">Comida</span>
        </div>
        
        <div class="meal-content-box">
          <div v-if="!getParsed(dia.comida).shared && getParsed(dia.comida).individuals.length === 0" class="meal-text empty-text">
            Añadir menú...
          </div>

          <div v-else class="meal-details">
            <!-- Menú general del grupo -->
            <div v-if="getParsed(dia.comida).shared" class="shared-meal-text">
              <span v-if="getParsed(dia.comida).individuals.length > 0" class="badge-tag shared-tag">🍲 General:</span>
              <span>{{ getParsed(dia.comida).shared }}</span>
            </div>

            <!-- Menús individuales / excepciones por persona -->
            <div v-if="getParsed(dia.comida).individuals.length > 0" class="individuals-list">
              <div 
                v-for="(ind, index) in getParsed(dia.comida).individuals" 
                :key="index" 
                class="individual-item"
              >
                <span class="person-tag">👤 {{ ind.person || 'Alguien' }}:</span>
                <span class="individual-text">{{ ind.text || 'Sin detalle' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slot Cena -->
      <div class="meal-slot" @click="$emit('select-meal', dia, 'cena')">
        <div class="meal-meta">
          <span class="meal-icon">🌙</span>
          <span class="meal-label">Cena</span>
        </div>

        <div class="meal-content-box">
          <div v-if="!getParsed(dia.cena).shared && getParsed(dia.cena).individuals.length === 0" class="meal-text empty-text">
            Añadir menú...
          </div>

          <div v-else class="meal-details">
            <!-- Menú general del grupo -->
            <div v-if="getParsed(dia.cena).shared" class="shared-meal-text">
              <span v-if="getParsed(dia.cena).individuals.length > 0" class="badge-tag shared-tag">🍲 General:</span>
              <span>{{ getParsed(dia.cena).shared }}</span>
            </div>

            <!-- Menús individuales / excepciones por persona -->
            <div v-if="getParsed(dia.cena).individuals.length > 0" class="individuals-list">
              <div 
                v-for="(ind, index) in getParsed(dia.cena).individuals" 
                :key="index" 
                class="individual-item"
              >
                <span class="person-tag">👤 {{ ind.person || 'Alguien' }}:</span>
                <span class="individual-text">{{ ind.text || 'Sin detalle' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { parseMeal } from '../../utils/mealParser'

defineProps({
  dia: { type: Object, required: true }
})
defineEmits(['select-meal'])

const getParsed = (rawText) => {
  return parseMeal(rawText)
}
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
.meal-slot { display: flex; align-items: flex-start; padding: 0.7rem 0.9rem; background: rgba(255, 255, 255, 0.05); border-radius: 10px; cursor: pointer; transition: background 0.2s; gap: 0.8rem; }
.meal-slot:hover { background: rgba(255, 255, 255, 0.1); }

.meal-meta { display: flex; align-items: center; gap: 0.4rem; width: 85px; flex-shrink: 0; margin-top: 0.1rem; }
.meal-label { font-size: 0.85rem; font-weight: 600; color: #aaa; }

.meal-content-box { flex-grow: 1; padding-left: 0.2rem; }
.meal-text { margin: 0; font-size: 0.95rem; color: #e0e0e0; word-break: break-word; }
.meal-text.empty-text { color: #777; font-style: italic; }

.meal-details { display: flex; flex-direction: column; gap: 0.35rem; }
.shared-meal-text { font-size: 0.95rem; color: #e0e0e0; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.badge-tag { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }
.shared-tag { background: rgba(241, 184, 24, 0.2); color: #ffd166; border: 1px solid rgba(241, 184, 24, 0.4); }

.individuals-list { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.2rem; }
.individual-item { font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; background: rgba(255, 255, 255, 0.05); padding: 0.25rem 0.5rem; border-radius: 6px; border-left: 3px solid #81c784; flex-wrap: wrap; }
.person-tag { font-weight: 600; color: #a2d2ff; }
.individual-text { color: #ddd; }
</style>