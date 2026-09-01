<template>
  <div class="login-container">
    <div class="login-card glass-effect animate-fade-in">
      <header class="login-header">
        <span class="logo-emoji">🔐</span>
        <h1>Acceso Administración</h1>
        <p class="subtitle">Panel de gestión para Superadministradores</p>
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
          Solicitar Cuenta
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="!isLoginMode" class="form-field">
          <label for="nombre">Nombre</label>
          <input 
            v-model="formData.nombre" 
            type="text" 
            id="nombre" 
            placeholder="Tu nombre completo" 
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
          <span v-else>{{ isLoginMode ? 'Entrar al Panel Admin' : 'Enviar Solicitud de Registro' }}</span>
        </button>

        <div class="back-link">
          <router-link to="/settings">← Volver a la App</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../services/apiClient'

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

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  // Validación de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email.trim())) {
    errorMsg.value = 'Por favor, introduce un correo electrónico válido (ejemplo: usuario@correo.com).'
    return
  }

  loading.value = true

  try {
    if (isLoginMode.value) {
      // --- MODO INICIAR SESIÓN ---
      const respuesta = await apiClient.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })

      localStorage.setItem('token', respuesta.data.token)
      localStorage.setItem('userSession', JSON.stringify(respuesta.data.user))

      // Redirigir al Panel Admin
      router.push('/admin-dashboard')

    } else {
      // --- MODO REGISTRO ---
      const respuesta = await apiClient.post('/auth/register', {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password
      })

      successMsg.value = respuesta.data.message
      
      setTimeout(() => {
        isLoginMode.value = true
        formData.password = ''
      }, 3500)
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
  background: #121212;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}

.login-header {
  text-align: center;
  margin-bottom: 1.8rem;
}

.logo-emoji {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.6rem;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  font-weight: 700;
}

.subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0;
}

.tab-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.6rem;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #ffd166;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
}

input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0.75rem;
  color: #ffffff;
  font-size: 0.95rem;
}

input:focus {
  outline: none;
  border-color: #ffd166;
  background: rgba(0, 0, 0, 0.4);
}

.btn-submit {
  background: #ffd166;
  color: #121212;
  border: none;
  border-radius: 10px;
  padding: 0.85rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
  margin-top: 0.5rem;
}

.back-link a {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-decoration: none;
}

.message {
  font-size: 0.85rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  line-height: 1.4;
}

.error-msg {
  background: rgba(231, 76, 60, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.success-msg {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #121212;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>