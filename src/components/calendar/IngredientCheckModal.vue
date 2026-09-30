<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass-effect check-modal-card">
        <!-- Cargando -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>🤖 Comprobando ingredientes con IA...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-state">
          <p class="error-icon">⚠️</p>
          <p class="error-msg">{{ error }}</p>
          <button @click="$emit('close')" class="btn btn-secondary">Cerrar</button>
        </div>

        <!-- Resultado -->
        <template v-else-if="result">
          <header class="modal-header">
            <div>
              <h3>🧑‍🍳 Comprobación de Despensa</h3>
              <p class="modal-subtitle">Receta: <strong>{{ recipeName }}</strong></p>
            </div>
            <button class="btn-close-x" @click="$emit('close')">✕</button>
          </header>

          <div class="results-scroll">
            <!-- Ingredientes disponibles -->
            <div v-if="result.ok && result.ok.length > 0" class="result-section ok-section">
              <h4 class="section-title">✅ Tienes en la despensa</h4>
              <div class="tags-list">
                <span v-for="ing in result.ok" :key="ing" class="tag ok-tag">{{ ing }}</span>
              </div>
            </div>

            <!-- Sustituciones posibles -->
            <div v-if="result.substitutes && result.substitutes.length > 0" class="result-section sub-section">
              <h4 class="section-title">💡 Posibles sustituciones</h4>
              <div class="sub-list">
                <div v-for="sub in result.substitutes" :key="sub.needed" class="sub-item">
                  <div class="sub-main">
                    <span class="sub-needed">{{ sub.needed }}</span>
                    <span class="sub-arrow">→</span>
                    <span class="sub-replace">{{ sub.substitute }}</span>
                  </div>
                  <p v-if="sub.note" class="sub-note">{{ sub.note }}</p>
                </div>
              </div>
            </div>

            <!-- Ingredientes faltantes -->
            <div v-if="result.missing && result.missing.length > 0" class="result-section missing-section">
              <h4 class="section-title">❌ Te faltan estos ingredientes</h4>
              <div class="missing-list">
                <div v-for="item in result.missing" :key="item.ingredient" class="missing-item">
                  <div class="missing-row">
                    <span class="missing-name">{{ item.ingredient }}</span>
                    <button
                      @click="addToShoppingList(item.ingredient)"
                      :disabled="addedToShop.includes(item.ingredient)"
                      class="btn-add-to-shop"
                    >
                      {{ addedToShop.includes(item.ingredient) ? '✅ Añadido' : '🛒 Añadir' }}
                    </button>
                  </div>
                  <p v-if="item.reason" class="missing-reason">{{ item.reason }}</p>
                </div>
              </div>
            </div>

            <!-- Todo OK -->
            <div v-if="(!result.missing || result.missing.length === 0) && (!result.substitutes || result.substitutes.length === 0)" class="all-ok-state">
              <p class="all-ok-icon">🎉</p>
              <p class="all-ok-msg">¡Tienes todos los ingredientes! Puedes cocinar esta receta sin ir a la compra.</p>
            </div>
          </div>

          <div class="modal-actions">
            <button
              v-if="result.missing && result.missing.length > 0 && pendingToAdd.length > 0"
              @click="addAllMissing"
              :disabled="addingAll"
              class="btn btn-warning"
            >
              {{ addingAll ? 'Añadiendo...' : `🛒 Añadir todo lo que falta (${pendingToAdd.length})` }}
            </button>
            <button @click="$emit('close')" class="btn btn-secondary">Cerrar</button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { addToShoppingList as addItemToShop } from '../../services/shoppingService'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  error: { type: String, default: null },
  result: { type: Object, default: null },
  recipeName: { type: String, default: '' },
  groupId: { type: Number, default: null },
  defaultCategoryId: { type: Number, default: null }
})

const emit = defineEmits(['close'])

const addedToShop = ref([])
const addingAll = ref(false)

watch(() => props.isOpen, (val) => {
  if (val) addedToShop.value = []
})

const pendingToAdd = computed(() => {
  if (!props.result?.missing) return []
  return props.result.missing
    .map(m => m.ingredient)
    .filter(ing => !addedToShop.value.includes(ing))
})

