// Toast configuration and enhanced toast utilities
import toast from 'react-hot-toast'

// Toast configuration
export const toastConfig = {
  duration: 4000,
  position: 'top-right',
  // Global styling
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  // Success toast styling
  success: {
    duration: 4000,
    style: {
      background: '#059669',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#059669',
    },
  },
  // Error toast styling
  error: {
    duration: 6000,
    style: {
      background: '#DC2626',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#DC2626',
    },
  },
  // Loading toast styling
  loading: {
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  },
}

// Enhanced toast functions
export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig.success,
    ...options,
  })
}

export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig.error,
    ...options,
  })
}

export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig.loading,
    ...options,
  })
}

// Authentication-specific toasts
export const authToasts = {
  loginSuccess: (userName) => 
    showSuccessToast(`Welcome back, ${userName}! 👋`, {
      icon: '🎉',
      duration: 4000,
    }),
  
  registerSuccess: (userName) => 
    showSuccessToast(`Welcome to Kanban, ${userName}! 🎊`, {
      icon: '🚀',
      duration: 5000,
    }),
  
  logoutSuccess: () => 
    showSuccessToast('You\'ve been logged out successfully', {
      icon: '👋',
      duration: 3000,
    }),
  
  loginError: (message) => 
    showErrorToast(message, {
      icon: '❌',
      duration: 6000,
    }),
  
  registerError: (message) => 
    showErrorToast(message, {
      icon: '❌', 
      duration: 6000,
    }),
  
  networkError: () => 
    showErrorToast('Network error. Please check your connection', {
      icon: '🌐',
      duration: 8000,
    }),
  
  serverError: () => 
    showErrorToast('Server error. Please try again later', {
      icon: '⚠️',
      duration: 6000,
    }),
}

// Form validation toasts
export const validationToasts = {
  requiredField: (fieldName) => 
    showErrorToast(`${fieldName} is required`, {
      icon: '📝',
      duration: 4000,
    }),
  
  invalidEmail: () => 
    showErrorToast('Please enter a valid email address', {
      icon: '📧',
      duration: 4000,
    }),
  
  passwordMismatch: () => 
    showErrorToast('Passwords do not match', {
      icon: '🔒',
      duration: 4000,
    }),
  
  weakPassword: () => 
    showErrorToast('Password must be at least 8 characters long', {
      icon: '🔐',
      duration: 5000,
    }),
}

// General utility toasts
export const utilityToasts = {
  copied: () => 
    toast.success('Copied to clipboard', {
      icon: '📋',
      duration: 2000,
    }),
  
  saved: () => 
    toast.success('Changes saved', {
      icon: '💾',
      duration: 3000,
    }),
  
  deleted: () => 
    toast.success('Deleted successfully', {
      icon: '🗑️',
      duration: 3000,
    }),
  
  undo: (action) => 
    toast.success(`${action} undone`, {
      icon: '↩️',
      duration: 3000,
    }),
}

export default {
  toastConfig,
  showSuccessToast,
  showErrorToast, 
  showLoadingToast,
  authToasts,
  validationToasts,
  utilityToasts,
}