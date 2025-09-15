import { useEffect } from 'react'
import { useToastStore } from '../../stores/toastStore'
import { cn } from '../../utils/cn'

const Toast = ({ toast, onRemove }) => {
  const { id, type, title, message } = toast
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, toast.duration)
    
    return () => clearTimeout(timer)
  }, [id, toast.duration, onRemove])
  
  const icons = {
    success: (
      <svg className="h-5 w-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-error-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  }
  
  const backgroundColors = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-error-50 border-error-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }
  
  return (
    <div
      className={cn(
        'relative flex items-start p-4 rounded-lg border shadow-lg animate-slide-in-right',
        backgroundColors[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="ml-3 flex-1">
        {title && (
          <h4 className={cn(
            'text-sm font-medium',
            type === 'success' && 'text-success-800',
            type === 'error' && 'text-error-800',
            type === 'warning' && 'text-yellow-800',
            type === 'info' && 'text-blue-800'
          )}>
            {title}
          </h4>
        )}
        <p className={cn(
          'text-sm',
          title ? 'mt-1' : '',
          type === 'success' && 'text-success-700',
          type === 'error' && 'text-error-700',
          type === 'warning' && 'text-yellow-700',
          type === 'info' && 'text-blue-700'
        )}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className={cn(
          'flex-shrink-0 ml-4 rounded-md inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
          type === 'success' && 'text-success-500 hover:text-success-600 focus:ring-success-500',
          type === 'error' && 'text-error-500 hover:text-error-600 focus:ring-error-500',
          type === 'warning' && 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500',
          type === 'info' && 'text-blue-500 hover:text-blue-600 focus:ring-blue-500'
        )}
        aria-label="Close notification"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()
  
  if (toasts.length === 0) return null
  
  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}