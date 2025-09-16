import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { commentApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import { 
  MessageCircle, 
  Send, 
  Edit, 
  Trash2, 
  Heart, 
  ThumbsUp, 
  Smile, 
  Reply, 
  MoreVertical,
  Check,
  X,
  Paperclip,
  Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const REACTION_TYPES = {
  LIKE: { emoji: '👍', label: 'Like' },
  LOVE: { emoji: '❤️', label: 'Love' },
  LAUGH: { emoji: '😄', label: 'Laugh' },
  WOW: { emoji: '😮', label: 'Wow' },
  SAD: { emoji: '😢', label: 'Sad' },
  ANGRY: { emoji: '😠', label: 'Angry' }
}

const Comment = ({ comment, onReply, depth = 0 }) => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue
  } = useForm({
    defaultValues: {
      content: comment.content
    }
  })

  // Reply form  
  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    formState: { errors: replyErrors },
    reset: resetReply
  } = useForm()

  // Mutations
  const updateCommentMutation = useMutation(
    ({ commentId, data }) => commentApi.updateComment(commentId, data),
    {
      onSuccess: () => {
        toast.success('Comment updated successfully')
        queryClient.invalidateQueries(['comments'])
        setIsEditing(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update comment')
      }
    }
  )

  const deleteCommentMutation = useMutation(commentApi.deleteComment, {
    onSuccess: () => {
      toast.success('Comment deleted successfully')
      queryClient.invalidateQueries(['comments'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    }
  })

  const addReactionMutation = useMutation(
    ({ commentId, type }) => commentApi.addReaction(commentId, { type }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add reaction')
      }
    }
  )

  const removeReactionMutation = useMutation(
    ({ commentId, reactionType }) => commentApi.removeReaction(commentId, reactionType),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove reaction')
      }
    }
  )

  const createReplyMutation = useMutation(
    ({ commentId, data }) => commentApi.createReply(commentId, data),
    {
      onSuccess: () => {
        toast.success('Reply added successfully')
        queryClient.invalidateQueries(['comments'])
        resetReply()
        setShowReplyForm(false)
        setShowReplies(true)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add reply')
      }
    }
  )

  const resolveCommentMutation = useMutation(commentApi.resolveComment, {
    onSuccess: () => {
      toast.success('Comment resolved')
      queryClient.invalidateQueries(['comments'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve comment')
    }
  })

  const unresolveCommentMutation = useMutation(commentApi.unresolveComment, {
    onSuccess: () => {
      toast.success('Comment unresolved')
      queryClient.invalidateQueries(['comments'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unresolve comment')
    }
  })

  // Handlers
  const handleEditComment = (data) => {
    updateCommentMutation.mutate({
      commentId: comment.id,
      data
    })
  }

  const handleDeleteComment = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(comment.id)
    }
  }

  const handleAddReaction = (type) => {
    addReactionMutation.mutate({
      commentId: comment.id,
      type
    })
    setShowReactions(false)
  }

  const handleRemoveReaction = (type) => {
    removeReactionMutation.mutate({
      commentId: comment.id,
      reactionType: type
    })
  }

  const handleReply = (data) => {
    createReplyMutation.mutate({
      commentId: comment.id,
      data
    })
  }

  const handleResolve = () => {
    if (comment.isResolved) {
      unresolveCommentMutation.mutate(comment.id)
    } else {
      resolveCommentMutation.mutate(comment.id)
    }
  }

  const startEditing = () => {
    setEditValue('content', comment.content)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    resetEdit()
    setIsEditing(false)
  }

  const isAuthor = user?.id === comment.authorId
  const reactions = comment.reactions || {}
  const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0)
  const userReactions = Object.entries(reactions).filter(([_, users]) => users.includes(user?.id))

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className={`bg-white rounded-lg border p-4 ${comment.isResolved ? 'opacity-75' : ''}`}>
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center overflow-hidden">
              {comment.author?.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={`${comment.author.firstName} ${comment.author.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-secondary-600">
                  {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-900">
                {comment.author?.firstName} {comment.author?.lastName}
              </p>
              <p className="text-xs text-secondary-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.updatedAt !== comment.createdAt && ' (edited)'}
              </p>
            </div>
            {comment.isResolved && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Resolved
              </span>
            )}
          </div>
          
          <div className="relative">
            <button className="text-secondary-400 hover:text-secondary-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <form onSubmit={handleSubmitEdit(handleEditComment)} className="space-y-3">
            <textarea
              {...registerEdit('content', { required: 'Comment content is required' })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            {editErrors.content && (
              <p className="text-sm text-red-600">{editErrors.content.message}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="px-3 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCommentMutation.isLoading}
                className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-3">
            <p className="text-secondary-900 whitespace-pre-wrap">{comment.content}</p>
            
            {/* Attachments */}
            {comment.attachments?.length > 0 && (
              <div className="mt-2 space-y-1">
                {comment.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm text-secondary-600 hover:text-secondary-900"
                  >
                    <Paperclip className="w-4 h-4" />
                    <a
                      href={attachment.url}
                      download={attachment.filename}
                      className="hover:underline"
                    >
                      {attachment.filename}
                    </a>
                    <Download className="w-3 h-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {reactionEntries.map(([type, users]) => {
              const reaction = REACTION_TYPES[type]
              const userHasReacted = users.includes(user?.id)
              return (
                <button
                  key={type}
                  onClick={() => userHasReacted ? handleRemoveReaction(type) : handleAddReaction(type)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                    userHasReacted
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-secondary-50 border-secondary-200 text-secondary-700 hover:bg-secondary-100'
                  }`}
                >
                  <span>{reaction?.emoji}</span>
                  <span>{users.length}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Reaction Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
                >
                  <Smile className="w-4 h-4 inline mr-1" />
                  React
                </button>
                
                {showReactions && (
                  <div className="absolute top-8 left-0 z-10 bg-white border border-secondary-200 rounded-lg shadow-lg p-2">
                    <div className="flex space-x-1">
                      {Object.entries(REACTION_TYPES).map(([type, reaction]) => (
                        <button
                          key={type}
                          onClick={() => handleAddReaction(type)}
                          className="w-8 h-8 rounded hover:bg-secondary-100 flex items-center justify-center"
                          title={reaction.label}
                        >
                          {reaction.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Button */}
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
              >
                <Reply className="w-4 h-4 inline mr-1" />
                Reply
              </button>

              {/* Show Replies */}
              {comment.replies?.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Resolve Button */}
              <button
                onClick={handleResolve}
                className={`text-sm font-medium ${
                  comment.isResolved
                    ? 'text-orange-600 hover:text-orange-700'
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                {comment.isResolved ? (
                  <>
                    <X className="w-4 h-4 inline mr-1" />
                    Unresolve
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 inline mr-1" />
                    Resolve
                  </>
                )}
              </button>

              {/* Edit/Delete for author */}
              {isAuthor && (
                <>
                  <button
                    onClick={startEditing}
                    className="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteComment}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <form onSubmit={handleSubmitReply(handleReply)} className="space-y-3">
              <textarea
                {...registerReply('content', { required: 'Reply content is required' })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="Write a reply..."
              />
              {replyErrors.content && (
                <p className="text-sm text-red-600">{replyErrors.content.message}</p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReplyMutation.isLoading}
                  className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Reply
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies?.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
        />
      ))}
    </div>
  )
}

export const EnhancedCommentSystem = ({ cardId }) => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  // Form for new comments
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Fetch comments
  const {
    data: commentsData,
    isLoading,
    error
  } = useQuery(
    ['comments', cardId, page],
    () => commentApi.getComments(cardId, { page, limit: 10 }),
    {
      enabled: !!cardId
    }
  )

  // Create comment mutation
  const createCommentMutation = useMutation(
    ({ cardId, data }) => commentApi.createComment(cardId, data),
    {
      onSuccess: () => {
        toast.success('Comment added successfully')
        queryClient.invalidateQueries(['comments', cardId])
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment')
      }
    }
  )

  // Handlers
  const handleCreateComment = (data) => {
    createCommentMutation.mutate({
      cardId,
      data
    })
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600">Failed to load comments</p>
      </div>
    )
  }

  const comments = commentsData?.data?.comments || []
  const pagination = commentsData?.data?.pagination
  const hasMore = pagination ? pagination.page < pagination.pages : false

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <form onSubmit={handleSubmit(handleCreateComment)} className="space-y-3">
        <textarea
          {...register('content', { required: 'Comment content is required' })}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
          placeholder="Add a comment..."
        />
        {errors.content && (
          <p className="text-sm text-red-600">{errors.content.message}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createCommentMutation.isLoading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {createCommentMutation.isLoading ? (
              'Adding...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Add Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-secondary-500">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No comments yet</p>
          <p className="text-sm text-secondary-400">Be the first to add a comment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Load More Comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}