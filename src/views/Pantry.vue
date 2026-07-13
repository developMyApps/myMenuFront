<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Recetas</h1>
      <button @click="modalCrearAbierta = true" class="btn btn-primary btn-add-recipe">
        ➕ Nueva Receta
      </button>
    </header>

    <main class="recipes-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para ver tus recetas.</p>
      </div>

      <template v-else>
        <div class="search-container mb-4 glass-effect">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar receta..." 
            class="search-input"
          />
        </div>

        <div v-if="loading" class="text-center py-8">
          <p class="loading-text">Cargando tu libro de recetas...</p>
        </div>

        <div v-else-if="recetasFiltradas.length > 0" class="recipes-grid">
          <RecipeCard 
            v-for="receta in recetasFiltradas" 
            :key="receta.id"
            :recipe="receta"
            @click="abrirDetalle(receta)"
            @delete="confirmarEliminarReceta"
          />
        </div>

        <div v-else class="card glass-effect text-center py-6">
          <p class="empty-state">
            {{ searchQuery ? 'No se encontraron recetas con ese nombre.' : 'Tu libro de recetas está vacío. ¡Añade la primera!' }}
          </p>
        </div>
      </template>
    </main>

    <RecipeDetailModal 
      :is-open="modalDetalleAbierta"
      :recipe="recetaSeleccionada"
      :guardando="guardando"
      @close="modalDetalleAbierta = false"
      @save="guardarCambiosReceta"
    />

    <RecipeCreateModal 
      :is-open="modalCrearAbierta"
      :guardando="guardando"
      @close="modalCrearAbierta = false"
      @create="handleCrearReceta"
    />

    <RecipeDeleteModal 
      :is-open="modalConfirmarEliminarAbierta"
      :recipe="recetaAEliminar"
      :guardando="guardando"
      @close="modalConfirmarEliminarAbierta = false"
      @confirm="handleEliminarReceta"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import RecipeCard from '../components/recipes/RecipeCard.vue'
import RecipeDetailModal from '../components/recipes/RecipeDetailModal.vue'
import RecipeCreateModal from '../components/recipes/RecipeCreateModal.vue'
import RecipeDeleteModal from '../components/recipes/RecipeDeleteModal.vue'
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../services/recipeService'

const recetas = ref([])
const loading = ref(true)
const guardando = ref(false)
const groupId = ref(null)
const searchQuery = ref('')

const modalDetalleAbierta = ref(false)
const modalCrearAbierta = ref(false)
const modalConfirmarEliminarAbierta = ref(false)

const recetaSeleccionada = ref(null)
const recetaAEliminar = ref(null)

const recetasFiltradas = computed(() => {
  let resultado = [...recetas.value]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    resultado = resultado.filter(r => r.title.toLowerCase().includes(query))
  }
  return resultado.sort((a, b) => a.title.localeCompare(b.title))
})

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    cargarRecetas()
  } else {
    loading.value = false
  }
})

const cargarRecetas = async () => {
  try {
    const datosRecetas = await getRecipes(groupId.value)
    recetas.value = datosRecetas || []
  } catch (error) {
    console.error("Error cargando las recetas:", error)
  } finally {
    loading.value = false
  }
}

const abrirDetalle = (receta) => {
  recetaSeleccionada.value = receta
  modalDetalleAbierta.value = true
}

const guardarCambiosReceta = async (datosEditados) => {
  if (!groupId.value || !recetaSeleccionada.value) return
  guardando.value = true
  try {
    const responseData = await updateRecipe(groupId.value, recetaSeleccionada.value.id, datosEditados)
    const index = recetas.value.findIndex(r => r.id === recetaSeleccionada.value.id)
    if (index !== -1) recetas.value[index] = responseData
    recetaSeleccionada.value = responseData
    modalDetalleAbierta.value = false
  } catch (error) {
    console.error(error)
    alert("No se pudieron guardar los cambios.")
  } finally {
    guardando.value = false
  }
}

const handleCrearReceta = async (nuevaRecetaData) => {
  if (!groupId.value) return
  guardando.value = true
  try {
    const responseData = await createRecipe(groupId.value, nuevaRecetaData)
    recetas.value.push(responseData)
    modalCrearAbierta.value = false
  } catch (error) {
    console.error(error)
    alert("No se pudo guardar la receta.")
  } finally {
    guardando.value = false
  }
}

const confirmarEliminarReceta = (receta) => {
  recetaAEliminar.value = receta
  modalConfirmarEliminarAbierta.value = true
}

const handleEliminarReceta = async () => {
  if (!recetaAEliminar.value || !groupId.value) return
  guardando.value = true
  try {
    await deleteRecipe(groupId.value, recetaAEliminar.value.id)
    recetas.value = recetas.value.filter(r => r.id !== recetaAEliminar.value.id)
    modalConfirmarEliminarAbierta.value = false
    recetaAEliminar.value = null
  } catch (error) {
    console.error(error)
    alert("No se pudo eliminar la receta.")
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.recipes-content { padding: 1rem; }
.search-container { padding: 0.5rem 1rem; border-radius: 14px; display: flex; align-items: center; border: 1px solid rgba(255, 255, 255, 0.2); }
.search-input { width: 100%; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem; padding: 0.4rem 0; }
.search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.top-header h1 { color: white; margin: 0; }
.btn { font-weight: bold; border-radius: 10px; border: 0; padding: 0.8em 1.2em; cursor: pointer; }
.btn-add-recipe { color: black; background-color: #f1b818; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.mb-4 { margin-bottom: 1rem; }
.text-center { text-align: center; }
.loading-text, .empty-state { opacity: 0.6; font-size: 0.95rem; color: white; }
.warning-card { padding: 1rem; color: white; }
</style>