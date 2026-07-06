<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active">
      <span class="icon">🏠</span>
      <span class="label">Inicio</span>
    </router-link>
    <router-link to="/calendar" class="nav-item" active-class="active">
      <span class="icon">📅</span>
      <span class="label">Calendario</span>
    </router-link>
    <router-link to="/shopping" class="nav-item" active-class="active">
      <span class="icon">🛒</span>
      <span class="label">Compra</span>
    </router-link>
    <router-link to="/pantry" class="nav-item" active-class="active">
      <span class="icon">📖</span>
      <span class="label">Recetas</span>
    </router-link>
    <router-link to="/tupperware" class="nav-item" active-class="active">
      <span class="icon">🍱</span>
      <span class="label">Tuppers</span>
    </router-link>
    <router-link to="/settings" class="nav-item" active-class="active">
      <span class="icon">⚙️</span>
      <span class="label">Ajustes</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #888;
  transition: all 0.3s ease;
}

.nav-item .icon {
  font-size: 1.5rem;
  margin-bottom: 2px;
}

.nav-item .label {
  font-size: 0.7rem;
  font-weight: 500;
}

.nav-item.active {
  color: var(--primary-color);
  transform: translateY(-2px);
}
</style>
