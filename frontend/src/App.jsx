import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { SocketProvider } from './contexts/SocketContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Pages
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  const { user, loading, checkAuth } = useAuthStore()

  useEffect(() => {
    // Log environment info on app startup
    console.log('🚀 Kanban App Starting:', {
      environment: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      isDev: import.meta.env.DEV,
      apiUrl: import.meta.env.VITE_API_URL,
      allEnvVars: import.meta.env,
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      origin: window.location.origin
    })
    
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {user ? (
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:boardId"
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SocketProvider>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default App
