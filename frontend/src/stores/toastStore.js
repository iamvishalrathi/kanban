import { create } from 'zustand'

const useToastStore = create((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info', // info, success, error, warning
      title: '',
      message: '',
      duration: 5000,
      ...toast,
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },
  
  clearAllToasts: () => {
    set({ toasts: [] })
  },
  
  // Helper methods for different toast types
  success: (message, options = {}) => {
    return get().addToast({
      type: 'success',
      message,
      ...options
    })
  },
  
  error: (message, options = {}) => {
    return get().addToast({
      type: 'error',
      message,
      duration: 7000, // Error messages stay longer
      ...options
    })
  },
  
  warning: (message, options = {}) => {
    return get().addToast({
      type: 'warning',
      message,
      ...options
    })
  },
  
  info: (message, options = {}) => {
    return get().addToast({
      type: 'info',
      message,
      ...options
    })
  },
}))

export { useToastStore }