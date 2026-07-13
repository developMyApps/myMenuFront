<template>
  <div class="login-container">
    <div class="login-card glass-effect animate-fade-in">
      <header class="login-header">
        <span class="logo-emoji">🧑‍🍳</span>
        <h1>Kitchen Share</h1>
        <p class="subtitle">Gestiona tus menús y tápers en familia</p>
      </header>

      <div class="tab-group">
        <button 
          :class="['tab-btn', { active: isLoginMode }]" 
          @click="isLoginMode = true; errorMsg = ''; successMsg = ''"
        >
          Iniciar Sesión
        </button>
        <button 
          :class="['tab-btn', { active: !isLoginMode }]" 
          @click="isLoginMode = false; errorMsg = ''; successMsg = ''"
        >
          Registrarse
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="!isLoginMode" class="form-field">
          <label for="nombre">Nombre</label>
          <input 
            v-model="formData.nombre" 
            type="text" 
            id="nombre" 
            placeholder="Tu nombre o apodo" 
            required 
          />
        </div>

        <div class="form-field">
          <label for="email">Correo Electrónico</label>
          <input 
            v-model="formData.email" 
            type="email" 
            id="email" 
            placeholder="ejemplo@correo.com" 
            required 
          />
        </div>

        <div class="form-field">
          <label for="password">Contraseña</label>
          <input 
            v-model="formData.password" 
            type="password" 
            id="password" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <p v-if="errorMsg" class="message error-msg">❌ {{ errorMsg }}</p>
        <p v-if="successMsg" class="message success-msg">✨ {{ successMsg }}</p>

        <button type="submit" :disabled="loading" class="btn-submit">
          <span v-if="loading" class="spinner"></span>
          <span v-else>{{ isLoginMode ? 'Entrar a la cocina' : 'Crear mi cuenta' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' // O el cliente HTTP que uses (ej: cambiar por tu instancia de api)

const router = useRouter()

const isLoginMode = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const formData = reactive({
  nombre: '',
  email: '',
  password: ''
})

// Configuración de la URL base del backend
const API_URL = 'http://localhost:8000/auth' // Ajusta el puerto según tu FastAPI

const handleSubmit = async () => {
  loading.value = false
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  try {
    if (isLoginMode.value) {
      // --- MODO INICIAR SESIÓN ---
      const respuesta = await axios.post(`${API_URL}/login`, {
        email: formData.email,
        password: formData.password
      })

      // 💾 Guardamos los datos cruciales en el almacenamiento local
      localStorage.setItem('token', respuesta.data.token)
      localStorage.setItem('userSession', JSON.stringify(respuesta.data.user))

      // Redirigimos al Dashboard (Ajusta la ruta si se llama diferente en tu router)
      router.push('/dashboard')

    } else {
      // --- MODO REGISTRO ---
      const respuesta = await axios.post(`${API_URL}/register`, {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password
      })

      successMsg.value = `${respuesta.data.message} Tu rol asignado es: ${respuesta.data.role}.`
      
      // Limpiamos campos y pasamos al login automáticamente tras 2 segundos
      setTimeout(() => {
        isLoginMode.value = true
        formData.password = ''
        successMsg.value = ''
      }, 2000)
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.detail) {
      errorMsg.value = err.response.data.detail
    } else {
      errorMsg.value = 'Ha ocurrido un error de conexión con el servidor.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  padding: 1.5rem;
  background: #121212; /* Fondo oscuro asegurado */
  position: fixed; /* Ocupa toda la pantalla flotando sobre el resto */
  top: 0;
  left: 0;
  z-index: 9999; /* Se pone por encima de menús o barras laterales */
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #1e1e1e; /* Fondo gris oscuro sólido para que no dependa de transparencias */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.8rem;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  font-weight: 700;
}

.subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin: 0;
}

/* Tabs */
.tab-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.6rem;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Formulario */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
  padding-left: 0.2rem;
}

input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0.8rem;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #ffd166; /* Color de acento de tu app */
  background: rgba(0, 0, 0, 0.4);
}

/* Botón */
.btn-submit {
  background: #ffd166; /* O tu color primario */
  color: #121212;
  border: none;
  border-radius: 10px;
  padding: 0.9rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-submit:hover {
  opacity: 0.9;
}

.btn-submit:active {
  transform: scale(0.98);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mensajes */
.message {
  font-size: 0.85rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  margin: 0;
}

.error-msg {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.success-msg {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

/* Animaciones simples */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Spinner básico */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #121212;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>