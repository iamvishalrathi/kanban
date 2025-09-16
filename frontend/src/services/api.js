import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Determine the correct base URL based on environment
const getBaseURL = () => {
  const isProd = import.meta.env.PROD
  const isDev = import.meta.env.DEV
  const mode = import.meta.env.MODE
  const envApiUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'https://kanban-backend-6fgz.onrender.com'
  
  // Force production URL if we're not on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (!isLocalhost || isProd) {
    const baseUrl = (envApiUrl || fallbackUrl) + '/api'
    return baseUrl
  } else {
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
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
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
  uploadBackground: (boardId, file) => {
    const formData = new FormData();
    formData.append('background', file);
    return api.post(`/boards/${boardId}/background`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteBackground: (boardId) => api.delete(`/boards/${boardId}/background`),
}

// Column API
export const columnApi = {
  createColumn: (data) => api.post(`/boards/${data.boardId}/columns`, data),
  getColumn: (columnId) => api.get(`/columns/${columnId}`),
  updateColumn: (columnId, data) => api.put(`/columns/${columnId}`, data),
  deleteColumn: (columnId) => api.delete(`/columns/${columnId}`),
  archiveColumn: (columnId) => api.put(`/columns/${columnId}/archive`),
  duplicateColumn: (columnId, data) => api.post(`/columns/${columnId}/duplicate`, data),
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
  getComments: (cardId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/cards/${cardId}/comments?${queryString}`)
  },
  createComment: (cardId, data) => api.post(`/cards/${cardId}/comments`, data),
  updateComment: (commentId, data) => api.put(`/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  createReply: (commentId, data) => api.post(`/comments/${commentId}/replies`, data),
  getReplies: (commentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/comments/${commentId}/replies?${queryString}`)
  },
  addReaction: (commentId, data) => api.post(`/comments/${commentId}/reactions`, data),
  removeReaction: (commentId, reactionType) => api.delete(`/comments/${commentId}/reactions/${reactionType}`),
  resolveComment: (commentId) => api.put(`/comments/${commentId}/resolve`),
  unresolveComment: (commentId) => api.put(`/comments/${commentId}/unresolve`),
  uploadAttachment: (commentId, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.post(`/comments/${commentId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
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

// User Profile API
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAvatar: () => api.delete('/users/me/avatar'),
  getPreferences: () => api.get('/users/me/preferences'),
  updatePreferences: (data) => api.put('/users/me/preferences', data),
  getActivity: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/users/me/activity?${queryString}`)
  },
  getNotificationSettings: () => api.get('/users/me/notification-settings'),
  updateNotificationSettings: (data) => api.put('/users/me/notification-settings', data),
  getBoardsSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/users/me/boards/summary?${queryString}`)
  },
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/users/me/stats?${queryString}`)
  },
  deleteAccount: (data) => api.delete('/users/me', { data }),
  exportData: () => api.get('/users/me/export')
}

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/admin/users?${queryString}`)
  },
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  banUser: (userId, data) => api.put(`/admin/users/${userId}/ban`, data),
  unbanUser: (userId) => api.put(`/admin/users/${userId}/unban`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  impersonateUser: (userId) => api.post(`/admin/users/${userId}/impersonate`),
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

// Analytics API
export const analyticsApi = {
  getOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/overview?${queryString}`)
  },
  getActivity: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/activity?${queryString}`)
  },
  getProductivity: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/productivity?${queryString}`)
  },
  getBoards: () => api.get('/analytics/boards'),
  getUserStats: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/users/${userId}?${queryString}`)
  },
  getBoardStats: (boardId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/boards/${boardId}?${queryString}`)
  },
  exportAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/analytics/export?${queryString}`)
  },
}

// Search API
export const searchApi = {
  search: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/search?${queryString}`)
  },
  quickSearch: (query) => {
    return api.get(`/search/quick?q=${encodeURIComponent(query)}`)
  },
  getSavedSearches: () => api.get('/search/saved'),
  saveSearch: (data) => api.post('/search/saved', data),
  updateSavedSearch: (searchId, data) => api.put(`/search/saved/${searchId}`, data),
  deleteSavedSearch: (searchId) => api.delete(`/search/saved/${searchId}`),
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/search/users?${queryString}`)
  },
  getLabels: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/search/labels?${queryString}`)
  },
}

// Template API
export const templateApi = {
  getTemplates: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/templates?${queryString}`)
  },
  getTemplate: (templateId) => api.get(`/templates/${templateId}`),
  createFromTemplate: (templateId, data) => api.post(`/templates/${templateId}/create`, data),
  saveAsTemplate: (boardId, data) => api.post(`/boards/${boardId}/save-as-template`, data),
  getCategories: () => api.get('/templates/categories'),
}

// Attachment API
export const attachmentApi = {
  uploadFile: (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteFile: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
  getFile: (attachmentId) => api.get(`/attachments/${attachmentId}`),
  downloadFile: (attachmentId) => {
    return api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    })
  },
}

// Notification API Extensions
export const notificationApi2 = {
  ...notificationApi,
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  deleteMultiple: (notificationIds) => api.delete('/notifications/bulk', { data: { ids: notificationIds } }),
  markMultipleAsRead: (notificationIds) => api.put('/notifications/bulk/read', { ids: notificationIds }),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data),
}

// Update the original notificationApi to include new methods
Object.assign(notificationApi, notificationApi2)

export default api
