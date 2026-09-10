<template>
  <div class="recipe-card card glass-effect" @click="$emit('click')">
    <div class="recipe-card-body">
      <span class="recipe-icon">📖</span>
      <div class="recipe-info">
        <h3 class="recipe-title">{{ recipe.title }}</h3>
        
        <!-- 🆕 Badges de Etiquetas -->
        <div v-if="recipe.tags && recipe.tags.length > 0" class="card-tags">
          <span 
            v-for="tagId in recipe.tags" 
            :key="tagId" 
            class="tag-badge"
            :title="getTagLabel(tagId)"
          >
            {{ getTagIcon(tagId) }} {{ getTagLabel(tagId) }}
          </span>
        </div>
      </div>
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
import { AVAILABLE_TAGS } from '../../utils/tags'

defineProps({
  recipe: { type: Object, required: true }
})
defineEmits(['click', 'delete'])

const getTagIcon = (tagId) => {
  const tag = AVAILABLE_TAGS.find(t => t.id === tagId)
  return tag ? tag.icon : '🏷️'
}

const getTagLabel = (tagId) => {
  const tag = AVAILABLE_TAGS.find(t => t.id === tagId)
  return tag ? tag.label : tagId
}
</script>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.2rem;
  min-height: 125px;
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
.recipe-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

/* 🆕 Badges de Etiquetas en Card */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
}
.tag-badge {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
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