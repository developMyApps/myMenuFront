<script setup>
import { onMounted } from 'vue'
import BottomNav from './components/BottomNav.vue'
import apiClient from './services/apiClient'

onMounted(() => {
  // Ping silencioso en segundo plano para despertar a Render rápidamente si estaba en reposo
  apiClient.get('/').catch(() => {})
})
</script>

<template>
  <div id="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <BottomNav />
  </div>
</template>

<style>
#app-container {
  min-height: 100vh;
  padding-bottom: 80px; /* Space for BottomNav */
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
