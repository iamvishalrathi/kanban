import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { userApi } from '../services/api'
import { MainLayout } from '../components/layout/MainLayout'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { 
  Settings, 
  Bell, 
  Palette, 
  Globe, 
  Clock,
  Shield,
  Download,
  Upload,
  Trash2,
  Check
} from 'lucide-react'

const preferencesSchema = yup.object({
  theme: yup.string().oneOf(['light', 'dark', 'system']),
  language: yup.string(),
  timezone: yup.string(),
  dateFormat: yup.string(),
  emailNotifications: yup.boolean(),
  pushNotifications: yup.boolean(),
  soundEnabled: yup.boolean(),
  autoSave: yup.boolean(),
  showTutorial: yup.boolean(),
  defaultBoardView: yup.string().oneOf(['board', 'list', 'calendar']),
  cardDetailsPosition: yup.string().oneOf(['sidebar', 'modal']),
  compactMode: yup.boolean()
})

export const PreferencesPage = () => {
  const [activeSection, setActiveSection] = useState('general')
  const queryClient = useQueryClient()

  // Fetch current preferences
  const { data: preferencesData, isLoading } = useQuery(
    'userPreferences',
    () => userApi.getPreferences()
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(preferencesSchema),
    defaultValues: preferencesData?.data?.preferences || {}
  })

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(
    (data) => userApi.updatePreferences(data),
    {
      onSuccess: () => {
        toast.success('Preferences updated successfully')
        queryClient.invalidateQueries('userPreferences')
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update preferences')
      }
    }
  )

  // Export data mutation
  const exportDataMutation = useMutation(
    () => userApi.exportUserData(),
    {
      onSuccess: (data) => {
        // Create and trigger download
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'kanban-user-data.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Data exported successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to export data')
      }
    }
  )

  const handleSavePreferences = (data) => {
    updatePreferencesMutation.mutate(data)
  }

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield }
  ]

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Preferences</h1>
          <p className="text-secondary-600">
            Customize your Kanban experience to match your workflow
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-secondary-50 border-r border-secondary-200">
              <nav className="p-4 space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === section.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {section.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <form onSubmit={handleSubmit(handleSavePreferences)}>
                {/* General Settings */}
                {activeSection === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900 mb-4">
                        General Settings
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Language
                          </label>
                          <select
                            {...register('language')}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Timezone
                          </label>
                          <select
                            {...register('timezone')}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Date Format
                          </label>
                          <select
                            {...register('dateFormat')}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Default Board View
                          </label>
                          <select
                            {...register('defaultBoardView')}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="board">Board View</option>
                            <option value="list">List View</option>
                            <option value="calendar">Calendar View</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('autoSave')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-secondary-900">
                            Auto-save changes
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('showTutorial')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-secondary-900">
                            Show tutorial tips for new features
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('compactMode')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-secondary-900">
                            Compact mode (show more content in less space)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900 mb-4">
                        Appearance Settings
                      </h3>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-3">
                            Theme
                          </label>
                          <div className="space-y-3">
                            {[
                              { value: 'light', label: 'Light', description: 'Clean and bright interface' },
                              { value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light' },
                              { value: 'system', label: 'System', description: 'Match your device settings' }
                            ].map((theme) => (
                              <label key={theme.value} className="flex items-start">
                                <input
                                  type="radio"
                                  {...register('theme')}
                                  value={theme.value}
                                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                                />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-secondary-900">
                                    {theme.label}
                                  </div>
                                  <div className="text-sm text-secondary-500">
                                    {theme.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-3">
                            Card Details Position
                          </label>
                          <div className="space-y-3">
                            {[
                              { value: 'sidebar', label: 'Sidebar', description: 'Open details in a side panel' },
                              { value: 'modal', label: 'Modal', description: 'Open details in a popup window' }
                            ].map((position) => (
                              <label key={position.value} className="flex items-start">
                                <input
                                  type="radio"
                                  {...register('cardDetailsPosition')}
                                  value={position.value}
                                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                                />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-secondary-900">
                                    {position.label}
                                  </div>
                                  <div className="text-sm text-secondary-500">
                                    {position.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900 mb-4">
                        Notification Preferences
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              Email Notifications
                            </div>
                            <div className="text-sm text-secondary-500">
                              Receive notifications via email
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...register('emailNotifications')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              Push Notifications
                            </div>
                            <div className="text-sm text-secondary-500">
                              Receive browser push notifications
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...register('pushNotifications')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              Sound Effects
                            </div>
                            <div className="text-sm text-secondary-500">
                              Play sounds for notifications and actions
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...register('soundEnabled')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy & Data Settings */}
                {activeSection === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900 mb-4">
                        Privacy & Data Management
                      </h3>

                      <div className="space-y-6">
                        <div className="border border-secondary-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-secondary-900 mb-2">
                            Export Your Data
                          </h4>
                          <p className="text-sm text-secondary-600 mb-3">
                            Download a copy of all your data including boards, cards, and comments.
                          </p>
                          <button
                            type="button"
                            onClick={() => exportDataMutation.mutate()}
                            disabled={exportDataMutation.isLoading}
                            className="flex items-center px-3 py-2 border border-secondary-300 rounded-md text-sm text-secondary-700 hover:bg-secondary-50 disabled:opacity-50"
                          >
                            {exportDataMutation.isLoading ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Export Data
                          </button>
                        </div>

                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <h4 className="text-sm font-medium text-red-900 mb-2">
                            Delete Account
                          </h4>
                          <p className="text-sm text-red-700 mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <button
                            type="button"
                            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {(activeSection === 'general' || activeSection === 'appearance' || activeSection === 'notifications') && (
                  <div className="flex items-center justify-end pt-6 border-t border-secondary-200">
                    <button
                      type="submit"
                      disabled={!isDirty || updatePreferencesMutation.isLoading}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatePreferencesMutation.isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Save Preferences
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}