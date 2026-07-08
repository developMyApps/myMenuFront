<template>
  <div class="add-container">
    <div class="add-bar">
      <input 
        v-model="name" 
        @keyup.enter="agregar" 
        type="text" 
        placeholder="Añadir producto (Ej. Tomates)" 
        class="input-field"
        autocomplete="off"
      />

      <select v-model="selectedCategoryId" class="select-field" :disabled="listaCategorias.length === 0">
        <option v-for="cat in listaCategorias" :key="cat.id" :value="cat.id">
          {{ cat.icon }} {{ cat.name }}
        </option>
      </select>

      <button @click="agregar" :disabled="!name" class="btn-add">+</button>
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
const listaCategorias = ref([]) // Se llenará desde la base de datos

onMounted(async () => {
  // Cargamos el catálogo real desde PostgreSQL al iniciar la pantalla
  const cats = await getCategories()
  listaCategorias.value = cats

  if (cats.length > 0) {
    // Buscamos si existe la categoría 'General' para ponerla por defecto
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
}
.add-bar { 
  display: flex; 
  gap: 0.5rem; 
  align-items: center;
}
.input-field { 
  flex: 2; 
  padding: 0.8rem 1rem; 
  border-radius: 12px; 
  border: 1px solid rgba(255, 255, 255, 0.2); 
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
}
.select-field {
  flex: 1;
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  outline: none;
  font-size: 0.9rem;
  cursor: pointer;
}
.select-field option {
  background: #222;
  color: white;
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
}
.btn-add:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.5;
}
</style>