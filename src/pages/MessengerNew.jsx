import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import MessageBubble from '../components/MessageBubble'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174'

export default function MessengerNew() {
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null) // Database user with UUID
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [query, setQuery] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [connections, setConnections] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [showConnectionsModal, setShowConnectionsModal] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const socketRef = useRef(null)
  const endRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒'
  ]

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/conversations`, {
        withCredentials: true
      })
      setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [user])

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!user || !conversationId) return
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/messages/conversations/${conversationId}/messages`,
        { withCredentials: true }
      )
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [user])

  // Socket.IO setup
  useEffect(() => {
    if (!user) return

    const socket = io(API_BASE, { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    // Join user room
    socket.emit('user:join', { userId: user.id })

    // Listen for new messages
    socket.on('message:new', (message) => {
      setMessages(prev => [...prev, message])
      // Refresh conversations to update last message
      loadConversations()
      
      // If message is for current conversation and not from me, mark as delivered
      if (message.conversation_id === activeConversationId && message.sender_id !== dbUser?.id) {
        socket.emit('message:delivered', { 
          messageId: message.id, 
          conversationId: message.conversation_id 
        })
      }
    })
    
    // Listen for message delivery status updates
    socket.on('message:delivered', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, delivery_status: 'delivered', delivered_at: new Date().toISOString() } : msg
      ))
    })
    
    socket.on('message:read', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, delivery_status: 'read', read_at: new Date().toISOString() } : msg
      ))
    })

    // Listen for typing indicators
    socket.on('typing:start', ({ userId, conversationId }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers(prev => new Set(prev).add(userId))
      }
    })

    socket.on('typing:stop', ({ userId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    // Listen for online/offline status
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers(prev => new Set(prev).add(userId))
    })

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user, activeConversationId, loadConversations])

  // Fetch database user info
  useEffect(() => {
    const fetchDbUser = async () => {
      if (!user) return
      try {
        const { data } = await axios.get(`${API_BASE}/api/users/me`, {
          withCredentials: true
        })
        console.log('[DB User Fetched]', data)
        setDbUser(data)
      } catch (error) {
        console.error('Error fetching db user:', error)
      }
    }
    fetchDbUser()
  }, [user])

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
      // Join conversation room
      socketRef.current?.emit('conversation:join', activeConversationId)
      
      return () => {
        socketRef.current?.emit('conversation:leave', activeConversationId)
      }
    }
  }, [activeConversationId, loadMessages])

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!activeConversationId || !user) return

    socketRef.current?.emit('typing:start', {
      conversationId: activeConversationId,
      userId: user.id
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', {
        conversationId: activeConversationId,
        userId: user.id
      })
    }, 3000)
  }, [activeConversationId, user])

  // Send message
  const handleSend = async (e) => {
    const sendMessage = async () => {
      if (!text.trim() || isSending) return
    
      // Check for @gemini trigger - don't send as message
      if (text.trim().toLowerCase().startsWith('@gemini')) {
        setText('')
        setShowAiSuggestion(false)
        return
      }
      
      if (!activeConversationId) return
      
      setIsSending(true)
      try {
        const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: activeConversationId,
        sender_id: user.id,
        sender_name: user.fullName || user.firstName || 'You',
        sender_avatar: user.imageUrl,
        content: text,
        created_at: new Date().toISOString(),
        _optimistic: true
      }
      setMessages(prev => [...prev, optimisticMessage])
      setText('')

      // Stop typing indicator
      socketRef.current?.emit('typing:stop', {
        conversationId: activeConversationId,
        userId: user.id
      })

      // Send to server
      const { data } = await axios.post(
        `${API_BASE}/api/messages/conversations/${activeConversationId}/messages`,
        { content: text },
        { withCredentials: true }
      )

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? data : m)
      )
      
      // Refresh conversations
      loadConversations()
      } catch (error) {
        console.error('Error sending message:', error)
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => !m._optimistic))
        setText(text) // Restore text
      } finally {
        setIsSending(false)
      }
    }
    
    e?.preventDefault()
    await sendMessage()
  }

  // Handle text change with typing indicator
  const handleTextChange = (e) => {
    const value = e.target.value
    setText(value)
    
    // Show @gemini suggestion when typing @ (but not if it's already @gemini)
    if (value === '@' || (value.startsWith('@') && value.length <= 7 && !value.toLowerCase().includes('gemini'))) {
      setShowAiSuggestion(true)
    } else {
      setShowAiSuggestion(false)
    }
    
    // Don't send typing indicator if typing @gemini trigger
    if (!value.toLowerCase().startsWith('@gemini')) {
      handleTyping()
    }
  }

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isSending) {
        handleSend(e)
      }
    }
  }

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await axios.get(`${API_BASE}/api/connections`, {
        withCredentials: true
      })
      setConnections(data.filter(c => c.status === 'accepted'))
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }, [user])

  // Load pending requests
  const loadPendingRequests = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await axios.get(`${API_BASE}/api/connections/requests`, {
        withCredentials: true
      })
      setPendingRequests(data)
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }, [user])

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`,
        { withCredentials: true }
      )
      setSearchResults(data.users || data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }, [])

  // Send connection request
  const sendConnectionRequest = async (targetUserId) => {
    try {
      await axios.post(
        `${API_BASE}/api/connections/request`,
        { targetUserId },
        { withCredentials: true }
      )
      alert('Connection request sent!')
      loadConnections()
    } catch (error) {
      if (error.response?.data?.error === 'Already connected') {
        alert('Already connected with this user')
      } else if (error.response?.data?.error === 'Request already sent') {
        alert('Request already sent to this user')
      } else {
        alert('Failed to send request')
      }
    }
  }

  // Accept connection request
  const acceptRequest = async (connectionId) => {
    try {
      await axios.post(
        `${API_BASE}/api/connections/accept/${connectionId}`,
        {},
        { withCredentials: true }
      )
      loadConnections()
      loadPendingRequests()
      alert('Connection accepted!')
    } catch (error) {
      alert('Failed to accept request')
    }
  }

  // Reject connection request
  const rejectRequest = async (connectionId) => {
    try {
      await axios.post(
        `${API_BASE}/api/connections/reject/${connectionId}`,
        {},
        { withCredentials: true }
      )
      loadPendingRequests()
      alert('Connection rejected')
    } catch (error) {
      alert('Failed to reject request')
    }
  }

  // Create conversation with user
  const createConversation = async (participantId) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/messages/conversations`,
        { participantId },
        { withCredentials: true }
      )
      setActiveConversationId(data.id)
      loadConversations()
      setShowNewChatModal(false)
      setShowUserSearch(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  // Create AI conversation
  const createAIConversation = async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/messages/conversations`,
        { type: 'ai' },
        { withCredentials: true }
      )
      setActiveConversationId(data.id)
      loadConversations()
      setShowNewChatModal(false)
    } catch (error) {
      console.error('Error creating AI conversation:', error)
    }
  }

  // Load connections and requests after functions are defined
  useEffect(() => {
    if (user) {
      loadConnections()
      loadPendingRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter(c => {
      const name = c.name || c.participants?.[0]?.name || ''
      const lastMessage = c.last_message?.content || ''
      return name.toLowerCase().includes(q) || lastMessage.toLowerCase().includes(q)
    })
  }, [conversations, query])

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId)

  // Get conversation display name
  const getConversationName = (conv) => {
    if (conv.type === 'ai') return '🤖 Gemini AI'
    if (conv.name) return conv.name
    return conv.participants?.[0]?.name || 'Unknown'
  }

  // Get conversation avatar
  const getConversationAvatar = (conv) => {
    if (conv.type === 'ai') return null
    return conv.participants?.[0]?.avatar_url
  }

  // Check if user is online
  const isUserOnline = (conv) => {
    if (conv.type === 'ai') return true
    const participant = conv.participants?.[0]
    return participant && onlineUsers.has(participant.id)
  }

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Messages</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConnectionsModal(true)}
                className="relative bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md text-sm flex items-center gap-1"
              >
                <span>👥</span> Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm flex items-center gap-1"
              >
                <span>+</span> New
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`flex items-center p-3 hover:bg-gray-700 cursor-pointer border-l-4 ${
                activeConversationId === conv.id 
                  ? 'bg-gray-700 border-blue-500' 
                  : 'border-transparent'
              }`}
            >
              <div className="relative">
                {getConversationAvatar(conv) ? (
                  <img 
                    src={getConversationAvatar(conv)} 
                    alt={getConversationName(conv)} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                    {conv.type === 'ai' ? '🤖' : '👤'}
                  </div>
                )}
                {isUserOnline(conv) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{getConversationName(conv)}</h3>
                  {conv.last_message && (
                    <span className="text-xs text-gray-400">
                      {(() => {
                        const date = new Date(conv.last_message.created_at)
                        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                        return istDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      })()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {conv.last_message?.is_ai_message && '🤖 '}
                  {conv.last_message?.content || 'No messages yet'}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <div className="bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ml-2 shadow-lg">
                  {conv.unread_count}
                </div>
              )}
            </div>
          ))}
          {!conversations.length && (
            <div className="p-4 text-center text-gray-400">
              <p className="mb-2">No conversations yet</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                Start a conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  {getConversationAvatar(activeConversation) ? (
                    <img 
                      src={getConversationAvatar(activeConversation)} 
                      alt={getConversationName(activeConversation)} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                      {activeConversation.type === 'ai' ? '🤖' : '👤'}
                    </div>
                  )}
                  {isUserOnline(activeConversation) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="font-semibold">{getConversationName(activeConversation)}</h2>
                  <p className="text-sm text-gray-400">
                    {activeConversation.type === 'ai' 
                      ? 'AI Assistant powered by Gemini' 
                      : isUserOnline(activeConversation) 
                        ? 'online' 
                        : 'offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => {
                // Compare sender_id with dbUser.id (both should be UUID strings)
                // Also check if sender_name matches as fallback
                const isMyMessage = (msg.sender_id === dbUser?.id) ||
                                   (msg.sender_id === user?.id) ||
                                   (msg.sender_name === dbUser?.name) ||
                                   (msg.sender_name === user?.fullName)
                
                // Get avatar - use Clerk image or database avatar
                const myAvatar = user?.imageUrl || dbUser?.avatar_url
                const senderAvatar = isMyMessage ? myAvatar : msg.sender_avatar
                const senderName = isMyMessage ? (user?.fullName || user?.firstName || dbUser?.name) : msg.sender_name
                
                // Handle AI messages differently
                if (msg.is_ai_message) {
                  return (
                    <div key={msg.id} className="flex items-end gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm flex-shrink-0">
                        🤖
                      </div>
                      <div className="max-w-[70%] rounded-2xl px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-bl-none">
                        <div className="text-xs text-purple-200 mb-1 font-semibold">Gemini AI</div>
                        <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-purple-100">
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="w-8" />
                    </div>
                  )
                }
                
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={isMyMessage}
                    senderAvatar={senderAvatar}
                    senderName={senderName}
                  />
                )
              })}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center text-gray-400 text-sm">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>typing...</span>
                </div>
              )}
              
              {!messages.length && (
                <div className="text-center text-gray-400 mt-8">
                  <p className="text-lg mb-2">👋</p>
                  <p>Say hi to start the conversation!</p>
                  {activeConversation.type === 'ai' && (
                    <p className="text-sm mt-2">Ask me anything! I'm powered by Google Gemini.</p>
                  )}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg w-80 max-h-40 overflow-y-auto z-10">
                      <div className="text-sm text-gray-300 mb-2">Smileys</div>
                      <div className="grid grid-cols-8 gap-1">
                        {emojis.map((emoji, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setText(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  {/* @gemini Autocomplete Suggestion */}
                  {showAiSuggestion && (
                    <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-purple-500 rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={async () => {
                          setShowAiSuggestion(false)
                          setText('')
                          // Find or create AI conversation
                          const aiConv = conversations.find(c => c.type === 'ai')
                          if (aiConv) {
                            setActiveConversationId(aiConv.id)
                          } else {
                            try {
                              const { data } = await axios.post(
                                `${API_BASE}/api/messages/conversations`,
                                { type: 'ai', name: 'Gemini AI' },
                                { withCredentials: true }
                              )
                              await loadConversations()
                              setActiveConversationId(data.id)
                            } catch (error) {
                              console.error('Error creating AI conversation:', error)
                            }
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors w-full text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                          🤖
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            @gemini
                            <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">AI</span>
                          </div>
                          <div className="text-sm text-gray-400">Talk to Gemini AI Assistant</div>
                        </div>
                      </button>
                    </div>
                  )}
                  <textarea
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder={activeConversation?.type === 'ai' ? 'Ask Gemini AI anything...' : 'Type a message or @gemini for AI...'}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim() || isSending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white font-medium"
                >
                  {isSending ? '...' : '➤'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-gray-400 mb-4">Choose a conversation from the sidebar to start chatting</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Chat</h3>
              <button 
                onClick={() => {
                  setShowNewChatModal(false)
                  setShowUserSearch(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {!showUserSearch ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowUserSearch(true)}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left flex items-center"
                >
                  <span className="text-2xl mr-3">👤</span>
                  <span>Message a User</span>
                </button>
                <button 
                  onClick={createAIConversation}
                  className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-left flex items-center"
                >
                  <span className="text-2xl mr-3">🤖</span>
                  <div>
                    <div>Chat with Gemini AI</div>
                    <div className="text-xs opacity-80">Ask questions, get help, or just chat!</div>
                  </div>
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map(result => {
                    const isConnected = connections.some(c => c.user_id === result.id)
                    const connectionStatus = result.connection_status
                    
                    return (
                      <div
                        key={result.id}
                        className="w-full p-3 bg-gray-700 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center flex-1">
                          {result.avatar_url ? (
                            <img 
                              src={result.avatar_url} 
                              alt={result.name}
                              className="w-12 h-12 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3 text-lg font-bold">
                              {result.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-white">{result.name || 'Unknown User'}</div>
                            {result.headline && (
                              <div className="text-sm text-gray-400">{result.headline}</div>
                            )}
                            {result.title && (
                              <div className="text-xs text-gray-500">{result.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          {connectionStatus === 'accepted' || isConnected ? (
                            <button
                              onClick={() => createConversation(result.id)}
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                            >
                              💬 Message
                            </button>
                          ) : connectionStatus === 'pending' ? (
                            <div className="bg-gray-600 px-4 py-2 rounded-lg text-sm text-gray-300">
                              ⏳ Pending
                            </div>
                          ) : (
                            <button
                              onClick={() => sendConnectionRequest(result.id)}
                              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
                            >
                              ➕ Connect
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {searchQuery && !searchResults.length && (
                    <div className="text-center text-gray-400 py-4">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Requests Modal */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Connection Requests</h3>
              <button 
                onClick={() => setShowConnectionsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center mb-3">
                      {request.avatar_url ? (
                        <img 
                          src={request.avatar_url} 
                          alt={request.name}
                          className="w-12 h-12 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3 text-lg font-bold">
                          {request.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{request.name}</div>
                        {request.headline && (
                          <div className="text-sm text-gray-400">{request.headline}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">👥</div>
                <p>No pending requests</p>
              </div>
            )}
            
            {connections.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Your Connections ({connections.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {connections.slice(0, 5).map(conn => (
                    <div
                      key={conn.id}
                      className="flex items-center p-2 bg-gray-700 rounded-lg"
                    >
                      {conn.avatar_url ? (
                        <img 
                          src={conn.avatar_url} 
                          alt={conn.name}
                          className="w-8 h-8 rounded-full object-cover mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 text-sm">
                          {conn.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 text-sm">{conn.name}</div>
                      <button
                        onClick={() => {
                          createConversation(conn.user_id)
                          setShowConnectionsModal(false)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
