import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Calendar from '../views/Calendar.vue'
import ShoppingList from '../views/ShoppingList.vue'
import Pantry from '../views/Pantry.vue'
import Settings from '../views/Settings.vue'
import Tupperware from '../views/Tupperware.vue'
import LoginView from '../views/LoginView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/calendar', name: 'Calendar', component: Calendar },
  { path: '/shopping', name: 'ShoppingList', component: ShoppingList },
  { path: '/pantry', name: 'Pantry', component: Pantry },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/tupperware', name: 'Tupperware', component: Tupperware },
  { path: '/super-login', name: 'LoginView', component: LoginView },
  { path: '/admin-dashboard', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/verify-email', name: 'VerifyEmail', component: () => import('../views/VerifyEmailView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.name === 'AdminDashboard') {
    const userSession = localStorage.getItem('userSession')
    if (!userSession) {
      return next('/super-login')
    }
  }
  next()
})

export default router