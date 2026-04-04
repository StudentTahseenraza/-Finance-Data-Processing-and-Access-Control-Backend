import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { permissions } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchSummary()
    if (permissions.canViewAnalytics) {
      fetchTrends()
    }
  }, [dateRange])

  const fetchSummary = async () => {
    try {
      const params = {}
      if (dateRange.start_date) params.start_date = dateRange.start_date
      if (dateRange.end_date) params.end_date = dateRange.end_date
      
      const response = await api.get('/dashboard/summary', { params })
      setSummary(response.data.data.summary)
    } catch (error) {
      toast.error('Failed to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await api.get('/dashboard/trends?months=6')
      setTrends(response.data.data.trends)
    } catch (error) {
      console.error('Failed to load trends:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setDateRange({ start_date: '', end_date: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-4 md:p-6 transform hover:scale-105 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm md:text-base">Total Income</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                ${parseFloat(summary?.total_income || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-3xl md:text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow p-4 md:p-6 transform hover:scale-105 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm md:text-base">Total Expenses</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">
                ${parseFloat(summary?.total_expense || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-3xl md:text-4xl">💸</div>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4 md:p-6 transform hover:scale-105 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm md:text-base">Net Balance</p>
              <p className={`text-2xl md:text-3xl font-bold ${summary?.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${parseFloat(summary?.net_balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-3xl md:text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold text-lg">{summary?.total_transactions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <span className="text-gray-600">Income Transactions:</span>
              <span className="font-semibold text-lg text-green-600">{summary?.income_count || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <span className="text-gray-600">Expense Transactions:</span>
              <span className="font-semibold text-lg text-red-600">{summary?.expense_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Trends Section */}
        {permissions.canViewAnalytics && trends && trends.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Monthly Trends (Last 6 months)</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {trends.map((trend, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">{trend.month}</span>
                    <span className={`font-bold ${trend.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Net: ${trend.net.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Income: ${trend.income.toFixed(2)}</span>
                    <span className="text-red-600">Expense: ${trend.expense.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role-based access message */}
      {!permissions.canViewAnalytics && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your role (Viewer) has limited access. Upgrade to Analyst for detailed insights, trends, and analytics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard