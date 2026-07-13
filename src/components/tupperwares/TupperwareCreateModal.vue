<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect tupper-modal">
        <div class="modal-header">
          <h2>🍱 Registrar Tupper</h2>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="modal-label">¿Qué comida es?</label>
            <input 
              v-model="nuevoTupper.title" 
              type="text" 
              placeholder="Ej: Lentejas con arroz" 
              class="modal-input"
              :disabled="loading"
            />
          </div>

          <div class="form-row mt-4">
            <div class="form-group flex-1">
              <label class="modal-label">Raciones iniciales</label>
              <input 
                v-model.number="nuevoTupper.servings" 
                type="number" 
                min="1" 
                class="modal-input"
                :disabled="loading"
              />
            </div>
            
            <div class="form-group flex-2">
              <label class="modal-label">¿Dónde está guardado?</label>
              <select v-model="nuevoTupper.location" class="modal-select" :disabled="loading">
                <option value="Congelador">❄️ Congelador</option>
                <option value="Nevera">🥦 Nevera</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="loading" @click="$emit('close')">Cancelar</button>
          <button 
            class="btn btn-primary" 
            :disabled="loading || !nuevoTupper.title.trim() || nuevoTupper.servings < 1" 
            @click="handleSave"
          >
            {{ loading ? 'Guardando...' : 'Guardar Comida' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean
})

const emit = defineEmits(['close', 'create'])

const nuevoTupper = ref({ title: '', servings: 1, location: 'Congelador' })

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nuevoTupper.value = { title: '', servings: 1, location: 'Congelador' }
  }
})

const handleSave = () => {
  if (nuevoTupper.value.title.trim() && nuevoTupper.value.servings >= 1) {
    emit('create', { ...nuevoTupper.value })
  }
}
</script>

<style scoped>
@import '../../assets/styles/modal-shared.css';
.tupper-modal { max-width: 420px; width: 92%; text-align: left; background-color: #333; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.modal-select {
  width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px; color: white; padding: 0.75rem; font-family: inherit; font-size: 0.95rem; outline: none; appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem; padding-right: 2rem;
}
.modal-select:focus { border-color: #ffd166; }
.modal-select option { background: #1e1e24; color: white; }
</style>