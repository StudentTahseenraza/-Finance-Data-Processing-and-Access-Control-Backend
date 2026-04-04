import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'
import { format, subMonths, subWeeks, subYears, startOfMonth, endOfMonth } from 'date-fns'

const Analytics = () => {
  const { permissions, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('monthly') // monthly, weekly, yearly
  const [chartData, setChartData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState(null)

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  useEffect(() => {
    if (!permissions.canViewAnalytics) {
      toast.error('You need Analyst or Admin role to view analytics')
      return
    }
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch all records for the selected time range
      const now = new Date()
      let startDate, endDate
      
      if (timeRange === 'monthly') {
        startDate = format(subMonths(now, 11), 'yyyy-MM-dd') // Last 12 months
        endDate = format(now, 'yyyy-MM-dd')
      } else if (timeRange === 'weekly') {
        startDate = format(subWeeks(now, 12), 'yyyy-MM-dd') // Last 12 weeks
        endDate = format(now, 'yyyy-MM-dd')
      } else {
        startDate = format(subYears(now, 5), 'yyyy-MM-dd') // Last 5 years
        endDate = format(now, 'yyyy-MM-dd')
      }

      const response = await api.get('/records', {
        params: {
          start_date: startDate,
          end_date: endDate,
          limit: 1000
        }
      })

      const records = response.data.data.data
      
      // Process data based on time range
      let processedData = []
      if (timeRange === 'monthly') {
        processedData = processMonthlyData(records)
      } else if (timeRange === 'weekly') {
        processedData = processWeeklyData(records)
      } else {
        processedData = processYearlyData(records)
      }
      
      setChartData(processedData)
      
      // Process category data
      const categories = processCategoryData(records)
      setCategoryData(categories)
      
      // Calculate summary
      const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0)
      const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0)
      setSummary({
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        totalTransactions: records.length,
        averageTransaction: (totalIncome + totalExpense) / records.length
      })
      
      // Get insights
      await fetchInsights()
      
    } catch (error) {
      toast.error('Failed to load analytics data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const processMonthlyData = (records) => {
    const monthlyMap = new Map()
    
    records.forEach(record => {
      const month = format(new Date(record.date), 'MMM yyyy')
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, income: 0, expense: 0, net: 0 })
      }
      const data = monthlyMap.get(month)
      if (record.type === 'income') {
        data.income += parseFloat(record.amount)
      } else {
        data.expense += parseFloat(record.amount)
      }
      data.net = data.income - data.expense
    })
    
    return Array.from(monthlyMap.values()).reverse()
  }

  const processWeeklyData = (records) => {
    const weeklyMap = new Map()
    
    records.forEach(record => {
      const date = new Date(record.date)
      const weekNumber = format(date, 'w')
      const year = format(date, 'yyyy')
      const weekLabel = `Week ${weekNumber} (${format(date, 'MMM')})`
      
      if (!weeklyMap.has(weekLabel)) {
        weeklyMap.set(weekLabel, { week: weekLabel, income: 0, expense: 0, net: 0 })
      }
      const data = weeklyMap.get(weekLabel)
      if (record.type === 'income') {
        data.income += parseFloat(record.amount)
      } else {
        data.expense += parseFloat(record.amount)
      }
      data.net = data.income - data.expense
    })
    
    return Array.from(weeklyMap.values()).slice(-12) // Last 12 weeks
  }

  const processYearlyData = (records) => {
    const yearlyMap = new Map()
    
    records.forEach(record => {
      const year = format(new Date(record.date), 'yyyy')
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { year, income: 0, expense: 0, net: 0 })
      }
      const data = yearlyMap.get(year)
      if (record.type === 'income') {
        data.income += parseFloat(record.amount)
      } else {
        data.expense += parseFloat(record.amount)
      }
      data.net = data.income - data.expense
    })
    
    return Array.from(yearlyMap.values())
  }

  const processCategoryData = (records) => {
    const categoryMap = new Map()
    
    records.forEach(record => {
      if (!categoryMap.has(record.category)) {
        categoryMap.set(record.category, { name: record.category, value: 0, type: record.type })
      }
      const data = categoryMap.get(record.category)
      data.value += parseFloat(record.amount)
    })
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }

  const fetchInsights = async () => {
    try {
      const response = await api.get('/dashboard/insights')
      setInsights(response.data.data.insights)
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }

  if (!permissions.canViewAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Denied</h2>
          <p className="text-yellow-700">
            You need Analyst or Admin role to view analytics charts and insights.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Visual insights of your financial data</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('weekly')}
            className={`px-4 py-2 rounded-lg transition ${
              timeRange === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-4 py-2 rounded-lg transition ${
              timeRange === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={`px-4 py-2 rounded-lg transition ${
              timeRange === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Total Income</p>
          <p className="text-2xl font-bold text-green-700">${summary?.totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">${summary?.totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">Net Balance</p>
          <p className={`text-2xl font-bold ${summary?.netBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ${summary?.netBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow p-4">
          <p className="text-sm text-purple-600">Avg Transaction</p>
          <p className="text-2xl font-bold text-purple-700">${summary?.averageTransaction.toFixed(2)}</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income vs Expense Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {timeRange === 'weekly' ? 'Weekly' : timeRange === 'monthly' ? 'Monthly' : 'Yearly'} Income vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'yearly' ? 'year' : timeRange === 'monthly' ? 'month' : 'week'} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net Balance" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart for Cumulative */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cumulative Growth</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'yearly' ? 'year' : timeRange === 'monthly' ? 'month' : 'week'} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Income" />
              <Area type="monotone" dataKey="expense" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#3B82F6">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Smart Insights */}
        {insights && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Smart Insights</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Spending Category</p>
                <p className="text-xl font-bold text-red-600">
                  {insights.top_spending_categories[0]?.category || 'N/A'} - 
                  ${insights.top_spending_categories[0]?.total?.toFixed(2) || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Income Source</p>
                <p className="text-xl font-bold text-green-600">
                  {insights.top_income_sources[0]?.category || 'N/A'} - 
                  ${insights.top_income_sources[0]?.total?.toFixed(2) || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Daily Spending</p>
                <p className="text-xl font-bold text-blue-600">
                  ${insights.average_daily_spending?.toFixed(2) || '0'} per day
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Quick Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold">{summary?.totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Income/Expense Ratio:</span>
              <span className="font-semibold">
                {summary?.totalExpense > 0 
                  ? (summary?.totalIncome / summary?.totalExpense).toFixed(2)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Saving Rate:</span>
              <span className="font-semibold text-green-600">
                {summary?.totalIncome > 0
                  ? ((summary?.netBalance / summary?.totalIncome) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Data Period:</span>
              <span className="font-semibold capitalize">{timeRange}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics