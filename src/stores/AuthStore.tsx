import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, User } from '../types'
import { providerUsers } from '../data/mock'

interface Session {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isProvider: boolean
  loginAsPatient: () => Promise<User>
  loginAsProvider: (role: Role) => Promise<User>
  login: (email: string, password: string, role: Role) => Promise<User>
  register: (data: Partial<User> & { role: Role; password: string }) => Promise<User>
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

const PATIENT = {
  id: 'u_patient_1',
  firstName: 'Voahangy',
  lastName: 'Andrianiaina',
  phone: '+261 34 12 345 67',
  email: 'voahangy.andrianiaina@demo.mg',
  role: 'patient' as Role,
  location: 'Antananarivo',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const loginAsPatient = useCallback(async (): Promise<User> => {
    const sessionData: Session = {
      token: `demo-jwt.${Math.random().toString(36).slice(2)}.${Date.now()}`,
      user: PATIENT,
    }
    writeSession(sessionData)
    setSession(sessionData)
    return PATIENT
  }, [])

  const loginAsProvider = useCallback(async (role: Role): Promise<User> => {
    const user = providerUsers.find((u) => u.role === role) ?? providerUsers[0]
    if (!user) throw new Error('unknown provider')
    const sessionData: Session = {
      token: `demo-jwt.${Math.random().toString(36).slice(2)}.${Date.now()}`,
      user,
    }
    writeSession(sessionData)
    setSession(sessionData)
    return user
  }, [])

  const login = useCallback(
    async (_email: string, _password: string, role: Role): Promise<User> => {
      await new Promise((r) => setTimeout(r, 700))
      if (role === 'patient') return loginAsPatient()
      return loginAsProvider(role)
    },
    [loginAsPatient, loginAsProvider],
  )

  const register = useCallback(
    async (data: Partial<User> & { role: Role; password?: string }): Promise<User> => {
      await new Promise((r) => setTimeout(r, 800))
      if (data.role === 'patient') {
        const user: User = {
          id: `u_${Date.now()}`,
          firstName: data.firstName || 'Nouveau',
          lastName: data.lastName || 'Patient',
          phone: data.phone || '+261 34 00 000 00',
          email: data.email || 'patient@demo.mg',
          role: 'patient',
          location: data.location || 'Antananarivo',
        }
        const sessionData: Session = { token: `demo-jwt.${Date.now()}`, user }
        writeSession(sessionData)
        setSession(sessionData)
        return user
      }
      return loginAsProvider(data.role)
    },
    [loginAsProvider],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  const isProvider = useMemo(() => session?.user.role !== 'patient', [session])

  const value: AuthContextValue = {
    user: session?.user ?? null,
    accessToken: session?.token ?? null,
    isProvider,
    loginAsPatient,
    loginAsProvider,
    login,
    register,
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