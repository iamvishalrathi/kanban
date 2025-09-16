import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  MessageCircle,
  UserPlus,
  Calendar,
  Archive,
  Star,
  AlertTriangle,
  Eye,
  Filter,
  Search
} from 'lucide-react'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'comment': return MessageCircle
    case 'assignment': return UserPlus
    case 'due_date': return Calendar
    case 'card_moved': return Archive
    case 'mention': return Star
    case 'system': return AlertTriangle
    default: return Bell
  }
}

const getNotificationColor = (type, priority) => {
  if (priority === 'high') return 'text-red-500'
  if (priority === 'medium') return 'text-orange-500'
  
  switch (type) {
    case 'comment': return 'text-blue-500'
    case 'assignment': return 'text-green-500'
    case 'due_date': return 'text-red-500'
    case 'card_moved': return 'text-purple-500'
    case 'mention': return 'text-yellow-500'
    case 'system': return 'text-gray-500'
    default: return 'text-gray-500'
  }
}

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery(
    ['notifications', filter],
    () => notificationApi.getNotifications({ 
      filter: filter !== 'all' ? filter : undefined,
      limit: 20 
    }),
    { enabled: isOpen }
  )

  // Mutations
  const markAsReadMutation = useMutation(
    (notificationId) => notificationApi.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        queryClient.invalidateQueries(['notificationCount'])
      }
    }
  )

  const markAllAsReadMutation = useMutation(
    () => notificationApi.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        queryClient.invalidateQueries(['notificationCount'])
        toast.success('All notifications marked as read')
      }
    }
  )

  const deleteNotificationMutation = useMutation(
    (notificationId) => notificationApi.deleteNotification(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        queryClient.invalidateQueries(['notificationCount'])
      }
    }
  )

  if (!isOpen) return null

  const notificationList = notifications?.data?.notifications || []
  const filteredNotifications = notificationList.filter(notification =>
    notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = notificationList.filter(n => !n.isRead).length

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 max-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-secondary-900">Notifications</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="comment">Comments</option>
              <option value="assignment">Assignments</option>
              <option value="due_date">Due Dates</option>
              <option value="mention">Mentions</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-secondary-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500">
              {searchTerm ? 'No notifications match your search' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const iconColor = getNotificationColor(notification.type, notification.priority)

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-secondary-50 transition-colors ${
                    !notification.isRead ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-full bg-white ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-secondary-900' : 'text-secondary-700'
                        }`}>
                          {notification.title}
                        </p>
                        
                        <div className="flex items-center space-x-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="text-primary-600 hover:text-primary-700"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            className="text-secondary-400 hover:text-red-500"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-secondary-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-secondary-200">
        <button className="w-full text-sm text-primary-600 hover:text-primary-700 text-center">
          View all notifications
        </button>
      </div>
    </div>
  )
}

export const NotificationCenter = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState([])

  // Fetch notifications with pagination
  const { data: notifications, isLoading, fetchNextPage, hasNextPage } = useQuery(
    ['notifications', filter, searchTerm],
    ({ pageParam = 1 }) => 
      notificationApi.getNotifications({ 
        page: pageParam,
        filter: filter !== 'all' ? filter : undefined,
        search: searchTerm || undefined,
        limit: 20 
      })
  )

  // Mutations
  const markSelectedAsReadMutation = useMutation(
    (notificationIds) => notificationApi.markMultipleAsRead(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        queryClient.invalidateQueries(['notificationCount'])
        setSelectedNotifications([])
        toast.success('Selected notifications marked as read')
      }
    }
  )

  const deleteSelectedMutation = useMutation(
    (notificationIds) => notificationApi.deleteMultiple(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        queryClient.invalidateQueries(['notificationCount'])
        setSelectedNotifications([])
        toast.success('Selected notifications deleted')
      }
    }
  )

  const notificationList = notifications?.data?.notifications || []
  const totalCount = notifications?.data?.totalCount || 0

  const handleSelectAll = () => {
    if (selectedNotifications.length === notificationList.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(notificationList.map(n => n.id))
    }
  }

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-secondary-900">Notification Center</h1>
          <button className="p-2 text-secondary-400 hover:text-secondary-600 rounded-md hover:bg-secondary-100">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="comment">Comments</option>
              <option value="assignment">Assignments</option>
              <option value="due_date">Due Dates</option>
              <option value="mention">Mentions</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={() => markSelectedAsReadMutation.mutate(selectedNotifications)}
                className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark Read
              </button>
              <button
                onClick={() => deleteSelectedMutation.mutate(selectedNotifications)}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-secondary-100">
        {/* Select All Header */}
        {notificationList.length > 0 && (
          <div className="p-4 bg-secondary-50 flex items-center">
            <input
              type="checkbox"
              checked={selectedNotifications.length === notificationList.length}
              onChange={handleSelectAll}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label className="ml-2 text-sm text-secondary-700">
              Select all notifications
            </label>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-secondary-500">
            Loading notifications...
          </div>
        ) : notificationList.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No notifications</h3>
            <p className="text-secondary-500">
              {searchTerm || filter !== 'all' 
                ? 'No notifications match your current filters'
                : "You're all caught up! New notifications will appear here."
              }
            </p>
          </div>
        ) : (
          <>
            {notificationList.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const iconColor = getNotificationColor(notification.type, notification.priority)
              const isSelected = selectedNotifications.includes(notification.id)

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-secondary-50 transition-colors ${
                    !notification.isRead ? 'bg-primary-50' : ''
                  } ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />

                    <div className={`flex-shrink-0 p-2 rounded-full bg-white ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-secondary-900' : 'text-secondary-700'
                          }`}>
                            {notification.title}
                            {!notification.isRead && (
                              <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full inline-block"></span>
                            )}
                          </p>
                          <p className="text-sm text-secondary-600 mt-1">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-secondary-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>

                        {notification.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            notification.priority === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : notification.priority === 'medium'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load More */}
            {hasNextPage && (
              <div className="p-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Load more notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Get unread notification count
  const { data: notificationCount } = useQuery(
    'notificationCount',
    () => notificationApi.getUnreadCount(),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 25000 
    }
  )

  const unreadCount = notificationCount?.data?.unreadCount || 0

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-600 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}