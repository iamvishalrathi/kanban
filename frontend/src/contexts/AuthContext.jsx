import { createContext, useContext } from 'react'
import { useAuthStore } from '../stores/authStore'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // If no context provider, fall back to the store
    return useAuthStore()
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const authState = useAuthStore()
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext