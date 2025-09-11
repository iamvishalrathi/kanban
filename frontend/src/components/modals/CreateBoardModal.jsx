import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { boardApi } from '../../services/api'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { X, Palette } from 'lucide-react'
import { toast } from 'react-hot-toast'

const schema = yup.object({
  title: yup.string().required('Title is required').min(1, 'Title cannot be empty'),
  description: yup.string(),
  backgroundColor: yup.string(),
  visibility: yup.string().oneOf(['public', 'private']).required('Visibility is required'),
})

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
]

export const CreateBoardModal = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      backgroundColor: '#3B82F6',
      visibility: 'private'
    }
  })

  const createBoardMutation = useMutation(
    (data) => boardApi.createBoard(data),
    {
      onSuccess: (response) => {
        const board = response.data.board
        toast.success('Board created successfully')
        reset()
        onClose()
        queryClient.invalidateQueries('boards')
        navigate(`/board/${board.id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create board')
      },
      onSettled: () => {
        setIsSubmitting(false)
      }
    }
  )

  const onSubmit = (data) => {
    setIsSubmitting(true)
    createBoardMutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const selectedColor = watch('backgroundColor')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Create New Board</h2>
            <button
              onClick={handleClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="Enter board title..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Enter board description..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Background Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue('backgroundColor', color.value)}
                    className={`w-full h-10 rounded-md border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-secondary-400 scale-110'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Visibility *
              </label>
              <select
                {...register('visibility')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="private">Private - Only you and invited members can see this board</option>
                <option value="public">Public - Anyone with the link can view this board</option>
              </select>
              {errors.visibility && (
                <p className="mt-1 text-sm text-red-600">{errors.visibility.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                {isSubmitting ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}