import { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { analyticsApi } from '../../services/api'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { 
  Activity, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Clock, 
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter
} from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280']

const MetricCard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('week') // week, month, quarter
  const [boardFilter, setBoardFilter] = useState('all')

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now)
        }
      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        }
      case 'quarter':
        return {
          startDate: subDays(now, 90),
          endDate: now
        }
      default:
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now)
        }
    }
  }, [timeRange])

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['analytics', 'overview', timeRange, boardFilter],
    () => analyticsApi.getOverview({
      ...dateRange,
      boardId: boardFilter !== 'all' ? boardFilter : undefined
    })
  )

  const { data: activity, isLoading: activityLoading } = useQuery(
    ['analytics', 'activity', timeRange, boardFilter],
    () => analyticsApi.getActivity({
      ...dateRange,
      boardId: boardFilter !== 'all' ? boardFilter : undefined
    })
  )

  const { data: productivity, isLoading: productivityLoading } = useQuery(
    ['analytics', 'productivity', timeRange, boardFilter],
    () => analyticsApi.getProductivity({
      ...dateRange,
      boardId: boardFilter !== 'all' ? boardFilter : undefined
    })
  )

  const { data: boards } = useQuery('boards', () => analyticsApi.getBoards())

  if (overviewLoading || activityLoading || productivityLoading) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-secondary-600">Loading analytics...</p>
      </div>
    )
  }

  const overviewData = overview?.data || {}
  const activityData = activity?.data || {}
  const productivityData = productivity?.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Analytics Dashboard</h1>
          <p className="text-secondary-600">Track your team's productivity and progress</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-secondary-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
          </select>

          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="border border-secondary-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Boards</option>
            {boards?.data?.boards?.map(board => (
              <option key={board.id} value={board.id}>{board.title}</option>
            ))}
          </select>

          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Cards Completed"
          value={overviewData.cardsCompleted || 0}
          change={overviewData.cardsCompletedChange}
          icon={CheckSquare}
          color="success"
        />
        <MetricCard
          title="Active Users"
          value={overviewData.activeUsers || 0}
          change={overviewData.activeUsersChange}
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Average Completion Time"
          value={`${overviewData.avgCompletionTime || 0}h`}
          change={overviewData.avgCompletionTimeChange}
          icon={Clock}
          color="warning"
        />
        <MetricCard
          title="Productivity Score"
          value={`${overviewData.productivityScore || 0}%`}
          change={overviewData.productivityScoreChange}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Daily Activity</h3>
            <BarChart3 className="w-5 h-5 text-secondary-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Area 
                type="monotone" 
                dataKey="cardsCompleted" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
                name="Cards Completed"
              />
              <Area 
                type="monotone" 
                dataKey="cardsCreated" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.1}
                name="Cards Created"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Completion Rate Trend</h3>
            <TrendingUp className="w-5 h-5 text-secondary-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                formatter={(value) => [`${value}%`, 'Completion Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Card Status Distribution</h3>
            <PieChartIcon className="w-5 h-5 text-secondary-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={overviewData.statusDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {(overviewData.statusDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {(overviewData.statusDistribution || []).map((item, index) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-secondary-600">{item.status}</span>
                </div>
                <span className="font-medium text-secondary-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Top Performers</h3>
            <Users className="w-5 h-5 text-secondary-400" />
          </div>
          <div className="space-y-3">
            {(productivityData.topPerformers || []).slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-6 h-6 bg-secondary-300 rounded-full flex items-center justify-center">
                        <span className="text-xs">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-secondary-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-secondary-900">{user.completedCards}</div>
                  <div className="text-xs text-secondary-500">cards</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board Performance */}
        <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Board Performance</h3>
            <BarChart3 className="w-5 h-5 text-secondary-400" />
          </div>
          <div className="space-y-3">
            {(activityData.boardStats || []).slice(0, 5).map((board) => (
              <div key={board.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-900 truncate">
                    {board.title}
                  </span>
                  <span className="text-sm text-secondary-600">{board.completionRate}%</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${board.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-secondary-500">
                  <span>{board.completedCards} completed</span>
                  <span>{board.totalCards} total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white p-6 rounded-lg shadow border border-secondary-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
          <Calendar className="w-5 h-5 text-secondary-400" />
        </div>
        
        <div className="space-y-4">
          {(activityData.recentActivity || []).slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-secondary-900">
                  <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                  {' '}{activity.action}{' '}
                  <span className="font-medium">{activity.target}</span>
                  {activity.board && (
                    <span className="text-secondary-600"> in {activity.board}</span>
                  )}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}