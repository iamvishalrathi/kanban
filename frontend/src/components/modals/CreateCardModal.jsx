import { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cardApi, boardApi } from '../../services/api'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { X, Calendar, Tag, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

const schema = yup.object({
  title: yup.string().required('Title is required').min(1, 'Title cannot be empty').max(200, 'Title must be less than 200 characters'),
  description: yup.string().max(2000, 'Description must be less than 2000 characters'),
  dueDate: yup.date().nullable(),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent', '']),
  assigneeId: yup.string().nullable()
})

export const CreateCardModal = ({ isOpen, onClose, columnId, boardId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch board members for assignee selection
  const { data: membersData } = useQuery(
    ['board-members', boardId],
    () => boardApi.getMembers(boardId),
    {
      enabled: !!boardId && isOpen,
    }
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: '',
      assigneeId: ''
    }
  })

  const createCardMutation = useMutation(
    (data) => cardApi.createCard({ ...data, columnId }),
    {
      onSuccess: () => {
        toast.success('Card created successfully')
        reset()
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create card')
      },
      onSettled: () => {
        setIsSubmitting(false)
      }
    }
  )

  const onSubmit = (data) => {
    setIsSubmitting(true)
    const cardData = {
      ...data,
      dueDate: data.dueDate || null,
      assigneeId: data.assigneeId || null
    }
    createCardMutation.mutate(cardData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Create New Card</h2>
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
                placeholder="Enter card title..."
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
                placeholder="Enter card description..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Assignee
              </label>
              <div className="relative">
                <select
                  {...register('assigneeId')}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Unassigned</option>
                  {membersData?.data?.members?.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-2.5 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>
              {errors.assigneeId && (
                <p className="mt-1 text-sm text-red-600">{errors.assigneeId.message}</p>
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
                {isSubmitting ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
