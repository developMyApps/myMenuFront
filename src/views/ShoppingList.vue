<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Lista de la Compra</h1>
      <button 
        v-if="tieneElementos" 
        @click="isModalOpen = true" 
        class="btn-clear-all"
      >
        🗑️ Vaciar Lista
      </button>
    </header>
    
    <main class="shopping-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para ver tu lista de la compra.</p>
      </div>

      <template v-else>
        <ShoppingInput :groupId="groupId" @item-added="fetchItemsFresh" />

        <!-- Filtros por Categoría (Estilo Pantry) -->
        <div v-if="categorias.length > 0 && tieneElementos" class="category-filter-bar mb-3">
          <button
            class="filter-chip"
            :class="{ active: selectedCategories.length === 0 }"
            @click="limpiarFiltrosCategorias"
          >
            Todas
          </button>
          <button
            v-for="cat in categorias"
            :key="cat.id"
            class="filter-chip"
            :class="{ active: selectedCategories.includes(cat.name) }"
            :style="getFilterChipStyle(cat)"
            @click="toggleCategoryFilter(cat.name)"
          >
            <span>{{ cat.icon }}</span> {{ cat.name }}
          </button>
        </div>

        <div v-if="loading" class="loader">Cargando lista de la compra...</div>

        <div v-else-if="!tieneElementos" class="empty-state">
          🛒 Tu lista está vacía. ¡Añade productos arriba!
        </div>

        <div v-else-if="Object.keys(listaAgrupada).length === 0" class="empty-state">
          🔍 No hay productos con las categorías seleccionadas.
        </div>

        <div v-else>
          <div v-for="(itemsCategoria, cat) in listaAgrupada" :key="cat" class="category-section">
            <div class="category-header">
              <span class="cat-icon">{{ getCatIcon(cat) }}</span>
              <h3 class="category-title" :style="{ color: getCatColor(cat) || 'rgba(255,255,255,0.7)' }">{{ cat }}</h3>
              <span class="cat-count">{{ itemsCategoria.length }}</span>
            </div>
            
            <div class="items-list">
              <ShoppingItem 
                v-for="item in itemsCategoria" 
                :key="item.id" 
                :item="item"
                :style="getItemCardStyle(item)"
                @toggle="handleToggle"
                @modify="handleModifyQuantity"
                @delete="handleDeleteItem"
                @move-to-pantry="openPantryConfirm"
              />
            </div>
          </div>
        </div>
      </template>
    </main>

    <ShoppingClearModal 
      :is-open="isModalOpen"
      :loading="modalLoading"
      @close="isModalOpen = false"
      @confirm="confirmClearAll"
    />

    <!-- Toast de confirmación despensa -->
    <Transition name="toast-fade">
      <div v-if="pantryToast" class="pantry-toast">
        🏪 <strong>{{ pantryToast }}</strong> añadido a la despensa
      </div>
    </Transition>

    <ShoppingPantryConfirmModal
      :is-open="!!itemParaDespensa"
      :item-name="itemParaDespensa?.ingredient_name"
      :loading="modalPantryLoading"
      @close="itemParaDespensa = null"
      @confirm="confirmMoveToPantry"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ShoppingInput from '../components/Shopping/ShoppingInput.vue'
import ShoppingItem from '../components/Shopping/ShoppingItem.vue'
import ShoppingClearModal from '../components/Shopping/ShoppingClearModal.vue'
import ShoppingPantryConfirmModal from '../components/Shopping/ShoppingPantryConfirmModal.vue'
import { getShoppingList, toggleShoppingItem, updateItemQuantity, deleteShoppingItem, clearShoppingList } from '../services/shoppingService'
import { moveToPantryFromShopping } from '../services/pantryService'

const items = ref([])
const categorias = ref([])
const selectedCategories = ref([])
const loading = ref(true)
const modalLoading = ref(false)
const isModalOpen = ref(false) 
const groupId = ref(null)
const pantryToast = ref(null)
let toastTimer = null

const tieneElementos = computed(() => items.value.length > 0)

// Cargar las categorías con color e icono
const cargarCategorias = async () => {
  try {
    const { data } = await import('../services/apiClient').then(m => m.default.get('/categories'))
    categorias.value = data || []
  } catch (e) {
    console.error('Error cargando categorías:', e)
  }
}

// Alternar filtro de categorías
const toggleCategoryFilter = (catName) => {
  const index = selectedCategories.value.indexOf(catName)
  if (index === -1) {
    selectedCategories.value.push(catName)
  } else {
    selectedCategories.value.splice(index, 1)
  }
}

const limpiarFiltrosCategorias = () => {
  selectedCategories.value = []
}

// Filtrar items por las categorías seleccionadas
const itemsFiltrados = computed(() => {
  if (selectedCategories.value.length === 0) return items.value
  return items.value.filter(item => {
    const catName = item.category || 'General'
    return selectedCategories.value.includes(catName)
  })
})

