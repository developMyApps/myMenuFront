<template>
  <div class="recipe-card card glass-effect" @click="$emit('click')">
    <div class="recipe-card-body">
      <span class="recipe-icon">📖</span>
      <h3 class="recipe-title">{{ recipe.title }}</h3>
    </div>
    <div class="recipe-card-footer">
      <span class="view-recipe-lbl">Ver receta</span>
      <div class="card-actions-wrapper">
        <button 
          class="btn-delete-recipe" 
          @click.stop="$emit('delete', recipe)"
          title="Eliminar receta"
        >
          🗑️
        </button>
        <span class="arrow-icon">▶</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  recipe: { type: Object, required: true }
})
defineEmits(['click', 'delete'])
</script>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.2rem;
  min-height: 115px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.recipe-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.recipe-card-body {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.recipe-icon {
  font-size: 1.3rem;
  line-height: 1;
}
.recipe-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
}
.recipe-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.view-recipe-lbl {
  font-size: 0.8rem;
  color: #ffd166;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.card-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.btn-delete-recipe {
  background: transparent;
  border: none;
  font-size: 1.05rem;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 6px;
  transition: transform 0.15s, background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-delete-recipe:hover {
  background-color: rgba(239, 71, 111, 0.15);
  transform: scale(1.15);
}
.arrow-icon {
  font-size: 0.7rem;
  opacity: 0.4;
  transition: transform 0.2s;
}
.recipe-card:hover .arrow-icon {
  transform: translateX(2px);
  opacity: 0.8;
}
</style>