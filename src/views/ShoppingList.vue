<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Lista de la Compra</h1>
      <button v-if="items.length > 0 && !loading" @click="modalBorrarAbierto = true" class="btn-clear-all">
        🗑️ Vaciar
      </button>
    </header>
    <main class="shopping-content">
      
      <div v-if="!groupId" class="card glass-effect warning-card">
        <p>Debes crear o unirte a un grupo en <strong>Ajustes</strong> para usar la lista.</p>
      </div>

      <template v-else>
        <!-- 2. Formulario de Añadir Item mejorado con Selector de Categorías -->
        <div class="add-container mb-4">
          <div class="add-bar">
            <input 
              v-model="newItemName" 
              @keyup.enter="handleAddItem"
              type="text" 
              placeholder="Añadir producto (Ej. Tomates)" 
              class="input-field"
            />
            <button @click="handleAddItem" :disabled="!newItemName" class="btn-add">+</button>
          </div>
          <div class="category-selector-wrapper mt-2">
            <label for="category-select" class="select-label">Categoría:</label>
            <select id="category-select" v-model="selectedCategory" class="select-field">
              <option v-for="cat in CATEGORIAS" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-center">
          <p>Cargando lista...</p>
        </div>

        <!-- 3. Listado organizado por Secciones/Categorías -->
        <div v-else-if="items.length > 0" class="shopping-list-container">
          <div 
            v-for="(itemsCategoria, categoria) in listaAgrupadaPorCategoria" 
            :key="categoria" 
            class="category-section mb-4"
          >
           <!-- Título tuneado con Icono y Color dinámico -->
            <h3 
              class="category-title" 
              :style="{ color: CONFIG_CATEGORIAS[categoria]?.color || '#ffd166' }"
            >
             <span class="category-icon">{{ CONFIG_CATEGORIAS[categoria]?.icono || '🛒' }}</span>
            {{ categoria }}
          </h3>
            
            <div class="shopping-list">
              <div 
                v-for="item in itemsCategoria" 
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
                </div>
                
                <div class="quantity-control">
                  <button @click="handleModifyQuantity(item, -1)" class="qty-btn" :disabled="item.is_bought">-</button>
                  <span class="qty-number">{{ Number(item.quantity) }}</span>
                  <button @click="handleModifyQuantity(item, 1)" class="qty-btn" :disabled="item.is_bought">+</button>
                  <span class="qty-unit">{{ item.unit }}</span>
                </div>

                <!-- 1. Botón de papelera roja para eliminar un solo elemento -->
                <button class="btn-delete-item" @click="handleDeleteItem(item.id)" title="Eliminar producto">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card glass-effect">
          <p class="empty-state">No hay productos en tu lista. ¡Añade algunos!</p>
        </div>
      </template>
    </main>

    <!-- Modal de confirmación para vaciar la lista completa -->
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
import { ref, onMounted, computed } from 'vue'
import { 
  getShoppingList, 
  addShoppingItem, 
  toggleShoppingItem, 
  updateItemQuantity, 
  deleteShoppingItem, 
  clearShoppingList 
} from '../services/shoppingService'

// Listado oficial de categorías
const CATEGORIAS = [
  'General', 'Frutas y verduras', 'Legumbres', 'Lácteos', 
  'Bebida', 'Carne', 'Pescado', 'Limpieza', 'Congelados',
  'Cereales y Derivados', 'Bazar', 'Mascotas'
]

const CONFIG_CATEGORIAS = {
  'General':          { icono: '📦', color: '#a8a8a8', clases: 'cat-general' },
  'Frutas y verduras': { icono: '🥦', color: '#4caf50', clases: 'cat-frutas' },
  'Legumbres':         { icono: '🫘', color: '#ff9800', clases: 'cat-legumbres' },
  'Lácteos':           { icono: '🥛', color: '#00bcd4', clases: 'cat-lacteos' },
  'Bebida':            { icono: '🧃', color: '#2196f3', clases: 'cat-bebida' },
  'Carne':             { icono: '🥩', color: '#e91e63', clases: 'cat-carne' },
  'Pescado':           { icono: '🐟', color: '#009688', clases: 'cat-pescado' },
  'Limpieza':          { icono: '🧼', color: '#9c27b0', clases: 'cat-limpieza' },
  'Congelados':        { icono: '❄️', color: '#03a9f4', clases: 'cat-congelados' },
  'Cereales y Derivados':{ icono: '🍞', color: '#ffb74d', clases: 'cat-cereales' },
  'Bazar':             { icono: '🛒', color: '#bdbdbd', clases: 'cat-bazar' },
  'Mascotas':          { icono: '🐶', color: '#d97706', clases: 'cat-mascotas' },
}

const items = ref([])
const loading = ref(true)
const newItemName = ref('')
const selectedCategory = ref('General') // Categoría por defecto
const groupId = ref(null)
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

