import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { boardApi, cardApi } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BoardHeader } from '../components/board/BoardHeader'
import { Column } from '../components/board/Column'
import { Card } from '../components/board/Card'
import { CreateCardModal } from '../components/modals/CreateCardModal'
import { CardDetailsModal } from '../components/modals/CardDetailsModal'
import { toast } from 'react-hot-toast'

export const BoardPage = () => {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [createCardColumnId, setCreateCardColumnId] = useState(null)

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
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const columnId = destination.droppableId
    const position = destination.index

    // Optimistic update
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

    // Make API call
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
            <div className="flex gap-6 h-full overflow-x-auto pb-4">
              {board?.columns?.map((column) => (
                <div key={column.id} className="flex-shrink-0 w-80">
                  <Droppable droppableId={column.id}>
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
                        />

                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                          {column.cards?.map((card, index) => (
                            <Draggable
                              key={card.id}
                              draggableId={card.id}
                              index={index}
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
              ))}
            </div>
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
    </div>
  )
}
