"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, confirmPassword: string, isPersistence?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isTokenValid: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE_URL = 'https://localhost:7210'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if token is valid and not expired
  const isTokenValid = (): boolean => {
    if (!token) return false
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      
      return tokenPayload.exp && tokenPayload.exp > currentTime
    } catch (error) {
      console.error('Error validating token:', error)
      return false
    }
  }

  // Computed property for authentication status
  const isAuthenticated = user !== null && token !== null && isTokenValid()

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      // Check if token is valid/not expired
      try {
        const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (tokenPayload.exp && tokenPayload.exp > currentTime) {
          // Token is still valid
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
          console.log('Token loaded and validated successfully')
        } else {
          // Token is expired
          console.log('Token has expired, clearing auth state')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      } catch (error) {
        // Token is malformed
        console.error('Error parsing token:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/Identity/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.token) {
        setToken(data.token)
        const userData = { id: email, email, name: email.split('@')[0] }
        setUser(userData)
        
        // Save to localStorage
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(userData))
        
        setLoading(false)
        return true
      } else {
        // Handle different error formats
        let errorMessage = 'Invalid login credentials'
        if (data.message) {
          errorMessage = data.message
        } else if (data.errors) {
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ')
          } else if (typeof data.errors === 'object') {
            // Handle object with error keys
            const errorValues = Object.values(data.errors)
            errorMessage = errorValues.join(', ')
          } else if (typeof data.errors === 'string') {
            errorMessage = data.errors
          }
        }
        setError(errorMessage)
        setLoading(false)
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to server. Please check your connection.')
      setLoading(false)
      return false
    }
  }

  const register = async (email: string, password: string, confirmPassword: string, isPersistence = true): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/Identity/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: email, // Use email as username
          email, 
          password,
          confirmPassword,
          isPersistance: isPersistence 
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Auto-login after successful registration
        const loginSuccess = await login(email, password)
        setLoading(false)
        return loginSuccess
      } else {
        // Handle different error formats
        let errorMessage = 'Registration failed'
        if (data.message) {
          errorMessage = data.message
        } else if (data.errors) {
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ')
          } else if (typeof data.errors === 'object') {
            // Handle object with error keys
            const errorValues = Object.values(data.errors)
            errorMessage = errorValues.join(', ')
          } else if (typeof data.errors === 'string') {
            errorMessage = data.errors
          }
        }
        setError(errorMessage)
        setLoading(false)
        return false
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Unable to connect to server. Please check your connection.')
      setLoading(false)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)

    try {
      // Call backend logout endpoint
      if (token) {
        await fetch(`${API_BASE_URL}/api/Identity/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    }

    // Clear local state regardless of backend response
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setLoading(false)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
    isAuthenticated,
    isTokenValid,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
