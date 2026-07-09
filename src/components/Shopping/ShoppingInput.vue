<template>
  <div class="add-container">
    <div class="add-form-layout">
      <div class="input-row">
        <input 
          v-model="name" 
          @keyup.enter="agregar" 
          type="text" 
          placeholder="Añadir producto (Ej. Tomates)" 
          class="input-field"
          autocomplete="off"
        />
        <button @click="agregar" :disabled="!name" class="btn-add">+</button>
      </div>

      <div class="select-row">
        <select v-model="selectedCategoryId" class="select-field" :disabled="listaCategorias.length === 0">
          <option v-for="cat in listaCategorias" :key="cat.id" :value="cat.id">
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { addShoppingItem, getCategories } from '../../services/shoppingService'

const props = defineProps(['groupId'])
const emit = defineEmits(['item-added'])

const name = ref('')
const selectedCategoryId = ref(null)
const listaCategorias = ref([]) 

onMounted(async () => {
  const cats = await getCategories()
  listaCategorias.value = cats

  if (cats.length > 0) {
    const catGeneral = cats.find(c => c.name.toLowerCase() === 'general')
    selectedCategoryId.value = catGeneral ? catGeneral.id : cats[0].id
  }
})

const agregar = async () => {
  if (!name.value || !props.groupId || !selectedCategoryId.value) return
  
  try {
    await addShoppingItem(props.groupId, { 
      ingredient_name: name.value, 
      category_id: selectedCategoryId.value, 
      quantity: 1,
      unit: 'ud'
    })
    
    name.value = ''
    emit('item-added')
  } catch (error) {
    console.error("Error al guardar el elemento:", error)
  }
}
</script>

<style scoped>
.add-container { 
  margin-bottom: 1.5rem; 
  width: 100%;
  box-sizing: border-box;
}

/* Contenedor principal en formato columna para apilar las filas */
.add-form-layout {
  display: flex;
  flex-direction: column;
  gap: 0.6rem; /* Espaciado controlado entre la fila de arriba y la de abajo */
  width: 100%;
  box-sizing: border-box;
}

/* Fila 1: Ocupa todo el ancho horizontal compartido */
.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.input-field { 
  flex: 1; /* El input se estira de manera elástica ocupando el espacio que le deja el botón */
  min-width: 0; 
  padding: 0.8rem 1rem; 
  border-radius: 12px; 
  border: 1px solid rgba(255, 255, 255, 0.2); 
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  box-sizing: border-box;
}

.btn-add { 
  background: #4caf50; 
  color: white; 
  border: none; 
  border-radius: 12px; 
  width: 48px; 
  height: 44px;
  font-size: 1.5rem; 
  cursor: pointer; 
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; 
}

.btn-add:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.5;
}

/* Fila 2: Contenedor para el selector a pantalla completa */
.select-row {
  width: 100%;
  box-sizing: border-box;
}

.select-field {
  width: 100%; /* Toma el 100% del ancho del formulario */
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  outline: none;
  font-size: 0.95rem;
  cursor: pointer;
  box-sizing: border-box;
}

.select-field option {
  background: #222;
  color: white;
}

@media (max-width: 400px) {
  .input-field, .select-field {
    padding: 0.7rem;
    font-size: 0.9rem;
  }
}
</style>