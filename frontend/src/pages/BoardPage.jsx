import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { boardApi, cardApi, columnApi } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BoardHeader } from '../components/board/BoardHeader'
import { Column } from '../components/board/Column'
import { Card } from '../components/board/Card'
import { CreateCardModal } from '../components/modals/CreateCardModal'
import { CardDetailsModal } from '../components/modals/CardDetailsModal'
import { CreateColumnModal } from '../components/modals/CreateColumnModal'
import { EditColumnModal } from '../components/modals/EditColumnModal'
import { toast } from 'react-hot-toast'

export const BoardPage = () => {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [createCardColumnId, setCreateCardColumnId] = useState(null)
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)

  // Fetch board data
  const { data: boardData, isLoading, error } = useQuery(
    ['board', boardId],
    () => boardApi.getBoard(boardId),
    {
      retry: 1,
      onError: (error) => {
        if (error.response?.status === 404) {
          navigate('/dashboard')
          toast.error('Board not found')
        }
      }
    }
  )

  // Move card mutation
  const moveCardMutation = useMutation(
    ({ cardId, columnId, position }) => cardApi.moveCard(cardId, { columnId, position }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to move card')
        queryClient.invalidateQueries(['board', boardId])
      }
    }
  )

  // Column operations mutations
  const deleteColumnMutation = useMutation(
    (columnId) => columnApi.deleteColumn(columnId),
    {
      onSuccess: () => {
        toast.success('Column deleted successfully')
        queryClient.invalidateQueries(['board', boardId])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete column')
      }
    }
  )

  const reorderColumnsMutation = useMutation(
    (data) => columnApi.reorderColumns(boardId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reorder columns')
        queryClient.invalidateQueries(['board', boardId])
      }
    }
  )

  // Socket event handlers
  useEffect(() => {
    if (!socket || !boardId) return

    const handleBoardUpdate = (data) => {
      if (data.boardId === boardId) {
        queryClient.invalidateQueries(['board', boardId])
      }
    }

    const handleCardMoved = (data) => {
      if (data.boardId === boardId) {
        queryClient.setQueryData(['board', boardId], (oldData) => {
          if (!oldData) return oldData

          const updatedBoard = { ...oldData }
          const columns = [...updatedBoard.data.board.columns]

          // Find source and destination columns
          const sourceColumn = columns.find(col =>
            col.cards.some(card => card.id === data.cardId)
          )
          const destColumn = columns.find(col => col.id === data.columnId)

          if (sourceColumn && destColumn) {
            // Remove card from source
            const card = sourceColumn.cards.find(c => c.id === data.cardId)
            sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== data.cardId)

            // Add card to destination
            if (card) {
              card.columnId = data.columnId
              destColumn.cards.splice(data.position, 0, card)
            }
          }

          return updatedBoard
        })
      }
    }

    socket.on('board:updated', handleBoardUpdate)
    socket.on('card:moved', handleCardMoved)
    socket.on('card:created', handleBoardUpdate)
    socket.on('card:updated', handleBoardUpdate)
    socket.on('card:deleted', handleBoardUpdate)

    // Join board room
    socket.emit('board:join', boardId)

    return () => {
      socket.off('board:updated', handleBoardUpdate)
      socket.off('card:moved', handleCardMoved)
      socket.off('card:created', handleBoardUpdate)
      socket.off('card:updated', handleBoardUpdate)
      socket.off('card:deleted', handleBoardUpdate)
      socket.emit('board:leave', boardId)
    }
  }, [socket, boardId, queryClient])

  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Handle column reordering
    if (type === 'COLUMN') {
      const newPosition = destination.index

      // Optimistic update for column reordering
      queryClient.setQueryData(['board', boardId], (oldData) => {
        if (!oldData) return oldData

        const updatedBoard = { ...oldData }
        const columns = [...updatedBoard.data.board.columns]
        
        const [movedColumn] = columns.splice(source.index, 1)
        columns.splice(destination.index, 0, movedColumn)

        updatedBoard.data.board.columns = columns
        return updatedBoard
      })

      // Make API call for column reordering
      const updatedColumns = [...board.columns]
      const [movedColumn] = updatedColumns.splice(source.index, 1)
      updatedColumns.splice(destination.index, 0, movedColumn)
      
      reorderColumnsMutation.mutate({
        columnIds: updatedColumns.map(col => col.id)
      })
      
      return
    }

    // Handle card reordering (existing logic)
    const columnId = destination.droppableId
    const position = destination.index

    // Optimistic update for card reordering
    queryClient.setQueryData(['board', boardId], (oldData) => {
      if (!oldData) return oldData

      const updatedBoard = { ...oldData }
      const columns = [...updatedBoard.data.board.columns]

      const sourceColumn = columns.find(col => col.id === source.droppableId)
      const destColumn = columns.find(col => col.id === destination.droppableId)

      if (sourceColumn && destColumn) {
        const [movedCard] = sourceColumn.cards.splice(source.index, 1)
        movedCard.columnId = columnId
        destColumn.cards.splice(destination.index, 0, movedCard)
      }

      return updatedBoard
    })

    // Make API call for card moving
    moveCardMutation.mutate({
      cardId: draggableId,
      columnId,
      position
    })
  }

  const handleCreateCard = (columnId) => {
    setCreateCardColumnId(columnId)
    setIsCreateCardModalOpen(true)
  }

  const handleCardClick = (card) => {
    setSelectedCard(card)
  }

  const handleCreateCardSuccess = () => {
    setIsCreateCardModalOpen(false)
    setCreateCardColumnId(null)
    queryClient.invalidateQueries(['board', boardId])
  }

  const handleCardUpdateSuccess = () => {
    setSelectedCard(null)
    queryClient.invalidateQueries(['board', boardId])
  }

  const handleCreateColumn = () => {
    setIsCreateColumnModalOpen(true)
  }

  const handleEditColumn = (column) => {
    setEditingColumn(column)
  }

  const handleDeleteColumn = (column) => {
    if (column.cards && column.cards.length > 0) {
      toast.error('Cannot delete column with cards. Please move or delete all cards first.')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete "${column.title}"? This action cannot be undone.`)) {
      deleteColumnMutation.mutate(column.id)
    }
  }

  const handleCreateColumnSuccess = () => {
    setIsCreateColumnModalOpen(false)
    queryClient.invalidateQueries(['board', boardId])
  }

  const handleEditColumnSuccess = () => {
    setEditingColumn(null)
    queryClient.invalidateQueries(['board', boardId])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            Error loading board
          </h2>
          <p className="text-secondary-600">{error.message}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const board = boardData?.data?.board

  return (
    <div className="min-h-screen bg-secondary-50">
      <BoardHeader board={board} />

      <main className="h-screen pt-16 pb-4">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="COLUMN">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-6 h-full overflow-x-auto pb-4"
                >
                  {board?.columns?.map((column, index) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex-shrink-0 w-80 ${snapshot.isDragging ? 'rotate-2 shadow-2xl' : ''}`}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="mb-2 cursor-move"
                          >
                            <div className="h-1 bg-secondary-300 rounded mx-auto w-8 opacity-50 hover:opacity-75" />
                          </div>
                          
                          <Droppable droppableId={column.id} type="CARD">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`bg-white rounded-lg shadow-card h-full flex flex-col ${snapshot.isDraggingOver ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
                                  }`}
                              >
                                <Column
                                  column={column}
                                  onCreateCard={() => handleCreateCard(column.id)}
                                  onEditColumn={handleEditColumn}
                                  onDeleteColumn={handleDeleteColumn}
                                />

                                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                  {column.cards?.map((card, cardIndex) => (
                                    <Draggable
                                      key={card.id}
                                      draggableId={card.id}
                                      index={cardIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          onClick={() => handleCardClick(card)}
                                          className={`${snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                                            }`}
                                        >
                                          <Card card={card} />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {/* Add Column Button */}
                  <div className="flex-shrink-0 w-80">
                    <button
                      onClick={handleCreateColumn}
                      className="w-full h-32 bg-secondary-50 border-2 border-dashed border-secondary-300 rounded-lg flex flex-col items-center justify-center text-secondary-600 hover:text-secondary-800 hover:border-secondary-400 hover:bg-secondary-100 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center mb-2 group-hover:bg-secondary-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Add Column</span>
                    </button>
                  </div>
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </main>

      {/* Modals */}
      {isCreateCardModalOpen && (
        <CreateCardModal
          isOpen={isCreateCardModalOpen}
          onClose={() => {
            setIsCreateCardModalOpen(false)
            setCreateCardColumnId(null)
          }}
          columnId={createCardColumnId}
          boardId={boardId}
          onSuccess={handleCreateCardSuccess}
        />
      )}

      {selectedCard && (
        <CardDetailsModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
          boardId={boardId}
          onSuccess={handleCardUpdateSuccess}
        />
      )}

      {/* Column Modals */}
      {isCreateColumnModalOpen && (
        <CreateColumnModal
          isOpen={isCreateColumnModalOpen}
          onClose={() => setIsCreateColumnModalOpen(false)}
          boardId={boardId}
          onSuccess={handleCreateColumnSuccess}
        />
      )}

      {editingColumn && (
        <EditColumnModal
          isOpen={!!editingColumn}
          onClose={() => setEditingColumn(null)}
          column={editingColumn}
          onSuccess={handleEditColumnSuccess}
        />
      )}
    </div>
  )
}
