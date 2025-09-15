import { useCallback, useState } from 'react'
import { debounce } from '../utils/validationUtils'

// Custom hook for enhanced form validation
export const useFormValidation = (validationRules = {}) => {
  const [fieldValidation, setFieldValidation] = useState({})
  
  const validateField = useCallback(
    debounce((fieldName, value) => {
      if (!validationRules[fieldName]) return
      
      const result = validationRules[fieldName](value)
      setFieldValidation(prev => ({
        ...prev,
        [fieldName]: result
      }))
    }, 300),
    [validationRules]
  )
  
  const clearFieldValidation = useCallback((fieldName) => {
    setFieldValidation(prev => {
      const newState = { ...prev }
      delete newState[fieldName]
      return newState
    })
  }, [])
  
  const clearAllValidation = useCallback(() => {
    setFieldValidation({})
  }, [])
  
  const getFieldValidation = useCallback((fieldName) => {
    return fieldValidation[fieldName] || { isValid: true, message: '' }
  }, [fieldValidation])
  
  return {
    fieldValidation,
    validateField,
    clearFieldValidation,
    clearAllValidation,
    getFieldValidation
  }
}

// Form submission handler with validation
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitErrors, setSubmitErrors] = useState({})
  
  const handleSubmit = useCallback(async (submitFn, data, options = {}) => {
    if (isSubmitting) return
    
    const { onSuccess, onError, preventMultiple = true } = options
    
    if (preventMultiple) {
      setIsSubmitting(true)
    }
    
    setSubmitErrors({})
    
    try {
      const result = await submitFn(data)
      
      if (result && !result.success) {
        // Handle server-side validation errors
        if (result.fieldErrors) {
          const errors = {}
          result.fieldErrors.forEach(error => {
            errors[error.field] = error.message
          })
          setSubmitErrors(errors)
        }
        
        if (onError) {
          onError(result)
        }
        
        return result
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      const errorResult = {
        success: false,
        message: 'An unexpected error occurred',
        error
      }
      
      if (onError) {
        onError(errorResult)
      }
      
      return errorResult
    } finally {
      if (preventMultiple) {
        setIsSubmitting(false)
      }
    }
  }, [isSubmitting])
  
  const clearSubmitErrors = useCallback(() => {
    setSubmitErrors({})
  }, [])
  
  const setSubmitError = useCallback((field, message) => {
    setSubmitErrors(prev => ({
      ...prev,
      [field]: message
    }))
  }, [])
  
  return {
    isSubmitting,
    submitErrors,
    handleSubmit,
    clearSubmitErrors,
    setSubmitError,
    setIsSubmitting
  }
}