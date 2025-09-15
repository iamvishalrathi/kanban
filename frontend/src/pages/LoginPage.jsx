import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useFormPersistence } from '../utils/formPersistence'
import { cn } from '../utils/cn'

const schema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required('Password is required')
    .min(1, 'Password cannot be empty'),
})

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuthStore()
  const { success, error } = useToastStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields, dirtyFields },
    setError,
    clearErrors,
    watch,
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validate on change for real-time feedback
    reValidateMode: 'onChange',
    shouldFocusError: true, // Focus first field with error
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Auto-persist form data (excluding sensitive fields)
  const { clearSavedData } = useFormPersistence('login', watch, reset, setValue)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data) => {
    // Prevent submission if already loading or form is invalid
    if (isLoading || !isValid) {
      return
    }
    
    setIsLoading(true)
    
    // Clear only server errors, keep validation errors
    clearErrors(['root'])
    
    try {
      const result = await login(data)
      
      if (!result.success) {
        // Handle field-specific errors - preserve form values
        if (result.fieldErrors && Array.isArray(result.fieldErrors)) {
          result.fieldErrors.forEach(fieldError => {
            if (fieldError.field === 'email' || fieldError.field === 'password') {
              setError(fieldError.field, { 
                type: 'server',
                message: fieldError.message 
              })
            }
          })
        }
        
        // Show toast notification for general errors
        const errorMessage = result.message || 'Login failed. Please check your credentials and try again.'
        error(errorMessage)
        
        // If no field-specific errors, also show in form
        if (!result.fieldErrors || result.fieldErrors.length === 0) {
          setError('root', { 
            type: 'server',
            message: errorMessage
          })
        }
        
        // Important: Don't reset form values on error - they should remain
      } else {
        success('Welcome back! You have been successfully logged in.')
        // Clear saved form data on successful login
        clearSavedData()
        // Success redirect is handled by the auth store
      }
    } catch (err) {
      const errorMessage = 'Network error. Please check your connection and try again.'
      error(errorMessage)
      setError('root', { 
        type: 'network',
        message: errorMessage
      })
      // Important: Don't reset form on network errors - preserve user input
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    'input',
                    errors.email && 'input-error',
                    touchedFields.email && !errors.email && 'border-success-500 focus-visible:ring-success-500'
                  )}
                  placeholder="Enter your email address"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {touchedFields.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-error-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className={cn(
                    'input',
                    errors.password && 'input-error',
                    touchedFields.password && !errors.password && 'border-success-500 focus-visible:ring-success-500'
                  )}
                  placeholder="Enter your password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {touchedFields.password && !errors.password && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-error-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && errors.root.message && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className={cn(
                "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:cursor-not-allowed transition-all duration-200",
                isLoading || !isValid
                  ? "bg-secondary-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 active:bg-primary-800"
              )}
              aria-describedby={isLoading ? "loading-message" : undefined}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="border-white border-t-transparent mr-2" />
                  <span id="loading-message">Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
