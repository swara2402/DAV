const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export interface SupabaseSession {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at?: number
  user: SupabaseUser
}

function ensureConfigured(): void {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Real sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  ensureConfigured()
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data.msg === 'string'
      ? data.msg
      : typeof data.message === 'string'
        ? data.message
        : typeof data.error_description === 'string'
          ? data.error_description
          : typeof data.error === 'string'
            ? data.error
            : 'Authentication request failed. Please try again.'
    throw new Error(message)
  }
  return data as T
}

function withExpiry(session: SupabaseSession): SupabaseSession {
  return {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<{
  user: SupabaseUser | null
  session: SupabaseSession | null
}> {
  const redirectTo = `${window.location.origin}/auth`
  const result = await authRequest<SupabaseSession & SupabaseUser & { user?: SupabaseUser }>(
    `signup?redirect_to=${encodeURIComponent(redirectTo)}`,
    { method: 'POST', body: JSON.stringify({ email, password, data: { display_name: email.split('@')[0] } }) },
  )
  // GoTrue may return a session plus nested user, or a user-shaped response when
  // email confirmation is required. Normalize both API response forms.
  const user = result.user ?? (result.id ? result as SupabaseUser : null)
  const session = result.access_token && result.refresh_token && user
    ? withExpiry({ ...result, user } as SupabaseSession)
    : null
  return { user, session }
}

export async function signInWithEmail(email: string, password: string): Promise<SupabaseSession> {
  const result = await authRequest<SupabaseSession>(
    'token?grant_type=password',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )
  return withExpiry(result)
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseSession> {
  const result = await authRequest<SupabaseSession>(
    'token?grant_type=refresh_token',
    { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) },
  )
  return withExpiry(result)
}

export async function getSupabaseUser(accessToken: string): Promise<SupabaseUser> {
  return authRequest<SupabaseUser>('user', { method: 'GET' }, accessToken)
}

export async function signOutSupabase(accessToken: string): Promise<void> {
  await authRequest<unknown>('logout', { method: 'POST' }, accessToken)
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/auth?recovery=1`
  await authRequest<unknown>(
    `recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export async function updateSupabasePassword(accessToken: string, password: string): Promise<SupabaseUser> {
  return authRequest<SupabaseUser>(
    'user',
    { method: 'PUT', body: JSON.stringify({ password }) },
    accessToken,
  )
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}
