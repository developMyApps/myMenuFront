<script setup>
import { ref, onMounted } from 'vue'
import { createGroup } from '../services/api'

const groupName = ref('')
const currentGroup = ref(null)
const isCreating = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    currentGroup.value = JSON.parse(savedGroup)
  }
})

const handleCreateGroup = async () => {
  if (!groupName.value) return
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

const handleDisconnect = () => {
  localStorage.removeItem('kitchenGroup')
  currentGroup.value = null
}
</script>

<template>
  <div class="view-container">
    <header class="top-header">
      <h1>Ajustes de Grupo</h1>
    </header>
    <main class="settings-content">
      <section class="card glass-effect">
        <h2>👥 Mi Grupo</h2>
        
        <div v-if="currentGroup" class="group-info">
          <p class="success-text">¡Estás conectado!</p>
          <h3>{{ currentGroup.name }}</h3>
          <div class="invite-code">
            Código de invitación: <strong>{{ currentGroup.invite_code }}</strong>
          </div>
          <button @click="handleDisconnect" class="btn danger mt-4">Desconectar</button>
        </div>

        <div v-else class="group-info">
          <p>No perteneces a ningún grupo familiar todavía.</p>
          
          <div class="form-group mt-4">
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
          </div>
          
          <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

          <div class="divider">o</div>
          
          <div class="form-group">
            <button class="btn secondary">Unirse con Código (Próximamente)</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

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
</style>
