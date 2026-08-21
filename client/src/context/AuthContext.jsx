import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import api from '../api/axios'
import { Role } from '../constants'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,
    isAuthenticated: false,
  })

  // On mount, restore the session from localStorage (mirrors @ishub/shared user shape).
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setState({
          user,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // Accept either `accessToken` (ishub) or `token` (older backend) for robustness.
    const accessToken = data.accessToken || data.token
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setState({
      user: data.user,
      token: accessToken,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const register = useCallback(async (input) => {
    const { data } = await api.post('/auth/register', input)
    const accessToken = data.accessToken || data.token
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setState({
      user: data.user,
      token: accessToken,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