// Ordena los elementos: los comprados se van al fondo dentro de su sección
const ordenarLista = () => {
  items.value.sort((a, b) => a.is_bought - b.is_bought)
}

// 3. Computed Property que agrupa los elementos según su categoría automáticamente
const listaAgrupadaPorCategoria = computed(() => {
  const grupos = {}
  
  items.value.forEach(item => {
    const cat = item.category || 'General'
    if (!grupos[cat]) {
      grupos[cat] = []
    }
    grupos[cat].push(item)
  })
  
  return grupos
})

const loadItems = async () => {
  try {
    // getShoppingList ya retorna directamente response.data
    const datosBD = await getShoppingList(groupId.value)
    items.value = datosBD || []
    ordenarLista()
  } catch (error) {
    console.error('Error cargando lista', error)
  } finally {
    loading.value = false
  }
}

const handleAddItem = async () => {
  if (!newItemName.value || !groupId.value) return
  
  const tempId = Date.now()
  const itemData = {
    id: tempId,
    ingredient_name: newItemName.value,
    category: selectedCategory.value, // Envía la categoría seleccionada
    quantity: 1,
    unit: 'ud',
    is_bought: false
  }
  
  // Añadimos visualmente al instante (estrategia optimista)
  items.value.unshift(itemData) 
  const nombreGuardado = newItemName.value
  const categoriaGuardada = selectedCategory.value
  newItemName.value = ''
  selectedCategory.value = 'General' // Reseteamos a General para el siguiente producto
  
  try {
    // Usamos addShoppingItem del servicio modular
    const respuestaBackend = await addShoppingItem(groupId.value, {
      ingredient_name: nombreGuardado,
      category: categoriaGuardada,
      quantity: itemData.quantity,
      unit: itemData.unit
    })
    
    const index = items.value.findIndex(i => i.id === tempId)
    if (index !== -1) {
      items.value[index] = respuestaBackend
    }
  } catch (error) {
    console.error('Error añadiendo producto', error)
    await loadItems() // Revertimos recargando en caso de error
  }
}

const handleToggle = async (item) => {
  item.is_bought = !item.is_bought
  ordenarLista()
  
  try {
    // Usamos toggleShoppingItem del servicio modular
    await toggleShoppingItem(groupId.value, item.id, item.is_bought)
  } catch (error) {
    item.is_bought = !item.is_bought
    ordenarLista()
    console.error('Error actualizando estado', error)
  }
}

const handleModifyQuantity = async (item, cambio) => {
  const cantidadAnterior = Number(item.quantity)
  const nuevaCantidad = Math.max(0, cantidadAnterior + cambio)
  
  item.quantity = nuevaCantidad
  if (nuevaCantidad === 0) {
    item.is_bought = true
    ordenarLista()
  }

  try {
    // Usamos updateItemQuantity del servicio modular
    await updateItemQuantity(groupId.value, item.id, nuevaCantidad)
  } catch (error) {
    console.error('Error modificando cantidad', error)
    item.quantity = cantidadAnterior
    if (cantidadAnterior > 0) item.is_bought = false
    ordenarLista()
  }
}


// 6. MÉTODO ACTUALIZADO: handleDeleteItem
const handleDeleteItem = async (itemId) => {
  const copiaItemsAnteriores = [...items.value]
  
  // Eliminamos de la pantalla en milisegundos (optimista)
  items.value = items.value.filter(item => item.id !== itemId)
  
  try {
    // Usamos deleteShoppingItem del servicio modular (DELETE)
    await deleteShoppingItem(groupId.value, itemId)
  } catch (error) {
    console.error('Error al eliminar elemento de la lista', error)
    items.value = copiaItemsAnteriores // Revertimos la UI si falla la red
    alert('No se pudo eliminar el elemento de la base de datos.')
  }
}


// 7. MÉTODO ACTUALIZADO: handleClearAll
const handleClearAll = async () => {
  try {
    // Usamos clearShoppingList del servicio modular (DELETE)
    await clearShoppingList(groupId.value)
    items.value = []
    modalBorrarAbierto.value = false
  } catch (error) {
    console.error('Error al vaciar la lista de la compra:', error)
  }
}

</script>

<style scoped>
/* Nuevos estilos específicos para las categorías y la papelera */
.add-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.add-bar {
  display: flex;
  gap: 0.5rem;
}
.category-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.select-label {
  font-size: 0.9rem;
  opacity: 0.8;
}
.select-field {
  padding: 0.4rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
  outline: none;
}
.select-field option {
  background: #222; /* Color oscuro para que se lea bien en móviles */
  color: white;
}
.category-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.category-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #ffd166; /* Un tono amarillo/dorado elegante para separar */
  font-weight: 600;
  padding-left: 0.25rem;
}
.btn-delete-item {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: transform 0.1s ease;
  filter: drop-shadow(0px 0px 2px rgba(255,0,0,0.3));
}
.btn-delete-item:active {
  transform: scale(0.85);
}
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
</style>

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
