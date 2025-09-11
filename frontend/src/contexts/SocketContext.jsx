import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState(new Map())
  const { user, token } = useAuthStore()

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return

    const newSocket = io(window.location.origin, {
      auth: {
        token,
      },
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      randomizationFactor: 0.5,
    })

    newSocket.on('connect', () => {
      setConnected(true)
      
      // Listen for transport upgrades
      newSocket.io.engine.on('upgrade', () => {
        // Transport upgraded
      })
    })

    newSocket.on('disconnect', (reason) => {
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      setConnected(false)
      
      // Show user-friendly error message
      if (error.message?.includes('timeout')) {
        toast.error('Connection timeout. Retrying...')
      } else if (error.message?.includes('Authentication')) {
        toast.error('Authentication failed. Please login again.')
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      setConnected(true)
      toast.success('Reconnected to server')
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      // Reconnection attempt in progress
    })

    newSocket.on('reconnect_error', (error) => {
      // Reconnection error occurred
    })

    newSocket.on('reconnect_failed', () => {
      setConnected(false)
      toast.error('Failed to reconnect. Please refresh the page.')
    })

    // User presence events
    newSocket.on('user:online', (userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]))
    })

    newSocket.on('user:offline', (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    })

    newSocket.on('presence:update', (presence) => {
      setOnlineUsers(new Set(presence.onlineUsers))
    })

    // Typing indicators
    newSocket.on('typing:start', ({ userId, userName, cardId }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev)
        if (!newMap.has(cardId)) {
          newMap.set(cardId, new Set())
        }
        newMap.get(cardId).add({ userId, userName })
        return newMap
      })
    })

    newSocket.on('typing:stop', ({ userId, cardId }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev)
        if (newMap.has(cardId)) {
          const typingInCard = newMap.get(cardId)
          const updatedTyping = new Set([...typingInCard].filter((user) => user.userId !== userId))
          if (updatedTyping.size === 0) {
            newMap.delete(cardId)
          } else {
            newMap.set(cardId, updatedTyping)
          }
        }
        return newMap
      })
    })

    // Real-time updates
    newSocket.on('board:updated', (data) => {
      // Handle board updates
    })

    newSocket.on('column:created', (data) => {
      // Column created
    })

    newSocket.on('column:updated', (data) => {
      // Column updated
    })

    newSocket.on('column:deleted', (data) => {
      // Column deleted
    })

    newSocket.on('card:created', (data) => {
      // Card created
    })

    newSocket.on('card:updated', (data) => {
      // Card updated
    })

    newSocket.on('card:moved', (data) => {
      // Card moved
    })

    newSocket.on('card:deleted', (data) => {
      // Card deleted
    })

    newSocket.on('comment:created', (data) => {
      // Comment created
    })

    newSocket.on('comment:updated', (data) => {
      // Comment updated
    })

    newSocket.on('comment:deleted', (data) => {
      // Comment deleted
    })

    // Notification events
    newSocket.on('notification:new', (notification) => {
      toast.success(notification.message)
    })

    // Error handling
    newSocket.on('error', (error) => {
      toast.error(error.message || 'Socket error occurred')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(null)
      setConnected(false)
      setOnlineUsers(new Set())
      setTypingUsers(new Map())
    }
  }, [user, token])

  // Socket helper functions
  const joinBoard = useCallback(
    (boardId) => {
      if (socket && connected) {
        socket.emit('board:join', { boardId })
      }
    },
    [socket, connected]
  )

  const leaveBoard = useCallback(
    (boardId) => {
      if (socket && connected) {
        socket.emit('board:leave', { boardId })
      }
    },
    [socket, connected]
  )

  const startTyping = useCallback(
    (cardId) => {
      if (socket && connected) {
        socket.emit('typing:start', { cardId })
      }
    },
    [socket, connected]
  )

  const stopTyping = useCallback(
    (cardId) => {
      if (socket && connected) {
        socket.emit('typing:stop', { cardId })
      }
    },
    [socket, connected]
  )

  const emitBoardUpdate = useCallback(
    (boardId, data) => {
      if (socket && connected) {
        socket.emit('board:update', { boardId, ...data })
      }
    },
    [socket, connected]
  )

  const emitColumnUpdate = useCallback(
    (boardId, action, data) => {
      if (socket && connected) {
        socket.emit(`column:${action}`, { boardId, ...data })
      }
    },
    [socket, connected]
  )

  const emitCardUpdate = useCallback(
    (boardId, action, data) => {
      if (socket && connected) {
        socket.emit(`card:${action}`, { boardId, ...data })
      }
    },
    [socket, connected]
  )

  const emitCommentUpdate = useCallback(
    (boardId, action, data) => {
      if (socket && connected) {
        socket.emit(`comment:${action}`, { boardId, ...data })
      }
    },
    [socket, connected]
  )

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId)
    },
    [onlineUsers]
  )

  const getTypingUsers = useCallback(
    (cardId) => {
      return typingUsers.get(cardId) || new Set()
    },
    [typingUsers]
  )

  const value = {
    socket,
    connected,
    onlineUsers,
    typingUsers,
    joinBoard,
    leaveBoard,
    startTyping,
    stopTyping,
    emitBoardUpdate,
    emitColumnUpdate,
    emitCardUpdate,
    emitCommentUpdate,
    isUserOnline,
    getTypingUsers,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
