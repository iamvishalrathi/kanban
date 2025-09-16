import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { userApi, authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Palette,
  Camera,
  Settings,
  Activity,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Validation schemas
const profileSchema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Email is invalid'),
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
  timezone: yup.string(),
  language: yup.string()
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: yup.string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

const preferencesSchema = yup.object({
  theme: yup.string().oneOf(['light', 'dark', 'system']),
  emailNotifications: yup.boolean(),
  pushNotifications: yup.boolean(),
  weeklyDigest: yup.boolean(),
  boardUpdates: yup.boolean(),
  commentMentions: yup.boolean(),
  dueDateReminders: yup.boolean()
})

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery(
    'userProfile',
    userApi.getProfile,
    {
      initialData: { data: { user } }
    }
  )

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery(
    'userPreferences',
    userApi.getPreferences
  )

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile,
    watch: watchProfile
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: profile?.data?.user?.firstName || '',
      lastName: profile?.data?.user?.lastName || '',
      email: profile?.data?.user?.email || '',
      username: profile?.data?.user?.username || '',
      bio: profile?.data?.user?.bio || '',
      timezone: profile?.data?.user?.timezone || 'UTC',
      language: profile?.data?.user?.language || 'en'
    }
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm({
    resolver: yupResolver(passwordSchema)
  })

  // Preferences form
  const {
    register: registerPreferences,
    handleSubmit: handleSubmitPreferences,
    formState: { errors: preferencesErrors, isDirty: isPreferencesDirty },
    reset: resetPreferences
  } = useForm({
    resolver: yupResolver(preferencesSchema),
    defaultValues: {
      theme: preferences?.data?.theme || 'system',
      emailNotifications: preferences?.data?.emailNotifications ?? true,
      pushNotifications: preferences?.data?.pushNotifications ?? true,
      weeklyDigest: preferences?.data?.weeklyDigest ?? false,
      boardUpdates: preferences?.data?.boardUpdates ?? true,
      commentMentions: preferences?.data?.commentMentions ?? true,
      dueDateReminders: preferences?.data?.dueDateReminders ?? true
    }
  })

  // Mutations
  const updateProfileMutation = useMutation(userApi.updateProfile, {
    onSuccess: (data) => {
      toast.success('Profile updated successfully')
      updateUser(data.data.user)
      queryClient.invalidateQueries('userProfile')
      resetProfile(data.data.user)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  })

  const changePasswordMutation = useMutation(userApi.changePassword, {
    onSuccess: () => {
      toast.success('Password changed successfully')
      resetPassword()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  })

  const updatePreferencesMutation = useMutation(userApi.updatePreferences, {
    onSuccess: () => {
      toast.success('Preferences updated successfully')
      queryClient.invalidateQueries('userPreferences')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    }
  })

  const uploadAvatarMutation = useMutation(userApi.uploadAvatar, {
    onSuccess: (data) => {
      toast.success('Avatar updated successfully')
      updateUser(data.data.user)
      queryClient.invalidateQueries('userProfile')
      setUploadingAvatar(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
      setUploadingAvatar(false)
    }
  })

  const deleteAvatarMutation = useMutation(userApi.deleteAvatar, {
    onSuccess: (data) => {
      toast.success('Avatar removed successfully')
      updateUser(data.data.user)
      queryClient.invalidateQueries('userProfile')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove avatar')
    }
  })

  const exportDataMutation = useMutation(userApi.exportData, {
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kanban-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Data exported successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export data')
    }
  })

  // Form handlers
  const onUpdateProfile = (data) => {
    updateProfileMutation.mutate(data)
  }

  const onChangePassword = (data) => {
    changePasswordMutation.mutate(data)
  }

  const onUpdatePreferences = (data) => {
    updatePreferencesMutation.mutate(data)
  }

  // Avatar handlers
  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Avatar must be an image file')
        return
      }

      setUploadingAvatar(true)
      uploadAvatarMutation.mutate(file)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarDelete = () => {
    if (window.confirm('Are you sure you want to remove your avatar?')) {
      deleteAvatarMutation.mutate()
    }
  }

  const handleExportData = () => {
    if (window.confirm('This will download all your data including boards, cards, and comments. Continue?')) {
      exportDataMutation.mutate()
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const currentUser = profile?.data?.user || user

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              to="/dashboard"
              className="flex items-center text-secondary-600 hover:text-secondary-900 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-secondary-900">
              Account Settings
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Profile Information
                  </h3>
                  
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-secondary-200 flex items-center justify-center overflow-hidden">
                        {currentUser?.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={`${currentUser.firstName} ${currentUser.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-secondary-400" />
                        )}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center px-3 py-2 border border-secondary-300 shadow-sm text-sm leading-4 font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </button>
                      {currentUser?.avatar && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          {...registerProfile('firstName')}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        {profileErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          {...registerProfile('lastName')}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        {profileErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        {...registerProfile('email')}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        {...registerProfile('username')}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {profileErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        {...registerProfile('bio')}
                        rows={4}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell us a bit about yourself..."
                      />
                      {profileErrors.bio && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.bio.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Timezone
                        </label>
                        <select
                          {...registerProfile('timezone')}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                          <option value="Asia/Shanghai">Shanghai</option>
                          <option value="Australia/Sydney">Sydney</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Language
                        </label>
                        <select
                          {...registerProfile('language')}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                          <option value="ja">Japanese</option>
                          <option value="ko">Korean</option>
                          <option value="zh">Chinese</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={!isProfileDirty || updateProfileMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateProfileMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Change Password
                  </h3>
                  <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...registerPassword('currentPassword')}
                          className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-secondary-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-secondary-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          {...registerPassword('newPassword')}
                          className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-secondary-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-secondary-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        {...registerPassword('confirmPassword')}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {changePasswordMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Appearance & Preferences
                  </h3>
                  <form onSubmit={handleSubmitPreferences(onUpdatePreferences)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Theme
                      </label>
                      <select
                        {...registerPreferences('theme')}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="system">System Default</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={!isPreferencesDirty || updatePreferencesMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {updatePreferencesMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        Save Preferences
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Notification Settings
                  </h3>
                  <form onSubmit={handleSubmitPreferences(onUpdatePreferences)} className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Email Notifications
                          </label>
                          <p className="text-sm text-secondary-500">
                            Receive notifications via email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('emailNotifications')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Push Notifications
                          </label>
                          <p className="text-sm text-secondary-500">
                            Receive browser push notifications
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('pushNotifications')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Weekly Digest
                          </label>
                          <p className="text-sm text-secondary-500">
                            Get a weekly summary of your activity
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('weeklyDigest')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Board Updates
                          </label>
                          <p className="text-sm text-secondary-500">
                            Notifications when boards are updated
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('boardUpdates')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Comment Mentions
                          </label>
                          <p className="text-sm text-secondary-500">
                            When someone mentions you in a comment
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('commentMentions')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-secondary-900">
                            Due Date Reminders
                          </label>
                          <p className="text-sm text-secondary-500">
                            Reminders for upcoming due dates
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...registerPreferences('dueDateReminders')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={updatePreferencesMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {updatePreferencesMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        Save Notification Settings
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Account Management
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-secondary-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">
                        Export Your Data
                      </h4>
                      <p className="text-sm text-secondary-600 mb-3">
                        Download a copy of all your data including boards, cards, and comments.
                      </p>
                      <button
                        type="button"
                        onClick={handleExportData}
                        disabled={exportDataMutation.isLoading}
                        className="inline-flex items-center px-3 py-2 border border-secondary-300 shadow-sm text-sm leading-4 font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {exportDataMutation.isLoading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {exportDataMutation.isLoading ? 'Exporting...' : 'Export Data'}
                      </button>
                    </div>

                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        Danger Zone
                      </h4>
                      <p className="text-sm text-red-600 mb-3">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}