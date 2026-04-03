import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      toast.success('Login successful!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
    
    setLoading(false)
  }

  // Quick login buttons for testing
  const quickLogin = async (email, password) => {
    setEmail(email)
    setPassword(password)
    setLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      toast.success(`Logged in as ${email.split('@')[0]}`)
      navigate('/')
    } else {
      toast.error(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Finance Dashboard</h1>
          <p className="text-gray-600 mt-2">Login to access your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="admin@finance.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-sm text-gray-600 text-center mb-3">Quick Test Accounts:</p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('admin@finance.com', 'Admin@123456')}
              className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 rounded transition"
            >
              🔴 Admin: admin@finance.com
            </button>
            <button
              onClick={() => quickLogin('analyst@finance.com', 'Analyst@123456')}
              className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded transition"
            >
              🟢 Analyst: analyst@finance.com
            </button>
            <button
              onClick={() => quickLogin('viewer@finance.com', 'Viewer@123456')}
              className="w-full text-left px-3 py-2 text-sm bg-yellow-50 hover:bg-yellow-100 rounded transition"
            >
              🟡 Viewer: viewer@finance.com
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login