<template>
  <div class="view-container">
    <header class="top-header">
      <div class="header-title-area">
        <h1>Inicio</h1>
        <button class="btn-guide-trigger" @click="abrirGuia">📖 Guía de Uso</button>
      </div>
      <div class="user-avatar">🧑‍🍳</div>
    </header>

    <main class="dashboard-content">
      
      <section class="stats-grid">
        <div class="card glass-effect stat-card">
          <h3>🛍️ Lista de Compra</h3>
          <p class="big-number">{{ totalElementosCompra }}</p>
          <small>elementos pendientes</small>
        </div>
        <div class="card glass-effect stat-card">
          <h3>🍱 Total Tuppers</h3>
          <p class="big-number">{{ totalTuppers }}</p>
          <div class="sub-stats">
            <span>❄️ {{ totalTuppersCongelador }} Congelador</span>
            <span>🍏 {{ totalTuppersNevera }} Nevera</span>
          </div>
        </div>
      </section>

      <section class="card glass-effect">
        <h2>🍽️ Menú de Hoy</h2>
        <p class="current-date-label">{{ fechaVisualHoy }}</p>
        <div v-if="loading" class="text-center py-4">Cargando...</div>
        <template v-else>
          <div class="menu-item">☀️ Comida: {{ menuHoy.comida || '---' }}</div>
          <div class="menu-item">🌙 Cena: {{ menuHoy.cena || '---' }}</div>
        </template>
      </section>

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
    </main>

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getMeals, getHistoricalMeals } from '../services/mealService'
import { getShoppingList } from '../services/shoppingService'
import { getTupperwares } from '../services/tupperwareService'

const menuHoy = ref({ comida: '', cena: '' })
const fechaVisualHoy = ref('')
const loading = ref(true)
const groupId = ref(null)
const topComidas = ref([])
const topCenas = ref([])
const listaCompra = ref([])
const tuppers = ref([])

// Lógica de fechas
const obtenerLunesYHoyISO = () => {
  const hoy = new Date()
  fechaVisualHoy.value = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
  const hoyISO = hoy.toISOString().split('T')[0]
  const diaActualSemana = hoy.getDay()
  const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana
  const lunesActual = new Date(hoy)
  lunesActual.setDate(hoy.getDate() + distanciaAlLunes)
  const lunesISO = lunesActual.toISOString().split('T')[0]
  return { lunesISO, hoyISO }
}

const procesarTendencias = (meals) => {
  const comidaMap = {}, cenaMap = {}
  meals.forEach(m => {
    const nombre = m.texto_menu.replace('🍱 ', '').trim()
    if (m.tipo === 'comida') comidaMap[nombre] = (comidaMap[nombre] || 0) + 1
    if (m.tipo === 'cena') cenaMap[nombre] = (cenaMap[nombre] || 0) + 1
  })
  topComidas.value = Object.entries(comidaMap).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count).slice(0, 3)
  topCenas.value = Object.entries(cenaMap).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count).slice(0, 3)
}


// ... dentro de <script setup>

const cargarTodo = async () => {
  try {
    const { lunesISO, hoyISO } = obtenerLunesYHoyISO()
    
    // 1. Cargar menús del día
    const datosBD = await getMeals(groupId.value, lunesISO)
    if (datosBD && datosBD[hoyISO]) menuHoy.value = datosBD[hoyISO]

    // 2. Cargar historial para tendencias
    const historial = await getHistoricalMeals(groupId.value)
    procesarTendencias(historial)

    // 3. NUEVO: Cargar Lista de la compra
    const compras = await getShoppingList(groupId.value)
    listaCompra.value = compras || []

    // 4. NUEVO: Cargar Tuppers
    const invTuppers = await getTupperwares(groupId.value)
    tuppers.value = invTuppers || []

  } catch (e) { 
    console.error("Error al cargar datos:", e) 
  } finally { 
    loading.value = false 
  }
}

const obtenerAnchoProgreso = (count, tipo) => {
  const lista = tipo === 'comida' ? topComidas.value : topCenas.value
  const max = Math.max(...lista.map(i => i.count), 1)
  return `${(count / max) * 100}%`
}

