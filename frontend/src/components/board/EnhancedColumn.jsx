import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { columnApi } from '../../services/api'
import { toast } from 'react-hot-toast'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Archive, 
  Copy, 
  RotateCcw,
  Users,
  AlertCircle
} from 'lucide-react'

export const EnhancedColumn = ({ 
  column, 
  onCreateCard, 
  onEditColumn, 
  onDeleteColumn,
  isDragging = false,
  isArchived = false
}) => {
  const queryClient = useQueryClient()
  const [showMenu, setShowMenu] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  // Mutations
  const archiveColumnMutation = useMutation(columnApi.archiveColumn, {
    onSuccess: () => {
      toast.success('Column archived successfully')
      queryClient.invalidateQueries(['board'])
      setShowMenu(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to archive column')
    }
  })

  const restoreColumnMutation = useMutation(columnApi.restoreColumn, {
    onSuccess: () => {
      toast.success('Column restored successfully')
      queryClient.invalidateQueries(['board'])
      setShowMenu(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to restore column')
    }
  })

  const duplicateColumnMutation = useMutation(columnApi.duplicateColumn, {
    onSuccess: () => {
      toast.success('Column duplicated successfully')
      queryClient.invalidateQueries(['board'])
      setShowDuplicateModal(false)
      setShowMenu(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate column')
    }
  })

  // Handlers
  const handleArchive = () => {
    if (window.confirm('Are you sure you want to archive this column? It will be hidden from the board.')) {
      archiveColumnMutation.mutate(column.id)
    }
  }

  const handleRestore = () => {
    restoreColumnMutation.mutate(column.id)
  }

  const handleDuplicate = (includeCards = false) => {
    const title = `${column.title} (Copy)`
    duplicateColumnMutation.mutate(column.id, {
      title,
      includeCards
    })
  }

  const cardCount = column.cards?.length || 0
  const isWipLimitExceeded = column.wipLimit && cardCount > column.wipLimit

  return (
    <div className={`
      bg-secondary-100 rounded-lg p-3 w-72 flex-shrink-0 
      ${isDragging ? 'opacity-50' : ''} 
      ${isArchived ? 'opacity-60' : ''}
    `}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Column Title with Color Indicator */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {column.color && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: column.color }}
              />
            )}
            <h3 className="font-medium text-secondary-900 truncate">
              {column.title}
            </h3>
            {isArchived && (
              <Archive className="w-4 h-4 text-secondary-400 flex-shrink-0" />
            )}
          </div>

          {/* Card Count with WIP Limit */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <span className={`
              text-xs px-2 py-1 rounded-full font-medium
              ${isWipLimitExceeded 
                ? 'bg-red-100 text-red-700' 
                : 'bg-secondary-200 text-secondary-600'
              }
            `}>
              {cardCount}
              {column.wipLimit && `/${column.wipLimit}`}
            </span>
            {isWipLimitExceeded && (
              <AlertCircle className="w-4 h-4 text-red-500" title="WIP limit exceeded" />
            )}
          </div>
        </div>

        {/* Column Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {!isArchived && (
            <button
              onClick={onCreateCard}
              className="p-1 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-200 rounded"
              title="Add card"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-200 rounded"
              title="Column options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-secondary-200 py-1 z-30">
                {!isArchived ? (
                  <>
                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        onEditColumn(column)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Column
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        setShowDuplicateModal(true)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Column
                    </button>

                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        onCreateCard()
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Card
                    </button>

                    <hr className="my-1 border-secondary-200" />
                    
                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        handleArchive()
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Column
                    </button>

                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        onDeleteColumn(column)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Column
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        handleRestore()
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore Column
                    </button>

                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        onDeleteColumn(column)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Description (if exists) */}
      {column.description && (
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
          {column.description}
        </p>
      )}

      {/* WIP Limit Warning */}
      {isWipLimitExceeded && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            WIP limit exceeded
          </div>
        </div>
      )}

      {/* Archived Notice */}
      {isArchived && (
        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Archive className="w-4 h-4 mr-1" />
              Archived Column
            </div>
            <button
              onClick={handleRestore}
              className="text-xs font-medium hover:underline"
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Assignee Info (if column has assigned users) */}
      {column.assignedUsers?.length > 0 && (
        <div className="mb-3 flex items-center text-sm text-secondary-600">
          <Users className="w-4 h-4 mr-1" />
          <span>{column.assignedUsers.length} assigned</span>
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Duplicate Column
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              Choose whether to duplicate just the column or include all cards as well.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDuplicate(false)}
                disabled={duplicateColumnMutation.isLoading}
                className="w-full p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 disabled:opacity-50"
              >
                <div className="font-medium text-secondary-900">Column Only</div>
                <div className="text-sm text-secondary-600">
                  Create an empty copy of this column
                </div>
              </button>

              <button
                onClick={() => handleDuplicate(true)}
                disabled={duplicateColumnMutation.isLoading}
                className="w-full p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 disabled:opacity-50"
              >
                <div className="font-medium text-secondary-900">Column + Cards</div>
                <div className="text-sm text-secondary-600">
                  Copy the column and all {cardCount} cards
                </div>
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Legacy Column component for backward compatibility
export const Column = (props) => {
  return <EnhancedColumn {...props} />
}