<template>
  <div class="admin-wrapper">
    <div class="view-container">
      <header class="top-header admin-header">
        <div>
          <h1>👑 Panel de Administración</h1>
          <p class="role-badge">
            Sesión: <strong>{{ currentUser.name || currentUser.email }}</strong> 
            <span class="badge" :class="currentUser.role">{{ currentUser.role === 'owner' ? 'Propietario (Owner)' : 'Superadmin' }}</span>
          </p>
        </div>
        <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
      </header>

      <main class="admin-content">
        <!-- Navegación por pestañas -->
        <nav class="admin-tabs">
          <button 
            :class="['tab-link', { active: activeTab === 'groups' }]"
            @click="activeTab = 'groups'"
          >
            📁 Grupos ({{ groups.length }})
          </button>
          <button 
            v-if="isOwner"
            :class="['tab-link', { active: activeTab === 'pending' }]"
            @click="activeTab = 'pending'"
          >
            📩 Solicitudes <span v-if="pendingUsers.length" class="counter-tag">{{ pendingUsers.length }}</span>
          </button>
          <!-- Pestaña de Equipo visible ÚNICAMENTE para el Propietario Principal (Owner) -->
          <button 
            v-if="isOwner"
            :class="['tab-link', { active: activeTab === 'superadmins' }]"
            @click="activeTab = 'superadmins'"
          >
            👑 Equipo ({{ superadmins.length }})
          </button>
          <button 
            :class="['tab-link', { active: activeTab === 'new-group' }]"
            @click="activeTab = 'new-group'"
          >
            ➕ Crear Grupo
          </button>
        </nav>

        <!-- Pestaña 1: Grupos Activos -->
        <section v-if="activeTab === 'groups'" class="tab-panel">
          <div v-if="loadingGroups" class="loading-state">Cargando grupos...</div>
          <div v-else-if="groups.length === 0" class="empty-state">
            <p>No hay grupos registrados en la plataforma.</p>
          </div>
          <div v-else class="groups-grid">
            <div v-for="g in groups" :key="g.id" class="card glass-effect group-card">
              <div class="group-header">
                <h3>{{ g.name }}</h3>
                <span class="device-pill">📱 {{ g.active_devices_count }} activos</span>
              </div>
              <div class="group-body">
                <p>Código de invitación: <strong class="code-highlight">{{ g.invite_code }}</strong></p>
                <p class="date-text">Creado el: {{ formatDate(g.created_at) }}</p>
              </div>
              <div class="group-actions">
                <button @click="abrirModalEliminarGrupo(g)" class="btn danger-sm">
                  🗑️ Eliminar Grupo
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Pestaña 2: Solicitudes Pendientes -->
        <section v-if="activeTab === 'pending'" class="tab-panel">
          <div v-if="loadingPending" class="loading-state">Cargando solicitudes...</div>
          <div v-else-if="pendingUsers.length === 0" class="empty-state">
            <p>✨ No hay solicitudes de superadministrador pendientes de aprobación.</p>
          </div>
          <div v-else class="users-list">
            <div v-for="u in pendingUsers" :key="u.id" class="card glass-effect user-card">
              <div class="user-info">
                <h4>{{ u.name }}</h4>
                <p class="email">{{ u.email }}</p>
                <span class="date-text">Solicitado: {{ formatDate(u.created_at) }}</span>
              </div>
              <div class="user-actions">
                <button @click="handleApprove(u.id)" class="btn success-sm">✅ Aprobar</button>
                <button @click="handleReject(u.id)" class="btn danger-sm">❌ Rechazar</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Pestaña 3: Equipo Superadmin (Solo Owner) -->
        <section v-if="activeTab === 'superadmins' && isOwner" class="tab-panel">
          <div v-if="loadingSuperadmins" class="loading-state">Cargando equipo...</div>
          <div v-else class="users-list">
            <div v-for="sa in superadmins" :key="sa.id" class="card glass-effect user-card">
              <div class="user-info">
                <h4>{{ sa.name }}</h4>
                <p class="email">{{ sa.email }}</p>
                <span class="badge" :class="sa.role">{{ sa.role === 'owner' ? 'Propietario Principal' : 'Superadministrador' }}</span>
              </div>
              <div class="user-actions" v-if="sa.role !== 'owner'">
                <button @click="abrirModalBajaUsuario(sa)" class="btn danger-sm">
                  🛑 Dar de baja
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Pestaña 4: Crear Nuevo Grupo -->
        <section v-if="activeTab === 'new-group'" class="tab-panel">
          <div class="card glass-effect form-card">
            <h2>➕ Crear Nuevo Grupo Familiar</h2>
            <p class="form-desc">Al crear un grupo se generará automáticamente un código de invitación para dárselo a los convivientes.</p>
            <div class="form-group">
              <label>Nombre del Grupo / Piso:</label>
              <input 
                v-model="newGroupName" 
                type="text" 
                placeholder="Ej: Piso Alameda 4B" 
                class="input-field" 
              />
            </div>
            <p v-if="createMsg" class="success-text">{{ createMsg }}</p>
            <p v-if="createError" class="error-text">{{ createError }}</p>

            <button 
              @click="handleCreateGroup" 
              :disabled="creatingGroup || !newGroupName" 
              class="btn primary mt-3"
            >
              {{ creatingGroup ? 'Creando...' : 'Generar Grupo y Código' }}
            </button>
          </div>
        </section>

        <!-- MODAL PROPIA DE CONFIRMACIÓN DE ELIMINACIÓN DE GRUPO -->
        <Transition name="modal-fade">
          <div v-if="grupoAEliminar" class="modal-overlay" @click.self="grupoAEliminar = null">
            <div class="modal-content glass-effect confirm-modal">
              <div class="modal-header">
                <h2>⚠️ Confirmar Eliminación</h2>
                <button class="btn-close-modal" @click="grupoAEliminar = null">×</button>
              </div>

              <div class="modal-body">
                <p class="confirm-text">
                  ¿Estás seguro de que deseas eliminar permanentemente el grupo <strong>"{{ grupoAEliminar.name }}"</strong>?
                </p>
                <div class="warning-box mt-3">
                  <p>🚨 Esta acción no se puede deshacer. Se borrarán todas sus comidas del calendario, recetas asociadas, tupperwares y elementos de la lista de la compra.</p>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-secondary" @click="grupoAEliminar = null">Cancelar</button>
                <button 
                  class="btn btn-danger" 
                  :disabled="eliminandoGrupo" 
                  @click="ejecutarEliminacionGrupo"
                >
                  {{ eliminandoGrupo ? 'Eliminando...' : '🗑️ Sí, Eliminar Grupo' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- MODAL PROPIA DE CONFIRMACIÓN DE BAJA DE USUARIO -->
        <Transition name="modal-fade">
          <div v-if="usuarioADarDeBaja" class="modal-overlay" @click.self="usuarioADarDeBaja = null">
            <div class="modal-content glass-effect confirm-modal">
              <div class="modal-header">
                <h2>⚠️ Confirmar Baja de Usuario</h2>
                <button class="btn-close-modal" @click="usuarioADarDeBaja = null">×</button>
              </div>

              <div class="modal-body">
                <p class="confirm-text">
                  ¿Estás seguro de que deseas dar de baja a <strong>"{{ usuarioADarDeBaja.name }}"</strong> (<code>{{ usuarioADarDeBaja.email }}</code>)?
                </p>
                <div class="warning-box mt-3">
                  <p>🚨 El usuario perderá inmediatamente sus permisos de Superadministrador y no podrá acceder al panel de administración.</p>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-secondary" @click="usuarioADarDeBaja = null">Cancelar</button>
                <button 
                  class="btn btn-danger" 
                  :disabled="dandoDeBaja" 
                  @click="ejecutarBajaUsuario"
                >
                  {{ dandoDeBaja ? 'Procesando...' : '🛑 Sí, Dar de Baja' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- MENSAJE FLOTANTE CENTRADO EN LA PANTALLA -->
        <Transition name="modal-fade">
          <div v-if="feedbackMsg" class="feedback-banner">
            {{ feedbackMsg }}
          </div>
        </Transition>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getGroups, 
  deleteGroup, 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getSuperadmins, 
  revokeSuperadmin 
} from '../services/adminService'
import { createGroup } from '../services/groupService'

const router = useRouter()
const activeTab = ref('groups')

const currentUser = ref({ name: '', email: '', role: 'superadmin' })
const isOwner = computed(() => currentUser.value.role === 'owner')

const groups = ref([])
const pendingUsers = ref([])
const superadmins = ref([])

const loadingGroups = ref(false)
const loadingPending = ref(false)
const loadingSuperadmins = ref(false)
const feedbackMsg = ref('')

const newGroupName = ref('')
const creatingGroup = ref(false)
const createMsg = ref('')
const createError = ref('')

// Estado para la Modal de Eliminación de Grupo
const grupoAEliminar = ref(null)
const eliminandoGrupo = ref(false)

// Estado para la Modal de Baja de Usuario
const usuarioADarDeBaja = ref(null)
const dandoDeBaja = ref(false)

const loadData = async () => {
  const session = localStorage.getItem('userSession')
  if (session) {
    try {
      currentUser.value = JSON.parse(session)
    } catch (e) {}
  }

  // Si no es owner y estaba en la pestaña de superadmins, redirigir a grupos
  if (!isOwner.value && activeTab.value === 'superadmins') {
    activeTab.value = 'groups'
  }

  // Cargar grupos
  loadingGroups.value = true
  try {
    groups.value = await getGroups()
  } catch (e) { console.error(e) }
  finally { loadingGroups.value = false }

  // Cargar solicitudes pendientes
  loadingPending.value = true
  try {
    pendingUsers.value = await getPendingUsers()
  } catch (e) { console.error(e) }
  finally { loadingPending.value = false }

  // Cargar superadmins ÚNICAMENTE si es el Owner
  if (isOwner.value) {
    loadingSuperadmins.value = true
    try {
      superadmins.value = await getSuperadmins()
    } catch (e) { console.error(e) }
    finally { loadingSuperadmins.value = false }
  }
}

onMounted(() => {
  loadData()
})

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const showFeedback = (msg) => {
  feedbackMsg.value = msg
  setTimeout(() => { feedbackMsg.value = '' }, 3500)
}

const abrirModalEliminarGrupo = (group) => {
  grupoAEliminar.value = group
}

const ejecutarEliminacionGrupo = async () => {
  if (!grupoAEliminar.value) return
  eliminandoGrupo.value = true
  const nombreGuardado = grupoAEliminar.value.name
  try {
    await deleteGroup(grupoAEliminar.value.id)
    grupoAEliminar.value = null
    showFeedback(`✨ El grupo "${nombreGuardado}" ha sido eliminado con éxito.`)
    loadData()
  } catch (e) {
    showFeedback('❌ Error al intentar eliminar el grupo.')
  } finally {
    eliminandoGrupo.value = false
  }
}

const handleApprove = async (userId) => {
  try {
    await approveUser(userId)
    showFeedback('✨ Usuario superadministrador aprobado con éxito.')
    loadData()
  } catch (e) {
    showFeedback('❌ Error al aprobar usuario.')
  }
}

const handleReject = async (userId) => {
  try {
    await rejectUser(userId)
    showFeedback('Solicitud rechazada y eliminada.')
    loadData()
  } catch (e) {
    showFeedback('❌ Error al rechazar solicitud.')
  }
}

const abrirModalBajaUsuario = (user) => {
  usuarioADarDeBaja.value = user
}

const ejecutarBajaUsuario = async () => {
  if (!usuarioADarDeBaja.value) return
  dandoDeBaja.value = true
  const userTemp = usuarioADarDeBaja.value
  try {
    await revokeSuperadmin(userTemp.id)
    usuarioADarDeBaja.value = null
    showFeedback(`🛑 El usuario ${userTemp.name} ha sido dado de baja.`)
    loadData()
  } catch (e) {
    showFeedback(`❌ ${e.response?.data?.detail || 'Error al dar de baja al superadmin.'}`)
  } finally {
    dandoDeBaja.value = false
  }
}

const handleCreateGroup = async () => {
  if (!newGroupName.value) return
  creatingGroup.value = true
  createMsg.value = ''
  createError.value = ''
  try {
    const g = await createGroup(newGroupName.value)
    createMsg.value = `¡Grupo "${g.name}" creado con éxito! Código: ${g.invite_code}`
    newGroupName.value = ''
    loadData()
  } catch (e) {
    createError.value = 'Error al crear el grupo.'
  } finally {
    creatingGroup.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userSession')
  router.push('/settings')
}
</script>

<style scoped>
@import '../assets/styles/modal-shared.css';

.admin-wrapper {
  min-height: 100vh;
  padding: 1rem;
  background: #121212;
  color: #e0e0e0;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #ffffff;
}

.role-badge {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.2rem;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-link {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.tab-link.active {
  background: rgba(255, 209, 102, 0.15);
  color: #ffd166;
  border: 1px solid rgba(255, 209, 102, 0.3);
}

.counter-tag {
  background: #ff6b6b;
  color: white;
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.group-card {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.group-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.device-pill {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
}

.code-highlight {
  color: #ffd166;
  font-family: monospace;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.date-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.3rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-info h4 {
  margin: 0 0 0.2rem 0;
  color: #fff;
}

.user-info .email {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.4rem;
}

.badge.owner { background: rgba(255, 209, 102, 0.2); color: #ffd166; }
.badge.superadmin { background: rgba(52, 152, 219, 0.2); color: #3498db; }

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary { background: #ffd166; color: #121212; width: 100%; padding: 0.8rem; }
.btn.success-sm { background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
.btn.danger-sm { background: rgba(231, 76, 60, 0.2); color: #ff6b6b; border: 1px solid rgba(231, 76, 60, 0.3); }

.form-card {
  max-width: 500px;
  margin: 0 auto;
  padding: 1.8rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.form-card h2 { margin-top: 0; color: #fff; font-size: 1.3rem; }
.form-desc { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); line-height: 1.4; }

.input-field {
  width: 100%;
  padding: 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.95rem;
  margin-top: 0.4rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
}

/* Modal personalizada de confirmación */
.confirm-modal {
  max-width: 440px;
  width: 92%;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1.8rem;
  border-radius: 20px;
  text-align: left;
}

.warning-box {
  background: rgba(231, 76, 60, 0.1);
  border-left: 4px solid #e74c3c;
  padding: 0.8rem 1rem;
  border-radius: 0 10px 10px 0;
  font-size: 0.85rem;
  color: #ff8e8e;
  line-height: 1.4;
}

.warning-box p {
  margin: 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
}

/* MENSAJE FLOTANTE TOTALMENTE CENTRADO EN PANTALLA */
.feedback-banner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1e1e1e;
  border: 1px solid #ffd166;
  color: #ffd166;
  padding: 1.2rem 2.2rem;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1.05rem;
  box-shadow: 0 12px 45px rgba(0, 0, 0, 0.85);
  z-index: 10000;
  text-align: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>