const totalElementosCompra = computed(() => listaCompra.value?.length || 0)
const totalTuppersNevera = computed(() => tuppers.value?.filter(t => t.location === 'Nevera').length || 0)
const totalTuppersCongelador = computed(() => tuppers.value?.filter(t => t.location === 'Congelador').length || 0)
const totalTuppers = computed(() => totalTuppersNevera.value + totalTuppersCongelador.value)

onMounted(() => {
  const saved = localStorage.getItem('kitchenGroup')
  if (saved) {
    groupId.value = JSON.parse(saved).id
    cargarTodo()
  } else { loading.value = false }
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.stat-card { text-align: center; padding: 1rem; }
.big-number { font-size: 2rem; font-weight: bold; margin: 0; color: var(--accent-color); }
.tendencias-container { display: flex; gap: 2rem; }
.rank-item { display: flex; justify-content: space-between; padding: 0.2rem 0; border-bottom: 1px solid #eee; }
</style>

<style scoped>
.dashboard-content {
  padding: 1rem;
}

.header-title-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

/* Botón elegante para lanzar la guía */
.btn-guide-trigger {
  background: rgba(255, 209, 102, 0.12);
  border: 1px solid rgba(255, 209, 102, 0.3);
  color: #ffd166;
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.btn-guide-trigger:hover {
  background: rgba(255, 209, 102, 0.25);
  transform: translateY(-1px);
}

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
  align-items: center;
  gap: 0.75rem;
}

.meal-type {
  font-weight: 600;
  color: #ffd166;
  width: 80px;
  flex-shrink: 0;
  text-align: left;
}

.meal-name {
  font-size: 0.95rem;
  color: #ffffff;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0.5rem;
}

.meal-name.empty-text {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}

/* =========================================
   ESTILOS DE LA MODAL DE LA GUÍA (GLASS)
   ========================================= */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
  box-sizing: border-box;
}

.guide-modal {
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  text-align: left;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.modal-header h2 {
  font-size: 1.3rem;
  color: #ffd166;
  margin: 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
}

.btn-close-modal:hover {
  color: white;
}

/* Pestañas de Navegación */
.guide-tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
  overflow-x: auto;
}

.guide-tabs button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  white-space: nowrap;
  transition: all 0.2s;
}

.guide-tabs button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.guide-tabs button.active-tab {
  color: #ffd166;
  background: rgba(255, 209, 102, 0.15);
  font-weight: 600;
}

/* Cuerpo del Contenido */
.guide-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.guide-tab-content h3 {
  margin-top: 0;
  font-size: 1.1rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.guide-tab-content p {
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
}

.guide-tab-content ul {
  padding-left: 1.2rem;
  margin: 0;
}

.guide-tab-content li {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.6rem;
}

.tip-box {
  background: rgba(162, 210, 255, 0.1);
  border-left: 4px solid #a2d2ff;
  padding: 0.75rem 1rem;
  border-radius: 0 10px 10px 0;
  margin-top: 1rem;
}

.tip-box strong {
  font-size: 0.85rem;
  color: #a2d2ff;
  display: block;
  margin-bottom: 0.25rem;
}

.tip-box p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
}
.btn {
  font-weight: bold;
  border-radius: 10px;
  border: 0;
  vertical-align: middle;
  padding: 0.8em 1.2em;
  cursor: pointer;
  box-shadow: 0 5px 5px 0px rgba(0, 0, 0, 0.06);
}



.mt-4 { margin-top: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.text-center { text-align: center; }
.loading-text { opacity: 0.5; font-size: 0.9rem; }

/* Transiciones de Modal */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .guide-modal, .modal-fade-leave-active .guide-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from .guide-modal, .modal-fade-leave-to .guide-modal { transform: scale(0.95); }
</style>

<style scoped>
.tendencias-section { padding: 1.5rem; }
.tendencias-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.rank-title { margin-bottom: 1rem; color: #e19c90; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }

.rank-card { margin-bottom: 1.2rem; }
.rank-info { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 4px; }
.rank-number { font-weight: 800; color: #ffa500; font-size: 0.9rem; }
.rank-name { font-weight: 500; font-size: 0.95rem; }

/* Barras de progreso elegantes */
.progress-bg { height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.comida-fill { background: linear-gradient(90deg, #ff9f1c, #ffbf69); }
.cena-fill { background: linear-gradient(90deg, #48cae4, #90e0ef); }

.rank-count { font-size: 0.75rem; color: #888; float: right; margin-top: 2px; }
</style>
