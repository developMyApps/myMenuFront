<!-- components/AppLogo.vue -->
<template>
  <div class="brand-logo" :style="{ '--logo-size': size + 'px' }">
    <div class="logo-wrapper">
      <svg class="logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Gradiente Principal -->
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD166" />
            <stop offset="50%" stop-color="#FF9F1C" />
            <stop offset="100%" stop-color="#FF6B6B" />
          </linearGradient>

          <!-- Gradiente de Brillo Superior -->
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>

          <!-- Sombras Suaves -->
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25"/>
          </filter>
        </defs>
        
        <!-- Fondo base con gradiente y bordes redondeados -->
        <rect width="100" height="100" rx="28" fill="url(#brandGrad)" />
        
        <!-- Capa de brillo superior (Efecto cristal) -->
        <path d="M 0 28 Q 0 0 28 0 L 72 0 Q 100 0 100 28 L 100 45 L 0 60 Z" fill="url(#shineGrad)" />
        
        <!-- Icono Central: Campana Gourmet + Destello -->
        <g filter="url(#glow)">
          <!-- Base / Plato de la campana -->
          <path d="M22 70 C22 68, 24 66, 27 66 L73 66 C76 66, 78 68, 78 70 C78 72, 76 73, 73 73 L27 73 C24 73, 22 72, 22 70 Z" fill="#FFFFFF" />

          <!-- Cúpula de la Campana -->
          <path d="M26 62 C26 40, 38 32, 50 32 C62 32, 74 40, 74 62 Z" fill="#FFFFFF" />

          <!-- Asa superior de la campana -->
          <circle cx="50" cy="27" r="4.5" fill="#FFFFFF" />

          <!-- Detalle de vapor / Destello de calidad (Estrella superior derecha) -->
          <path d="M72 26 C72 26 74 30 78 30 C74 30 72 34 72 34 C72 34 70 30 66 30 C70 30 72 26 72 26 Z" fill="#FFE66D" />
          <path d="M30 24 C30 24 31 27 34 27 C31 27 30 30 30 30 C30 30 29 27 26 27 C29 27 30 24 30 24 Z" fill="#FFFFFF" opacity="0.8" />
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
}

.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-icon {
  width: var(--logo-size);
  height: var(--logo-size);
  border-radius: 28%;
  box-shadow: 
    0 8px 20px -4px rgba(255, 107, 107, 0.4),
    0 4px 10px -2px rgba(255, 209, 102, 0.3);
  transition: box-shadow 0.3s ease;
}

/* Efecto hover interactivo */
.brand-logo:hover .logo-wrapper {
  transform: translateY(-2px) scale(1.04);
}

.brand-logo:hover .logo-icon {
  box-shadow: 
    0 12px 25px -4px rgba(255, 107, 107, 0.55),
    0 6px 14px -2px rgba(255, 209, 102, 0.4);
}

.brand-name {
  font-weight: 800;
  font-size: calc(var(--logo-size) * 0.58);
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #FFFFFF 60%, #FFD166 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
</style>