import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { boardApi, templateApi } from '../../services/api'
import { toast } from 'react-hot-toast'
import { BoardBackgroundUpload } from '../ui/FileUpload'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { 
  Settings, 
  Download, 
  Copy, 
  Archive, 
  Share2, 
  Users, 
  Palette, 
  Eye,
  EyeOff,
  Globe,
  Lock,
  Star,
  Trash2,
  Plus,
  Template,
  X
} from 'lucide-react'

const boardSettingsSchema = yup.object({
  title: yup.string().required('Board title is required').max(100, 'Title must be less than 100 characters'),
  description: yup.string().max(500, 'Description must be less than 500 characters'),
  isPublic: yup.boolean(),
  allowComments: yup.boolean(),
  autoArchiveCards: yup.boolean(),
  archiveDaysInactive: yup.number().min(1, 'Must be at least 1 day').max(365, 'Must be less than 365 days'),
  wipLimitEnabled: yup.boolean(),
  defaultWipLimit: yup.number().min(1, 'Must be at least 1').max(50, 'Must be less than 50')
})

export const BoardSettingsModal = ({ board, isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(boardSettingsSchema),
    defaultValues: {
      title: board?.title || '',
      description: board?.description || '',
      isPublic: board?.isPublic || false,
      allowComments: board?.allowComments ?? true,
      autoArchiveCards: board?.autoArchiveCards || false,
      archiveDaysInactive: board?.archiveDaysInactive || 30,
      wipLimitEnabled: board?.wipLimitEnabled || false,
      defaultWipLimit: board?.defaultWipLimit || 5
    }
  })

  // Mutations
  const updateBoardMutation = useMutation(
    ({ boardId, data }) => boardApi.updateBoard(boardId, data),
    {
      onSuccess: () => {
        toast.success('Board settings updated successfully')
        queryClient.invalidateQueries(['board', board.id])
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update board settings')
      }
    }
  )

  const uploadBackgroundMutation = useMutation(
    ({ boardId, file }) => boardApi.uploadBackground(boardId, file),
    {
      onSuccess: () => {
        toast.success('Background updated successfully')
        queryClient.invalidateQueries(['board', board.id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload background')
      }
    }
  )

  const deleteBackgroundMutation = useMutation(
    (boardId) => boardApi.deleteBackground(boardId),
    {
      onSuccess: () => {
        toast.success('Background removed successfully')
        queryClient.invalidateQueries(['board', board.id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove background')
      }
    }
  )

  const archiveBoardMutation = useMutation(boardApi.archiveBoard, {
    onSuccess: () => {
      toast.success('Board archived successfully')
      queryClient.invalidateQueries(['boards'])
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to archive board')
    }
  })

  // Handlers
  const handleSaveSettings = (data) => {
    updateBoardMutation.mutate({
      boardId: board.id,
      data
    })
  }

  const handleUploadBackground = async (file) => {
    return uploadBackgroundMutation.mutateAsync({
      boardId: board.id,
      file
    })
  }

  const handleDeleteBackground = () => {
    deleteBackgroundMutation.mutate(board.id)
  }

  const handleArchiveBoard = () => {
    if (window.confirm('Are you sure you want to archive this board? It will be hidden from your dashboard but can be restored later.')) {
      archiveBoardMutation.mutate(board.id)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'permissions', label: 'Permissions', icon: Users },
    { id: 'advanced', label: 'Advanced', icon: Eye }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Board Settings</h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

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

        <form onSubmit={handleSubmit(handleSaveSettings)}>
          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Board Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe what this board is for..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('allowComments')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-secondary-900">
                      Allow comments on cards
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('autoArchiveCards')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-secondary-900">
                      Auto-archive inactive cards
                    </label>
                  </div>

                  {watch('autoArchiveCards') && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Archive after (days)
                      </label>
                      <input
                        type="number"
                        {...register('archiveDaysInactive')}
                        className="w-20 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.archiveDaysInactive && (
                        <p className="mt-1 text-sm text-red-600">{errors.archiveDaysInactive.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('wipLimitEnabled')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-secondary-900">
                      Enable WIP limits by default
                    </label>
                  </div>

                  {watch('wipLimitEnabled') && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Default WIP limit
                      </label>
                      <input
                        type="number"
                        {...register('defaultWipLimit')}
                        className="w-20 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.defaultWipLimit && (
                        <p className="mt-1 text-sm text-red-600">{errors.defaultWipLimit.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Board Background
                  </h3>
                  <BoardBackgroundUpload
                    currentBackground={board?.background}
                    onUpload={handleUploadBackground}
                    onRemove={handleDeleteBackground}
                    disabled={uploadBackgroundMutation.isLoading || deleteBackgroundMutation.isLoading}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Color Theme
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                      '#8B5CF6', '#EC4899', '#6B7280', '#1F2937'
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('themeColor', color)}
                        className="w-8 h-8 rounded-full border-2 border-secondary-300 hover:border-secondary-400"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-secondary-400" />
                      <label className="block text-sm font-medium text-secondary-900">
                        Public Board
                      </label>
                    </div>
                    <p className="text-sm text-secondary-600 mt-1">
                      Anyone can view this board without being a member
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    {...register('isPublic')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </div>

                <div className="border-t border-secondary-200 pt-4">
                  <h4 className="text-sm font-medium text-secondary-900 mb-3">Board Members</h4>
                  <div className="space-y-2">
                    {board?.members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-secondary-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-300 flex items-center justify-center">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-xs">{member.firstName?.[0]}{member.lastName?.[0]}</span>
                            )}
                          </div>
                          <span className="text-sm text-secondary-900">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                        <select className="text-xs border border-secondary-300 rounded px-2 py-1">
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Danger Zone
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div>
                        <div className="font-medium text-orange-900">Archive Board</div>
                        <div className="text-sm text-orange-700">
                          Hide this board from your dashboard. Can be restored later.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleArchiveBoard}
                        disabled={archiveBoardMutation.isLoading}
                        className="px-3 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-100 disabled:opacity-50 flex items-center"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <div className="font-medium text-red-900">Delete Board</div>
                        <div className="text-sm text-red-700">
                          Permanently delete this board and all its data. This cannot be undone.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-100 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-200 bg-secondary-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900"
            >
              Cancel
            </button>
            
            <div className="flex items-center space-x-2">
              {(activeTab === 'general' || activeTab === 'permissions') && (
                <button
                  type="submit"
                  disabled={!isDirty || updateBoardMutation.isLoading}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {updateBoardMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export const BoardExportModal = ({ board, isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState('json')
  const [includeComments, setIncludeComments] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(false)

  const exportBoardMutation = useMutation(boardApi.exportBoard, {
    onSuccess: (data) => {
      // Create and trigger download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${board.title}-export.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Board exported successfully')
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export board')
    }
  })

  const handleExport = () => {
    exportBoardMutation.mutate(board.id, {
      format: exportFormat,
      includeComments,
      includeAttachments
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Export Board</h2>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeComments"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="includeComments" className="ml-2 block text-sm text-secondary-900">
                  Include comments
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeAttachments"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="includeAttachments" className="ml-2 block text-sm text-secondary-900">
                  Include attachment references
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exportBoardMutation.isLoading}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {exportBoardMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Board
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BoardTemplateModal = ({ isOpen, onClose, onCreateFromTemplate }) => {
  const { data: templates, isLoading } = useQuery('boardTemplates', templateApi.getTemplates)

  if (!isOpen) return null

  const templateList = templates?.data?.templates || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary-900">Choose a Template</h2>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateList.map((template) => (
                <div
                  key={template.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onCreateFromTemplate(template)}
                >
                  <div className="flex items-start space-x-3">
                    <Template className="w-6 h-6 text-primary-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary-900 mb-1">
                        {template.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center text-xs text-secondary-500">
                        <Star className="w-3 h-3 mr-1" />
                        {template.category}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}