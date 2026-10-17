export type AuthUser = {
  email: string
  role: 'student' | 'staff' | 'admin'
}

type ApiError = { message?: unknown }

async function requestUser(url: string, init?: RequestInit): Promise<AuthUser> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Impossible de joindre le serveur. Réessayez.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(
      typeof body.message === 'string'
        ? body.message
        : 'Une erreur est survenue. Veuillez réessayer.',
    )
  }

  return (await response.json()) as AuthUser
}

export function login(email: string, password: string): Promise<AuthUser> {
  return requestUser('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser(): Promise<AuthUser> {
  return requestUser('/api/auth/me')
}
