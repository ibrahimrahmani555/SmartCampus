import type { MiddlewareHandler } from 'hono'
import type { AuthUser } from './sessionMiddleware.js'

export type Role = 'student' | 'staff' | 'admin'
export type Permission = 'rooms:read' | 'availability:read' | 'favorites:manage' | 'rooms:manage'

export const rolePermissions: Record<Role, readonly Permission[]> = {
  student: ['rooms:read', 'availability:read', 'favorites:manage'],
  staff: ['rooms:read', 'availability:read', 'favorites:manage'],
  admin: ['rooms:read', 'availability:read', 'favorites:manage', 'rooms:manage'],
}

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export function requirePermission(permission: Permission): MiddlewareHandler<{
  Variables: { user: AuthUser }
}> {
  return async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ code: 'UNAUTHENTICATED', message: 'Veuillez vous connecter.' }, 401)
    }
    if (!can(user.role, permission)) {
      return c.json({ code: 'FORBIDDEN', message: 'Accès refusé.' }, 403)
    }
    await next()
  }
}
