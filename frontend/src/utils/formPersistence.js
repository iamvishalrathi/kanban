// Form persistence utility to save/restore form data in localStorage
// This provides an extra layer of input preservation across page refreshes

export const FormPersistence = {
  // Save form data to localStorage with a unique key
  saveFormData: (formKey, data) => {
    try {
      const formData = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes expiration
      }
      localStorage.setItem(`form_${formKey}`, JSON.stringify(formData))
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  },

  // Load form data from localStorage
  loadFormData: (formKey) => {
    try {
      const stored = localStorage.getItem(`form_${formKey}`)
      if (!stored) return null

      const formData = JSON.parse(stored)
      
      // Check if data has expired
      if (Date.now() > formData.expires) {
        localStorage.removeItem(`form_${formKey}`)
        return null
      }

      return formData.data
    } catch (error) {
      // Clear corrupted data and return null
      localStorage.removeItem(`form_${formKey}`)
      return null
    }
  },

  // Clear form data from localStorage
  clearFormData: (formKey) => {
    try {
      localStorage.removeItem(`form_${formKey}`)
    } catch (error) {
      // Silently fail
    }
  },

  // Auto-save form data as user types (debounced)
  createAutoSaver: (formKey, delay = 1000) => {
    let timeoutId = null
    
    return (data) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        FormPersistence.saveFormData(formKey, data)
      }, delay)
    }
  }
}

// Hook to automatically persist and restore form data
import { useEffect, useRef } from 'react'

export const useFormPersistence = (formKey, watch, reset, setValue) => {
  const autoSave = useRef(FormPersistence.createAutoSaver(formKey))
  const isInitialized = useRef(false)

  // Load saved data on component mount
  useEffect(() => {
    if (!isInitialized.current) {
      const savedData = FormPersistence.loadFormData(formKey)
      if (savedData && Object.keys(savedData).length > 0) {
        // Only restore non-password fields for security
        const dataToRestore = { ...savedData }
        delete dataToRestore.password
        delete dataToRestore.confirmPassword
        
        Object.entries(dataToRestore).forEach(([key, value]) => {
          if (value && value.trim !== '') {
            setValue(key, value, { shouldDirty: true })
          }
        })
      }
      isInitialized.current = true
    }
  }, [formKey, setValue])

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = watch((data) => {
      if (isInitialized.current) {
        // Don't save password fields for security
        const dataToSave = { ...data }
        delete dataToSave.password
        delete dataToSave.confirmPassword
        autoSave.current(dataToSave)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [watch])

  // Clear saved data on successful submission
  const clearSavedData = () => {
    FormPersistence.clearFormData(formKey)
  }

  return { clearSavedData }
}