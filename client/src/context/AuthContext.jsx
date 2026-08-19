import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const TOKEN_KEY = 'token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  // On app load, restore the user session when a token already exists.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setLoading(false)
      return
    }

    const restoreSession = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
      } catch {
        // Token is invalid or expired — clear the stale session.
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    persistSession(res.data.token, res.data.user)
    return res.data
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    // Register returns a token + user, so the user is logged in automatically.
    persistSession(res.data.token, res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  // Merge partial fields into the current authenticated user (e.g. a newly
  // selected category_id). No-op when there is no active user.
  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
