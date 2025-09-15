import { useState } from 'react'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { columnApi } from '../../services/api'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { X } from 'lucide-react'
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

export const CreateColumnModal = ({ isOpen, onClose, boardId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      color: '',
      wipLimit: ''
    }
  })

  const createColumnMutation = useMutation(
    (data) => columnApi.createColumn({ ...data, boardId }),
    {
      onSuccess: () => {
        toast.success('Column created successfully')
        reset()
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create column')
      },
      onSettled: () => {
        setIsSubmitting(false)
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
    
    createColumnMutation.mutate(cleanData)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  if (!isOpen) return null

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
          <h2 className="text-lg font-semibold text-secondary-900">Create Column</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <label key={option.value} className="cursor-pointer">
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

          <div className="flex justify-end space-x-3 pt-4">
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
              <span>{isSubmitting ? 'Creating...' : 'Create Column'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}