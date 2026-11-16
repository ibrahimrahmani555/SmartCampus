import { ref } from 'vue'
import { getCurrentUser } from '../services/auth'

export type Role = 'student' | 'staff' | 'admin'
export type Permission = 'rooms:read' | 'availability:read' | 'favorites:manage' | 'rooms:manage'

// Keep this table synchronized with backend/src/auth/permissions.ts.
const rolePermissions: Record<Role, readonly Permission[]> = {
  student: ['rooms:read', 'availability:read', 'favorites:manage'],
  staff: ['rooms:read', 'availability:read', 'favorites:manage'],
  admin: ['rooms:read', 'availability:read', 'favorites:manage', 'rooms:manage'],
}

const user = ref<{ email: string; role: Role } | null>(null)

export function useAuth() {
  async function refresh() {
    user.value = await getCurrentUser()
    return user.value
  }

  function can(permission: Permission): boolean {
    return user.value ? rolePermissions[user.value.role].includes(permission) : false
  }

  return { user, refresh, can }
}
