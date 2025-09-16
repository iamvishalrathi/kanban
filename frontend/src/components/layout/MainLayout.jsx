import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { NotificationBell } from '../notifications/NotificationSystem'
import { UserPresence } from '../collaboration/RealTimeFeatures'
import { QuickSearch } from '../search/SearchSystem'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  User, 
  LogOut,
  Menu,
  X,
  BarChart3,
  MessageCircle,
  FileText,
  Archive,
  Bookmark,
  Shield,
  ChevronDown,
  Home
} from 'lucide-react'

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'View all your boards'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Track productivity and insights'
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      description: 'View all notifications'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileText,
      description: 'Browse board templates'
    },
    {
      name: 'Archive',
      href: '/archive',
      icon: Archive,
      description: 'Archived boards and cards'
    }
  ]

  const adminItems = [
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      description: 'System administration'
    }
  ]

  const userMenuItems = [
    {
      name: 'Profile Settings',
      href: '/profile',
      icon: User,
      description: 'Manage your account'
    },
    {
      name: 'Preferences',
      href: '/preferences', 
      icon: Settings,
      description: 'App preferences'
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: MessageCircle,
      description: 'Get help and support'
    }
  ]

  const handleSearchSelect = (type, item) => {
    switch (type) {
      case 'board':
        navigate(`/board/${item.id}`)
        break
      case 'card':
        navigate(`/board/${item.boardId}?card=${item.id}`)
        break
      case 'user':
        navigate(`/users/${item.id}`)
        break
      default:
        break
    }
    setIsQuickSearchOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-secondary-900 hidden sm:block">
                  Kanban Pro
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      }`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}

                {/* Admin Navigation */}
                {isAdmin && adminItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                      }`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-xs mx-4">
              <div className="relative">
                <button
                  onClick={() => setIsQuickSearchOpen(true)}
                  className="w-full flex items-center px-3 py-2 border border-secondary-300 rounded-md text-sm text-secondary-500 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span>Search boards, cards...</span>
                  <kbd className="ml-auto text-xs bg-secondary-100 px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* User Presence */}
              <UserPresence boardId={location.pathname.includes('/board/') ? location.pathname.split('/')[2] : null} />

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-secondary-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-secondary-200">
                      <div className="flex items-center space-x-3">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="text-sm text-secondary-500">{user?.email}</div>
                          {isAdmin && (
                            <div className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded mt-1 inline-block">
                              Administrator
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          >
                            <Icon className="w-4 h-4 mr-3 text-secondary-400" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-secondary-500">{item.description}</div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    <div className="border-t border-secondary-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-secondary-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-secondary-500">{item.description}</div>
                    </div>
                  </Link>
                )
              })}

              {/* Mobile Admin Items */}
              {isAdmin && (
                <>
                  <div className="border-t border-secondary-200 pt-2 mt-2">
                    <div className="px-3 py-1 text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Administration
                    </div>
                  </div>
                  {adminItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                          isActive(item.href)
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <div>
                          <div>{item.name}</div>
                          <div className="text-xs text-secondary-500">{item.description}</div>
                        </div>
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Quick Search Modal */}
      {isQuickSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <div className="w-full max-w-2xl mx-4">
            <QuickSearch
              placeholder="Search boards, cards, users..."
              onSelect={handleSearchSelect}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsQuickSearchOpen(false)}
                className="text-sm text-white hover:text-secondary-200"
              >
                Press Esc to close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(isUserMenuOpen || isQuickSearchOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setIsUserMenuOpen(false)
            setIsQuickSearchOpen(false)
          }}
        />
      )}

      {/* Keyboard shortcut handler */}
      <div
        className="sr-only"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault()
            setIsQuickSearchOpen(true)
          }
          if (e.key === 'Escape') {
            setIsQuickSearchOpen(false)
            setIsUserMenuOpen(false)
            setIsMobileMenuOpen(false)
          }
        }}
        tabIndex={-1}
      />
    </div>
  )
}