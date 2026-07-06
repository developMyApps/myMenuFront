<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Inicio</h1>
      <div class="user-avatar">🧑‍🍳</div>
    </header>
    <main class="dashboard-content">
      
      <!-- Cartela del Menú de Hoy con Estado de Carga -->
      <section class="card glass-effect">
        <h2>🍽️ Menú de Hoy</h2>
        <p class="current-date-label">{{ fechaVisualHoy }}</p>
        
        <div v-if="loading" class="text-center py-4">
          <p class="loading-text">Cargando menú...</p>
        </div>

        <template v-else>
          <div class="menu-item">
            <span class="meal-type">Comida</span>
            <span class="meal-name" :class="{ 'empty-text': !menuHoy.comida }">
              {{ menuHoy.comida || 'Sin programar...' }}
            </span>
          </div>
          <div class="menu-item">
            <span class="meal-type">Cena</span>
            <span class="meal-name" :class="{ 'empty-text': !menuHoy.cena }">
              {{ menuHoy.cena || 'Sin programar...' }}
            </span>
          </div>
        </template>
      </section>

      <!-- Alertas de Caducidad -->
      <!-- <section class="card glass-effect mt-4">
        <h2>⚠️ Caducan Pronto</h2>
        <ul class="expiring-list">
          <li>Leche <span class="badge warning">2 días</span></li>
          <li>Yogures <span class="badge danger">Hoy</span></li>
        </ul>
      </section> -->
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// IMPORTANTE: Usamos tu instancia de axios centralizada que maneja local/prod automáticamente
import api from '../services/api' 

// Estado reactivo
const menuHoy = ref({ comida: '', cena: '' })
const fechaVisualHoy = ref('')
const loading = ref(true)
const groupId = ref(null)

// Obtiene la fecha del lunes de la semana actual para la consulta a la API
const obtenerLunesYHoyISO = () => {
  const hoy = new Date()
  
  // Formato visual para el subtítulo (Ej: "Viernes, 3 de jul")
  fechaVisualHoy.value = hoy.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  })

  // Calcular el string ISO exacto de hoy (YYYY-MM-DD)
  const añoHoy = hoy.getFullYear()
  const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0')
  const diaHoy = String(hoy.getDate()).padStart(2, '0')
  const hoyISO = `${añoHoy}-${mesHoy}-${diaHoy}`

  // Calcular el lunes de esta semana para pedir el bloque de menús a la API
  const diaActualSemana = hoy.getDay()
  const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana
  const lunesActual = new Date(hoy)
  lunesActual.setDate(hoy.getDate() + distanciaAlLunes)

  const añoLunes = lunesActual.getFullYear()
  const mesLunes = String(lunesActual.getMonth() + 1).padStart(2, '0')
  const diaLunes = String(lunesActual.getDate()).padStart(2, '0')
  const lunesISO = `${añoLunes}-${mesLunes}-${diaLunes}`

  return { lunesISO, hoyISO }
}

const cargarMenuDeHoy = async () => {
  if (!groupId.value) {
    loading.value = false
    return
  }

  const { lunesISO, hoyISO } = obtenerLunesYHoyISO()

  try {
    // CORREGIDO: Ahora usa 'api.get' apuntando a la ruta relativa
    const respuesta = await api.get(`/groups/${groupId.value}/meals`, {
      params: { fecha_inicio: lunesISO }
    })

    const datosBD = respuesta.data

    if (datosBD && datosBD[hoyISO]) {
      menuHoy.value.comida = datosBD[hoyISO].comida || ''
      menuHoy.value.cena = datosBD[hoyISO].cena || ''
    }
  } catch (error) {
    console.error("Error al recuperar el menú del día de hoy:", error)
  } finally {
    loading.value = false // Quitamos el estado de carga pase lo que pase
  }
}

onMounted(() => {
  // CORREGIDO: Obtenemos el grupo real del usuario igual que en la lista de la compra
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
  }
  
  // Ejecutamos la carga sin congelar el ciclo de vida del componente
  cargarMenuDeHoy()
})
</script>

<style scoped>
.dashboard-content {
  padding: 1rem;
}
.current-date-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: capitalize;
  margin-top: -0.4rem;
  margin-bottom: 1rem;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.8rem;
  background: #f9f9f9;
  border-radius: 8px;
  align-items: center;
}
.meal-type {
  font-weight: 600;
  color: #4caf50;
  width: 80px;
  flex-shrink: 0;
}
.meal-name {
  font-size: 0.95rem;
  color: #2c3e50;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0.5rem;
}
.meal-name.empty-text {
  color: #bbb;
  font-style: italic;
}
.expiring-list {
  list-style: none;
  padding: 0;
}
.expiring-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #eee;
}
.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}
.badge.warning { background: #f39c12; color: #fff; }
.badge.danger { background: #e74c3c; color: #fff; }
.mt-4 { margin-top: 1.5rem; }
</style>
