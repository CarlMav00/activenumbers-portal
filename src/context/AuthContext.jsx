import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../lib/api'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('an_user')) } catch { return null }
  })

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const token = data.accessToken || data.data?.accessToken
    const userData = data.user || data.data?.user
    localStorage.setItem('an_access_token', token)
    localStorage.setItem('an_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])
  const register = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/register', { email, password })
    return data
  }, [])
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('an_access_token')
    localStorage.removeItem('an_user')
    setUser(null)
  }, [])
  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  }, [])
  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  }, [])
  return (
    <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
