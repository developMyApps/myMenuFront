<!-- components/AppLogo.vue -->
<template>
  <div class="brand-logo" :style="{ '--logo-size': size + 'px' }">
    <div class="logo-wrapper">
      <svg class="logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Gradiente Moderno Púrpura Neón a Rosa Vivo -->
          <linearGradient id="kitchyPurpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6" />
            <stop offset="50%" stop-color="#D946EF" />
            <stop offset="100%" stop-color="#EC4899" />
          </linearGradient>

          <!-- Gradiente Neón Dorado para Acentos -->
          <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="100%" stop-color="#F97316" />
          </linearGradient>

          <!-- Reflexión de Cristal -->
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>

          <!-- Sombra Suave -->
          <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Base Geométrica (Squircle) con gradiente -->
        <rect width="100" height="100" rx="28" fill="url(#kitchyPurpGrad)" />

        <!-- Capa de brillo superior de cristal -->
        <path d="M 0 28 Q 0 0 28 0 L 72 0 Q 100 0 100 28 L 100 38 L 0 52 Z" fill="url(#glassReflection)" />

        <!-- ICONO CENTRAL: Letra "K" Culinaria (Tenedor + Cuchara integrados) -->
        <g filter="url(#purpleGlow)">
          <!-- Palo vertical de la K (Representa el mango de un cubierto elegante) -->
          <rect x="28" y="24" width="10" height="52" rx="5" fill="#FFFFFF" />

          <!-- Parte superior derecha de la K (Cabeza de Cuchara inclinada) -->
          <path d="M42 46 L58 28 C62 24, 69 26, 71 31 C73 36, 70 42, 65 45 L48 53 Z" fill="#FFFFFF" />

          <!-- Parte inferior derecha de la K (Tenedor estilizado en diagonal) -->
          <path d="M48 49 L66 68 C70 72, 76 70, 77 65 C78 60, 74 55, 69 52 L54 44 Z" fill="#FFFFFF" opacity="0.9" />

          <!-- Detalle de chispa / estrella de sabor (Arriba a la derecha) -->
          <path d="M76 18 C76 18, 78 22, 82 22 C78 22, 76 26, 76 26 C76 26, 74 22, 70 22 C74 22, 76 18, 76 18 Z" fill="url(#goldAccent)" />
          
          <!-- Llama / Punto de cocción en la intersección de la K -->
          <circle cx="43" cy="50" r="4" fill="url(#goldAccent)" />
        </g>
      </svg>
    </div>

    <span v-if="showText" class="brand-name">{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Kitchy' },
  size: { type: Number, default: 42 },
  showText: { type: Boolean, default: true }
})
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  user-select: none;
  cursor: pointer;
}

.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-icon {
  width: var(--logo-size);
  height: var(--logo-size);
  border-radius: 28%;
  box-shadow: 
    0 8px 22px -4px rgba(217, 70, 239, 0.5),
    0 4px 10px -2px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

/* Efecto hover interactivo con rotación sutil */
.brand-logo:hover .logo-wrapper {
  transform: translateY(-3px) scale(1.06) rotate(3deg);
}

.brand-logo:hover .logo-icon {
  box-shadow: 
    0 14px 28px -4px rgba(217, 70, 239, 0.65),
    0 6px 14px -2px rgba(139, 92, 246, 0.4);
}

.brand-name {
  font-weight: 900;
  font-size: calc(var(--logo-size) * 0.58);
  letter-spacing: -0.6px;
  background: linear-gradient(135deg, #FFFFFF 40%, #F472B6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
}
</style>