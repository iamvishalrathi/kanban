import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { formatDistanceToNow } from 'date-fns'
import { 
  Mouse, 
  Eye, 
  Users, 
  MessageCircle, 
  Edit3,
  Circle,
  Wifi,
  WifiOff
} from 'lucide-react'

// Real-time cursors for collaborative editing
export const CollaborativeCursors = ({ boardId }) => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [cursors, setCursors] = useState({})
  const [showCursors, setShowCursors] = useState(true)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!socket || !boardId) return

    // Join board room
    socket.emit('joinBoard', boardId)

    // Listen for cursor updates
    socket.on('cursorUpdate', ({ userId, cursor, userInfo }) => {
      if (userId !== user.id) {
        setCursors(prev => ({
          ...prev,
          [userId]: {
            ...cursor,
            userInfo,
            lastUpdate: Date.now()
          }
        }))
      }
    })

    // Listen for user disconnections
    socket.on('userLeft', ({ userId }) => {
      setCursors(prev => {
        const newCursors = { ...prev }
        delete newCursors[userId]
        return newCursors
      })
    })

    // Send mouse position updates
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      
      // Throttle cursor updates
      if (Date.now() - (mouseRef.current.lastEmit || 0) > 50) {
        socket.emit('cursorMove', {
          boardId,
          cursor: {
            x: e.clientX,
            y: e.clientY,
            target: e.target.dataset.cursorTarget || null
          },
          userInfo: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatar,
            color: user.cursorColor || '#3B82F6'
          }
        })
        mouseRef.current.lastEmit = Date.now()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)

    // Clean up old cursors
    const cleanupInterval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now()
        const filtered = {}
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (now - cursor.lastUpdate < 10000) { // Remove after 10 seconds
            filtered[userId] = cursor
          }
        })
        return filtered
      })
    }, 5000)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearInterval(cleanupInterval)
      socket.off('cursorUpdate')
      socket.off('userLeft')
    }
  }, [socket, boardId, user.id])

  if (!showCursors || !isConnected) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute transform -translate-x-1 -translate-y-1 transition-all duration-100 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            color: cursor.userInfo.color
          }}
        >
          <Mouse className="w-4 h-4" style={{ color: cursor.userInfo.color }} />
          <div 
            className="ml-2 px-2 py-1 rounded text-white text-xs whitespace-nowrap"
            style={{ backgroundColor: cursor.userInfo.color }}
          >
            {cursor.userInfo.name}
          </div>
        </div>
      ))}
      
      {/* Cursor toggle button */}
      <button
        onClick={() => setShowCursors(!showCursors)}
        className="fixed bottom-4 right-4 p-2 bg-white rounded-full shadow-lg border border-secondary-200 pointer-events-auto hover:bg-secondary-50"
      >
        {showCursors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  )
}

