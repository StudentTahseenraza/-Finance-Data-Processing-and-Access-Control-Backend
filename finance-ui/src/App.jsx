import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import AddRecord from './pages/AddRecord'
import Analytics from './pages/Analytics'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <Dashboard />
            </>
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <Records />
            </>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute requirePermission="canViewAnalytics">
            <>
              <Navbar />
              <Analytics />
            </>
          </ProtectedRoute>
        } />
        <Route path="/add-record" element={
          <ProtectedRoute requirePermission="canCreateRecords">
            <>
              <Navbar />
              <AddRecord />
            </>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

function ProtectedRoute({ children, requirePermission }) {
  const token = localStorage.getItem('accessToken')
  const userRole = localStorage.getItem('userRole')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  // Check permission for route
  if (requirePermission) {
    const permissions = JSON.parse(localStorage.getItem('permissions') || '{}')
    if (!permissions[requirePermission]) {
      return <Navigate to="/" replace />
    }
  }
  
  return children
}

export default App