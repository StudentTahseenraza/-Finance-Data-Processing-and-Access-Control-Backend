import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, permissions, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold text-blue-600">
            💰 Finance Dashboard
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Dashboard</Link>
            <Link to="/records" className="text-gray-700 hover:text-blue-600 transition">Records</Link>
            {permissions.canViewAnalytics && (
              <Link to="/analytics" className="text-gray-700 hover:text-blue-600 transition">Analytics</Link>
            )}
            {permissions.canCreateRecords && (
              <Link to="/add-record" className="text-gray-700 hover:text-blue-600 transition">Add Record</Link>
            )}
            <div className="flex items-center space-x-4 ml-4">
              <span className="text-sm text-gray-600">
                👤 {user?.full_name?.split(' ')[0]} ({user?.role?.name})
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition py-2"
              >
                Dashboard
              </Link>
              <Link 
                to="/records" 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition py-2"
              >
                Records
              </Link>
              {permissions.canViewAnalytics && (
                <Link 
                  to="/analytics" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 transition py-2"
                >
                  Analytics
                </Link>
              )}
              {permissions.canCreateRecords && (
                <Link 
                  to="/add-record" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 transition py-2"
                >
                  Add Record
                </Link>
              )}
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-3">
                  👤 {user?.full_name} ({user?.role?.name})
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar