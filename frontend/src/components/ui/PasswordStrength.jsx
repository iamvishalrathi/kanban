import { useMemo } from 'react'
import { cn } from '../../utils/cn'

const PasswordStrength = ({ password, className }) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, text: '', color: '' }
    
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
    
    // Calculate score
    if (checks.length) score++
    if (checks.lowercase) score++
    if (checks.uppercase) score++
    if (checks.number) score++
    if (checks.special) score++
    
    // Length bonus
    if (password.length >= 12) score++
    
    let text, color, bgColor
    if (score <= 2) {
      text = 'Weak'
      color = 'text-red-600'
      bgColor = 'bg-red-500'
    } else if (score <= 4) {
      text = 'Fair'
      color = 'text-yellow-600'
      bgColor = 'bg-yellow-500'
    } else if (score <= 5) {
      text = 'Good'
      color = 'text-blue-600'
      bgColor = 'bg-blue-500'
    } else {
      text = 'Strong'
      color = 'text-green-600'
      bgColor = 'bg-green-500'
    }
    
    return { score, text, color, bgColor, checks }
  }, [password])

  if (!password) return null

  return (
    <div className={cn('mt-2', className)}>
      {/* Strength bar */}
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1 rounded-full transition-colors duration-300',
              strength.score >= i * 1.5 ? strength.bgColor : 'bg-secondary-200'
            )}
          />
        ))}
      </div>
      
      {/* Strength text */}
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', strength.color)}>
          Password strength: {strength.text}
        </span>
      </div>
      
      {/* Requirements checklist */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center text-xs">
          <svg 
            className={cn('w-3 h-3 mr-1', strength.checks.length ? 'text-green-500' : 'text-secondary-400')} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            {strength.checks.length ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className={strength.checks.length ? 'text-secondary-600' : 'text-secondary-500'}>
            At least 8 characters
          </span>
        </div>
        <div className="flex items-center text-xs">
          <svg 
            className={cn('w-3 h-3 mr-1', strength.checks.lowercase ? 'text-green-500' : 'text-secondary-400')} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            {strength.checks.lowercase ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className={strength.checks.lowercase ? 'text-secondary-600' : 'text-secondary-500'}>
            One lowercase letter
          </span>
        </div>
        <div className="flex items-center text-xs">
          <svg 
            className={cn('w-3 h-3 mr-1', strength.checks.uppercase ? 'text-green-500' : 'text-secondary-400')} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            {strength.checks.uppercase ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className={strength.checks.uppercase ? 'text-secondary-600' : 'text-secondary-500'}>
            One uppercase letter
          </span>
        </div>
        <div className="flex items-center text-xs">
          <svg 
            className={cn('w-3 h-3 mr-1', strength.checks.number ? 'text-green-500' : 'text-secondary-400')} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            {strength.checks.number ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className={strength.checks.number ? 'text-secondary-600' : 'text-secondary-500'}>
            One number
          </span>
        </div>
      </div>
    </div>
  )
}

export { PasswordStrength }