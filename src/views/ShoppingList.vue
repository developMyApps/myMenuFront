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
      <ShoppingInput :groupId="groupId" @item-added="fetchItemsFresh" />

      <div v-if="loading && !tieneElementos" class="loader">Cargando lista de la compra...</div>

      <div v-else-if="!tieneElementos" class="empty-state">
        🛒 Tu lista está vacía. ¡Añade productos arriba!
      </div>

      <div v-else>
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
      </div>
    </main>

    <ShoppingClearModal 
      :is-open="isModalOpen"
      :loading="modalLoading"
      @close="isModalOpen = false"
      @confirm="confirmClearAll"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ShoppingInput from '../components/Shopping/ShoppingInput.vue'
import ShoppingItem from '../components/Shopping/ShoppingItem.vue'
import ShoppingClearModal from '../components/Shopping/ShoppingClearModal.vue'
import { getShoppingList, toggleShoppingItem, updateItemQuantity, deleteShoppingItem, clearShoppingList } from '../services/shoppingService'

const route = useRoute()
const groupId = computed(() => route.params.groupId || 4) 

const items = ref([])
const loading = ref(true)
const modalLoading = ref(false)
const isModalOpen = ref(false) 

const tieneElementos = computed(() => items.value.length > 0)

const listaAgrupada = computed(() => {
  return items.value.reduce((acc, item) => {
    const cat = item.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
})

// 1. Cargar caché del almacenamiento local al instante
const cargarCacheLocal = () => {
  const cacheLocal = localStorage.getItem(`cache_shopping_${groupId.value}`)
  if (cacheLocal) {
    items.value = JSON.parse(cacheLocal)
    loading.value = false // Mostramos los datos viejos inmediatamente
  }
}

// 2. Traer datos actualizados del servidor en segundo plano
const fetchItemsFresh = async () => {
  try {
    const res = await getShoppingList(groupId.value)
    items.value = res || []
    localStorage.setItem(`cache_shopping_${groupId.value}`, JSON.stringify(items.value))
  } catch (e) {
    console.error("Error sincronizando lista de la compra:", e)
  } finally {
    loading.value = false
  }
}

// Reactividad Instantánea (Optimistic UI): Cambiamos el estado en pantalla sin esperar al servidor
const handleToggle = async (item) => {
  const nuevoEstado = !item.is_bought
  
  // Modificación local instantánea
  item.is_bought = nuevoEstado
  localStorage.setItem(`cache_shopping_${groupId.value}`, JSON.stringify(items.value))

  try {
    await toggleShoppingItem(groupId.value, item.id, nuevoEstado)
  } catch (e) { 
    console.error(e)
    item.is_bought = !nuevoEstado // Revertimos si falla
  }
}

const handleModifyQuantity = async (item, cambio) => {
  const nuevaQty = Number(item.quantity) + cambio
  if (nuevaQty < 1) return

  const qtyAnterior = item.quantity
  item.quantity = nuevaQty
  localStorage.setItem(`cache_shopping_${groupId.value}`, JSON.stringify(items.value))

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
  localStorage.setItem(`cache_shopping_${groupId.value}`, JSON.stringify(items.value))

  try {
    await deleteShoppingItem(groupId.value, itemId)
  } catch (e) { 
    console.error(e)
    items.value = copiaItems // Revertimos si falla el borrado remoto
  }
}

const confirmClearAll = async () => {
  modalLoading.value = true
  try {
    await clearShoppingList(groupId.value)
    items.value = []
    localStorage.removeItem(`cache_shopping_${groupId.value}`)
    isModalOpen.value = false
  } catch (e) { 
    console.error(e) 
  } finally {
    modalLoading.value = false
  }
}

onMounted(() => {
  cargarCacheLocal()
  fetchItemsFresh()
})
</script>

<style scoped>
.view-container { width: 100%; max-width: 100vw; box-sizing: border-box; padding: 1rem; overflow-x: hidden; }
.top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; width: 100%; box-sizing: border-box; }
.top-header h1 { color: white; margin: 0; font-size: 1.6rem; white-space: nowrap; }

.btn-clear-all {
  background: rgba(244, 67, 54, 0.2); color: #ff5252; border: 1px solid rgba(244, 67, 54, 0.4);
  padding: 0.5rem 0.8rem; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; white-space: nowrap;
}
.btn-clear-all:hover { background: #ff5252; color: white; }
.shopping-content { width: 100%; box-sizing: border-box; }
.category-title { color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 1.5rem 0 0.8rem 0; text-transform: uppercase; letter-spacing: 1px; }
.empty-state { text-align: center; color: #888; padding: 3rem 1rem; }
.loader { color: white; text-align: center; padding: 2rem; }
</style>