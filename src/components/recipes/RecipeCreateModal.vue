<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content glass-effect modal-card recipe-modal">
        <div class="modal-header">
          <h2>Añadir Nueva Receta</h2>
        </div>

        <!-- Selector de Modo: Manual vs Generar con IA -->
        <div class="mode-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: modo === 'manual' }" 
            :disabled="guardando || generandoIA"
            @click="modo = 'manual'"
          >
            ✍️ Manual
          </button>
          <button 
            class="tab-btn ai-tab" 
            :class="{ active: modo === 'ia' }" 
            :disabled="guardando || generandoIA"
            @click="modo = 'ia'"
          >
            ✨ Generar con IA
          </button>
        </div>
        
        <div class="modal-body">
          <!-- SECCIÓN IA -->
          <div v-if="modo === 'ia'" class="ai-box">
            <label class="modal-label">¿Qué quieres cocinar hoy?</label>
            <div class="ai-input-group">
              <input 
                v-model="promptIA" 
                type="text" 
                placeholder="Ej: Tarta de queso para 8 personas sin horno" 
                class="modal-input"
                :disabled="generandoIA || guardando"
                @keyup.enter="handleGenerarIA"
              />
              <button 
                class="btn btn-ai" 
                :disabled="generandoIA || !promptIA.trim() || guardando" 
                @click="handleGenerarIA"
              >
                {{ generandoIA ? 'Pensando...' : '✨ Generar' }}
              </button>
            </div>
            <p v-if="errorIA" class="error-text">{{ errorIA }}</p>
          </div>

          <!-- FORMULARIO DE RECETA -->
          <div class="form-group mt-3">
            <label class="modal-label">Título de la receta</label>
            <input 
              v-model="nuevaReceta.title" 
              type="text" 
              placeholder="Ej: Lasaña de carne" 
              class="modal-input"
              :disabled="guardando || generandoIA"
              @keyup.enter="handleCrear"
            />
          </div>

          <!-- 🆕 Selector de Etiquetas -->
          <div class="form-group mt-3">
            <label class="modal-label">Etiquetas</label>
            <div class="tags-selector">
              <button
                v-for="tag in AVAILABLE_TAGS"
                :key="tag.id"
                type="button"
                class="tag-chip"
                :class="{ selected: nuevaReceta.tags.includes(tag.id) }"
                :disabled="guardando || generandoIA"
                @click="toggleTag(tag.id)"
              >
                {{ tag.icon }} {{ tag.label }}
              </button>
            </div>
          </div>

          <div class="form-group mt-4">
            <label class="modal-label">Instrucciones / Pasos de preparación</label>
            <textarea 
              v-model="nuevaReceta.instructions" 
              placeholder="🛒 INGREDIENTES...&#10;&#10;👨‍🍳 PREPARACIÓN...&#10;Paso 1. Hervir la pasta..." 
              class="modal-textarea"
              rows="8"
              :disabled="guardando || generandoIA"
            ></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary cancel-btn" :disabled="guardando || generandoIA" @click="cerrarModal">
            Cancelar
          </button>
          <button 
            class="btn btn-primary save-btn" 
            :disabled="guardando || generandoIA || !nuevaReceta.title.trim()" 
            @click="handleCrear"
          >
            {{ guardando ? 'Guardando...' : 'Guardar Receta' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AVAILABLE_TAGS } from '../../utils/tags'

const props = defineProps({
  isOpen: Boolean,
  guardando: Boolean,
  groupId: { type: [Number, String], required: true }
})

const emit = defineEmits(['close', 'create'])

const modo = ref('manual')
const promptIA = ref('')
const generandoIA = ref(false)
const errorIA = ref('')

const nuevaReceta = ref({ title: '', instructions: '', tags: [] })

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    modo.value = 'manual'
    promptIA.value = ''
    errorIA.value = ''
    generandoIA.value = false
    nuevaReceta.value = { title: '', instructions: '', tags: [] }
  }
})

const toggleTag = (tagId) => {
  const index = nuevaReceta.value.tags.indexOf(tagId)
  if (index === -1) {
    nuevaReceta.value.tags.push(tagId)
  } else {
    nuevaReceta.value.tags.splice(index, 1)
  }
}

const handleGenerarIA = async () => {
  if (!promptIA.value.trim() || generandoIA.value) return

  generandoIA.value = true
  errorIA.value = ''

  try {
    const res = await fetch(`/api/groups/${props.groupId}/ai/generate-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptIA.value })
    })

    if (!res.ok) {
      throw new Error('No se pudo generar la receta. Inténtalo de nuevo.')
    }

    const data = await res.json()
    nuevaReceta.value.title = data.title
    nuevaReceta.value.instructions = data.instructions
    if (data.tags && Array.isArray(data.tags)) {
      nuevaReceta.value.tags = data.tags
    }
  } catch (err) {
    errorIA.value = err.message || 'Error al conectar con el servidor de IA.'
  } finally {
    generandoIA.value = false
  }
}

const handleCrear = () => {
  if (nuevaReceta.value.title.trim()) {
    emit('create', { ...nuevaReceta.value })
  }
}

const cerrarModal = () => {
  if (!generandoIA.value && !props.guardando) {
    emit('close')
  }
}
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';

.recipe-modal { 
  max-width: 520px; 
  width: 92%; 
  text-align: left; 
  background-color: #1f2937; 
}

.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #374151;
  color: #ffffff;
}

.ai-tab.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.ai-box {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  padding: 0.85rem;
  margin-bottom: 1rem;
}

.ai-input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.btn-ai {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.15s ease;
}

.btn-ai:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-ai:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* 🆕 Selector de Chips de Tags */
.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-height: 140px;
  overflow-y: auto;
  padding: 0.4rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tag-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #d1d5db;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-chip:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.tag-chip.selected {
  background: #f1b818;
  color: #000;
  font-weight: bold;
  border-color: #f1b818;
}
</style>