// User presence indicators
export const UserPresence = ({ boardId }) => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    if (!socket || !boardId) return

    // Join presence room
    socket.emit('joinPresence', { boardId, userInfo: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      status: 'active'
    }})

    // Listen for presence updates
    socket.on('presenceUpdate', ({ users }) => {
      setActiveUsers(users.filter(u => u.id !== user.id))
    })

    socket.on('userJoined', ({ userInfo }) => {
      if (userInfo.id !== user.id) {
        setActiveUsers(prev => [...prev.filter(u => u.id !== userInfo.id), userInfo])
      }
    })

    socket.on('userLeft', ({ userId }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== userId))
    })

    return () => {
      socket.emit('leavePresence', { boardId })
      socket.off('presenceUpdate')
      socket.off('userJoined')
      socket.off('userLeft')
    }
  }, [socket, boardId, user.id])

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-secondary-500">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Offline</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1 text-secondary-600">
        <Wifi className="w-4 h-4 text-green-500" />
        <span className="text-sm">Online</span>
      </div>

      {activeUsers.length > 0 && (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-secondary-500" />
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 5).map((activeUser) => (
              <div
                key={activeUser.id}
                className="relative"
                title={activeUser.name}
              >
                {activeUser.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {activeUser.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
            ))}
            {activeUsers.length > 5 && (
              <div className="w-8 h-8 bg-secondary-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <span className="text-secondary-600 text-xs font-medium">
                  +{activeUsers.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Real-time activity feed
export const ActivityFeed = ({ boardId }) => {
  const { socket, isConnected } = useSocket()
  const [activities, setActivities] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!socket || !boardId) return

    // Listen for real-time activities
    socket.on('boardActivity', (activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]) // Keep last 50 activities
    })

    return () => {
      socket.off('boardActivity')
    }
  }, [socket, boardId])

  if (!isConnected) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="relative p-2 text-secondary-600 hover:text-secondary-900 rounded-md hover:bg-secondary-100"
      >
        <MessageCircle className="w-5 h-5" />
        {activities.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {isVisible && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-secondary-200">
            <h3 className="font-medium text-secondary-900">Live Activity</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-4 text-center text-secondary-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-100">
                {activities.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="p-3">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        {activity.user?.avatar ? (
                          <img
                            src={activity.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">
                              {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-secondary-900">
                          <span className="font-medium">
                            {activity.user?.firstName} {activity.user?.lastName}
                          </span>
                          {' '}{activity.action}{' '}
                          {activity.target && (
                            <span className="font-medium">{activity.target}</span>
                          )}
                        </p>
                        <p className="text-xs text-secondary-500 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isVisible && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsVisible(false)}
        />
      )}
    </div>
  )
}

// Collaborative text editor for card descriptions
export const CollaborativeEditor = ({ cardId, initialContent, onChange }) => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [content, setContent] = useState(initialContent || '')
  const [isEditing, setIsEditing] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const editorRef = useRef(null)

  useEffect(() => {
    if (!socket || !cardId) return

    // Join editor room
    socket.emit('joinEditor', { cardId, userInfo: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar
    }})

    // Listen for content changes from other users
    socket.on('contentChange', ({ content: newContent, userId }) => {
      if (userId !== user.id) {
        setContent(newContent)
      }
    })

    // Listen for collaborator updates
    socket.on('editorUsers', ({ users }) => {
      setCollaborators(users.filter(u => u.id !== user.id))
    })

    return () => {
      socket.emit('leaveEditor', { cardId })
      socket.off('contentChange')
      socket.off('editorUsers')
    }
  }, [socket, cardId, user.id])

  const handleContentChange = (newContent) => {
    setContent(newContent)
    
    // Emit changes to other users
    if (socket && cardId) {
      socket.emit('contentUpdate', {
        cardId,
        content: newContent,
        userId: user.id
      })
    }
    
    // Notify parent component
    onChange?.(newContent)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setTimeout(() => editorRef.current?.focus(), 0)
  }

  const handleSave = () => {
    setIsEditing(false)
    // Save to backend would happen here
  }

  return (
    <div className="relative">
      {/* Collaborator indicators */}
      {collaborators.length > 0 && (
        <div className="flex items-center space-x-1 mb-2">
          <Edit3 className="w-3 h-3 text-secondary-400" />
          <span className="text-xs text-secondary-500">
            {collaborators.length === 1 
              ? `${collaborators[0].name} is editing`
              : `${collaborators.length} people are editing`
            }
          </span>
          <div className="flex -space-x-1">
            {collaborators.slice(0, 3).map((collaborator) => (
              <Circle
                key={collaborator.id}
                className="w-2 h-2 animate-pulse"
                style={{ color: collaborator.cursorColor || '#3B82F6' }}
                fill="currentColor"
              />
            ))}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full p-3 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Add a description..."
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm text-secondary-600 hover:text-secondary-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleEdit}
          className="p-3 min-h-[60px] border border-secondary-200 rounded-md cursor-text hover:border-secondary-300 focus-within:border-primary-500"
        >
          {content ? (
            <p className="text-secondary-900 whitespace-pre-wrap">{content}</p>
          ) : (
            <p className="text-secondary-500">Click to add a description...</p>
          )}
        </div>
      )}
    </div>
  )
}

// Connection status indicator
export const ConnectionStatus = () => {
  const { isConnected, connectionError } = useSocket()

  if (isConnected) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-red-500 text-white px-3 py-2 rounded-md shadow-lg flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">
          {connectionError ? 'Connection failed' : 'Reconnecting...'}
        </span>
      </div>
    </div>
  )
}