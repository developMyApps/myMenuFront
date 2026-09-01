<!-- views/VerifyEmailView.vue -->
<template>
  <div class="view-container text-center py-5">
    <div v-if="loading" class="card glass-effect">
      <h2>⏳ Verificando tu correo...</h2>
      <p>Por favor espera un momento.</p>
    </div>

    <div v-else-if="exito" class="card glass-effect">
      <h2>✅ ¡Correo Verificado!</h2>
      <p>Tu dirección de correo ha sido confirmada con éxito.</p>
      <p class="mt-3">Tu solicitud ha sido enviada al Administrador Principal (Owner) para su aprobación final.</p>
    </div>

    <div v-else class="card glass-effect">
      <h2>❌ Error de Verificación</h2>
      <p>{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(true)
const exito = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    errorMsg.value = 'El enlace de verificación no contiene un token válido.'
    loading.value = false
    return
  }

  try {
    // Reemplaza VITE_API_BASE_URL por la ruta a tu backend
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email?token=${token}`, {
      method: 'POST'
    })
    
    if (res.ok) {
      exito.value = true
    } else {
      const data = await res.json()
      errorMsg.value = data.detail || 'No se pudo verificar el correo o el enlace ha caducado.'
    }
  } catch (err) {
    errorMsg.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
})
</script>