<template>
  <section class="card glass-effect tendencias-section">
    <h2>⭐ Tus Platos Estrella</h2>
    <div class="tendencias-container">
      
      <div class="ranking-column">
        <h4 class="rank-title">☀️ Comidas</h4>
        <div v-for="(item, index) in topComidas" :key="item.name" class="rank-card">
          <div class="rank-info">
            <span class="rank-number">#{{ index + 1 }}</span>
            <span class="rank-name">{{ item.name }}</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill comida-fill" :style="{ width: obtenerAnchoProgreso(item.count, 'comida') }"></div>
          </div>
          <small class="rank-count">{{ item.count }} veces</small>
        </div>
      </div>

      <div class="ranking-column">
        <h4 class="rank-title">🌙 Cenas</h4>
        <div v-for="(item, index) in topCenas" :key="item.name" class="rank-card">
          <div class="rank-info">
            <span class="rank-number">#{{ index + 1 }}</span>
            <span class="rank-name">{{ item.name }}</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill cena-fill" :style="{ width: obtenerAnchoProgreso(item.count, 'cena') }"></div>
          </div>
          <small class="rank-count">{{ item.count }} veces</small>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  topComidas: { type: Array, default: () => [] },
  topCenas: { type: Array, default: () => [] }
})

const obtenerAnchoProgreso = (count, tipo) => {
  const lista = tipo === 'comida' ? props.topComidas : props.topCenas
  const max = Math.max(...lista.map(i => i.count), 1)
  return `${(count / max) * 100}%`
}
</script>

<style scoped>
.tendencias-section { padding: 1.5rem; }
.tendencias-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.rank-title { margin-bottom: 1rem; color: #e19c90; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
.rank-card { margin-bottom: 1.2rem; }
.rank-info { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 4px; }
.rank-number { font-weight: 800; color: #ffa500; font-size: 0.9rem; }
.rank-name { font-weight: 500; font-size: 0.95rem; color: white; }
.progress-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.comida-fill { background: linear-gradient(90deg, #ff9f1c, #ffbf69); }
.cena-fill { background: linear-gradient(90deg, #48cae4, #90e0ef); }
.rank-count { font-size: 0.75rem; color: #888; float: right; margin-top: 2px; }

@media (max-width: 600px) {
  .tendencias-container { grid-template-columns: 1fr; gap: 1rem; }
}
</style>