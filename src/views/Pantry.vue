<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Despensa</h1>
      <button @click="abrirModalAñadir" class="btn btn-primary btn-add">
        ➕ Añadir artículo
      </button>
    </header>

    <main class="pantry-content">
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para ver tu despensa.</p>
      </div>

      <template v-else>
        <!-- Buscador -->
        <div class="search-container mb-3 glass-effect">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Buscar artículo..."
            class="search-input"
          />
        </div>

        <!-- Filtros por Categoría -->
        <div v-if="categorias.length > 0" class="category-filter-bar mb-3">
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

        <div v-if="loading" class="text-center py-8">
          <p class="loading-text">Cargando despensa...</p>
        </div>

        <div v-else-if="itemsFiltrados.length === 0" class="card glass-effect text-center py-6">
          <p class="empty-state">
            {{ (searchQuery || selectedCategories.length > 0) ? 'No se encontraron artículos con los filtros aplicados.' : '🏪 Tu despensa está vacía. ¡Añade el primer artículo!' }}
          </p>
        </div>

        <template v-else>
          <!-- Artículos agrupados por categoría -->
          <div v-for="(items, cat) in itemsAgrupados" :key="cat" class="category-group">
            <div class="category-header">
              <span class="cat-icon">{{ getCatIcon(cat) }}</span>
              <h3 :style="{ color: getCatColor(cat) || 'rgba(255,255,255,0.8)' }">{{ cat }}</h3>
              <span class="cat-count">{{ items.length }}</span>
            </div>
            <div class="items-grid">
              <div
                v-for="item in items"
                :key="item.id"
                class="pantry-card glass-effect"
                :style="getItemCardStyle(item)"
                @click="abrirEditar(item)"
                title="Haz clic para ver/editar detalles"
              >
                <div class="pantry-card-header">
                  <span class="item-name">{{ item.name }}</span>
                  <button @click.stop="confirmarEliminar(item)" class="btn-delete" title="Eliminar">🗑️</button>
                </div>
                <div class="pantry-card-body">
                  <div class="qty-control">
                    <button @click.stop="cambiarCantidad(item, -1)" class="qty-btn">−</button>
                    <span class="qty-value">{{ formatQty(item.quantity) }} {{ item.unit }}</span>
                    <button @click.stop="cambiarCantidad(item, 1)" class="qty-btn">+</button>
                  </div>
                  <div v-if="item.notes" class="item-notes" :title="item.notes">
                    📝 {{ item.notes }}
                  </div>
                  <div v-if="item.purchased_at" class="purchased-date">
                    🛒 {{ formatDate(item.purchased_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </main>

    <!-- Modal añadir/editar artículo -->
    <PantryAddModal
      :is-open="modalAbierta"
      :categories="categorias"
      :guardando="guardando"
      :item-to-edit="itemAEditar"
      @close="cerrarModal"
      @add="handleAñadir"
      @save="handleGuardarEditar"
    />

    <!-- Modal confirmar eliminar -->
    <Transition name="fade">
      <div v-if="itemAEliminar" class="modal-overlay" @click.self="itemAEliminar = null">
        <div class="modal-content glass-effect confirm-card">
          <h3>¿Eliminar artículo?</h3>
          <p>Se eliminará <strong>{{ itemAEliminar.name }}</strong> de tu despensa.</p>
          <div class="confirm-actions">
            <button @click="itemAEliminar = null" class="btn btn-secondary">Cancelar</button>
            <button @click="handleEliminar" :disabled="guardando" class="btn btn-danger">
              {{ guardando ? 'Eliminando...' : '🗑️ Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PantryAddModal from '../components/pantry/PantryAddModal.vue'
import { getPantryItems, addPantryItem, updatePantryItem, deletePantryItem } from '../services/pantryService'

const items = ref([])
const categorias = ref([])
const loading = ref(true)
const guardando = ref(false)
const groupId = ref(null)
const searchQuery = ref('')
const selectedCategories = ref([])
const modalAbierta = ref(false)
const itemAEditar = ref(null)
const itemAEliminar = ref(null)

// Cargar categorías desde la lista de la compra (mismo endpoint)
const cargarCategorias = async () => {
  try {
    const { data } = await import('../services/apiClient').then(m => {
      return m.default.get('/categories')
    })
    categorias.value = data || []
  } catch (e) {
    console.error('Error cargando categorías', e)
  }
}

const cargarDespensa = async () => {
  if (!groupId.value) return
  loading.value = true
  try {
    items.value = await getPantryItems(groupId.value) || []
  } catch (e) {
    console.error('Error cargando despensa', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    await Promise.all([cargarDespensa(), cargarCategorias()])
  } else {
    loading.value = false
  }
})

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

const itemsFiltrados = computed(() => {
  let res = [...items.value]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(i => i.name.toLowerCase().includes(q))
  }

  if (selectedCategories.value.length > 0) {
    res = res.filter(i => {
      const catName = i.category || 'General'
      return selectedCategories.value.includes(catName)
    })
  }

  return res
})

const itemsAgrupados = computed(() => {
  return itemsFiltrados.value.reduce((acc, item) => {
    const cat = item.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
})

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
  if (!color || color === '#888888') {
    return {}
  }
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

const formatQty = (qty) => {
  const n = Number(qty)
  return n % 1 === 0 ? n.toString() : n.toFixed(1)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const abrirModalAñadir = () => {
  itemAEditar.value = null
  modalAbierta.value = true
}

const abrirEditar = (item) => {
  itemAEditar.value = item
  modalAbierta.value = true
}

const cerrarModal = () => {
  modalAbierta.value = false
  itemAEditar.value = null
}

const handleAñadir = async (nuevoItem) => {
  if (!groupId.value) return
  guardando.value = true
  try {
    const creado = await addPantryItem(groupId.value, nuevoItem)
    items.value.push(creado)
    cerrarModal()
  } catch (e) {
    console.error('Error añadiendo artículo', e)
    alert('No se pudo añadir el artículo.')
  } finally {
    guardando.value = false
  }
}

const handleGuardarEditar = async (dataActualizada) => {
  if (!groupId.value) return
  guardando.value = true
  try {
    const { id, ...updates } = dataActualizada
    const editado = await updatePantryItem(groupId.value, id, updates)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) {
      items.value[index] = editado
    }
    cerrarModal()
  } catch (e) {
    console.error('Error editando artículo', e)
    alert('No se pudo actualizar el artículo.')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = (item) => {
  itemAEliminar.value = item
}

const handleEliminar = async () => {
  if (!itemAEliminar.value || !groupId.value) return
  guardando.value = true
  try {
    await deletePantryItem(groupId.value, itemAEliminar.value.id)
    items.value = items.value.filter(i => i.id !== itemAEliminar.value.id)
    itemAEliminar.value = null
  } catch (e) {
    console.error('Error eliminando artículo', e)
  } finally {
    guardando.value = false
  }
}

const cambiarCantidad = async (item, delta) => {
  const nuevaQty = Math.max(0.5, Number(item.quantity) + delta)
  const qtyAnterior = item.quantity
  item.quantity = nuevaQty
  try {
    await updatePantryItem(groupId.value, item.id, { quantity: nuevaQty })
  } catch (e) {
    console.error(e)
    item.quantity = qtyAnterior
  }
}
</script>

<style scoped>
.view-container { width: 100%; max-width: 100vw; box-sizing: border-box; padding: 1rem; }
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.top-header h1 { color: white; margin: 0; font-size: 1.6rem; }
.btn { font-weight: bold; border-radius: 10px; border: 0; padding: 0.7em 1.1em; cursor: pointer; }
.btn-primary { background: #f1b818; color: black; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #ccc; border: none; }
.btn-danger { background: rgba(244,67,54,0.2); color: #ff5252; border: 1px solid rgba(244,67,54,0.4); }
.btn-danger:hover { background: #ff5252; color: white; }
.btn-add { font-size: 0.9rem; }

.search-container { padding: 0.5rem 1rem; border-radius: 14px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.2); }
.search-input { width: 100%; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem; padding: 0.4rem 0; }
.search-input::placeholder { color: rgba(255,255,255,0.4); }

/* Barra de Filtros por Categoría */
.category-filter-bar {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
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

.category-group { margin-bottom: 1.5rem; }
.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.category-header h3 { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
.cat-icon { font-size: 1.1rem; }
.cat-count { margin-left: auto; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 10px; }

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.pantry-card {
  border-radius: 12px;
  padding: 0.85rem;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: all 0.2s ease;
  cursor: pointer;
}
.pantry-card:hover { filter: brightness(1.2); transform: translateY(-2px); }

.pantry-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; }
.item-name { font-size: 0.95rem; font-weight: 600; color: #fff; line-height: 1.3; flex: 1; word-break: break-word; }
.btn-delete { background: none; border: none; cursor: pointer; font-size: 0.9rem; opacity: 0.4; transition: opacity 0.2s; flex-shrink: 0; padding: 0; line-height: 1; }
.btn-delete:hover { opacity: 1; }

.pantry-card-body { display: flex; flex-direction: column; gap: 0.4rem; }

.qty-control { display: flex; align-items: center; gap: 0.4rem; }
.qty-btn {
  width: 26px; height: 26px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.qty-btn:hover { background: rgba(241,184,24,0.3); border-color: #f1b818; }
.qty-value { font-size: 0.85rem; color: #ffd166; font-weight: 600; flex: 1; text-align: center; }

.item-notes {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
  background: rgba(0,0,0,0.25);
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.purchased-date { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

/* Modal confirmar */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; box-sizing: border-box; }
.confirm-card { padding: 1.5rem; border-radius: 16px; max-width: 360px; width: 100%; text-align: left; background: #222228; border: 1px solid rgba(255,255,255,0.15); }
.confirm-card h3 { margin: 0 0 0.5rem; color: #ff5252; }
.confirm-card p { color: rgba(255,255,255,0.8); margin: 0 0 1.25rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

.py-6 { padding: 1.5rem 0; }
.py-8 { padding: 2rem 0; }
.mb-3 { margin-bottom: 0.75rem; }
.text-center { text-align: center; }
.loading-text, .empty-state { color: rgba(255,255,255,0.5); font-size: 0.95rem; }
.warning-card { padding: 1rem; color: white; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>