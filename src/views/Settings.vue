<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { createGroup, joinGroup } from '../services/groupService'
import { pingGroupDevice } from '../utils/deviceTracker'
import FeedbackModal from '../components/tickets/FeedbackModal.vue'
import { getGroupTickets, replyToTicket } from '../services/feedbackService.js'

// Estados de Grupo
const groupName = ref('')
const inviteCode = ref('') 
const currentGroup = ref(null)
const isCreating = ref(false)
const isJoining = ref(false) 
const errorMsg = ref('')
const isSuperAdmin = ref(false)

// Estados de Feedback / Incidencias
const isModalOpen = ref(false)
const tickets = ref([])
const loadingTickets = ref(true)

// Estado para respuestas de tickets
const ticketSeleccionado = ref(null)
const userReplyText = ref('')
const enviandoRespuesta = ref(false)
const draftReplies = reactive({})
const sendingReplyId = ref(null)

// Mensaje de éxito/notificación
const successBannerMsg = ref('')

const adminLinkTarget = computed(() => isSuperAdmin.value ? '/admin-dashboard' : '/super-login')

onMounted(() => {
  const savedGroup = localStorage.getItem('kitchenGroup')
  if (savedGroup) {
    currentGroup.value = JSON.parse(savedGroup)
    if (currentGroup.value?.id) {
      pingGroupDevice(currentGroup.value.id)
      cargarTickets()
    } else {
      loadingTickets.value = false
    }
  } else {
    loadingTickets.value = false
  }

  const userSession = localStorage.getItem('userSession')
  if (userSession) {
    const user = JSON.parse(userSession)
    isSuperAdmin.value = user.role === 'superadmin' || user.role === 'owner' || user.isSuperAdmin === true
  } else {
    isSuperAdmin.value = false 
  }
})

// Cargar tickets del grupo
const cargarTickets = async () => {
  if (!currentGroup.value?.id) return
  loadingTickets.value = true
  try {
    tickets.value = await getGroupTickets(currentGroup.value.id)
  } catch (e) {
    console.error("Error cargando tickets:", e)
  } finally {
    loadingTickets.value = false
  }
}

// Función para mostrar notificación temporal en pantalla
const handleNotification = (message) => {
  successBannerMsg.value = message
  setTimeout(() => {
    successBannerMsg.value = ''
  }, 4000)
}

