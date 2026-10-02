<template>
  <div class="view-container">
    <header class="top-header">
      <div class="header-title-area">
        <h1>Inicio</h1>
        <button class="btn-guide-trigger" @click="guiaAbierta = true">📖 Guía de Uso</button>
      </div>

      <!-- Acción superior derecha: Botón a Ajustes -->
      <router-link to="/settings" class="btn-settings-header" title="Ajustes">
        ⚙️
      </router-link>
    </header>

    <main class="dashboard-content">
      <div class="banner-mensaje glass-effect">
        <div class="mensaje-destacado">NUEVAS FUNCIONALIDADES</div>
        <p class="texto-mensaje">{{ mensajeDelDia }}</p>
      </div>

      <DashboardStats :listaCompra="listaCompra" :tuppers="tuppers" />

      <router-link to="/calendar" class="card-link">
        <DashboardMenuHoy :menuHoy="menuHoy" :fechaVisualHoy="fechaVisualHoy" :loading="loading" />
      </router-link>

      <DashboardPlatosEstrella :topComidas="topComidas" :topCenas="topCenas" />
    </main>

    <DashboardGuideModal :is-open="guiaAbierta" @close="guiaAbierta = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const mensajeDelDia = "¡YA HA LLEGADO LA DESPENSA! Al tachar un artículo de tu lista de la compra se habilitará el botón para añadir a la despensa. En la pantalla de DESPENSA 🏪 podrás gestionar tus artículos. ⚙️ El toque mágico ✨: En tus recetas podrás comprobar si tienes los ingredientes necesarios pulsando el botón 'Comprobar despensa'. En caso de faltar ingredientes, podrás añadirlos directamente a tu lista de la compra. Recuerda que esto es una fase BETA, cualquier error o sugerencia hágalo saber."

const obtenerLunesYHoyISO = () => {
  const hoy = new Date()
  
  fechaVisualHoy.value = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
  
  const año = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  const hoyISO = `${año}-${mes}-${dia}`
  
  const diaActualSemana = hoy.getDay()
  const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana
  const lunesActual = new Date(hoy)
  lunesActual.setDate(hoy.getDate() + distanciaAlLunes)
  
  const lAño = lunesActual.getFullYear()
  const lMes = String(lunesActual.getMonth() + 1).padStart(2, '0')
  const lDia = String(lunesActual.getDate()).padStart(2, '0')
  const lunesISO = `${lAño}-${lMes}-${lDia}`

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

const cargarTodo = async () => {
  try {
    const { lunesISO, hoyISO } = obtenerLunesYHoyISO()
    
    const [datosBD, historial, resLista, resTuppers] = await Promise.all([
      getMeals(groupId.value, lunesISO),
      getHistoricalMeals(groupId.value),
      getShoppingList(groupId.value),
      getTupperwares(groupId.value)
    ])

    if (datosBD && datosBD[hoyISO]) {
      menuHoy.value = datosBD[hoyISO]
    } else {
      menuHoy.value = { comida: '', cena: '' }
    }

    procesarTendencias(historial || [])
    listaCompra.value = resLista || []
    tuppers.value = resTuppers || []
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
    cargarTodo()        
  } else { 
    loading.value = false 
  }
})
</script>

<style scoped>
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.header-title-area { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-start; 
  gap: 0.25rem; 
}

.btn-guide-trigger {
  background: rgba(255, 209, 102, 0.12); 
  border: 1px solid rgba(255, 209, 102, 0.3);
  color: #ffd166; 
  border-radius: 20px; 
  padding: 0.25rem 0.75rem; 
  font-size: 0.8rem; 
  font-weight: 600; 
  cursor: pointer; 
  transition: all 0.2s;
}

.btn-guide-trigger:hover { 
  background: rgba(255, 209, 102, 0.25); 
  transform: translateY(-1px); 
}

.btn-settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  font-size: 1.3rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-settings-header:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: rotate(30deg);
}

.dashboard-content { 
  padding: 0 1rem 1rem 1rem; 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
}

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
  color: #e0e0e0; 
  font-size: 1.1rem; 
  font-weight: 500; 
  margin: 0; 
  font-style: italic; 
  letter-spacing: 0.5px; 
  line-height: 1.4;
}

.banner-mensaje::before { content: '💡 '; }

.mensaje-destacado {
  color: #ffd166; 
  font-size: 1.2rem; 
  font-weight: 700; 
  margin: 0; 
  letter-spacing: 0.5px; 
  line-height: 1.4;
}

.card-link {
  text-decoration: none;
  color: inherit;
}
</style>