import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const FormField = forwardRef(({ 
  label, 
  id,
  error, 
  touched, 
  isValid,
  success,
  className, 
  children,
  required,
  description,
  ...props 
}, ref) => {
  const hasError = error && touched
  const hasSuccess = touched && isValid && !error
  
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-secondary-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Success indicator */}
        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-success-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-error-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Description text */}
      {description && !hasError && (
        <p className="text-xs text-secondary-500">
          {description}
        </p>
      )}
      
      {/* Error message */}
      {hasError && (
        <p 
          id={`${id}-error`}
          className="text-sm text-error-600" 
          role="alert"
        >
          {error}
        </p>
      )}
      
      {/* Success message */}
      {success && hasSuccess && (
        <p className="text-sm text-success-600">
          {success}
        </p>
      )}
    </div>
  )
})

FormField.displayName = 'FormField'

const Input = forwardRef(({ 
  className, 
  type = 'text',
  error,
  touched,
  isValid,
  ...props 
}, ref) => {
  const hasError = error && touched
  const hasSuccess = touched && isValid && !error
  
  return (
    <input
      type={type}
      className={cn(
        'input',
        hasError && 'input-error',
        hasSuccess && 'border-success-500 focus-visible:ring-success-500',
        className
      )}
      ref={ref}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-describedby={hasError ? `${props.id}-error` : undefined}
      {...props}
    />
  )
})

Input.displayName = 'Input'

const Button = forwardRef(({ 
  className, 
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  children,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-secondary-200 text-secondary-900 hover:bg-secondary-300 active:bg-secondary-400',
    outline: 'border border-secondary-300 bg-transparent hover:bg-secondary-50 active:bg-secondary-100',
    danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800'
  }
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        'transition-all duration-200',
        className
      )}
      disabled={isDisabled}
      ref={ref}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { FormField, Input, Button }