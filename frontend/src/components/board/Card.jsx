import { Calendar, MessageCircle, Paperclip, User, AlertCircle } from 'lucide-react'

export const Card = ({ card }) => {
  if (!card) return null

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()
  const isDueSoon = card.dueDate &&
    new Date(card.dueDate) > new Date() &&
    new Date(card.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-secondary-300'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-3 cursor-pointer hover:shadow-md transition-shadow">
      {/* Priority indicator */}
      {card.priority && (
        <div className="flex justify-end mb-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(card.priority)}`} />
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-secondary-900 mb-2 line-clamp-2">
        {card.title}
      </h4>

      {/* Description */}
      {card.description && (
        <p className="text-xs text-secondary-600 mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Labels */}
      {card.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-block px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: label.color + '20',
                color: label.color
              }}
            >
              {label.name}
            </span>
          ))}
          {card.labels.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-secondary-100 text-secondary-600">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Due date */}
      {card.dueDate && (
        <div className={`flex items-center space-x-1 mb-2 text-xs ${isOverdue
            ? 'text-red-600'
            : isDueSoon
              ? 'text-yellow-600'
              : 'text-secondary-600'
          }`}>
          {isOverdue && <AlertCircle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          <span>{formatDate(card.dueDate)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Comments count */}
          {card.commentsCount > 0 && (
            <div className="flex items-center space-x-1 text-xs text-secondary-600">
              <MessageCircle className="w-3 h-3" />
              <span>{card.commentsCount}</span>
            </div>
          )}

          {/* Attachments count */}
          {card.attachmentsCount > 0 && (
            <div className="flex items-center space-x-1 text-xs text-secondary-600">
              <Paperclip className="w-3 h-3" />
              <span>{card.attachmentsCount}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {card.assignees?.length > 0 && (
          <div className="flex -space-x-1">
            {card.assignees.slice(0, 2).map((assignee) => (
              <div
                key={assignee.id}
                className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium border border-white"
                title={`${assignee.firstName || assignee.user?.firstName || 'Unknown'} ${assignee.lastName || assignee.user?.lastName || 'User'}`}
              >
                {(assignee.firstName || assignee.user?.firstName || 'U')[0]}{(assignee.lastName || assignee.user?.lastName || 'U')[0]}
              </div>
            ))}
            {card.assignees.length > 2 && (
              <div className="w-6 h-6 rounded-full bg-secondary-300 flex items-center justify-center text-secondary-600 text-xs font-medium border border-white">
                +{card.assignees.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
