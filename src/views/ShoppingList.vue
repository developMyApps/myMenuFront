<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Lista de la Compra</h1>
      <button 
        v-if="tieneElementos" 
        @click="handleClearAll" 
        class="btn-clear-all"
      >
        🗑️ Vaciar Lista
      </button>
    </header>
    
    <main class="shopping-content">
      <ShoppingInput :groupId="groupId" @item-added="loadItems" />

      <div v-if="loading" class="loader">Cargando despensa...</div>

      <div v-else-if="!tieneElementos" class="empty-state">
        🛒 Tu lista está vacía. ¡Añade productos arriba!
      </div>

      <div v-for="(itemsCategoria, cat) in listaAgrupada" :key="cat" class="category-section">
        <h3 class="category-title">{{ cat }}</h3>
        <ShoppingItem 
          v-for="item in itemsCategoria" 
          :key="item.id" 
          :item="item"
          @toggle="handleToggle"
          @modify="handleModifyQuantity"
          @delete="handleDeleteItem"
        />
      </div>
    </main>

    <!-- Modal de Confirmación Estilizada -->
    <Transition name="fade">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
        <div class="modal-content glass-effect">
          <h3>¿Vaciar lista de la compra?</h3>
          <p class="modal-subtitle">
            Esta acción eliminará de forma permanente todos los artículos que tienes apuntados. No se puede deshacer.
          </p>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="isModalOpen = false">
              Cancelar
            </button>
            <button class="btn btn-danger" @click="confirmClearAll">
              Sí, vaciar todo
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ShoppingInput from '../components/Shopping/ShoppingInput.vue'
import ShoppingItem from '../components/Shopping/ShoppingItem.vue'
import { getShoppingList, toggleShoppingItem, updateItemQuantity, deleteShoppingItem, clearShoppingList } from '../services/shoppingService'

const route = useRoute()
const groupId = computed(() => route.params.groupId || 4) // Ajusta según tu router

const items = ref([])
const loading = ref(false)
const isModalOpen = ref(false) // Control de estado de la modal

const tieneElementos = computed(() => items.value.length > 0)

// Agrupa automáticamente los ítems por el nombre de su categoría
const listaAgrupada = computed(() => {
  return items.value.reduce((acc, item) => {
    const cat = item.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc;
  }, {})
})

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await getShoppingList(groupId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleToggle = async (item) => {
  try {
    const nuevoEstado = !item.is_bought
    await toggleShoppingItem(groupId.value, item.id, nuevoEstado)
    await loadItems() 
  } catch (e) { console.error(e) }
}

const handleModifyQuantity = async (item, cambio) => {
  const nuevaQty = Number(item.quantity) + cambio
  try {
    await updateItemQuantity(groupId.value, item.id, nuevaQty)
    await loadItems()
  } catch (e) { console.error(e) }
}

const handleDeleteItem = async (itemId) => {
  try {
    await deleteShoppingItem(groupId.value, itemId)
    await loadItems()
  } catch (e) { console.error(e) }
}

// Abre la modal en lugar del alert/confirm nativo
const handleClearAll = () => {
  isModalOpen.value = true
}

// Ejecuta el borrado definitivo tras confirmar en la modal
const confirmClearAll = async () => {
  isModalOpen.value = false
  loading.value = true
  try {
    await clearShoppingList(groupId.value)
    await loadItems()
  } catch (e) { 
    console.error(e) 
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.view-container {
  width: 100%;
  max-width: 100vw; 
  box-sizing: border-box;
  padding: 1rem; 
  overflow-x: hidden; 
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.top-header h1 { 
  color: white; 
  margin: 0; 
  font-size: 1.6rem; 
  white-space: nowrap; 
}

.btn-clear-all {
  background: rgba(244, 67, 54, 0.2);
  color: #ff5252;
  border: 1px solid rgba(244, 67, 54, 0.4);
  padding: 0.5rem 0.8rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-clear-all:hover {
  background: #ff5252;
  color: white;
}

.shopping-content {
  width: 100%;
  box-sizing: border-box;
}

.category-title {
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  margin: 1.5rem 0 0.8rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.empty-state {
  text-align: center;
  color: #888;
  padding: 3rem 1rem;
}
.loader { color: white; text-align: center; padding: 2rem; }

/* ========================================== */
/*           ESTILOS DE LA MODAL              */
/* ========================================== */

.modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background: rgba(0, 0, 0, 0.6); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
  padding: 1.5rem; 
  box-sizing: border-box; 
}

.modal-content { 
  width: 100%; 
  max-width: 400px; 
  padding: 1.5rem; 
  border-radius: 16px; 
  text-align: left;
}

.modal-content h3 { 
  margin: 0 0 0.5rem 0; 
  color: #ff5252; /* Tono destructivo */
  font-size: 1.25rem; 
}

.modal-subtitle { 
  font-size: 0.9rem; 
  color: rgba(255, 255, 255, 0.6); 
  line-height: 1.4;
  margin-bottom: 1.5rem; 
}

.modal-actions { 
  display: flex; 
  justify-content: flex-end; 
  gap: 0.75rem; 
}

.btn { 
  padding: 0.6rem 1.2rem; 
  border-radius: 10px; 
  font-weight: 600; 
  border: none; 
  cursor: pointer; 
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-secondary { 
  background: rgba(255, 255, 255, 0.1); 
  color: rgba(255, 255, 255, 0.8); 
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-danger { 
  background: #ff5252; 
  color: white; 
}
.btn-danger:hover {
  background: #e03e3e;
}

/* Transiciones de entrada y salida */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.2s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
</style>