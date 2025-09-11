import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { userApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ArrowLeft, User, Mail, Shield, Bell, Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const profileSchema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Email is invalid'),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup.string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [isUpdating, setIsUpdating] = useState(false)

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      bio: user?.bio || '',
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

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => userApi.updateProfile(data),
    {
      onSuccess: (response) => {
        updateUser(response.data.user)
        queryClient.invalidateQueries('user')
        toast.success('Profile updated successfully')
        resetProfile(response.data.user)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      },
      onSettled: () => {
        setIsUpdating(false)
      }
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => userApi.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully')
        resetPassword()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const onSubmitProfile = (data) => {
    setIsUpdating(true)
    updateProfileMutation.mutate(data)
  }

  const onSubmitPassword = (data) => {
    changePasswordMutation.mutate(data)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
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
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-secondary-600">
                    Update your personal information and how others see you.
                  </p>
                </div>

                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email Address
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      {...registerProfile('bio')}
                      placeholder="Tell us a little about yourself..."
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {profileErrors.bio && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.bio.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!isProfileDirty || isUpdating}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isUpdating && <LoadingSpinner size="sm" className="mr-2" />}
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Security Settings</h3>
                  <p className="mt-1 text-sm text-secondary-600">
                    Manage your password and security preferences.
                  </p>
                </div>

                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      {...registerPassword('currentPassword')}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      {...registerPassword('newPassword')}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
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

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isLoading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {changePasswordMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                      {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Preferences</h3>
                  <p className="mt-1 text-sm text-secondary-600">
                    Customize your experience and notifications.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">Email Notifications</h4>
                      <p className="text-sm text-secondary-600">Receive email updates about your boards and cards</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">Real-time Notifications</h4>
                      <p className="text-sm text-secondary-600">Get instant notifications for board activities</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">Marketing Emails</h4>
                      <p className="text-sm text-secondary-600">Receive updates about new features and tips</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
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