const handleCreateGroup = async () => {
  if (!groupName.value || !isSuperAdmin.value) return
  isCreating.value = true
  errorMsg.value = ''
  try {
    const newGroup = await createGroup(groupName.value)
    currentGroup.value = newGroup
    localStorage.setItem('kitchenGroup', JSON.stringify(newGroup))
    groupName.value = ''
    cargarTickets()
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
    cargarTickets()
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
  tickets.value = []
}

// Helpers para badges y estados
const getTypeBadge = (type) => {
  const map = { incidencia: '🔴', mejora: '💡', sugerencia: '✨', duda: '❓' }
  return map[type] || '📌'
}

const getStatusLabel = (status) => {
  const map = {
    pendiente: '🟡 Recibido',
    open: '🟡 Recibido',
    en_curso: '🔵 En revisión',
    in_progress: '🔵 En revisión',
    resuelto: '🟢 Solucionado',
    resolved: '🟢 Solucionado',
    descartado: '⚪ Archivado',
    closed: '⚪ Archivado'
  }
  return map[status] || status
}

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const isTicketClosedOrResolved = (status) => {
  return status === 'resuelto' || status === 'resolved' || status === 'descartado' || status === 'closed'
}

const abrirHiloTicket = (ticket) => {
  ticketSeleccionado.value = ticket
  userReplyText.value = ''
}

const enviarRespuestaUsuario = async () => {
  if (!ticketSeleccionado.value || !userReplyText.value.trim()) return
  enviandoRespuesta.value = true
  try {
    const newReply = await replyToTicket(ticketSeleccionado.value.id, userReplyText.value.trim())
    if (!ticketSeleccionado.value.replies) {
      ticketSeleccionado.value.replies = []
    }
    ticketSeleccionado.value.replies.push(newReply)
    userReplyText.value = ''
    handleNotification('✨ Respuesta enviada correctamente.')
    await cargarTickets()
  } catch (err) {
    console.error("Error al enviar la respuesta:", err)
    alert("Hubo un error al enviar tu respuesta. Por favor inténtalo de nuevo.")
  } finally {
    enviandoRespuesta.value = false
  }
}

const enviarRespuestaInline = async (ticket) => {
  const text = (draftReplies[ticket.id] || '').trim()
  if (!text) return
  
  sendingReplyId.value = ticket.id
  try {
    const newReply = await replyToTicket(ticket.id, text)
    if (!ticket.replies) {
      ticket.replies = []
    }
    ticket.replies.push(newReply)
    draftReplies[ticket.id] = ''
    handleNotification('✨ Respuesta enviada al desarrollador.')
    await cargarTickets()
  } catch (err) {
    console.error("Error al enviar la respuesta:", err)
    alert("Hubo un error al enviar tu respuesta. Por favor inténtalo de nuevo.")
  } finally {
    sendingReplyId.value = null
  }
}
</script>

<template>
  <div class="settings-wrapper">

    <!-- BANNER TEMPORAL DE ÉXITO -->
    <Transition name="fade">
      <div v-if="successBannerMsg" class="success-toast">
        {{ successBannerMsg }}
      </div>
    </Transition>

    <div class="view-container">
      <header class="top-header">
        <h1>Ajustes de Grupo</h1>
      </header>
      <main class="settings-content">
        <!-- SECCIÓN MI GRUPO -->
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

        <!-- SECCIÓN DE INCIDENCIAS Y SUGERENCIAS -->
        <section v-if="currentGroup" class="card glass-effect mt-6">
          <div class="section-header">
            <div>
              <h2>💬 Ayuda y Sugerencias</h2>
              <p class="subtitle">¿Has encontrado un fallo o tienes una idea para mejorar la app?</p>
            </div>
            <button @click="isModalOpen = true" class="btn primary btn-feedback mt-2" style="background-color: #f1b818;">
              💬 Enviar Comentario
            </button>
          </div>

          <!-- LISTADO DE TICKETS DEL GRUPO -->
          <div class="tickets-container mt-4">
            <h3>Historial de solicitudes</h3>
            
            <div v-if="loadingTickets" class="loading-text">Cargando solicitudes...</div>
            
            <div v-else-if="tickets.length === 0" class="empty-tickets">
              Aún no has enviado ninguna sugerencia o incidencia.
            </div>

            <div v-else class="tickets-list">
              <div v-for="ticket in tickets" :key="ticket.id" class="ticket-card">
                <div class="ticket-header">
                  <span class="ticket-type">{{ getTypeBadge(ticket.type) }} {{ ticket.title }}</span>
                  <span class="status-badge" :class="ticket.status">{{ getStatusLabel(ticket.status) }}</span>
                </div>
                
                <!-- Hilo del chat dentro de la tarjeta -->
                <div class="chat-thread mt-2">
                  <div class="chat-bubble user-bubble">
                    <span class="chat-author">👤 Tu grupo (Reporte inicial)</span>
                    <p>{{ ticket.description }}</p>
                    <span class="chat-date" v-if="ticket.created_at">{{ formatDate(ticket.created_at) }}</span>
                  </div>

                  <div 
                    v-for="reply in (ticket.replies || [])" 
                    :key="reply.id" 
                    :class="['chat-bubble', reply.sender_type === 'owner' ? 'admin-bubble' : 'user-bubble']"
                  >
                    <span class="chat-author">
                      {{ reply.sender_type === 'owner' ? '👨‍💻 Soporte / Desarrollador' : '👤 Tu grupo' }}
                    </span>
                    <p>{{ reply.message }}</p>
                    <span class="chat-date" v-if="reply.created_at">{{ formatDate(reply.created_at) }}</span>
                  </div>
                </div>

                <!-- Caja de respuesta directa si el ticket está abierto -->
                <div v-if="!isTicketClosedOrResolved(ticket.status)" class="reply-box mt-3">
                  <textarea 
                    v-model="draftReplies[ticket.id]" 
                    placeholder="Responde al soporte si deseas añadir más datos o consultar una duda..." 
                    class="input-field textarea-field"
                    rows="2"
                  ></textarea>
                  <button 
                    @click="enviarRespuestaInline(ticket)" 
                    class="btn primary-sm mt-2" 
                    :disabled="sendingReplyId === ticket.id || !(draftReplies[ticket.id] && draftReplies[ticket.id].trim())"
                  >
                    <span v-if="sendingReplyId === ticket.id">Enviando...</span>
                    <span v-else>🚀 Enviar Respuesta</span>
                  </button>
                </div>
                <div v-else class="closed-notice mt-2">
                  🔒 Incidencia {{ getStatusLabel(ticket.status) }}. No se pueden enviar más mensajes en este hilo.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- MODAL PARA CREAR NUEVO TICKET -->
    <FeedbackModal 
      :is-open="isModalOpen" 
      :group-id="currentGroup?.id" 
      @close="isModalOpen = false"
      @ticket-created="cargarTickets"
      @notify="handleNotification"
    />

    <!-- MODAL DE HILO DE CONVERSACIÓN DE TICKET -->
    <Transition name="fade">
      <div v-if="ticketSeleccionado" class="modal-overlay" @click.self="ticketSeleccionado = null">
        <div class="modal-card glass-effect ticket-chat-modal">
          <header class="modal-header">
            <h2>💬 Ticket #{{ ticketSeleccionado.id }}: {{ ticketSeleccionado.title }}</h2>
            <button class="btn-close" @click="ticketSeleccionado = null">✕</button>
          </header>

          <div class="modal-body">
            <div class="status-info mb-3">
              <span class="info-label">Estado actual: </span>
              <span class="status-badge" :class="ticketSeleccionado.status">
                {{ getStatusLabel(ticketSeleccionado.status) }}
              </span>
            </div>

            <!-- Hilo del chat -->
            <div class="chat-thread mt-2">
              <!-- Reporte inicial -->
              <div class="chat-bubble user-bubble">
                <span class="chat-author">👤 Tu grupo (Reporte inicial)</span>
                <p>{{ ticketSeleccionado.description }}</p>
                <span class="chat-date" v-if="ticketSeleccionado.created_at">{{ formatDate(ticketSeleccionado.created_at) }}</span>
              </div>

              <!-- Mensajes del hilo -->
              <div 
                v-for="reply in (ticketSeleccionado.replies || [])" 
                :key="reply.id" 
                :class="['chat-bubble', reply.sender_type === 'owner' ? 'admin-bubble' : 'user-bubble']"
              >
                <span class="chat-author">
                  {{ reply.sender_type === 'owner' ? '👨‍💻 Soporte / Desarrollador' : '👤 Tu grupo' }}
                </span>
                <p>{{ reply.message }}</p>
                <span class="chat-date" v-if="reply.created_at">{{ formatDate(reply.created_at) }}</span>
              </div>
            </div>

            <!-- Formulario para enviar respuesta -->
            <div v-if="!isTicketClosedOrResolved(ticketSeleccionado.status)" class="reply-box mt-3">
              <label class="form-label">Escribir respuesta al desarrollador:</label>
              <textarea 
                v-model="userReplyText" 
                placeholder="Escribe tu respuesta o duda adicional aquí..." 
                class="input-field textarea-field"
                rows="3"
              ></textarea>
              <button 
                @click="enviarRespuestaUsuario" 
                class="btn primary mt-2" 
                :disabled="enviandoRespuesta || !userReplyText.trim()"
              >
                <span v-if="enviandoRespuesta">Enviando...</span>
                <span v-else>🚀 Enviar Respuesta</span>
              </button>
            </div>
            <div v-else class="closed-notice mt-3">
              🔒 Esta incidencia ha sido resuelta o archivada. No se pueden enviar más mensajes en este hilo.
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="admin-access mt-4">
      <router-link :to="adminLinkTarget" class="admin-link">🔐 Acceso Administración</router-link>
    </div>

  </div>
</template>

<style scoped>
/* Estilos para el aviso flotante de éxito */
.success-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2e7d32;
  color: white;
  padding: 0.8rem 1.4rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  z-index: 2000;
  text-align: center;
  border: 1px solid #4caf50;
}

