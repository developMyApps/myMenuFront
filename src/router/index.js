import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Calendar from '../views/Calendar.vue'
import ShoppingList from '../views/ShoppingList.vue'
import Pantry from '../views/Pantry.vue'
import Settings from '../views/Settings.vue'
import Tupperware from '../views/Tupperware.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard }, // Volvemos al Dashboard por defecto
  { path: '/calendar', name: 'Calendar', component: Calendar },
  { path: '/shopping', name: 'ShoppingList', component: ShoppingList },
  { path: '/pantry', name: 'Pantry', component: Pantry },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/tupperware', name: 'Tupperware', component: Tupperware },
  { path: '/super-login', name: 'LoginView', component: LoginView } // El login se queda aquí escondidito
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// SIN GUARDIANES. Todo el mundo puede entrar a las rutas.
export default router