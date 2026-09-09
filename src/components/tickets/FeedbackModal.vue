<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card glass-effect">
      <header class="modal-header">
        <h2>📢 Enviar Sugerencia / Incidencia</h2>
        <button class="btn-close" @click="closeModal">✕</button>
      </header>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Selector de Tipo -->
        <div class="form-group">
          <label class="form-label">¿De qué se trata?</label>
          <div class="type-selector">
            <button 
              type="button"
              v-for="typeOption in types" 
              :key="typeOption.value"
              class="type-btn"
              :class="{ active: form.type === typeOption.value }"
              @click="form.type = typeOption.value"
            >
              <span class="type-icon">{{ typeOption.icon }}</span>
              <span class="type-label">{{ typeOption.label }}</span>
            </button>
          </div>
        </div>

        <!-- Título -->
        <div class="form-group">
          <label class="form-label" for="title">Resumen o título</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            placeholder="Ej. No puedo vaciar la lista de la compra" 
            class="input-field" 
            required
            maxlength="150"
          />
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label class="form-label" for="description">Explicación detallada</label>
          <textarea 
            id="description"
            v-model="form.description" 
            rows="4" 
            placeholder="Explica qué ha pasado o qué idea tienes para mejorar la app..." 
            class="input-field textarea-field" 
            required
          ></textarea>
        </div>

        <!-- Nombre / Apodo (Opcional) -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="reporter_name">Tu nombre / apodo (opcional)</label>
            <input 
              id="reporter_name"
              v-model="form.reporter_name" 
              type="text" 
              placeholder="Ej. Laura" 
              class="input-field" 
            />
          </div>

          <!-- Email (Opcional) -->
          <div class="form-group">
            <label class="form-label" for="reporter_email">Tu email (opcional)</label>
            <input 
              id="reporter_email"
              v-model="form.reporter_email" 
              type="email" 
              placeholder="Para avisarte al resolverlo" 
              class="input-field" 
            />
          </div>
        </div>

        <!-- Botones de Acción -->
        <footer class="modal-footer">
          <button type="button" @click="closeModal" class="btn btn-secondary" :disabled="sending">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="sending || !form.title || !form.description">
            <span v-if="sending">Enviando...</span>
            <span v-else>🚀 Enviar Reporte</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createTicket } from '../../services/feedbackService'

const props = defineProps({
  isOpen: Boolean,
  groupId: [Number, String]
})

// Añadimos 'notify' a los eventos emitidos
const emit = defineEmits(['close', 'ticket-created', 'notify'])
const route = useRoute()

const sending = ref(false)

const types = [
  { value: 'incidencia', label: 'Error', icon: '🔴' },
  { value: 'mejora', label: 'Mejora', icon: '💡' },
  { value: 'sugerencia', label: 'Idea', icon: '✨' },
  { value: 'duda', label: 'Duda', icon: '❓' }
]

const form = reactive({
  type: 'incidencia',
  title: '',
  description: '',
  reporter_name: '',
  reporter_email: ''
})

// Limpiar formulario al abrir
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.type = 'incidencia'
    form.title = ''
    form.description = ''
    form.reporter_name = ''
    form.reporter_email = ''
  }
})

const closeModal = () => {
  if (!sending.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  if (!props.groupId || !form.title || !form.description) return

  sending.value = true
  try {
    const payload = {
      type: form.type,
      title: form.title,
      description: form.description,
      reporter_name: form.reporter_name || null,
      reporter_email: form.reporter_email || null,
      device_info: `${navigator.userAgentData?.platform || navigator.platform} - ${navigator.userAgent}`,
      screen_origin: route.fullPath || window.location.pathname
    }

    await createTicket(props.groupId, payload)
    
    // 1. Notificar al padre (Settings) para refrescar la lista y mostrar el aviso
    emit('ticket-created')
    emit('notify', '🚀 ¡Solicitud enviada correctamente! Gracias por tus comentarios.')
    
    // 2. Cerrar el modal
    closeModal()
  } catch (error) {
    console.error("Error al enviar el ticket:", error)
    alert("Hubo un error al enviar tu reporte. Por favor inténtalo de nuevo.")
  } finally {
    sending.value = false
    closeModal()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
}

.modal-card {
  width: 100%; max-width: 500px; background: #1e1e24; border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px; color: white; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  max-height: 90vh; overflow-y: auto;
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.modal-header h2 { font-size: 1.25rem; margin: 0; }
.btn-close { background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer; }
.btn-close:hover { color: white; }

.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 0.4rem; font-weight: 500; }

.type-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.type-btn {
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px; padding: 0.5rem 0.2rem; color: white; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 0.2rem; transition: all 0.2s;
}
.type-btn.active { background: rgba(76, 175, 80, 0.2); border-color: #4caf50; font-weight: bold; }
.type-icon { font-size: 1.1rem; }
.type-label { font-size: 0.75rem; }

.input-field {
  width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15);
  color: white; font-size: 0.95rem; box-sizing: border-box; outline: none;
}
.input-field:focus { border-color: #f1b818; }
.textarea-field { resize: vertical; min-height: 90px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1.5rem; }
.btn { padding: 0.7rem 1.2rem; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ccc; }
.btn-primary { background: #f1b818; color: black; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
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