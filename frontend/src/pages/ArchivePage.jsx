import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { boardApi, cardApi } from '../services/api'
import { MainLayout } from '../components/layout/MainLayout'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  Folder,
  CheckSquare,
  MessageCircle,
  Paperclip,
  Eye,
  MoreHorizontal
} from 'lucide-react'

export const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState('boards')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const queryClient = useQueryClient()

  // Fetch archived items
  const { data: archivedData, isLoading } = useQuery(
    ['archived', activeTab, searchTerm, filterBy],
    () => {
      if (activeTab === 'boards') {
        return boardApi.getArchivedBoards({ 
          search: searchTerm || undefined,
          filter: filterBy !== 'all' ? filterBy : undefined 
        })
      } else {
        return cardApi.getArchivedCards({ 
          search: searchTerm || undefined,
          filter: filterBy !== 'all' ? filterBy : undefined 
        })
      }
    }
  )

  // Restore mutations
  const restoreBoardMutation = useMutation(
    (boardId) => boardApi.restoreBoard(boardId),
    {
      onSuccess: () => {
        toast.success('Board restored successfully')
        queryClient.invalidateQueries(['archived'])
        queryClient.invalidateQueries(['boards'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to restore board')
      }
    }
  )

  const restoreCardMutation = useMutation(
    (cardId) => cardApi.restoreCard(cardId),
    {
      onSuccess: () => {
        toast.success('Card restored successfully')
        queryClient.invalidateQueries(['archived'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to restore card')
      }
    }
  )

  // Permanent delete mutations
  const deleteBoardMutation = useMutation(
    (boardId) => boardApi.permanentlyDeleteBoard(boardId),
    {
      onSuccess: () => {
        toast.success('Board permanently deleted')
        queryClient.invalidateQueries(['archived'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete board')
      }
    }
  )

  const deleteCardMutation = useMutation(
    (cardId) => cardApi.permanentlyDeleteCard(cardId),
    {
      onSuccess: () => {
        toast.success('Card permanently deleted')
        queryClient.invalidateQueries(['archived'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete card')
      }
    }
  )

  const items = archivedData?.data?.[activeTab] || []

  const handleRestore = (item) => {
    if (activeTab === 'boards') {
      restoreBoardMutation.mutate(item.id)
    } else {
      restoreCardMutation.mutate(item.id)
    }
  }

  const handlePermanentDelete = (item) => {
    const itemType = activeTab === 'boards' ? 'board' : 'card'
    const confirmMessage = `Are you sure you want to permanently delete this ${itemType}? This action cannot be undone.`
    
    if (window.confirm(confirmMessage)) {
      if (activeTab === 'boards') {
        deleteBoardMutation.mutate(item.id)
      } else {
        deleteCardMutation.mutate(item.id)
      }
    }
  }

  const tabs = [
    { id: 'boards', label: 'Archived Boards', icon: Folder },
    { id: 'cards', label: 'Archived Cards', icon: CheckSquare }
  ]

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Archive</h1>
          <p className="text-secondary-600">
            Manage your archived boards and cards. Restore items or delete them permanently.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-secondary-200">
            <nav className="-mb-px flex space-x-8">
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
                    {items.length > 0 && (
                      <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                        {items.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder={`Search archived ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-secondary-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Items</option>
              <option value="recent">Recently Archived</option>
              <option value="old">Older Items</option>
              {activeTab === 'boards' && <option value="owned">Owned by Me</option>}
            </select>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No archived {activeTab}
            </h3>
            <p className="text-secondary-500">
              {searchTerm 
                ? `No archived ${activeTab} match your search criteria`
                : `You haven't archived any ${activeTab} yet`
              }
            </p>
          </div>
        ) : activeTab === 'boards' ? (
          // Archived Boards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((board) => (
              <div
                key={board.id}
                className="bg-white rounded-lg shadow-card p-6 border border-secondary-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: board.color || '#6B7280' }}
                    />
                    <h3 className="text-lg font-semibold text-secondary-900 truncate">
                      {board.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestore(board)}
                      disabled={restoreBoardMutation.isLoading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Restore board"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(board)}
                      disabled={deleteBoardMutation.isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {board.description && (
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-secondary-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Archived {formatDistanceToNow(new Date(board.archivedAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-secondary-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {board.memberCount || 0} members
                    </span>
                    <span className="flex items-center">
                      <CheckSquare className="w-4 h-4 mr-1" />
                      {board.cardCount || 0} cards
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Archived Cards List
          <div className="space-y-4">
            {items.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-card p-6 border border-secondary-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {card.title}
                      </h3>
                      <span className="text-sm text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                        in {card.board?.title} → {card.column?.title}
                      </span>
                    </div>
                    
                    {card.description && (
                      <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-secondary-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Archived {formatDistanceToNow(new Date(card.archivedAt), { addSuffix: true })}
                      </span>
                      
                      {card.assignees?.length > 0 && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {card.assignees.length} assigned
                        </span>
                      )}
                      
                      {card.commentsCount > 0 && (
                        <span className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {card.commentsCount} comments
                        </span>
                      )}
                      
                      {card.attachmentsCount > 0 && (
                        <span className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-1" />
                          {card.attachmentsCount} files
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-md"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRestore(card)}
                      disabled={restoreCardMutation.isLoading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Restore card"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(card)}
                      disabled={deleteCardMutation.isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}