<template>
  <section class="stats-grid">
    <router-link to="/shopping" class="card-link">
      <div class="card glass-effect stat-card">
        <h3>🛍️ Lista de Compra</h3>
        <p class="big-number">{{ totalElementosCompra }}</p>
        <small>elementos pendientes</small>
      </div>
    </router-link>
    <router-link to="/tupperware" class="card-link">
      <div class="card glass-effect stat-card">
        <h3>🍱 Total Tuppers</h3>
        <p class="big-number">{{ totalTuppers }}</p>
        <div class="sub-stats">
          <span>❄️ {{ totalTuppersCongelador }} Congelador</span>
          <span>🍏 {{ totalTuppersNevera }} Nevera</span>
        </div>
      </div>
    </router-link>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  listaCompra: { type: Array, default: () => [] },
  tuppers: { type: Array, default: () => [] }
})

const totalElementosCompra = computed(() => props.listaCompra?.length || 0)
const totalTuppersNevera = computed(() => props.tuppers?.filter(t => t.location === 'Nevera').length || 0)
const totalTuppersCongelador = computed(() => props.tuppers?.filter(t => t.location === 'Congelador').length || 0)
const totalTuppers = computed(() => totalTuppersNevera.value + totalTuppersCongelador.value)
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.stat-card { text-align: center; padding: 1rem; }
.big-number { font-size: 2rem; font-weight: bold; margin: 0; color: var(--accent-color); }
.sub-stats { display: flex; justify-content: center; gap: 0.8rem; font-size: 0.8rem; opacity: 0.8; margin-top: 0.4rem; }
.card-link {
    text-decoration: none;
    color: inherit;
}
</style>