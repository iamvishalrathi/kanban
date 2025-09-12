// Authentication error constants and types
export const AUTH_ERRORS = {
  // Login errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_INACTIVE: 'Account has been deactivated',
  ACCOUNT_LOCKED: 'Account is temporarily locked',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  
  // Registration errors
  EMAIL_EXISTS: 'An account with this email already exists',
  USERNAME_EXISTS: 'This username is already taken',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  INVALID_EMAIL: 'Please enter a valid email address',
  
  // Network/Server errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  
  // General errors
  UNKNOWN_ERROR: 'An unexpected error occurred',
  VALIDATION_ERROR: 'Please check your input and try again',
  RATE_LIMITED: 'Too many attempts. Please try again later',
}

export const ERROR_TYPES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication', 
  NETWORK: 'network',
  SERVER: 'server',
  UNKNOWN: 'unknown'
}

// Error mapping for backend responses
export const ERROR_MESSAGE_MAP = {
  'Invalid email or password': AUTH_ERRORS.INVALID_CREDENTIALS,
  'User with this email already exists': AUTH_ERRORS.EMAIL_EXISTS,
  'User with this username already exists': AUTH_ERRORS.USERNAME_EXISTS,
  'Password must be at least 6 characters long': AUTH_ERRORS.WEAK_PASSWORD,
  'Please provide a valid email address': AUTH_ERRORS.INVALID_EMAIL,
  'All fields are required': AUTH_ERRORS.VALIDATION_ERROR,
  'Email and password are required': AUTH_ERRORS.VALIDATION_ERROR,
  'Invalid or inactive user': AUTH_ERRORS.ACCOUNT_INACTIVE,
}

// Get user-friendly error message
export const getErrorMessage = (error) => {
  // Handle axios errors
  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.message || error.message
    
    // Map specific backend messages
    if (ERROR_MESSAGE_MAP[message]) {
      return ERROR_MESSAGE_MAP[message]
    }
    
    // Handle HTTP status codes
    switch (status) {
      case 400:
        return AUTH_ERRORS.VALIDATION_ERROR
      case 401:
        return AUTH_ERRORS.INVALID_CREDENTIALS
      case 403:
        return AUTH_ERRORS.ACCOUNT_INACTIVE
      case 422:
        return message || AUTH_ERRORS.VALIDATION_ERROR
      case 429:
        return AUTH_ERRORS.RATE_LIMITED
      case 500:
        return AUTH_ERRORS.SERVER_ERROR
      default:
        return message || AUTH_ERRORS.UNKNOWN_ERROR
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return AUTH_ERRORS.NETWORK_ERROR
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    return AUTH_ERRORS.TIMEOUT_ERROR
  }
  
  // Default fallback
  return error.message || AUTH_ERRORS.UNKNOWN_ERROR
}

// Get error type for styling/icons
export const getErrorType = (error) => {
  if (error.response) {
    const status = error.response.status
    if (status >= 400 && status < 500) return ERROR_TYPES.AUTHENTICATION
    if (status >= 500) return ERROR_TYPES.SERVER
  }
  
  if (error.code === 'NETWORK_ERROR') return ERROR_TYPES.NETWORK
  if (error.name === 'ValidationError') return ERROR_TYPES.VALIDATION
  
  return ERROR_TYPES.UNKNOWN
}

// Field-specific error handling
export const getFieldError = (error, field) => {
  // Handle validation errors from backend
  if (error.response?.data?.errors) {
    const fieldError = error.response.data.errors.find(err => err.field === field)
    return fieldError?.message
  }
  
  // Handle field-specific messages
  const message = error.response?.data?.message || error.message
  if (field === 'email' && message.toLowerCase().includes('email')) {
    return message
  }
  if (field === 'password' && message.toLowerCase().includes('password')) {
    return message
  }
  
  return null
}

export default {
  AUTH_ERRORS,
  ERROR_TYPES,
  getErrorMessage,
  getErrorType,
  getFieldError
}