// Agrupar elementos filtrados por categoría
const listaAgrupada = computed(() => {
  return itemsFiltrados.value.reduce((acc, item) => {
    const cat = item.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
})

// Métodos para colores e iconos
const getCatIcon = (catName) => {
  const found = categorias.value.find(c => c.name === catName)
  return found ? found.icon : '📦'
}

const getCatColor = (catName) => {
  const found = categorias.value.find(c => c.name === catName)
  return found ? found.color : null
}

const getItemCardStyle = (item) => {
  const color = item.category_color || getCatColor(item.category)
  if (!color || color === '#888888') return {}
  return {
    backgroundColor: `${color}14`,
    borderColor: `${color}35`,
    boxShadow: `0 4px 12px ${color}10`
  }
}

const getFilterChipStyle = (cat) => {
  const isActive = selectedCategories.value.includes(cat.name)
  if (isActive && cat.color) {
    return {
      backgroundColor: cat.color + '33',
      borderColor: cat.color,
      color: '#ffffff',
      fontWeight: 'bold'
    }
  }
  return {}
}

onMounted(async () => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    try {
      groupId.value = JSON.parse(savedGroup).id
      await Promise.all([fetchItemsFresh(), cargarCategorias()])
    } catch (e) {
      console.error("Error al inicializar la lista de la compra:", e)
      loading.value = false
    }
  } else {
    loading.value = false
  }
})

const fetchItemsFresh = async () => {
  if (!groupId.value) { loading.value = false; return }
  loading.value = true
  try {
    const res = await getShoppingList(groupId.value)
    items.value = res || []
  } catch (e) {
    console.error("Error sincronizando lista de la compra:", e)
  } finally {
    loading.value = false
  }
}

const handleToggle = async (item) => {
  const nuevoEstado = !item.is_bought
  item.is_bought = nuevoEstado
  try {
    await toggleShoppingItem(groupId.value, item.id, nuevoEstado)
  } catch (e) { 
    console.error(e)
    item.is_bought = !nuevoEstado
  }
}

const handleModifyQuantity = async (item, cambio) => {
  const nuevaQty = Number(item.quantity) + cambio
  if (nuevaQty < 1) return
  const qtyAnterior = item.quantity
  item.quantity = nuevaQty
  try {
    await updateItemQuantity(groupId.value, item.id, nuevaQty)
  } catch (e) { 
    console.error(e)
    item.quantity = qtyAnterior
  }
}

const handleDeleteItem = async (itemId) => {
  const copiaItems = [...items.value]
  items.value = items.value.filter(item => item.id !== itemId)
  try {
    await deleteShoppingItem(groupId.value, itemId)
  } catch (e) { 
    console.error(e)
    items.value = copiaItems
  }
}

const itemParaDespensa = ref(null)
const modalPantryLoading = ref(false)

const openPantryConfirm = (item) => {
  itemParaDespensa.value = item
}

const confirmMoveToPantry = async () => {
  if (!itemParaDespensa.value || !groupId.value) return
  modalPantryLoading.value = true
  const item = itemParaDespensa.value
  try {
    await moveToPantryFromShopping(groupId.value, item.id, new Date().toISOString().split('T')[0])
    if (toastTimer) clearTimeout(toastTimer)
    pantryToast.value = item.ingredient_name
    toastTimer = setTimeout(() => { pantryToast.value = null }, 3000)
    itemParaDespensa.value = null
    await fetchItemsFresh()
  } catch (e) {
    console.error('Error al mover a la despensa:', e)
  } finally {
    modalPantryLoading.value = false
  }
}

const confirmClearAll = async () => {
  modalLoading.value = true
  try {
    await clearShoppingList(groupId.value)
    items.value = []
    isModalOpen.value = false
  } catch (e) { 
    console.error(e) 
  } finally {
    modalLoading.value = false
  }
}
</script>

<style scoped>
.view-container { width: 100%; max-width: 100vw; box-sizing: border-box; padding: 1rem; overflow-x: hidden; }
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; width: 100%; box-sizing: border-box; }
.top-header h1 { color: white; margin: 0; font-size: 1.6rem; white-space: nowrap; }
.btn-clear-all {
  background: rgba(244, 67, 54, 0.2); color: #ff5252; border: 1px solid rgba(244, 67, 54, 0.4);
  padding: 0.5rem 0.8rem; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; white-space: nowrap;
}
.btn-clear-all:hover { background: #ff5252; color: white; }
.shopping-content { width: 100%; box-sizing: border-box; }

/* Barra de Filtros por Categoría */
.category-filter-bar {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  margin-top: 1rem;
  margin-bottom: 1.25rem;
  scrollbar-width: thin;
}
.filter-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #d1d5db;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.filter-chip:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.filter-chip.active {
  background: #f1b818;
  color: #000;
  font-weight: bold;
  border-color: #f1b818;
}

/* Cabecera de Categoría */
.category-section { margin-bottom: 1.5rem; }
.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.category-title { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
.cat-icon { font-size: 1.1rem; }
.cat-count { margin-left: auto; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 10px; }

.items-list { display: flex; flex-direction: column; gap: 0.5rem; }

.empty-state { text-align: center; color: #888; padding: 3rem 1rem; }
.loader { color: white; text-align: center; padding: 2rem; }
.warning-card { padding: 1rem; color: white; }
.mb-3 { margin-bottom: 0.75rem; }

/* Toast */
.pantry-toast {
  position: fixed;
  bottom: 5.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(76, 175, 80, 0.95);
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.88rem;
  z-index: 2000;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
}
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>