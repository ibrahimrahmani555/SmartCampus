import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import { h } from 'vue'
import { useAuth, type Permission } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, permission: 'rooms:read' as Permission },
    },
    {
      path: '/access-denied',
      name: 'access-denied',
      component: { render: () => h('main', 'Accès refusé.') },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth !== true) return true
  try {
    const auth = useAuth()
    const user = await auth.refresh()
    if (!user) return { name: 'login' }
    return to.meta.permission && !auth.can(to.meta.permission as Permission)
      ? { name: 'access-denied' }
      : true
  } catch {
    return { name: 'login' }
  }
})

export default router
