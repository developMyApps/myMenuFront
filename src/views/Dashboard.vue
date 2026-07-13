<template>
  <div class="view-container">
    <header class="top-header">
      <div class="header-title-area">
        <h1>Inicio</h1>
        <button class="btn-guide-trigger" @click="guiaAbierta = true">📖 Guía de Uso</button>
      </div>
      <div class="user-avatar">🧑‍🍳</div>
    </header>

    <main class="dashboard-content">
      <div class="banner-mensaje glass-effect">
        <p class="texto-mensaje">{{ mensajeDelDia }}</p>
      </div>

      <DashboardStats :listaCompra="listaCompra" :tuppers="tuppers" />

      <DashboardMenuHoy :menuHoy="menuHoy" :fechaVisualHoy="fechaVisualHoy" :loading="loading" />

      <DashboardPlatosEstrella :topComidas="topComidas" :topCenas="topCenas" />
    </main>

    <DashboardGuideModal :is-open="guiaAbierta" @close="guiaAbierta = false" />
  </div>
</template>

<script setup>
// CORRECCIÓN 1: Añadido 'computed' a las importaciones de Vue
import { ref, onMounted, computed } from 'vue'
import DashboardStats from '../components/dashboard/DashboardStats.vue'
import DashboardMenuHoy from '../components/dashboard/DashboardMenuHoy.vue'
import DashboardPlatosEstrella from '../components/dashboard/DashboardPlatosEstrella.vue'
import DashboardGuideModal from '../components/dashboard/DashboardGuideModal.vue'

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
const guiaAbierta = ref(false)

const mensajesDashboard = [
  "¡Que tengas un día tan bonito como tú! ✨",
  "Disfruta del día y, sobre todo, de la comida. 🍽️",
  "Sonríe, que hoy el menú promete! 🌟",
  "Hoy es un gran día para... pedir comida a domicilio si esto falla. 🍕",
  "Cocinar es un arte, limpiar la cocina es una tortura. ¡Ánimo! 🧼",
  "Tu cuerpo pide ensalada, pero tu corazón grita croquetas. Escucha a tu corazón. ❤️",
  "Previsión del tiempo para hoy: 100% de probabilidad de tener hambre.",
  "Hoy te toca fregar! ⏱️",
  "Mueve ese culo y a cocinar, que la comida no se hace sola. 🍑",
  "Qué bonita es la convivencia... sobre todo cuando mágicamente aparece comida hecha que tú no has cocinado. 👨‍🍳",
  "Sé que tienes cara de zombi, pero un café y este dashboard lo arreglan todo. ☕",
  "¿Otra vez mirando el menú? ¡Ponte a trabajar! 🤪",
  "Por favor, un minuto de silencio por ese ingrediente caro que compraste con ilusión y hoy ha caducado. Descanse en paz. 🤔",
  "Ya queda menos para comer! Y sobretodo para la siesta zzz",
  "Oh, Lorena, lo que daría porque me hicieras magdalenas",
  "La leyenda dice que si usas el último huevo y no lo apuntas en la Shopping List, un gato asesino te morderá un tobillo por la noche.",
  "Hoy el chef sugiere: Te comes lo que hay, pides un Glovo o te mueres de asco. Elige sabiamente.",
  "Cocinar es de guapos. Comprar precocinados y fingir que los has hecho tú, de genios flojos. Tú sabrás en qué bando estás."
]

// CORRECCIÓN 2: Añadida la función que calcula las fechas que se había extraviado
const obtenerLunesYHoyISO = () => {
  const hoy = new Date()
  fechaVisualHoy.value = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
  const hoyISO = hoy.toISOString().split('T')[0]
  const diaActualSemana = hoy.getDay()
  const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana
  const lunesActual = new Date(hoy)
  lunesActual.setDate(hoy.getDate() + distanciaAlLunes)
  return { lunesISO: lunesActual.toISOString().split('T')[0], hoyISO }
}

// El computed ahora puede llamar a obtenerLunesYHoyISO de forma segura
const mensajeDelDia = computed(() => {
  try {
    const { hoyISO } = obtenerLunesYHoyISO() 
    if (!hoyISO) return mensajesDashboard[0]
    
    const charSum = hoyISO.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const indice = charSum % mensajesDashboard.length
    return mensajesDashboard[indice]
  } catch (e) {
    return mensajesDashboard[0]
  }
})

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

const cargarCacheLocal = () => {
  const cacheStr = localStorage.getItem(`cache_dashboard_${groupId.value}`)
  if (cacheStr) {
    const cache = JSON.parse(cacheStr)
    menuHoy.value = cache.menuHoy || { comida: '', cena: '' }
    topComidas.value = cache.topComidas || []
    topCenas.value = cache.topCenas || []
    listaCompra.value = cache.listaCompra || []
    tuppers.value = cache.tuppers || []
    loading.value = false 
  }
}

const cargarTodo = async () => {
  try {
    const { lunesISO, hoyISO } = obtenerLunesYHoyISO()
    
    const [datosBD, historial, resLista, resTuppers] = await Promise.all([
      getMeals(groupId.value, lunesISO),
      getHistoricalMeals(groupId.value),
      getShoppingList(groupId.value),
      getTupperwares(groupId.value)
    ])

    if (datosBD && datosBD[hoyISO]) menuHoy.value = datosBD[hoyISO]
    procesarTendencias(historial || [])
    listaCompra.value = resLista || []
    tuppers.value = resTuppers || []

    const cacheData = {
      menuHoy: menuHoy.value,
      topComidas: topComidas.value,
      topCenas: topCenas.value,
      listaCompra: listaCompra.value,
      tuppers: tuppers.value
    }
    localStorage.setItem(`cache_dashboard_${groupId.value}`, JSON.stringify(cacheData))
  } catch (e) { 
    console.error("Error al sincronizar con el servidor:", e) 
  } finally { 
    loading.value = false 
  }
}

onMounted(() => {
  obtenerLunesYHoyISO()
  const saved = localStorage.getItem('kitchenGroup')
  if (saved) {
    groupId.value = JSON.parse(saved).id
    cargarCacheLocal() 
    cargarTodo()        
  } else { 
    loading.value = false 
  }
})
</script>

<style scoped>
.dashboard-content { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.header-title-area { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
.btn-guide-trigger {
  background: rgba(255, 209, 102, 0.12); border: 1px solid rgba(255, 209, 102, 0.3);
  color: #ffd166; border-radius: 20px; padding: 0.25rem 0.75rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-guide-trigger:hover { background: rgba(255, 209, 102, 0.25); transform: translateY(-1px); }

.banner-mensaje {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.2rem;
  text-align: center;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.texto-mensaje {
  color: #e0e0e0; font-size: 1.1rem; font-weight: 500; margin: 0; font-style: italic; letter-spacing: 0.5px; line-height: 1.4;
}
.banner-mensaje::before { content: '💡 '; }
</style>