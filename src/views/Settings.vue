<script setup>
import { ref, onMounted } from 'vue'
import { createGroup, joinGroup } from '../services/groupService'

const groupName = ref('')
const inviteCode = ref('') 
const currentGroup = ref(null)
const isCreating = ref(false)
const isJoining = ref(false) 
const errorMsg = ref('')
const isSuperAdmin = ref(false)

onMounted(() => {
  // 1. Cargar grupo si ya tiene uno
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    currentGroup.value = JSON.parse(savedGroup)
  }

  // 2. Comprobar permisos leyendo de la sesión guardada tras el login
  const userSession = localStorage.getItem('userSession')
  if (userSession) {
    const user = JSON.parse(userSession)
    isSuperAdmin.value = user.role === 'superadmin' || user.isSuperAdmin === true
  } else {
    isSuperAdmin.value = false 
  }
})

const handleCreateGroup = async () => {
  if (!groupName.value || !isSuperAdmin.value) return
  isCreating.value = true
  errorMsg.value = ''
  try {
    const newGroup = await createGroup(groupName.value)
    currentGroup.value = newGroup
    localStorage.setItem('kitchenGroup', JSON.stringify(newGroup))
    groupName.value = ''
  } catch (err) {
    errorMsg.value = 'Error al crear el grupo'
  } finally {
    isCreating.value = false
  }
}

const handleJoinGroup = async () => {
  if (!inviteCode.value) return
  isJoining.value = true
  errorMsg.value = ''
  
  try {
    const joinedGroup = await joinGroup(inviteCode.value.trim().toUpperCase())
    currentGroup.value = joinedGroup
    localStorage.setItem('kitchenGroup', JSON.stringify(joinedGroup))
    inviteCode.value = ''
  } catch (err) {
    if (err.response && err.response.status === 404) {
      errorMsg.value = 'El código de invitación no es válido o no existe.'
    } else {
      errorMsg.value = 'Error al intentar unirse al grupo.'
    }
  } finally {
    isJoining.value = false
  }
}

const handleDisconnect = () => {
  localStorage.removeItem('kitchenGroup')
  currentGroup.value = null
}
</script>

<template>
  <div class="settings-wrapper">

    <div class="view-container">
      <header class="top-header">
        <h1>Ajustes de Grupo</h1>
      </header>
      <main class="settings-content">
        <section class="card glass-effect">
          <h2>👥 Mi Grupo</h2>
          
          <div v-if="currentGroup" class="group-info">
            <p class="success-text">¡Estás conectad@!</p>
            <h3>{{ currentGroup.name }}</h3>
            <div class="invite-code">
              Código de invitación: <strong>{{ currentGroup.invite_code }}</strong>
            </div>
            <button @click="handleDisconnect" class="btn danger mt-4">Desconectar</button>
          </div>

          <div v-else class="group-info">
            <p>No perteneces a ningún grupo familiar todavía.</p>
            
            <div v-if="isSuperAdmin" class="form-group mt-4">
              <label class="section-label">👑 Zona de Superadmin:</label>
              <input 
                v-model="groupName" 
                type="text" 
                placeholder="Nombre del nuevo grupo" 
                class="input-field"
              />
              <button 
                @click="handleCreateGroup" 
                :disabled="isCreating || !groupName" 
                class="btn primary mt-2"
              >
                {{ isCreating ? 'Creando...' : 'Crear Grupo' }}
              </button>
              <div class="divider">o si prefieres</div>
            </div>
            
            <div v-else class="info-banner mt-4">
              <p>🔒 La creación de grupos está restringida. Introduce el código que te haya proporcionado tu superadministrador.</p>
            </div>
            
            <div class="form-group">
              <input 
                v-model="inviteCode" 
                type="text" 
                placeholder="Introduce el código (Ej: ABC123)" 
                class="input-field uppercase-input"
                @keyup.enter="handleJoinGroup"
              />
              <button 
                @click="handleJoinGroup" 
                :disabled="isJoining || !inviteCode" 
                class="btn secondary mt-2"
              >
                {{ isJoining ? 'Conectando...' : 'Unirse con Código' }}
              </button>
            </div>
            
            <p v-if="errorMsg" class="error-text mt-3">{{ errorMsg }}</p>
          </div>
        </section>
      </main>
    </div>

    <div class="admin-access mt-4">
      <router-link to="/super-login" class="admin-link">🔐 Acceso Administración</router-link>
    </div>

  </div>
</template>

<style scoped>
/* Agrega estos estilos decorativos a tus estilos existentes */
.section-label {
  display: block;
  font-size: 0.85rem;
  color: #ffd166;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
}

.info-banner {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.divider {
  margin: 1.5rem 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
}
</style>

<style scoped>
/* Un par de estilos opcionales para mejorar la UI de los inputs de códigos */
.uppercase-input {
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
}
.mt-3 {
  margin-top: 0.75rem;
}
</style>
<style scoped>
.settings-content {
  padding: 1rem;
}
.btn {
  display: block;
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.primary {
  background: var(--primary-color);
  color: white;
}
.btn.secondary {
  background: var(--surface-light);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
.btn.danger {
  background: #e74c3c;
  color: white;
}
.input-field {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  margin-bottom: 0.5rem;
}
.invite-code {
  background: var(--surface-light);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-size: 1.1rem;
  letter-spacing: 1px;
}
.success-text {
  color: var(--primary-color);
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.error-text {
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #888;
}
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.admin-access {
  text-align: center;
  margin-top: 2rem;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.admin-access:hover {
  opacity: 1;
}
.admin-link {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-decoration: none;
}
</style>
