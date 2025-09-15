import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthStore } from '../stores/authStore'
import { PasswordStrength } from '../components/ui/PasswordStrength'
import { useFormPersistence } from '../utils/formPersistence'
import { cn } from '../utils/cn'

const schema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

export const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser, isAuthenticated } = useAuthStore()

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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Auto-persist form data (excluding sensitive fields)
  const { clearSavedData } = useFormPersistence('register', watch, reset, setValue)

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
      const { confirmPassword, ...userData } = data
      const result = await registerUser(userData)
      
      if (!result.success) {
        // Handle field-specific errors - preserve form values
        if (result.fieldErrors && Array.isArray(result.fieldErrors)) {
          result.fieldErrors.forEach(fieldError => {
            if (['email', 'password', 'firstName', 'lastName'].includes(fieldError.field)) {
              setError(fieldError.field, { 
                type: 'server',
                message: fieldError.message 
              })
            }
          })
        }
        
        // Auth store already shows toast notifications for errors
        // Only handle field-specific errors here for inline display
        
        // Important: Don't reset form values on error - they should remain
      } else {
        // Auth store already shows success toast notification
        // Clear saved form data on successful registration
        clearSavedData()
        // Success redirect is handled by the auth store
      }
    } catch (err) {
      // Auth store already handles error toast notifications
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-1">
                  First name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    {...register('firstName')}
                    type="text"
                    autoComplete="given-name"
                    className={cn(
                      'input',
                      errors.firstName && 'input-error',
                      touchedFields.firstName && !errors.firstName && 'border-success-500 focus-visible:ring-success-500'
                    )}
                    placeholder="Enter your first name"
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {touchedFields.firstName && !errors.firstName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.firstName && (
                  <p id="firstName-error" className="mt-1 text-sm text-error-600" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-1">
                  Last name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    {...register('lastName')}
                    type="text"
                    autoComplete="family-name"
                    className={cn(
                      'input',
                      errors.lastName && 'input-error',
                      touchedFields.lastName && !errors.lastName && 'border-success-500 focus-visible:ring-success-500'
                    )}
                    placeholder="Enter your last name"
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                  {touchedFields.lastName && !errors.lastName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.lastName && (
                  <p id="lastName-error" className="mt-1 text-sm text-error-600" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
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
                  autoComplete="new-password"
                  className={cn(
                    'input',
                    errors.password && 'input-error'
                  )}
                  placeholder="Create a strong password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                />
              </div>
              <PasswordStrength password={watch('password')} />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-error-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className={cn(
                    'input',
                    errors.confirmPassword && 'input-error',
                    touchedFields.confirmPassword && !errors.confirmPassword && watch('password') === watch('confirmPassword') && 'border-success-500 focus-visible:ring-success-500'
                  )}
                  placeholder="Confirm your password"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                {touchedFields.confirmPassword && !errors.confirmPassword && watch('password') === watch('confirmPassword') && watch('confirmPassword') && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-error-600" role="alert">
                  {errors.confirmPassword.message}
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
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
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
                  <span id="loading-message">Creating account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
            {!isValid && Object.keys(errors).length === 0 && (
              <p className="mt-2 text-xs text-secondary-500 text-center">
                Please fill in all required fields correctly
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
