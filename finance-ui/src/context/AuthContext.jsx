import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('accessToken'))
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    if (token) {
      fetchUser()
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = response.data.data.user
      setUser(userData)
      
      // Set permissions based on role
      const rolePermissions = {
        admin: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: true,
          canCreateRecords: true,
          canUpdateOwnRecords: true,
          canDeleteOwnRecords: true,
          canManageUsers: true,
          canViewAllRecords: true,
          canUpdateAnyRecord: true,
          canDeleteAnyRecord: true,
        },
        analyst: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: true,
          canCreateRecords: true,
          canUpdateOwnRecords: true,
          canDeleteOwnRecords: true,
          canManageUsers: false,
          canViewAllRecords: false,
          canUpdateAnyRecord: false,
          canDeleteAnyRecord: false,
        },
        viewer: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: false,
          canCreateRecords: false,
          canUpdateOwnRecords: false,
          canDeleteOwnRecords: false,
          canManageUsers: false,
          canViewAllRecords: false,
          canUpdateAnyRecord: false,
          canDeleteAnyRecord: false,
        }
      }
      
      setPermissions(rolePermissions[userData.role?.name] || rolePermissions.viewer)
      localStorage.setItem('userRole', userData.role?.name)
      localStorage.setItem('permissions', JSON.stringify(rolePermissions[userData.role?.name] || rolePermissions.viewer))
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
        email,
        password
      })
      
      const { accessToken, user } = response.data.data
      localStorage.setItem('accessToken', accessToken)
      setToken(accessToken)
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('permissions')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}