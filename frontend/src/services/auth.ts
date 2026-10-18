export interface AuthUser {
  email: string
  role: 'student' | 'staff' | 'admin'
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await response.json()) as AuthUser | { code?: string; message?: string }
  if (!response.ok) {
    const error = new Error('message' in data ? data.message ?? 'La connexion a échoué.' : 'La connexion a échoué.')
    Object.assign(error, { code: 'code' in data ? data.code : undefined, status: response.status })
    throw error
  }
  return data as AuthUser
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Impossible de vérifier la session.')
  return (await response.json()) as AuthUser
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  if (!response.ok) throw new Error('La déconnexion a échoué.')
}
