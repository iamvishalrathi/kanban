import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { getErrorMessage, getErrorType, getFieldError } from '../utils/errorUtils'
import { authToasts } from '../utils/toastUtils'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        console.log('🔐 Login attempt started:', {
          email: credentials.email,
          hasPassword: !!credentials.password,
          environment: import.meta.env.MODE,
          apiUrl: import.meta.env.VITE_API_URL
        })
        
        try {
          set({ loading: true })
          console.log('📡 Calling authApi.login...')
          const response = await authApi.login(credentials)
          console.log('📡 authApi.login response:', response)

          if (response.success) {
            console.log('✅ Login successful:', {
              user: response.data.user.email,
              hasToken: !!response.data.token
            })
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              loading: false,
            })
            authToasts.loginSuccess(response.data.user.firstName)
            return { success: true }
          } else {
            console.log('❌ Login failed - Server returned success:false:', response)
            set({ loading: false })
            const errorMessage = getErrorMessage(response)
            toast.error(errorMessage, {
              duration: 6000,
              icon: '❌',
            })
            return { success: false, message: response.message, fieldErrors: response.errors }
          }
        } catch (error) {
          console.error('💥 Login error caught:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            code: error.code,
            stack: error.stack
          })
          set({ loading: false })
          const errorMessage = getErrorMessage(error)
          const errorType = getErrorType(error)
          
          // Show appropriate toast based on error type
          toast.error(errorMessage, {
            duration: errorType === 'network' ? 8000 : 6000,
            icon: errorType === 'network' ? '🌐' : '❌',
          })
          
          return { 
            success: false, 
            message: errorMessage,
            type: errorType,
            fieldErrors: error.response?.data?.errors
          }
        }
      },

      register: async (userData) => {
        console.log('📝 Register attempt started:', {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasPassword: !!userData.password,
          environment: import.meta.env.MODE,
          apiUrl: import.meta.env.VITE_API_URL
        })
        
        try {
          set({ loading: true })
          console.log('📡 Calling authApi.register...')
          const response = await authApi.register(userData)
          console.log('📡 authApi.register response:', response)

          if (response.success) {
            console.log('✅ Register successful:', {
              user: response.data.user.email,
              hasToken: !!response.data.token
            })
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              loading: false,
            })
            toast.success(`Welcome to Kanban, ${response.data.user.firstName}! 🎊`, {
              duration: 5000,
              icon: '🚀',
            })
            return { success: true }
          } else {
            console.log('❌ Register failed - Server returned success:false:', response)
            set({ loading: false })
            const errorMessage = getErrorMessage(response)
            toast.error(errorMessage, {
              duration: 6000,
              icon: '❌',
            })
            return { success: false, message: response.message, fieldErrors: response.errors }
          }
        } catch (error) {
          console.error('💥 Register error caught:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            code: error.code,
            stack: error.stack
          })
          set({ loading: false })
          const errorMessage = getErrorMessage(error)
          const errorType = getErrorType(error)
          
          // Show appropriate toast based on error type
          toast.error(errorMessage, {
            duration: errorType === 'network' ? 8000 : 6000,
            icon: errorType === 'network' ? '🌐' : '❌',
          })
          
          return { 
            success: false, 
            message: errorMessage,
            type: errorType,
            fieldErrors: error.response?.data?.errors
          }
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          toast.success('Logged out successfully')
        }
      },

      updateProfile: async (profileData) => {
        try {
          set({ loading: true })
          const response = await authApi.updateProfile(profileData)

          if (response.success) {
            set((state) => ({
              user: { ...state.user, ...response.data.user },
              loading: false,
            }))
            toast.success('Profile updated successfully!')
            return { success: true }
          } else {
            set({ loading: false })
            toast.error(response.message || 'Profile update failed')
            return { success: false, message: response.message }
          }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.message || 'Profile update failed'
          toast.error(message)
          return { success: false, message }
        }
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ loading: false })
          return
        }

        try {
          set({ loading: true })
          const response = await authApi.getProfile()

          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              loading: false,
            })
          } else {
            // Token is invalid, clear auth state
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            })
          }
        } catch (error) {
          // Token is invalid, clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          })
        }
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
