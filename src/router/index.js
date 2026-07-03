import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Calendar from '../views/Calendar.vue'
import ShoppingList from '../views/ShoppingList.vue'
import Pantry from '../views/Pantry.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/calendar', name: 'Calendar', component: Calendar },
  { path: '/shopping', name: 'ShoppingList', component: ShoppingList },
  { path: '/pantry', name: 'Pantry', component: Pantry },
  { path: '/settings', name: 'Settings', component: Settings },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