/* Transiciones CSS para la alerta */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

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
  background: var(--primary-color, #f1b818);
  color: black;
}
.btn.primary-sm {
  background: var(--primary-color, #f1b818);
  color: black;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  width: auto;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.btn.primary-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.secondary {
  background: var(--surface-light, rgba(255, 255, 255, 0.1));
  color: var(--text-color, white);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
}
.btn.danger {
  background: #e74c3c;
  color: white;
}
.btn-feedback {
  max-width: 220px;
  background-color: #f1b818;
}

.input-field {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
  background: var(--bg-color, rgba(0, 0, 0, 0.2));
  color: var(--text-color, white);
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}
.invite-code {
  background: var(--surface-light, rgba(255, 255, 255, 0.1));
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-size: 1.1rem;
  letter-spacing: 1px;
}
.success-text {
  color: var(--primary-color, #f1b818);
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.error-text {
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

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
  text-align: center;
  margin: 1.5rem 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
}

.uppercase-input {
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
}

.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }

/* Estilos de Incidencias / Feedback */
.subtitle { color: #aaa; font-size: 0.85rem; margin-top: 0.2rem; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
.tickets-container h3 { font-size: 1rem; color: #ddd; margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.4rem; }
.empty-tickets, .loading-text { color: #888; font-size: 0.85rem; font-style: italic; }

.tickets-list { display: flex; flex-direction: column; gap: 0.8rem; }
.ticket-card { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.9rem; }

.ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.ticket-type { font-weight: 600; font-size: 0.95rem; color: white; }

.status-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 600; background: rgba(255,255,255,0.1); }
.status-badge.pendiente, .status-badge.open { color: #ffca28; background: rgba(255, 202, 40, 0.15); }
.status-badge.en_curso, .status-badge.in_progress { color: #29b6f6; background: rgba(41, 182, 246, 0.15); }
.status-badge.resuelto, .status-badge.resolved { color: #66bb6a; background: rgba(102, 187, 106, 0.15); }
.status-badge.descartado, .status-badge.closed { color: #aaa; background: rgba(255, 255, 255, 0.1); }

.ticket-desc { color: #ccc; font-size: 0.85rem; margin: 0; line-height: 1.3; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
}
.modal-card {
  width: 100%; max-width: 520px; background: #1e1e24; border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px; color: white; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  max-height: 90vh; overflow-y: auto;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.modal-header h2 { font-size: 1.15rem; margin: 0; }
.btn-close { background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer; }
.btn-close:hover { color: white; }
.btn-chat-trigger {
  font-size: 0.82rem;
  padding: 0.5rem 0.8rem;
  width: auto;
}
.textarea-field {
  min-height: 80px;
  resize: vertical;
}

.replies-box { margin-top: 0.8rem; padding-top: 0.6rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 0.5rem; }
.reply-item { font-size: 0.8rem; padding: 0.5rem 0.8rem; border-radius: 8px; }
.reply-item.owner { background: rgba(241, 184, 24, 0.15); color: #ffe082; }
.reply-item.user { background: rgba(255, 255, 255, 0.05); color: #ccc; }
.reply-item p { margin: 0.2rem 0 0 0; }

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