import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Determine the correct base URL based on environment
const getBaseURL = () => {
  const isProd = import.meta.env.PROD
  const isDev = import.meta.env.DEV
  const mode = import.meta.env.MODE
  const envApiUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'https://kanban-backend-6fgz.onrender.com'
  
  console.log('🔧 API Configuration Debug:')
  console.log('- Environment MODE:', mode)
  console.log('- Environment PROD:', isProd)
  console.log('- Environment DEV:', isDev)
  console.log('- VITE_API_URL from env:', envApiUrl)
  console.log('- Current hostname:', window.location.hostname)
  console.log('- Environment keys:', Object.keys(import.meta.env))
  
  // Force production URL if we're not on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (!isLocalhost || isProd) {
    const baseUrl = (envApiUrl || fallbackUrl) + '/api'
    console.log('✅ Production/Remote mode - Using base URL:', baseUrl)
    return baseUrl
  } else {
    console.log('🛠️ Local development mode - Using proxy: /api')
    return '/api'
  }
}

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      hasToken: !!token,
      headers: config.headers
    })
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    return response.data
  },
  (error) => {
    console.error('📥 API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      message: error.message,
      response: error.response?.data,
      headers: error.response?.headers,
      code: error.code
    })
    
    if (error.response?.status === 401) {
      console.log('🚪 Unauthorized - Clearing auth and redirecting to login')
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  searchUsers: (query) => api.get(`/auth/search?q=${encodeURIComponent(query)}`),
  refreshToken: () => api.post('/auth/refresh'),
  deactivateAccount: () => api.delete('/auth/deactivate'),
}

// Board API
export const boardApi = {
  getBoards: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/boards?${queryString}`)
  },
  createBoard: (data) => api.post('/boards', data),
  getBoard: (boardId) => api.get(`/boards/${boardId}`),
  updateBoard: (boardId, data) => api.put(`/boards/${boardId}`, data),
  deleteBoard: (boardId) => api.delete(`/boards/${boardId}`),
  archiveBoard: (boardId) => api.patch(`/boards/${boardId}/archive`),
  duplicateBoard: (boardId) => api.post(`/boards/${boardId}/duplicate`),
  exportBoard: (boardId) => api.get(`/boards/${boardId}/export`),
  getBoardStats: (boardId) => api.get(`/boards/${boardId}/stats`),
}

// Column API
export const columnApi = {
  createColumn: (boardId, data) => api.post(`/boards/${boardId}/columns`, data),
  updateColumn: (boardId, columnId, data) => api.put(`/boards/${boardId}/columns/${columnId}`, data),
  deleteColumn: (boardId, columnId) => api.delete(`/boards/${boardId}/columns/${columnId}`),
  reorderColumns: (boardId, data) => api.put(`/boards/${boardId}/columns/reorder`, data),
}

// Card API
export const cardApi = {
  createCard: (data) => api.post(`/cards`, data),
  getCard: (cardId) => api.get(`/cards/${cardId}`),
  updateCard: (cardId, data) => api.put(`/cards/${cardId}`, data),
  deleteCard: (cardId) => api.delete(`/cards/${cardId}`),
  moveCard: (cardId, data) => api.put(`/cards/${cardId}/move`, data),
  getCardHistory: (cardId) => api.get(`/cards/${cardId}/history`),
}

// Comment API
export const commentApi = {
  getComments: (cardId) => api.get(`/cards/${cardId}/comments`),
  createComment: (cardId, data) => api.post(`/cards/${cardId}/comments`, data),
}

// Member API
export const memberApi = {
  getMembers: (boardId) => api.get(`/boards/${boardId}/members`),
  inviteMember: (boardId, data) => api.post(`/boards/${boardId}/members/invite`, data),
  updateMemberRole: (boardId, memberId, data) => api.put(`/boards/${boardId}/members/${memberId}/role`, data),
  removeMember: (boardId, memberId) => api.delete(`/boards/${boardId}/members/${memberId}`),
  leaveBoard: (boardId) => api.post(`/boards/${boardId}/leave`),
}

// Notification API
export const notificationApi = {
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/notifications?${queryString}`)
  },
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// Note: User profile operations are handled through authApi

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/admin/users?${queryString}`)
  },
  banUser: (userId) => api.put(`/admin/users/${userId}/ban`),
  unbanUser: (userId) => api.put(`/admin/users/${userId}/unban`),
  getAllBoards: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/admin/boards?${queryString}`)
  },
  getAuditLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/admin/audit-logs?${queryString}`)
  },
  getSystemStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/admin/stats?${queryString}`)
  },
}

export default api
