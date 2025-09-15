// Email validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Enhanced email validation with more detailed checks
export const validateEmailFormat = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' }
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'Email address is too long' }
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (domain) {
    // Check for common misspellings
    const typos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com'
    }
    
    if (typos[domain]) {
      return { 
        isValid: false, 
        message: `Did you mean ${email.replace(domain, typos[domain])}?`,
        suggestion: email.replace(domain, typos[domain])
      }
    }
  }
  
  return { isValid: true, message: '' }
}

// Name validation utilities
export const validateName = (name, fieldName = 'Name') => {
  if (!name) {
    return { isValid: false, message: `${fieldName} is required` }
  }
  
  if (name.length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters` }
  }
  
  if (name.length > 50) {
    return { isValid: false, message: `${fieldName} must not exceed 50 characters` }
  }
  
  const nameRegex = /^[a-zA-Z\s-']+$/
  if (!nameRegex.test(name)) {
    return { isValid: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }
  
  return { isValid: true, message: '' }
}

// Password strength calculation
export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: [] }
  
  let score = 0
  const feedback = []
  
  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }
  
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }
  
  // Common password checks
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    score -= 2
    feedback.push('Avoid common passwords')
  }
  
  // Sequential characters check
  if (/123|abc|qwe/i.test(password)) {
    score -= 1
    feedback.push('Avoid sequential characters')
  }
  
  return { score: Math.max(0, Math.min(6, score)), feedback }
}

// Real-time validation debouncer
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}