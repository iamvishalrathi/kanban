import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cardApi, commentApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import {
  X,
  Calendar,
  Tag,
  MessageCircle,
  User,
  Edit2,
  Trash2,
  Send,
  Clock,
  Paperclip
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const schema = yup.object({
  title: yup.string().required('Title is required').min(1, 'Title cannot be empty'),
  description: yup.string(),
  dueDate: yup.date().nullable(),
  priority: yup.string().oneOf(['low', 'medium', 'high', '']),
})

const commentSchema = yup.object({
  content: yup.string().required('Comment cannot be empty').min(1, 'Comment cannot be empty'),
})

export const CardDetailsModal = ({ isOpen, onClose, card, boardId, onSuccess }) => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [newComment, setNewComment] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
  })

  const {
    register: registerComment,
    handleSubmit: handleSubmitComment,
    formState: { errors: commentErrors },
    reset: resetComment
  } = useForm({
    resolver: yupResolver(commentSchema)
  })

  // Fetch card details and comments
  const { data: cardDetails, isLoading } = useQuery(
    ['card', card?.id],
    () => cardApi.getCard(card.id),
    {
      enabled: !!card?.id && isOpen,
      onSuccess: (data) => {
        const cardData = data.data.card
        reset({
          title: cardData.title,
          description: cardData.description || '',
          dueDate: cardData.dueDate ? cardData.dueDate.split('T')[0] : '',
          priority: cardData.priority || ''
        })
      }
    }
  )

  // Update card mutation
  const updateCardMutation = useMutation(
    (data) => cardApi.updateCard(card.id, data),
    {
      onSuccess: () => {
        toast.success('Card updated successfully')
        setIsEditing(false)
        queryClient.invalidateQueries(['card', card.id])
        queryClient.invalidateQueries(['board', boardId])
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update card')
      }
    }
  )

  // Delete card mutation
  const deleteCardMutation = useMutation(
    () => cardApi.deleteCard(card.id),
    {
      onSuccess: () => {
        toast.success('Card deleted successfully')
        queryClient.invalidateQueries(['board', boardId])
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete card')
      }
    }
  )

  // Add comment mutation
  const addCommentMutation = useMutation(
    (data) => commentApi.createComment({ ...data, cardId: card.id }),
    {
      onSuccess: () => {
        toast.success('Comment added successfully')
        resetComment()
        queryClient.invalidateQueries(['card', card.id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment')
      }
    }
  )

  const onSubmit = (data) => {
    const updateData = {
      ...data,
      dueDate: data.dueDate || null
    }
    updateCardMutation.mutate(updateData)
  }

  const onSubmitComment = (data) => {
    addCommentMutation.mutate(data)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteCardMutation.mutate()
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    {...register('title')}
                    className="text-xl font-semibold text-secondary-900 w-full border-none outline-none focus:ring-0 p-0"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-secondary-900">
                    {cardDetails?.data?.card?.title || card.title}
                  </h2>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-secondary-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Add a description..."
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Due Date & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

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
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isDirty || updateCardMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {updateCardMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 mb-6">
                {/* Description */}
                {cardDetails?.data?.card?.description && (
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 mb-2">Description</h3>
                    <p className="text-secondary-900 whitespace-pre-wrap">
                      {cardDetails.data.card.description}
                    </p>
                  </div>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap gap-4">
                  {cardDetails?.data?.card?.dueDate && (
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(cardDetails.data.card.dueDate)}</span>
                    </div>
                  )}

                  {cardDetails?.data?.card?.priority && (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-secondary-600" />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(cardDetails.data.card.priority)}`}>
                        {cardDetails.data.card.priority} Priority
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-secondary-600">
                    <Clock className="w-4 h-4" />
                    <span>Created: {formatDate(cardDetails?.data?.card?.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Comments ({cardDetails?.data?.card?.comments?.length || 0})
              </h3>

              {/* Add Comment */}
              <form onSubmit={handleSubmitComment(onSubmitComment)} className="mb-6">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                    {(user?.firstName || 'U')[0]}{(user?.lastName || 'U')[0]}
                  </div>
                  <div className="flex-1">
                    <textarea
                      {...registerComment('content')}
                      rows={2}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {commentErrors.content && (
                      <p className="mt-1 text-sm text-red-600">{commentErrors.content.message}</p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={addCommentMutation.isLoading}
                        className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
                      >
                        {addCommentMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        <Send className="w-3 h-3 mr-1" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {cardDetails?.data?.card?.comments?.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center text-secondary-600 text-sm font-medium">
                      {(comment.author?.firstName || 'U')[0]}{(comment.author?.lastName || 'U')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="bg-secondary-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-secondary-900">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
