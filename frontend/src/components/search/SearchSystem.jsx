import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useDebounce } from '../../hooks/useDebounce'
import { searchApi, boardApi } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  ArrowUpDown, 
  Clock,
  CheckSquare,
  MessageCircle,
  Paperclip,
  Star,
  MoreHorizontal,
  FileText,
  Users,
  Columns,
  Save,
  Download
} from 'lucide-react'

export const SearchModal = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all', // all, cards, boards, users, comments
    boardId: '',
    assigneeId: '',
    labelId: '',
    dueDateRange: '',
    hasAttachments: false,
    hasComments: false,
    isCompleted: null
  })
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')

  const debouncedQuery = useDebounce(query, 300)

  // Search query
  const { data: searchResults, isLoading } = useQuery(
    ['search', debouncedQuery, filters, sortBy, sortOrder],
    () => searchApi.search({
      query: debouncedQuery,
      ...filters,
      sortBy,
      sortOrder,
      limit: 50
    }),
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000
    }
  )

  // Get filter options
  const { data: boards } = useQuery('boards', boardApi.getBoards)
  const { data: users } = useQuery('users', () => searchApi.getUsers())
  const { data: labels } = useQuery('labels', () => searchApi.getLabels())

  if (!isOpen) return null

  const results = searchResults?.data || {}
  const totalResults = Object.values(results).reduce((sum, items) => sum + (items?.length || 0), 0)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      type: 'all',
      boardId: '',
      assigneeId: '',
      labelId: '',
      dueDateRange: '',
      hasAttachments: false,
      hasComments: false,
      isCompleted: null
    })
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'card': return CheckSquare
      case 'board': return Columns
      case 'user': return User
      case 'comment': return MessageCircle
      default: return FileText
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search cards, boards, users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-secondary-400 hover:text-secondary-600 rounded-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-secondary-200 bg-secondary-50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-secondary-500" />
              <span className="text-sm font-medium text-secondary-700">Filters:</span>
            </div>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value="all">All Results</option>
              <option value="cards">Cards</option>
              <option value="boards">Boards</option>
              <option value="users">Users</option>
              <option value="comments">Comments</option>
            </select>

            <select
              value={filters.boardId}
              onChange={(e) => handleFilterChange('boardId', e.target.value)}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value="">Any Board</option>
              {boards?.data?.boards?.map(board => (
                <option key={board.id} value={board.id}>{board.title}</option>
              ))}
            </select>

            <select
              value={filters.assigneeId}
              onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value="">Any Assignee</option>
              {users?.data?.users?.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>

            <select
              value={filters.dueDateRange}
              onChange={(e) => handleFilterChange('dueDateRange', e.target.value)}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value="">Any Due Date</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="month">Due This Month</option>
            </select>

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-secondary-500" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-')
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder)
                }}
                className="text-sm border border-secondary-300 rounded px-2 py-1"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="dueDate-asc">Due Date</option>
                <option value="title-asc">Alphabetical</option>
              </select>
            </div>

            {Object.values(filters).some(value => value !== '' && value !== false && value !== null) && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filters.hasAttachments}
                onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                className="mr-2 h-3 w-3 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              Has Attachments
            </label>

            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filters.hasComments}
                onChange={(e) => handleFilterChange('hasComments', e.target.checked)}
                className="mr-2 h-3 w-3 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              Has Comments
            </label>

            <select
              value={filters.isCompleted || ''}
              onChange={(e) => handleFilterChange('isCompleted', e.target.value === '' ? null : e.target.value === 'true')}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value="">Any Status</option>
              <option value="true">Completed</option>
              <option value="false">In Progress</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {debouncedQuery.length < 2 ? (
            <div className="p-8 text-center text-secondary-500">
              <Search className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
              <p>Start typing to search...</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-secondary-500">
              Searching...
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-secondary-500">
              <Search className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
              <p>No results found for "{debouncedQuery}"</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {/* Result Summary */}
              <div className="p-4 bg-secondary-50">
                <p className="text-sm text-secondary-600">
                  Found {totalResults} results for "{debouncedQuery}"
                </p>
              </div>

              {/* Cards */}
              {results.cards?.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Cards ({results.cards.length})
                  </h3>
                  <div className="space-y-2">
                    {results.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onSelectResult && onSelectResult('card', card)}
                        className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-secondary-900 mb-1">
                              {card.title}
                            </h4>
                            {card.description && (
                              <p className="text-sm text-secondary-600 line-clamp-2 mb-2">
                                {card.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 text-xs text-secondary-500">
                              <span>in {card.board?.title} → {card.column?.title}</span>
                              {card.dueDate && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDistanceToNow(new Date(card.dueDate), { addSuffix: true })}
                                </span>
                              )}
                              {card.assignees?.length > 0 && (
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {card.assignees.length} assigned
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-3">
                            {card.attachmentsCount > 0 && (
                              <div className="flex items-center text-xs text-secondary-500">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {card.attachmentsCount}
                              </div>
                            )}
                            {card.commentsCount > 0 && (
                              <div className="flex items-center text-xs text-secondary-500">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {card.commentsCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boards */}
              {results.boards?.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                    <Columns className="w-4 h-4 mr-2" />
                    Boards ({results.boards.length})
                  </h3>
                  <div className="space-y-2">
                    {results.boards.map((board) => (
                      <div
                        key={board.id}
                        onClick={() => onSelectResult && onSelectResult('board', board)}
                        className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                      >
                        <h4 className="text-sm font-medium text-secondary-900 mb-1">
                          {board.title}
                        </h4>
                        {board.description && (
                          <p className="text-sm text-secondary-600 line-clamp-1 mb-2">
                            {board.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-secondary-500">
                          <span>{board.cardsCount || 0} cards</span>
                          <span>{board.membersCount || 0} members</span>
                          <span>Updated {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users?.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Users ({results.users.length})
                  </h3>
                  <div className="space-y-2">
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => onSelectResult && onSelectResult('user', user)}
                        className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-secondary-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-secondary-600">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {results.comments?.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comments ({results.comments.length})
                  </h3>
                  <div className="space-y-2">
                    {results.comments.map((comment) => (
                      <div
                        key={comment.id}
                        onClick={() => onSelectResult && onSelectResult('comment', comment)}
                        className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                      >
                        <p className="text-sm text-secondary-900 mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-secondary-500">
                          <span>by {comment.author?.firstName} {comment.author?.lastName}</span>
                          <span>on {comment.card?.title}</span>
                          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-secondary-200 bg-secondary-50">
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <div>
              Press <kbd className="px-2 py-1 bg-secondary-200 rounded text-xs">Enter</kbd> to select first result
            </div>
            <div>
              Press <kbd className="px-2 py-1 bg-secondary-200 rounded text-xs">Esc</kbd> to close
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const SavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)

  const { data: searches } = useQuery('savedSearches', () => searchApi.getSavedSearches())

  const saveSearchMutation = useMutation(searchApi.saveSearch, {
    onSuccess: () => {
      setShowSaveModal(false)
      // Refresh saved searches
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-secondary-900">Saved Searches</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 flex items-center"
        >
          <Save className="w-4 h-4 mr-1" />
          Save Current Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searches?.data?.searches?.map((search) => (
          <div key={search.id} className="p-4 border border-secondary-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-secondary-900">{search.name}</h4>
              <button className="text-secondary-400 hover:text-secondary-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-secondary-600 mb-3">
              {search.description || 'No description'}
            </p>

            <div className="flex items-center justify-between text-xs text-secondary-500">
              <span>{search.resultCount} results</span>
              <span>Updated {formatDistanceToNow(new Date(search.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const QuickSearch = ({ placeholder = "Search...", onSelect }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  const { data: quickResults, isLoading } = useQuery(
    ['quickSearch', debouncedQuery],
    () => searchApi.quickSearch(debouncedQuery),
    {
      enabled: debouncedQuery.length >= 2 && isOpen,
      staleTime: 30000
    }
  )

  const handleSelect = (type, item) => {
    onSelect && onSelect(type, item)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-secondary-500">Searching...</div>
          ) : quickResults?.data?.length > 0 ? (
            <div className="py-2">
              {quickResults.data.map((item) => {
                const Icon = getResultIcon(item.type)
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item.type, item)}
                    className="w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center space-x-3"
                  >
                    <Icon className="w-4 h-4 text-secondary-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-secondary-900 truncate">
                        {item.title || item.name}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-secondary-500 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-secondary-500">
              No results found
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}