import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminApi, userApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { 
  Users, 
  Columns, 
  Activity, 
  Settings, 
  Search, 
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Shield,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'

const AdminStats = () => {
  const { data: stats, isLoading } = useQuery('adminStats', adminApi.getSystemStats)

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-secondary-200 rounded mb-2"></div>
          <div className="h-8 bg-secondary-200 rounded"></div>
        </div>
      ))}
    </div>
  }

  const statsData = stats?.data || {}

  const statCards = [
    {
      title: 'Total Users',
      value: statsData.totalUsers || 0,
      change: statsData.userGrowth || 0,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Boards',
      value: statsData.totalBoards || 0,
      change: statsData.boardGrowth || 0,
      icon: Columns,
      color: 'green'
    },
    {
      title: 'Daily Active Users',
      value: statsData.dailyActiveUsers || 0,
      change: statsData.dauGrowth || 0,
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'System Health',
      value: `${statsData.systemHealth || 100}%`,
      change: 0,
      icon: TrendingUp,
      color: 'orange'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              {stat.change !== 0 && (
                <span className={`text-sm font-medium ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-secondary-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-secondary-600">
              {stat.title}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const UserManagement = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [page, setPage] = useState(1)

  // Fetch users with filters
  const { 
    data: usersData, 
    isLoading, 
    refetch 
  } = useQuery(
    ['adminUsers', page, searchQuery, statusFilter],
    () => adminApi.getUsers({ 
      page, 
      limit: 20, 
      search: searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter
    }),
    {
      keepPreviousData: true
    }
  )

  // Mutations
  const banUserMutation = useMutation(
    ({ userId, reason }) => adminApi.banUser(userId, { reason }),
    {
      onSuccess: () => {
        toast.success('User banned successfully')
        queryClient.invalidateQueries(['adminUsers'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to ban user')
      }
    }
  )

  const unbanUserMutation = useMutation(adminApi.unbanUser, {
    onSuccess: () => {
      toast.success('User unbanned successfully')
      queryClient.invalidateQueries(['adminUsers'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unban user')
    }
  })

  const deleteUserMutation = useMutation(adminApi.deleteUser, {
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries(['adminUsers'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  })

  const impersonateMutation = useMutation(adminApi.impersonateUser, {
    onSuccess: (data) => {
      toast.success('Impersonation started')
      // Handle impersonation token/redirect
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to impersonate user')
    }
  })

  // Handlers
  const handleBanUser = (userId) => {
    const reason = window.prompt('Enter reason for banning this user:')
    if (reason) {
      banUserMutation.mutate({ userId, reason })
    }
  }

  const handleUnbanUser = (userId) => {
    if (window.confirm('Are you sure you want to unban this user?')) {
      unbanUserMutation.mutate(userId)
    }
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleImpersonate = (userId) => {
    if (window.confirm('Are you sure you want to impersonate this user?')) {
      impersonateMutation.mutate(userId)
    }
  }

  const users = usersData?.data?.users || []
  const pagination = usersData?.data?.pagination

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-secondary-900">User Management</h2>
          <button
            onClick={() => refetch()}
            className="p-2 text-secondary-600 hover:text-secondary-900"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-secondary-600">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-secondary-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isBanned 
                        ? 'bg-red-100 text-red-800'
                        : user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-secondary-100 text-secondary-800'
                    }`}>
                      {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-secondary-400 mr-1" />
                      <span className="text-sm text-secondary-900 capitalize">
                        {user.role || 'user'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {user.lastLoginAt 
                      ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-secondary-600 hover:text-secondary-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Impersonate User"
                      >
                        <Shield className="w-4 h-4" />
                      </button>

                      {user.isBanned ? (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Unban User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Ban User"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-3 border-t border-secondary-200 flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {
              Math.min(pagination.page * pagination.limit, pagination.total)
            } of {pagination.total} users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-secondary-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-700">
              {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 border border-secondary-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SystemSettings = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-secondary-900 mb-6">System Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium text-secondary-900 mb-3">
            Security Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
              <div>
                <div className="font-medium text-secondary-900">Force Password Reset</div>
                <div className="text-sm text-secondary-600">Require all users to reset passwords</div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Trigger Reset
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
              <div>
                <div className="font-medium text-secondary-900">Maintenance Mode</div>
                <div className="text-sm text-secondary-600">Put system in maintenance mode</div>
              </div>
              <button className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50">
                Enable
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium text-secondary-900 mb-3">
            Data Management
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
              <div>
                <div className="font-medium text-secondary-900">Export All Data</div>
                <div className="text-sm text-secondary-600">Download complete system backup</div>
              </div>
              <button className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AdminDashboard = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Access Denied</h2>
          <p className="text-secondary-600">You don't have permission to access the admin dashboard.</p>
          <Link 
            to="/dashboard"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'boards', label: 'Boards', icon: Columns },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="flex items-center text-secondary-600 hover:text-secondary-900 mb-4"
          >
            <Shield className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">
            Admin Dashboard
          </h1>
        </div>
        {/* Tabs */}
        <div className="border-b border-secondary-200 mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <AdminStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Recent Activity</h3>
                <p className="text-secondary-600">Activity feed will be implemented here</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">System Alerts</h3>
                <p className="text-secondary-600">System alerts will be shown here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'boards' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-secondary-900 mb-4">Board Management</h2>
            <p className="text-secondary-600">Board management features will be implemented here</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-secondary-900 mb-4">System Activity</h2>
            <p className="text-secondary-600">Activity logs and audit trail will be shown here</p>
          </div>
        )}

        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </MainLayout>
  )
}