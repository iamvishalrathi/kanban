import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        try {
          set({ loading: true })
          const response = await authApi.login(credentials)
          
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              loading: false,
            })
            toast.success('Login successful!')
            return { success: true }
          } else {
            set({ loading: false })
            toast.error(response.message || 'Login failed')
            return { success: false, message: response.message }
          }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return { success: false, message }
        }
      },

      register: async (userData) => {
        try {
          set({ loading: true })
          const response = await authApi.register(userData)
          
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              loading: false,
            })
            toast.success('Registration successful!')
            return { success: true }
          } else {
            set({ loading: false })
            toast.error(response.message || 'Registration failed')
            return { success: false, message: response.message }
          }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return { success: false, message }
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
