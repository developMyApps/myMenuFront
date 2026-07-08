<template>
  <div class="category-section">
    <h3 :style="{ color: CONFIG[categoryName]?.color }">
      {{ CONFIG[categoryName]?.icono }} {{ categoryName }}
    </h3>
    <div v-for="item in items" :key="item.id" class="shopping-item">
      </div>
  </div>
</template>