const addToShoppingList = async (ingredient) => {
  if (!props.groupId) return
  try {
    await addItemToShop(props.groupId, {
      ingredient_name: ingredient,
      category_id: props.defaultCategoryId || 1,
      quantity: 1,
      unit: 'ud'
    })
    addedToShop.value.push(ingredient)
  } catch (e) {
    console.error('Error añadiendo a la compra:', e)
  }
}

const addAllMissing = async () => {
  addingAll.value = true
  try {
    for (const ing of pendingToAdd.value) {
      await addToShoppingList(ing)
    }
  } finally {
    addingAll.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1100; padding: 1rem; box-sizing: border-box;
}

.check-modal-card {
  width: 100%; max-width: 500px; max-height: 85vh;
  padding: 1.5rem; border-radius: 18px;
  background: #1a1a22; border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  display: flex; flex-direction: column;
}

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; }
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #f1b818;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state p { color: rgba(255,255,255,0.7); font-size: 0.95rem; }

/* Error */
.error-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem; text-align: center; }
.error-icon { font-size: 2rem; margin: 0; }
.error-msg { color: #ff6b6b; margin: 0; }

/* Header */
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.modal-header h3 { margin: 0 0 0.2rem; color: #f1b818; font-size: 1.15rem; }
.modal-subtitle { margin: 0; font-size: 0.82rem; color: rgba(255,255,255,0.5); }
.btn-close-x { background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer; flex-shrink: 0; }
.btn-close-x:hover { color: white; }

.results-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding-right: 0.2rem; }

.result-section { border-radius: 10px; padding: 0.85rem; }
.section-title { margin: 0 0 0.6rem; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

/* OK */
.ok-section { background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.2); }
.ok-section .section-title { color: #81c784; }
.tags-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.ok-tag { font-size: 0.82rem; background: rgba(76,175,80,0.15); color: #a5d6a7; border: 1px solid rgba(76,175,80,0.3); padding: 0.2rem 0.55rem; border-radius: 6px; }

/* Sustituciones */
.sub-section { background: rgba(33,150,243,0.08); border: 1px solid rgba(33,150,243,0.2); }
.sub-section .section-title { color: #64b5f6; }
.sub-list { display: flex; flex-direction: column; gap: 0.5rem; }
.sub-item { }
.sub-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.sub-needed { color: #ff9800; font-size: 0.88rem; font-weight: 600; }
.sub-arrow { color: rgba(255,255,255,0.3); }
.sub-replace { color: #81c784; font-size: 0.88rem; font-weight: 600; }
.sub-note { margin: 0.2rem 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.4); }

/* Faltantes */
.missing-section { background: rgba(244,67,54,0.07); border: 1px solid rgba(244,67,54,0.2); }
.missing-section .section-title { color: #ef9a9a; }
.missing-list { display: flex; flex-direction: column; gap: 0.5rem; }
.missing-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.missing-name { font-size: 0.9rem; color: #fff; font-weight: 500; }
.missing-reason { margin: 0.15rem 0 0; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
.btn-add-to-shop {
  background: rgba(241,184,24,0.15); color: #f1b818;
  border: 1px solid rgba(241,184,24,0.3);
  border-radius: 6px; padding: 0.2rem 0.55rem;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all 0.2s; flex-shrink: 0;
}
.btn-add-to-shop:hover:not(:disabled) { background: #f1b818; color: black; }
.btn-add-to-shop:disabled { opacity: 0.6; cursor: not-allowed; }

/* Todo OK */
.all-ok-state { text-align: center; padding: 1rem; }
.all-ok-icon { font-size: 2.5rem; margin: 0 0 0.5rem; }
.all-ok-msg { color: #81c784; margin: 0; font-size: 0.95rem; }

/* Acciones */
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.btn { padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 0.88rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #ccc; }
.btn-warning { background: rgba(241,184,24,0.15); color: #f1b818; border: 1px solid rgba(241,184,24,0.3); }
.btn-warning:hover:not(:disabled) { background: #f1b818; color: black; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
