<template>
  <div class="shopping-item card glass-effect" :class="{ bought: item.is_bought }">
    <label class="checkbox-container">
      <input type="checkbox" :checked="item.is_bought" @change="$emit('toggle', item)">
      <span class="checkmark"></span>
    </label>
    
    <div class="item-details">
      <span class="item-name">{{ item.ingredient_name }}</span>
      
      <span 
        v-if="item.category" 
        class="category-badge" 
        :style="{ backgroundColor: item.category_color + '22', color: item.category_color, borderColor: item.category_color + '44' }"
      >
        <span class="cat-icon">{{ item.category_icon }}</span>
        {{ item.category }}
      </span>
    </div>
    
    <div class="quantity-control">
      <button @click="$emit('modify', item, -1)" class="qty-btn" :disabled="item.is_bought">-</button>
      <span class="qty-number">{{ Number(item.quantity) }} {{ item.unit }}</span>
      <button @click="$emit('modify', item, 1)" class="qty-btn" :disabled="item.is_bought">+</button>
    </div>
    
    <button class="btn-delete-item" @click="$emit('delete', item.id)">🗑️</button>
  </div>
</template>

<script setup>
defineProps(['item'])
defineEmits(['toggle', 'modify', 'delete'])
</script>

<style scoped>
.shopping-item { 
  display: flex; 
  align-items: center; 
  padding: 1rem; 
  margin-bottom: 0.8rem; 
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  transition: all 0.3s ease;
}

/* Estado cuando el producto está COMPRADO (Oscurecido y tachado) */
.shopping-item.bought { 
  opacity: 0.35; 
}
.shopping-item.bought .item-name {
  text-decoration: line-through;
  color: #888;
}

.item-details { 
  flex: 1; 
  margin-left: 1.2rem; 
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: white;
}

/* El Badge dinámico de la categoría */
.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid;
  width: fit-content;
}

/* Estilización del Checkbox Gigante */
.checkbox-container {
  display: block;
  position: relative;
  width: 24px;
  height: 24px;
  cursor: pointer;
}
.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0; width: 0;
}
.checkmark {
  position: absolute;
  top: 0; left: 0;
  height: 24px; width: 24px;
  background-color: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  transition: all 0.2s ease;
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
  left: 8px; top: 4px;
  width: 5px; height: 10px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.quantity-control { display: flex; align-items: center; background: rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 20px; gap: 0.6rem; margin-right: 0.5rem;}
.qty-btn { background: rgba(255,255,255,0.2); border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; color: white; font-weight: bold;}
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-number { color: white; font-size: 0.9rem; min-width: 30px; text-align: center;}
.btn-delete-item { background: transparent; border: none; cursor: pointer; padding: 0.5rem; font-size: 1.1rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
</style>