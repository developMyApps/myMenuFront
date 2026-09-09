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
          <!-- Nueva Pestaña de Tickets visible ÚNICAMENTE para el Owner -->
          <button 
            v-if="isOwner"
            :class="['tab-link', { active: activeTab === 'tickets' }]"
            @click="activeTab = 'tickets'"
          >
            🎫 Tickets <span v-if="openTicketsCount" class="counter-tag">{{ openTicketsCount }}</span>
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

        <!-- Pestaña 4: Gestión de Tickets (Solo Owner) -->
        <!-- Pestaña 4: Gestión de Tickets (Solo Owner) -->
        <section v-if="activeTab === 'tickets' && isOwner" class="tab-panel">
          <div class="tickets-filter-bar">
            <button 
              :class="['filter-btn', { active: ticketFilter === 'all' }]"
              @click="ticketFilter = 'all'"
            >
              Todos ({{ tickets.length }})
            </button>
            <button 
              :class="['filter-btn', { active: ticketFilter === 'open' }]"
              @click="ticketFilter = 'open'"
            >
              Abiertos ({{ openTicketsCount }})
            </button>
            <button 
              :class="['filter-btn', { active: ticketFilter === 'in_progress' }]"
              @click="ticketFilter = 'in_progress'"
            >
              En proceso ({{ inProgressTicketsCount }})
            </button>
            <button 
              :class="['filter-btn', { active: ticketFilter === 'resolved' || ticketFilter === 'closed' }]"
              @click="ticketFilter = 'resolved'"
            >
              Resueltos / Cerrados
            </button>
          </div>

          <div v-if="loadingTickets" class="loading-state">Cargando tickets de soporte...</div>
          <div v-else-if="filteredTickets.length === 0" class="empty-state">
            <p>🎉 No hay tickets que coincidan con el filtro seleccionado.</p>
          </div>
          <div v-else class="tickets-list">
            <div 
              v-for="ticket in filteredTickets" 
              :key="ticket.id" 
              class="card glass-effect ticket-card"
            >
              <div class="ticket-header">
                <div>
                  <span class="ticket-id">#{{ ticket.id }}</span>
                  <!-- INSIGNIA O ETIQUETA DEL TIPO DE TICKET -->
                  <span class="type-badge">
                    {{ getTicketTypeLabel(ticket.type) }}
                  </span>
                  <h3 class="ticket-title">{{ ticket.title || 'Sin asunto' }}</h3>
                  <span class="date-text">Enviado por {{ ticket.user_name || ticket.user_email || 'Usuario' }} el {{ formatDate(ticket.created_at) }}</span>
                </div>
                <span class="status-badge" :class="ticket.status || 'open'">
                  {{ getStatusLabel(ticket.status || 'open') }}
                </span>
              </div>

              <div class="ticket-body">
                <p class="ticket-description">{{ ticket.description }}</p>
              </div>

              <div class="ticket-footer">
                <div class="status-selector">
                  <label>Cambiar Estado:</label>
                  <select 
                    :value="ticket.status || 'open'" 
                    @change="onChangeStatus(ticket, $event)"
                    class="select-field"
                  >
                    <option value="open">Abierto</option>
                    <option value="in_progress">En proceso</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
                
                <button @click="abrirModalResponderTicket(ticket)" class="btn primary-sm">
                  💬 Gestionar / Responder
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Pestaña 5: Crear Nuevo Grupo -->
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

        <!-- MODAL PARA RESPONDER Y VER HILO DEL TICKET -->
        <Transition name="modal-fade">
          <div v-if="ticketSeleccionado" class="modal-overlay" @click.self="ticketSeleccionado = null">
            <div class="modal-content glass-effect ticket-modal">
              <div class="modal-header">
                <h2>🎫 Ticket #{{ ticketSeleccionado.id }}: {{ ticketSeleccionado.title || ticketSeleccionado.subject || 'Sin título' }}</h2>
                <button class="btn-close-modal" @click="ticketSeleccionado = null">×</button>
              </div>

              <div class="modal-body">
                <div class="ticket-detail-info">
                  <p><strong>Usuario / Reportador:</strong> {{ ticketSeleccionado.reporter_name || ticketSeleccionado.user_name || 'Usuario' }} <span v-if="ticketSeleccionado.reporter_email || ticketSeleccionado.user_email">({{ ticketSeleccionado.reporter_email || ticketSeleccionado.user_email }})</span></p>
                  <p v-if="ticketSeleccionado.group_id"><strong>ID Grupo:</strong> {{ ticketSeleccionado.group_id }}</p>
                  <p><strong>Fecha inicio:</strong> {{ formatDate(ticketSeleccionado.created_at) }}</p>
                  
                  <div class="status-change-row mt-2">
                    <label><strong>Estado de la incidencia:</strong></label>
                    <select 
                      :value="ticketSeleccionado.status || 'open'" 
                      @change="onChangeStatusModal(ticketSeleccionado, $event)"
                      class="select-field status-select-modal"
                    >
                      <option value="open">Abierto / Recibido</option>
                      <option value="in_progress">En proceso / En revisión</option>
                      <option value="resolved">Resuelto / Solucionado</option>
                      <option value="closed">Cerrado / Archivado</option>
                    </select>
                  </div>
                </div>

                <!-- Hilo de conversación -->
                <div class="chat-thread mt-3">
                  <label><strong>Hilo de la conversación:</strong></label>
                  
                  <!-- Mensaje original -->
                  <div class="chat-bubble user-bubble">
                    <span class="chat-author">👤 {{ ticketSeleccionado.reporter_name || ticketSeleccionado.user_name || 'Usuario' }} (Reporte inicial)</span>
                    <p>{{ ticketSeleccionado.description }}</p>
                    <span class="chat-date" v-if="ticketSeleccionado.created_at">{{ formatDate(ticketSeleccionado.created_at) }}</span>
                  </div>

                  <!-- Lista de respuestas del hilo -->
                  <div 
                    v-for="msg in (ticketSeleccionado.replies || ticketSeleccionado.messages || [])" 
                    :key="msg.id" 
                    :class="['chat-bubble', msg.sender_type === 'owner' || msg.is_admin || msg.sender === 'admin' ? 'admin-bubble' : 'user-bubble']"
                  >
                    <span class="chat-author">
                      {{ msg.sender_type === 'owner' || msg.is_admin || msg.sender === 'admin' ? '👑 Owner / Soporte' : ('👤 ' + (ticketSeleccionado.reporter_name || 'Usuario')) }}
                    </span>
                    <p>{{ msg.message || msg.content }}</p>
                    <span class="chat-date" v-if="msg.created_at">{{ formatDate(msg.created_at) }}</span>
                  </div>
                </div>

                <!-- Formulario para enviar un nuevo mensaje -->
                <div v-if="ticketSeleccionado.status !== 'closed' && ticketSeleccionado.status !== 'descartado' && ticketSeleccionado.status !== 'resolved' && ticketSeleccionado.status !== 'resuelto'" class="form-group mt-3">
                  <label>Escribir mensaje / respuesta:</label>
                  <textarea 
                    v-model="ticketResponseText" 
                    rows="3" 
                    placeholder="Escribe un mensaje para el usuario..." 
                    class="input-field textarea-field"
                  ></textarea>
                </div>
                <div v-else class="closed-notice mt-3">
                  🔒 El ticket está {{ getStatusLabel(ticketSeleccionado.status) }}. Cambia el estado arriba si deseas reabrir la conversación.
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-secondary" @click="ticketSeleccionado = null">Cerrar vista</button>
                <button 
                  v-if="ticketSeleccionado.status !== 'closed' && ticketSeleccionado.status !== 'descartado' && ticketSeleccionado.status !== 'resolved' && ticketSeleccionado.status !== 'resuelto'"
                  class="btn btn-success" 
                  :disabled="guardandoRespuesta || !ticketResponseText.trim()" 
                  @click="ejecutarRespuestaTicket"
                >
                  {{ guardandoRespuesta ? 'Enviando...' : '💬 Enviar Mensaje' }}
                </button>
              </div>
            </div>
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
  revokeSuperadmin,
  getTickets,
  updateTicketStatus,
  respondToTicket
} from '../services/adminService'
import { createGroup } from '../services/groupService'

