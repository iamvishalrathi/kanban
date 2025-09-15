import { useState, useEffect } from 'react'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { columnApi } from '../../services/api'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const schema = yup.object({
  title: yup
    .string()
    .required('Column title is required')
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must be less than 100 characters'),
  color: yup.string().nullable(),
  wipLimit: yup
    .number()
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .min(1, 'WIP limit must be at least 1')
    .max(50, 'WIP limit cannot exceed 50')
})

export const EditColumnModal = ({ isOpen, onClose, column, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      color: '',
      wipLimit: ''
    }
  })

  // Set form values when column changes
  useEffect(() => {
    if (column) {
      setValue('title', column.title || '')
      setValue('color', column.color || '')
      setValue('wipLimit', column.wipLimit || '')
    }
  }, [column, setValue])

  const updateColumnMutation = useMutation(
    (data) => columnApi.updateColumn(column.id, data),
    {
      onSuccess: () => {
        toast.success('Column updated successfully')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update column')
      },
      onSettled: () => {
        setIsSubmitting(false)
      }
    }
  )

  const deleteColumnMutation = useMutation(
    () => columnApi.deleteColumn(column.id),
    {
      onSuccess: () => {
        toast.success('Column deleted successfully')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete column')
      },
      onSettled: () => {
        setIsDeleting(false)
        setShowDeleteConfirm(false)
      }
    }
  )

  const onSubmit = (data) => {
    setIsSubmitting(true)
    
    // Clean up data - remove empty strings and convert wipLimit
    const cleanData = {
      ...data,
      color: data.color || null,
      wipLimit: data.wipLimit ? parseInt(data.wipLimit) : null
    }
    
    updateColumnMutation.mutate(cleanData)
  }

  const handleDelete = () => {
    if (column.cards && column.cards.length > 0) {
      toast.error('Cannot delete column with cards. Please move or delete all cards first.')
      return
    }
    
    setIsDeleting(true)
    deleteColumnMutation.mutate()
  }

  const handleClose = () => {
    if (!isSubmitting && !isDeleting) {
      setShowDeleteConfirm(false)
      reset()
      onClose()
    }
  }

  if (!isOpen || !column) return null

  const colorOptions = [
    { value: '', label: 'Default', color: '#e5e7eb' },
    { value: '#fee2e2', label: 'Light Red', color: '#fee2e2' },
    { value: '#fef3c7', label: 'Light Yellow', color: '#fef3c7' },
    { value: '#d1fae5', label: 'Light Green', color: '#d1fae5' },
    { value: '#dbeafe', label: 'Light Blue', color: '#dbeafe' },
    { value: '#e0e7ff', label: 'Light Indigo', color: '#e0e7ff' },
    { value: '#f3e8ff', label: 'Light Purple', color: '#f3e8ff' },
    { value: '#fce7f3', label: 'Light Pink', color: '#fce7f3' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Edit Column</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            className="text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Column Title *
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g., To Do, In Progress, Done"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-500' : 'border-secondary-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Column Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register('color')}
                      value={option.value}
                      className="sr-only peer"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center space-x-2 p-2 rounded border-2 border-transparent peer-checked:border-primary-500 hover:border-primary-300">
                      <div
                        className="w-4 h-4 rounded border border-secondary-300"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="text-xs text-secondary-600">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* WIP Limit */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                WIP Limit
                <span className="text-xs text-secondary-500 ml-1">(optional)</span>
              </label>
              <input
                type="number"
                {...register('wipLimit')}
                placeholder="Maximum cards in this column"
                min="1"
                max="50"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.wipLimit ? 'border-red-500' : 'border-secondary-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.wipLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.wipLimit.message}</p>
              )}
              <p className="mt-1 text-xs text-secondary-500">
                Work In Progress limit helps manage workflow
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <LoadingSpinner size="sm" />}
                  <span>{isSubmitting ? 'Updating...' : 'Update Column'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Delete Column
              </h3>
              <p className="text-sm text-secondary-500 mb-4">
                Are you sure you want to delete "{column.title}"? This action cannot be undone.
              </p>
              {column.cards && column.cards.length > 0 && (
                <p className="text-sm text-red-600 mb-4">
                  This column contains {column.cards.length} card(s). Please move or delete all cards before deleting the column.
                </p>
              )}
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || (column.cards && column.cards.length > 0)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting && <LoadingSpinner size="sm" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Column'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}