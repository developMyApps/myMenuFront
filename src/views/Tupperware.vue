<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Congelador y Tuppers</h1>
      <button @click="modalCrearAbierta = true" class="btn btn-primary btn-add-tupper">
        ❄️ Congelar Tupper
      </button>
    </header>

    <main class="tupper-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para gestionar tus tupperwares.</p>
      </div>

      <template v-else>
        <div class="search-container mb-4 glass-effect">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar en el congelador o nevera... (ej: Lentejas)" 
            class="search-input"
          />
        </div>

        <div v-if="loading" class="text-center py-8">
          <p class="loading-text">Abriendo el congelador...</p>
        </div>

        <div v-else-if="tuppersFiltrados.length > 0" class="tuppers-grid">
          <TupperwareCard 
            v-for="tupper in tuppersFiltrados" 
            :key="tupper.id"
            :tupper="tupper"
            :is-saving="guardandoId === tupper.id"
            @update-servings="cambiarRacionesLocal"
            @delete-click="abrirModalConfirmarEliminar"
          />
        </div>

        <div v-else class="card glass-effect text-center py-6">
          <p class="empty-state">
            {{ searchQuery ? 'No hay ningún tupper con ese nombre o ubicación.' : '¡Tu inventario está vacío! Dale al botón superior para guardar tu comida.' }}
          </p>
        </div>
      </template>
    </main>

    <TupperwareCreateModal 
      :is-open="modalCrearAbierta"
      :loading="modalCargando"
      @close="modalCrearAbierta = false"
      @create="handleCrearTupper"
    />

    <TupperwareDeleteModal 
      :is-open="modalEliminarAbierta"
      :tupper="tupperAEliminar"
      :loading="modalCargando"
      @close="modalEliminarAbierta = false"
      @confirm="handleEliminarTupper"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TupperwareCard from '../components/Tupperwares/TupperwareCard.vue'
import TupperwareCreateModal from '../components/Tupperwares/TupperwareCreateModal.vue'
import TupperwareDeleteModal from '../components/Tupperwares/TupperwareDeleteModal.vue'
import { getTupperwares, createTupperware, updateTupperware, deleteTupperware } from '../services/tupperwareService'

const tuppers = ref([])
const loading = ref(true)
const modalCargando = ref(false)
const guardandoId = ref(null) 
const groupId = ref(null)
const searchQuery = ref('')

const modalCrearAbierta = ref(false)
const modalEliminarAbierta = ref(false)
const tupperAEliminar = ref(null)

const tuppersFiltrados = computed(() => {
  let resultado = [...tuppers.value]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    resultado = resultado.filter(t => 
      t.title.toLowerCase().includes(query) || 
      (t.location && t.location.toLowerCase().includes(query))
    )
  }
  return resultado
})

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    
    // 1. Intentar cargar del caché local inmediatamente
    const cacheLocal = localStorage.getItem(`cache_tuppers_${groupId.value}`)
    if (cacheLocal) {
      tuppers.value = JSON.parse(cacheLocal)
      loading.value = false // Ya tenemos qué mostrar, quitamos el loading
    }
    
    // 2. Traer los datos frescos de la API en segundo plano
    cargarTuppers()
  } else {
    loading.value = false
  }
})

const cargarTuppers = async () => {
  try {
    const response = await getTupperwares(groupId.value)
    const data = response.data || response
    
    // Actualizamos el estado y guardamos en el caché para la próxima vez
    tuppers.value = data
    localStorage.setItem(`cache_tuppers_${groupId.value}`, JSON.stringify(data))
  } catch (error) {
    console.error("Error al sincronizar tuppers:", error)
  } finally {
    loading.value = false // Por si no había caché previo
  }
}

const handleCrearTupper = async (nuevoTupperData) => {
  if (!groupId.value) return
  modalCargando.value = true
  try {
    const response = await createTupperware(groupId.value, nuevoTupperData)
    tuppers.value.unshift(response.data || response)
    modalCrearAbierta = false
  } catch (error) {
    console.error(error)
    alert("No se pudo guardar el tupperware.")
  } finally {
    modalCargando.value = false
  }
}

const cambiarRacionesLocal = async (tupper, cambio) => {
  const nuevasRaciones = tupper.servings + cambio
  if (nuevasRaciones < 0) return 
  
  guardandoId.value = tupper.id
  try {
    const response = await updateTupperware(groupId.value, tupper.id, {
      title: tupper.title,
      servings: nuevasRaciones,
      location: tupper.location
    })
    const index = tuppers.value.findIndex(t => t.id === tupper.id)
    if (index !== -1) tuppers.value[index] = response.data || response
  } catch (error) {
    console.error("Error modificando raciones:", error)
  } finally {
    guardandoId.value = null
  }
}

const abrirModalConfirmarEliminar = (tupper) => {
  tupperAEliminar.value = { ...tupper }
  modalEliminarAbierta.value = true
}

const handleEliminarTupper = async () => {
  if (!tupperAEliminar.value || !groupId.value) return
  modalCargando.value = true
  try {
    await deleteTupperware(groupId.value, tupperAEliminar.value.id)
    tuppers.value = tuppers.value.filter(t => t.id !== tupperAEliminar.value.id)
    modalEliminarAbierta.value = false
    tupperAEliminar.value = null
  } catch (error) {
    console.error(error)
    alert("No se pudo borrar el elemento.")
  } finally {
    modalCargando.value = false
  }
}
</script>

<style scoped>
.tupper-content { padding: 1rem; }
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.top-header h1 { color: white; margin: 0; }
.search-container { padding: 0.5rem 1rem; border-radius: 14px; display: flex; align-items: center; border: 1px solid rgba(255, 255, 255, 0.2); }
.search-input { width: 100%; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem; padding: 0.4rem 0; }
.search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.tuppers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.btn { font-weight: bold; border-radius: 10px; border: 0; padding: 0.8em 1.2em; cursor: pointer; }
.btn-add-tupper { color: black; background-color: #f1b818; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.mb-4 { margin-bottom: 1rem; }
.text-center { text-align: center; }
.loading-text, .empty-state { opacity: 0.5; font-size: 0.95rem; color: white; }
.warning-card { padding: 1rem; color: white; }
</style>