const router = useRouter()
const activeTab = ref('groups')

const currentUser = ref({ name: '', email: '', role: 'superadmin' })
const isOwner = computed(() => currentUser.value.role === 'owner')

const groups = ref([])
const pendingUsers = ref([])
const superadmins = ref([])

// Estado para Tickets
const tickets = ref([])
const loadingTickets = ref(false)
const ticketFilter = ref('all')
const ticketSeleccionado = ref(null)
const ticketResponseText = ref('')
const guardandoRespuesta = ref(false)

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

// Computados para Tickets
const openTicketsCount = computed(() => {
  return tickets.value.filter(t => (t.status || 'open') === 'open' || t.status === 'pendiente').length
})

//contador tickets en progreso
const inProgressTicketsCount = computed(() => {
  return tickets.value.filter(t => t.status === 'in_progress' || t.status === 'en_curso').length
})


const filteredTickets = computed(() => {
  if (ticketFilter.value === 'all') return tickets.value
  if (ticketFilter.value === 'open') {
    return tickets.value.filter(t => (t.status || 'open') === 'open' || t.status === 'pendiente')
  }
  if (ticketFilter.value === 'in_progress') {
    return tickets.value.filter(t => t.status === 'in_progress' || t.status === 'en_curso')
  }
  if (ticketFilter.value === 'resolved') {
    return tickets.value.filter(t => t.status === 'resolved' || t.status === 'closed')
  }
  return tickets.value.filter(t => (t.status || 'open') === ticketFilter.value)
})

