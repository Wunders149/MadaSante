import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRoutes } from '../lib/api'
import type { Role, User } from '../types'

interface Session {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isProvider: boolean
  isAdmin: boolean
  login: (email: string, password: string, role: Role) => Promise<User>
  register: (data: Partial<User> & { role: Role; password: string }) => Promise<User>
  updateUser: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'ms_session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    if (session) writeSession(session)
  }, [session])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    apiRoutes
      .me()
      .then(({ user }) => {
        if (cancelled) return
        const next = { ...session, user }
        setSession(next)
        writeSession(next)
      })
      .catch(() => {
        if (cancelled) return
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const apply = useCallback((token: string, user: User) => {
    const sessionData: Session = { token, user }
    writeSession(sessionData)
    setSession(sessionData)
  }, [])

  const login = useCallback(
    async (email: string, password: string, _role: Role): Promise<User> => {
      const { token, user } = await apiRoutes.login({ email, password })
      apply(token, user)
      return user
    },
    [apply],
  )

  const register = useCallback(
    async (data: Partial<User> & { role: Role; password: string }): Promise<User> => {
      const { token, user } = await apiRoutes.register({ ...data })
      apply(token, user)
      return user
    },
    [apply],
  )

  const logout = useCallback(async () => {
    try {
      await apiRoutes.logout()
    } catch {
      // ignore network errors during logout
    }
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  const updateUser = useCallback((nextUser: User) => {
    setSession((prev) => {
      if (!prev) return prev
      return { ...prev, user: nextUser }
    })
  }, [])

  const isProvider = useMemo(() => {
    const role = session?.user.role ?? 'patient'
    return role !== 'patient' && role !== 'admin'
  }, [session])

  const isAdmin = useMemo(() => session?.user.role === 'admin', [session])

  const value: AuthContextValue = {
    user: session?.user ?? null,
    accessToken: session?.token ?? null,
    isProvider,
    isAdmin,
    login,
    register,
    updateUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}