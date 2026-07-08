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
    await loadItems() // Recargamos para reflejar el orden y estilo
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

// Lógica del botón Vaciar Lista Completa
const handleClearAll = async () => {
  if (confirm("¿Seguro que quieres borrar TODOS los artículos de la lista?")) {
    try {
      await clearShoppingList(groupId.value)
      await loadItems()
    } catch (e) { console.error(e) }
  }
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.top-header h1 { color: white; margin: 0; font-size: 1.8rem; }

.btn-clear-all {
  background: rgba(244, 67, 54, 0.2);
  color: #ff5252;
  border: 1px solid rgba(244, 67, 54, 0.4);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-clear-all:hover {
  background: #ff5252;
  color: white;
}

.category-title {
  color: rgba(255,255,255,0.7);
  font-size: 1rem;
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
</style>