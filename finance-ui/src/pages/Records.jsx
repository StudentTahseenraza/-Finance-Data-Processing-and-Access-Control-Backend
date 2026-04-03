import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Records = () => {
  const { permissions } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])

  // Fetch records with filters
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Add filters only if they have values
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      params.append('page', filters.page)
      params.append('limit', filters.limit)
      params.append('sort_by', 'date')
      params.append('sort_order', 'DESC')

      const response = await api.get(`/records?${params}`)
      setRecords(response.data.data.data)
      setPagination(response.data.data.pagination)
      
      // Extract unique categories for filter dropdown
      const uniqueCategories = [...new Set(response.data.data.data.map(r => r.category))];
      setCategories(uniqueCategories)
      
    } catch (error) {
      toast.error('Failed to load records')
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return
    
    try {
      await api.delete(`/records/${id}`)
      toast.success('Record deleted successfully')
      fetchRecords()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete record')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      search: '',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 10
    })
  }

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Loading records...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Financial Records</h1>
        {permissions.canCreateRecords && (
          <button
            onClick={() => window.location.href = '/add-record'}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition transform hover:scale-105"
          >
            + Add New Record
          </button>
        )}
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by description, category, or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📊 Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Items Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📄 Items per page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            🗑️ Clear All Filters
          </button>
          {(filters.search || filters.type || filters.category || filters.start_date || filters.end_date) && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              🔍 Active filters applied
            </div>
          )}
        </div>
      </div>

      {/* Records Table - Responsive */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                {(permissions.canUpdateOwnRecords || permissions.canDeleteOwnRecords) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No records found</p>
                    {permissions.canCreateRecords && (
                      <button
                        onClick={() => window.location.href = '/add-record'}
                        className="mt-3 text-blue-600 hover:text-blue-800"
                      >
                        Click here to add your first record →
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'income' ? '💰 Income' : '💸 Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-gray-100 rounded">{record.category}</span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      record.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${parseFloat(record.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {record.description || '-'}
                    </td>
                    {(permissions.canUpdateOwnRecords || permissions.canDeleteOwnRecords) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {permissions.canDeleteOwnRecords && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900 transition"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No records found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'income' ? '💰 Income' : '💸 Expense'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{record.category}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        record.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${parseFloat(record.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{record.date}</div>
                    </div>
                  </div>
                  {record.description && (
                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                  )}
                  {permissions.canDeleteOwnRecords && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 text-sm hover:text-red-900"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              Showing {((pagination.page - 1) * filters.limit) + 1} to {Math.min(pagination.page * filters.limit, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => changePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
              >
                ← Previous
              </button>
              
              {/* Page Numbers */}
              <div className="hidden sm:flex gap-2">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => changePage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {records.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-green-600">Total Income</p>
            <p className="text-xl font-bold text-green-700">
              ${records.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
            <p className="text-sm text-red-600">Total Expense</p>
            <p className="text-xl font-bold text-red-700">
              ${records.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 col-span-2">
            <p className="text-sm text-blue-600">Net Balance</p>
            <p className="text-xl font-bold text-blue-700">
              ${(records.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0) - 
                 records.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0)).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Records