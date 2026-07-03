<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Lista de la Compra</h1>
      <!-- Botón para borrar todo, solo visible si hay elementos en la lista -->
      <button v-if="items.length > 0 && !loading" @click="modalBorrarAbierto = true" class="btn-clear-all">
        🗑️ Vaciar
      </button>
    </header>
    <main class="shopping-content">
      
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para usar la lista.</p>
      </div>

      <template v-else>
        <!-- Add Item -->
        <div class="add-bar mb-4">
          <input 
            v-model="newItemName" 
            @keyup.enter="handleAddItem"
            type="text" 
            placeholder="Añadir producto (Ej. Tomates)" 
            class="input-field"
          />
          <button @click="handleAddItem" class="btn-add">+</button>
        </div>

        <div v-if="loading" class="text-center">
          <p>Cargando lista...</p>
        </div>

        <!-- List Items -->
        <div v-else-if="items.length > 0" class="shopping-list">
          <div 
            v-for="item in items" 
            :key="item.id" 
            class="shopping-item card glass-effect"
            :class="{ bought: item.is_bought }"
          >
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="item.is_bought" 
                @change="handleToggle(item)"
              >
              <span class="checkmark"></span>
            </label>
            <div class="item-details">
              <span class="item-name">{{ item.ingredient_name }}</span>
              <span class="item-category">{{ item.category }}</span>
            </div>
            
            <!-- Selector de Cantidades Ajustable (- 1 +) -->
            <div class="quantity-control">
              <button @click="handleModifyQuantity(item, -1)" class="qty-btn" :disabled="item.is_bought">-</button>
              <span class="qty-number">{{ Number(item.quantity) }}</span>
              <button @click="handleModifyQuantity(item, 1)" class="qty-btn" :disabled="item.is_bought">+</button>
              <span class="qty-unit">{{ item.unit }}</span>
            </div>
          </div>
        </div>

        <div v-else class="card glass-effect">
          <p class="empty-state">No hay productos en tu lista. ¡Añade algunos!</p>
        </div>
      </template>
    </main>

    <!-- Modal de confirmación para vaciar la lista -->
    <Transition name="fade">
      <div v-if="modalBorrarAbierto" class="modal-overlay" @click.self="modalBorrarAbierto = false">
        <div class="modal-content glass-effect">
          <h3>¿Vaciar lista de la compra?</h3>
          <p class="modal-subtitle">Esta acción eliminará todos los elementos actuales de forma permanente.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="modalBorrarAbierto = false">Cancelar</button>
            <button class="btn btn-danger" @click="handleClearAll">Sí, Vaciar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  getShoppingList, 
  addShoppingItem, 
  toggleShoppingItem, 
  updateItemQuantity, 
  clearShoppingList 
} from '../services/api'

const items = ref([])
const loading = ref(true)
const newItemName = ref('')
const groupId = ref(null)

// Control del estado del modal de borrado
const modalBorrarAbierto = ref(false)

onMounted(async () => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    groupId.value = JSON.parse(savedGroup).id
    await loadItems()
  } else {
    loading.value = false
  }
})

const loadItems = async () => {
  try {
    items.value = await getShoppingList(groupId.value)
  } catch (error) {
    console.error('Error cargando lista', error)
  } finally {
    loading.value = false
  }
}

const handleAddItem = async () => {
  if (!newItemName.value || !groupId.value) return
  
  const itemData = {
    ingredient_name: newItemName.value,
    category: 'General',
    quantity: 1,
    unit: 'ud'
  }
  
  try {
    await addShoppingItem(groupId.value, itemData)
    newItemName.value = ''
    await loadItems()
  } catch (error) {
    console.error('Error añadiendo producto', error)
  }
}

const handleToggle = async (item) => {
  item.is_bought = !item.is_bought
  try {
    await toggleShoppingItem(groupId.value, item.id, item.is_bought)
    await loadItems() // Recarga para ordenar los elementos comprados abajo del todo
  } catch (error) {
    item.is_bought = !item.is_bought
    console.error('Error actualizando estado', error)
  }
}

// Modificar cantidades sumando o restando unidades de 1 en 1
const handleModifyQuantity = async (item, cambio) => {
  const nuevaCantidad = Math.max(0, Number(item.quantity) + cambio)
  
  // Actualización optimista en pantalla
  item.quantity = nuevaCantidad
  if (nuevaCantidad === 0) {
    item.is_bought = true
  }

  try {
    await updateItemQuantity(groupId.value, item.id, nuevaCantidad)
    await loadItems() // Forzar reordenación desde base de datos
  } catch (error) {
    console.error('Error modificando cantidad', error)
    await loadItems() // Revertir cambios leyendo estado real si falla
  }
}

// Vaciar la lista completa desde el modal
const handleClearAll = async () => {
  try {
    await clearShoppingList(groupId.value)
    items.value = []
    modalBorrarAbierto.value = false
  } catch (error) {
    console.error('Error al vaciar la lista de la compra:', error)
  }
}
</script>

<style scoped>
.shopping-content {
  padding: 1rem;
  padding-bottom: 5rem;
}
.btn-clear-all {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
}
.warning-card {
  border-left: 4px solid #f39c12;
}
.add-bar {
  display: flex;
  gap: 0.5rem;
}
.input-field {
  flex: 1;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color, #eee);
  background: var(--surface-color, #fff);
  color: var(--text-color, #333);
  font-size: 1rem;
}
.btn-add {
  background: var(--primary-color, #4caf50);
  color: white;
  border: none;
  border-radius: 12px;
  width: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mb-4 { margin-bottom: 1.5rem; }
.text-center { text-align: center; padding: 2rem 0; color: #888; }

.shopping-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  margin-bottom: 0.8rem;
  transition: opacity 0.3s ease;
}
.shopping-item.bought {
  opacity: 0.4;
}
.shopping-item.bought .item-name {
  text-decoration: line-through;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
}
.item-name {
  font-size: 1.05rem;
  font-weight: 500;
}
.item-category {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 1px;
}

/* --- CONTROLADOR DE CANTIDADES (- 1 +) --- */
.quantity-control {
  display: flex;
  align-items: center;
  background: #f1f1f1;
  padding: 0.3rem 0.5rem;
  border-radius: 20px;
  gap: 0.4rem;
}
.qty-btn {
  background: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.qty-number {
  font-size: 0.9rem;
  font-weight: bold;
  min-width: 16px;
  text-align: center;
  color:black;
}
.qty-unit {
  font-size: 0.75rem;
  color: #666;
  margin-left: 1px;
}

/* Custom Checkbox */
.checkbox-container {
  display: block;
  position: relative;
  padding-left: 24px;
  cursor: pointer;
  user-select: none;
}
.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  position: absolute;
  top: -12px;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 6px;
}
.checkbox-container input:checked ~ .checkmark {
  background-color: #4caf50;
  border-color: #4caf50;
}
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}
.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}
.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* --- ESTILOS DEL MODAL --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}
.modal-content {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
.modal-content h3 {
  margin-top: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}
.modal-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-secondary {
  background: #e0e0e0;
  color: #333;
}
.btn-danger {
  background: #e74c3c;
  color: white;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
