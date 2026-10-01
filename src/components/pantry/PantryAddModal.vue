<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect add-modal-card">
        <header class="modal-header">
          <h3>{{ itemToEdit ? '✏️ Editar artículo' : '➕ Añadir a la Despensa' }}</h3>
          <button class="btn-close-x" @click="$emit('close')">✕</button>
        </header>

        <div class="form-body">
          <div class="form-group">
            <label class="form-label">Nombre del artículo *</label>
            <input v-model="form.name" type="text" class="modal-input" placeholder="Ej: Arroz, Aceite de oliva..." @keyup.enter="handleSave" />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Cantidad</label>
              <input v-model.number="form.quantity" type="number" min="0.5" step="0.5" class="modal-input" />
            </div>
            <div class="form-group" style="width: 90px;">
              <label class="form-label">Unidad</label>
              <select v-model="form.unit" class="modal-input modal-select">
                <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select v-model="form.category_id" class="modal-input modal-select">
              <option :value="null">Sin categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Fecha de compra (opcional)</label>
            <input v-model="form.purchased_at" type="date" class="modal-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Notas (opcional)</label>
            <input v-model="form.notes" type="text" class="modal-input" placeholder="Ej: marca preferida, caduca pronto..." />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="guardando" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando || !form.name.trim()" @click="handleSave">
            {{ guardando ? 'Guardando...' : (itemToEdit ? '✅ Guardar' : '✅ Añadir') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const UNITS = ['ud', 'kg', 'g', 'L', 'ml', 'bote', 'paquete', 'lata', 'bolsa', 'docena']

const props = defineProps({
  isOpen: Boolean,
  categories: { type: Array, default: () => [] },
  guardando: Boolean,
  itemToEdit: { type: Object, default: null }
})

const emit = defineEmits(['close', 'add', 'save'])

const defaultForm = () => ({
  name: '',
  quantity: 1,
  unit: 'ud',
  category_id: null,
  purchased_at: '',
  notes: ''
})

const form = ref(defaultForm())

watch([() => props.isOpen, () => props.itemToEdit], () => {
  if (props.isOpen) {
    if (props.itemToEdit) {
      form.value = {
        name: props.itemToEdit.name || '',
        quantity: Number(props.itemToEdit.quantity) || 1,
        unit: props.itemToEdit.unit || 'ud',
        category_id: props.itemToEdit.category_id || null,
        purchased_at: props.itemToEdit.purchased_at ? props.itemToEdit.purchased_at.substring(0, 10) : '',
        notes: props.itemToEdit.notes || ''
      }
    } else {
      form.value = defaultForm()
    }
  }
}, { immediate: true })

const handleSave = () => {
  if (!form.value.name.trim()) return
  const itemData = {
    name: form.value.name.trim(),
    quantity: form.value.quantity || 1,
    unit: form.value.unit || 'ud',
    category_id: form.value.category_id || null,
    purchased_at: form.value.purchased_at || null,
    notes: form.value.notes ? form.value.notes.trim() : null
  }
  if (props.itemToEdit) {
    emit('save', { id: props.itemToEdit.id, ...itemData })
  } else {
    emit('add', itemData)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem; box-sizing: border-box;
}
.add-modal-card {
  width: 100%; max-width: 440px;
  padding: 1.5rem; border-radius: 16px;
  background: #222228; border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  display: flex; flex-direction: column; gap: 0;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h3 { margin: 0; color: #f1b818; font-size: 1.1rem; }
.btn-close-x { background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer; }
.btn-close-x:hover { color: white; }

.form-body { display: flex; flex-direction: column; gap: 0.85rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-row { display: flex; gap: 0.75rem; align-items: flex-end; }
.flex-1 { flex: 1; }
.form-label { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; }

.modal-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px; color: #fff;
  padding: 0.6rem 0.8rem; font-size: 0.9rem;
  outline: none; box-sizing: border-box; width: 100%;
}
.modal-input:focus { border-color: #f1b818; }
.modal-select { cursor: pointer; }
.modal-select option { background: #222; }

input[type="date"].modal-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1rem; margin-top: 1.25rem;
}
.btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 0.9rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #ccc; }
.btn-primary { background: #f1b818; color: black; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