// Función segura para capturar el cambio del selector
const onChangeStatus = async (ticket, event) => {
  const newStatus = event.target.value
  await handleStatusChange(ticket.id, newStatus)
}

const onChangeStatusModal = async (ticket, event) => {
  const newStatus = event.target.value
  await handleStatusChange(ticket.id, newStatus)
  if (ticketSeleccionado.value && ticketSeleccionado.value.id === ticket.id) {
    ticketSeleccionado.value.status = newStatus
  }
}

const loadData = async () => {
  const session = localStorage.getItem('userSession')
  if (session) {
    try {
      currentUser.value = JSON.parse(session)
    } catch (e) {}
  }

  // Si no es owner y estaba en pestañas restringidas, redirigir a grupos
  if (!isOwner.value && (activeTab.value === 'superadmins' || activeTab.value === 'tickets')) {
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

  // Cargar datos restringidos ÚNICAMENTE si es el Owner
  if (isOwner.value) {
    loadingSuperadmins.value = true
    try {
      superadmins.value = await getSuperadmins()
    } catch (e) { console.error(e) }
    finally { loadingSuperadmins.value = false }

    loadingTickets.value = true
    try {
      tickets.value = await getTickets()
    } catch (e) { console.error(e) }
    finally { loadingTickets.value = false }
  }
}

onMounted(() => {
  loadData()
})

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getStatusLabel = (status) => {
  const labels = {
    open: '🟡 Abierto',
    pendiente: '🟡 Abierto',
    in_progress: '🔵 En proceso',
    en_curso: '🔵 En proceso',
    resolved: '🟢 Resuelto',
    resuelto: '🟢 Resuelto',
    closed: '⚪ Cerrado',
    descartado: '⚪ Cerrado'
  }
  return labels[status] || status
}

const showFeedback = (msg) => {
  feedbackMsg.value = msg
  setTimeout(() => { feedbackMsg.value = '' }, 3500)
}

// Métodos para la gestión de Tickets
const handleStatusChange = async (ticketId, newStatus) => {
  try {
    await updateTicketStatus(ticketId, newStatus)
    showFeedback(`✨ Estado del ticket #${ticketId} actualizado.`)
    const ticket = tickets.value.find(t => t.id === ticketId)
    if (ticket) ticket.status = newStatus
  } catch (e) {
    console.error('Error detallado al actualizar estado:', e)
    showFeedback('❌ Error al actualizar el estado del ticket.')
  }
}

const abrirModalResponderTicket = (ticket) => {
  ticketSeleccionado.value = ticket
  ticketResponseText.value = ''
}

const ejecutarRespuestaTicket = async () => {
  if (!ticketSeleccionado.value || !ticketResponseText.value.trim()) return
  guardandoRespuesta.value = true
  try {
    // 1. Enviar el mensaje al hilo como owner
    const newReply = await respondToTicket(ticketSeleccionado.value.id, {
      message: ticketResponseText.value.trim()
    })

    showFeedback(`✨ Mensaje enviado en el ticket #${ticketSeleccionado.value.id}.`)
    
    // Añadir localmente la respuesta al hilo visible
    if (!ticketSeleccionado.value.replies) ticketSeleccionado.value.replies = []
    ticketSeleccionado.value.replies.push(newReply)

    ticketResponseText.value = ''
    await loadData()
  } catch (e) {
    console.error('Detalle del error:', e.response?.data?.detail || e)
    showFeedback('❌ Error al responder el ticket.')
  } finally {
    guardandoRespuesta.value = false
  }
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

// Función para formatear el tipo de ticket con su emoticono
const getTicketTypeLabel = (type) => {
  const types = {
    incidencia: '🔴 incidencia',
    mejora: '💡 mejora',
    sugerencia: '✨ sugerencia',
    duda: '❓ duda'
  }
  return types[type] || `📌 ${type || 'General'}`
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
  display: block;
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

/* Estilos de la Pestaña de Tickets */
.tickets-filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.filter-btn.active {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border-color: rgba(52, 152, 219, 0.4);
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-card {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.ticket-id {
  font-family: monospace;
  color: #ffd166;
  font-weight: bold;
  font-size: 0.85rem;
}

.ticket-title {
  margin: 0.2rem 0;
  color: #fff;
  font-size: 1.1rem;
}

.status-badge {
  padding: 0.3rem 0.7rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.open { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
.status-badge.in_progress { background: rgba(52, 152, 219, 0.2); color: #3498db; }
.status-badge.resolved { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.status-badge.closed { background: rgba(149, 165, 166, 0.2); color: #95a5a6; }

.ticket-body {
  margin: 1rem 0;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.8rem 1rem;
  border-radius: 10px;
}

.ticket-description {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.select-field {
  background: #1e1e1e;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.ticket-modal {
  max-width: 550px;
  width: 92%;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1.8rem;
  border-radius: 20px;
}

.ticket-detail-info p {
  margin: 0.3rem 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.detail-box {
  background: rgba(0, 0, 0, 0.25);
  padding: 0.8rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-box label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 0.3rem;
}

.description-text {
  margin: 0;
  font-size: 0.9rem;
  color: #eee;
}

.textarea-field {
  resize: vertical;
  min-height: 90px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary { background: #ffd166; color: #121212; width: 100%; padding: 0.8rem; }
.btn.primary-sm { background: rgba(255, 209, 102, 0.2); color: #ffd166; border: 1px solid rgba(255, 209, 102, 0.3); }
.btn.success-sm { background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
.btn.danger-sm { background: rgba(231, 76, 60, 0.2); color: #ff6b6b; border: 1px solid rgba(231, 76, 60, 0.3); }
.btn.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ccc; }
.btn.btn-success { background: #2ecc71; color: #121212; }
.btn.btn-danger { background: #e74c3c; color: white; }

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
.chat-thread {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 280px;
  overflow-y: auto;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chat-bubble {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  max-width: 85%;
  font-size: 0.88rem;
  line-height: 1.35;
}

.chat-bubble.user-bubble {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.chat-bubble.admin-bubble {
  align-self: flex-end;
  background: rgba(255, 209, 102, 0.15);
  border: 1px solid rgba(255, 209, 102, 0.3);
  color: #ffd166;
}

.chat-author {
  display: block;
  font-size: 0.72rem;
  font-weight: bold;
  margin-bottom: 0.2rem;
  opacity: 0.8;
}

.chat-date {
  display: block;
  font-size: 0.68rem;
  margin-top: 0.3rem;
  opacity: 0.5;
  text-align: right;
}

.closed-notice {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>