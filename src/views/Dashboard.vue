<template>
  <div class="view-container">
    <header class="top-header">
      <div class="header-title-area">
        <h1>Inicio</h1>
        <button class="btn-guide-trigger" @click="abrirGuia">📖 Guía de Uso</button>

         <!-- VENTANA MODAL INTERACTIVA: GUÍA DE USUARIO -->
        <Transition name="modal-fade">
          <div v-if="guiaAbierta" class="modal-overlay" @click.self="cerrarGuia">
            <div class="modal-content glass-effect guide-modal">
              
              <div class="modal-header">
                <h2>📖 Guía de Usuario Inteligente</h2>
                <button class="btn-close-modal" @click="cerrarGuia">×</button>
              </div>

              <!-- Pestañas de Navegación de la Guía -->
              <div class="guide-tabs">
                <button 
                  :class="{ 'active-tab': tabActiva === 'intro' }" 
                  @click="tabActiva = 'intro'"
                >
                  🚀 Inicio
                </button>
                <button 
                  :class="{ 'active-tab': tabActiva === 'calendar' }" 
                  @click="tabActiva = 'calendar'"
                >
                  📅 Calendario
                </button>
                <button 
                  :class="{ 'active-tab': tabActiva === 'recipes' }" 
                  @click="tabActiva = 'recipes'"
                >
                  🍳 Recetas
                </button>
                <button 
                  :class="{ 'active-tab': tabActiva === 'tuppers' }" 
                  @click="tabActiva = 'tuppers'"
                >
                  🍱 Tuppers
                </button>
              </div>

              <!-- Contenido según la pestaña activa -->
              <div class="guide-body">
                
                <!-- Pestaña: Introducción -->
                <div v-if="tabActiva === 'intro'" class="guide-tab-content">
                  <h3>¡Te damos la bienvenida a tu cocina! 👋</h3>
                  <p>Esta aplicación está diseñada para facilitar la planificación gastronómica del hogar. Todas las acciones se sincronizan automáticamente con las personas de tu grupo en tiempo real.</p>
                  
                  <div class="tip-box">
                    <strong>💡 El truco del grupo:</strong>
                    <p>Ve a <strong>Ajustes</strong>, crea un grupo y copia el ID. Pásaselo a tus familiares o compañeros de piso para que todos podáis ver qué hay en el congelador o qué toca cenar hoy.</p>
                  </div>
                </div>

                <!-- Pestaña: Calendario -->
                <div v-if="tabActiva === 'calendar'" class="guide-tab-content">
                  <h3>📅 Calendario y Menús Semanales</h3>
                  <p>Planifica de lunes a domingo de forma rápida y fluida sin esperas de red.</p>
                  <ul>
                    <li><strong>Añadir comidas:</strong> Haz clic en cualquier celda (Comida ☀️ o Cena 🌙) de cualquier día de la semana.</li>
                    <li><strong>Escribir libremente:</strong> Puedes escribir a mano el texto que quieras (ej: "Macarrones de ayer").</li>
                    <li><strong>Vincular Recetas:</strong> Pulsa el botón del libro 📖 al lado del input para volcar directamente el título de cualquiera de tus recetas guardadas de forma instantánea.</li>
                    <li><strong>Navegar en el tiempo:</strong> Utiliza las flechas del encabezado para planificar semanas futuras o revisar menús pasados.</li>
                  </ul>
                </div>

                <!-- Pestaña: Recetas -->
                <div v-if="tabActiva === 'recipes'" class="guide-tab-content">
                  <h3>🍳 Libro de Recetas Digital</h3>
                  <p>Mantén un catálogo digital con los platos que soléis preparar en casa.</p>
                  <ul>
                    <li><strong>Añadir Recetas:</strong> Haz clic en "➕ Nueva Receta" e introduce el nombre y las instrucciones detalladas paso a paso.</li>
                    <li><strong>Buscador Instantáneo:</strong> Utiliza la barra superior para filtrar tus recetas por título. Además, se ordenarán automáticamente por orden alfabético.</li>
                    <li><strong>Modo Detalle:</strong> Haz clic en cualquier receta de la cuadrícula para leerla.</li>
                    <li><strong>Edición en Caliente:</strong> Dentro de la vista de detalle de cualquier receta, pulsa el botón ✏️ para corregir las instrucciones o cambiarle el nombre.</li>
                  </ul>
                </div>

                <!-- Pestaña: Tuppers -->
                <div v-if="tabActiva === 'tuppers'" class="guide-tab-content">
                  <h3>🍱 Gestión de Tuppers y Congelador</h3>
                  <p>El fin del desperdicio de comida y del misterio de los recipientes sin etiqueta.</p>
                  <ul>
                    <li><strong>Registrar un Tupper:</strong> Pulsa "❄️ Congelar Tupper", indícale qué es, las raciones que tiene y su ubicación (Nevera o Congelador).</li>
                    <li><strong>Controles de Ración (+ / -):</strong> No necesitas entrar en ningún sitio para actualizar las raciones disponibles. Usa los botones rápidos directamente en las tarjetas del listado.</li>
                    <li><strong>Stock Agotado:</strong> Cuando una comida se acabe por completo y su ración llegue a <code>0</code>, aparecerá un botón rojo de reciclaje 🗑️ para eliminarla con un clic y limpiar el inventario.</li>
                  </ul>
                </div>

              </div>

              <div class="modal-actions mt-4">
                <button class="btn btn-primary" @click="cerrarGuia">¡Entendido, gracias!</button>
              </div>

            </div>
          </div>
        </Transition>

      </div>
      <div class="user-avatar">🧑‍🍳</div>
    </header>

    <main class="dashboard-content">
      <DashboardStats :listaCompra="listaCompra" :tuppers="tuppers" />

      <DashboardMenuHoy :menuHoy="menuHoy" :fechaVisualHoy="fechaVisualHoy" :loading="loading" />

      <DashboardPlatosEstrella :topComidas="topComidas" :topCenas="topCenas" />
    </main>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardStats from '../components/dashboard/DashboardStats.vue'
import DashboardMenuHoy from '../components/dashboard/DashboardMenuHoy.vue'
import DashboardPlatosEstrella from '../components/dashboard/DashboardPlatosEstrella.vue'

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
    
    const datosBD = await getMeals(groupId.value, lunesISO)
    if (datosBD && datosBD[hoyISO]) menuHoy.value = datosBD[hoyISO]

    const historial = await getHistoricalMeals(groupId.value)
    procesarTendencias(historial)

    listaCompra.value = await getShoppingList(groupId.value) || []
    tuppers.value = await getTupperwares(groupId.value) || []
  } catch (e) { 
    console.error("Error al cargar datos:", e) 
  } finally { 
    loading.value = false 
  }
}

onMounted(() => {
  const saved = localStorage.getItem('kitchenGroup')
  if (saved) {
    groupId.value = JSON.parse(saved).id
    cargarTodo()
  } else { loading.value = false }
})

// Estados para la Guía de Usuario
const guiaAbierta = ref(false)
const tabActiva = ref('intro')

// Métodos de la guía
const abrirGuia = () => {
  tabActiva.value = 'intro'
  guiaAbierta.value = true
}
const cerrarGuia = () => {
  guiaAbierta.value = false
}

</script>

<style scoped>
.dashboard-content { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.header-title-area { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
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
.btn-guide-trigger:hover { background: rgba(255, 209, 102, 0.25); transform: translateY(-1px); }
/* Transiciones de Modal */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .guide-modal, .modal-fade-leave-active .guide-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from .guide-modal, .modal-fade-leave-to .guide-modal { transform: scale(0.95); }
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
</style>