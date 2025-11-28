import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174'

export default function Message() {
  const { user, isLoaded } = useUser()
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
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const socketRef = useRef(null)
  const navigate = useNavigate()
  const endRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Demo conversations with proper structure
  const demoConversations = [
    {
      conversation_id: 1,
      name: 'Team Alpha',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3847ae2529b0?w=40&h=40&fit=crop&crop=face',
      last_text: 'Meeting at 10am tomorrow!',
      unread_count: 2,
      is_online: true,
      last_seen: '9:15 AM',
      is_pinned: true
    },
    {
      conversation_id: 2,
      name: 'Jane Doe',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6df2a17?w=40&h=40&fit=crop&crop=face',
      last_text: 'See you later!',
      unread_count: 0,
      is_online: false,
      last_seen: '9:15 AM',
      is_pinned: false
    },
    {
      conversation_id: 3,
      name: 'Dev Squad',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      last_text: 'Code review needed',
      unread_count: 1,
      is_online: false,
      last_seen: '9:15 AM',
      is_pinned: false
    }
  ]

  const demoMessages = [
    {
      id: 1,
      conversation_id: 1,
      sender_id: 2,
      sender_name: 'John',
      text: 'Hey team!',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      conversation_id: 1,
      sender_id: 3,
      sender_name: 'Alice',
      text: 'Meeting at 10am tomorrow!',
      created_at: '2024-01-15T10:02:00Z'
    }
  ]

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒'
  ]

  useEffect(() => {
    // Use demo data initially, then try to load from backend
    setConversations(demoConversations)
    if (!token) return
    fetch(`${API_BASE}/api/messages/conversations`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setConversations(data)
        }
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    const socket = io(API_BASE, { withCredentials: true })
    socketRef.current = socket
    return () => socket.disconnect()
  }, [token])

  useEffect(() => {
    if (!activeConversationId) return
    
    // Use demo messages for conversation 1
    if (activeConversationId === 1) {
      setMessages(demoMessages)
    } else {
      setMessages([])
    }

    if (!token) return
    
    // Load messages from backend
    fetch(`${API_BASE}/api/messages/conversations/${activeConversationId}/messages`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setMessages(data)
        }
      })
      .catch(() => {})
    
    // Join socket room
    socketRef.current?.emit('conversation:join', activeConversationId)
    const handler = (msg) => {
      if (msg.conversation_id === activeConversationId) {
        setMessages(prev => [...prev, msg])
      }
    }
    socketRef.current?.on('message:new', handler)
    return () => socketRef.current?.off('message:new', handler)
  }, [activeConversationId, token])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeConversationId) return
    try {
      setIsSending(true)
      // optimistic insert
      const optimistic = {
        id: `local-${Date.now()}`,
        conversation_id: activeConversationId,
        sender_id: user?.id || -1,
        sender_name: user?.fullName || user?.username || 'You',
        text,
        created_at: new Date().toISOString(),
        _optimistic: true
      }
      setMessages(prev => [...prev, optimistic])
      setText('')
      
      if (!token) {
        // Demo mode - just keep the optimistic message
        setIsSending(false)
        return
      }
      
    const res = await fetch(`${API_BASE}/api/messages/conversations/${activeConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
        body: JSON.stringify({ text: optimistic.text })
    })
    const data = await res.json()
    if (res.ok) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
      } else {
        // rollback optimistic and reinsert as error bubble
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setMessages(prev => [...prev, { ...optimistic, _error: true }])
      }
    } finally {
      setIsSending(false)
    }
  }

  // auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, activeConversationId])

  const handleComposerKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isSending) {
        handleSend(e)
      }
    }
  }

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter(c =>
      (c.name || '').toLowerCase().includes(q) || 
      (c.last_text || '').toLowerCase().includes(q)
    )
  }, [conversations, query])

  const activeConversation = conversations.find(c => c.conversation_id === activeConversationId)

  const addEmoji = (emoji) => {
    setText(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const addGroupMember = () => {
    if (memberName.trim()) {
      setGroupMembers(prev => [...prev, memberName.trim()])
      setMemberName('')
    }
  }

  const createGroup = () => {
    if (groupName.trim()) {
      // Demo: add new group conversation
      const newGroup = {
        conversation_id: Date.now(),
        name: groupName,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3847ae2529b0?w=40&h=40&fit=crop&crop=face',
        last_text: 'Group created',
        unread_count: 0,
        is_online: false,
        last_seen: 'now',
        is_pinned: false
      }
      setConversations(prev => [newGroup, ...prev])
      setShowGroupModal(false)
      setGroupName('')
      setGroupMembers([])
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Messages</h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm flex items-center gap-1"
            >
              <span>+</span> New
            </button>
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
              key={conv.conversation_id}
              onClick={() => setActiveConversationId(conv.conversation_id)}
              className={`flex items-center p-3 hover:bg-gray-700 cursor-pointer border-l-4 ${
                activeConversationId === conv.conversation_id 
                  ? 'bg-gray-700 border-blue-500' 
                  : 'border-transparent'
              }`}
            >
              <div className="relative">
                <img 
                  src={conv.avatar} 
                  alt={conv.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                {conv.is_online && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                )}
                {conv.is_pinned && (
                  <div className="absolute -top-1 -left-1 text-yellow-400">📌</div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{conv.name}</h3>
                  <span className="text-xs text-gray-400">{conv.last_seen}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{conv.last_text}</p>
              </div>
              {conv.unread_count > 0 && (
                <div className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center ml-2">
                  {conv.unread_count}
                </div>
              )}
            </div>
          ))}
          {!conversations.length && (
            <div className="p-4 text-center text-gray-400">No conversations yet</div>
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
                  <img 
                    src={activeConversation.avatar} 
                    alt={activeConversation.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {activeConversation.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          )}
        </div>
                <div className="ml-3">
                  <h2 className="font-semibold">{activeConversation.name}</h2>
                  <p className="text-sm text-gray-400">
                    {activeConversation.is_online ? 'online' : `last seen ${activeConversation.last_seen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-700 rounded">📅</button>
                <button className="p-2 hover:bg-gray-700 rounded">⚡</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender_id !== user?.id && (
                    <div className="mr-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {msg.sender_name?.[0] || 'U'}
                      </div>
                    </div>
                  )}
                  <div className={`max-w-xs lg:max-w-md ${msg.sender_id === user?.id ? 'ml-auto' : ''}`}>
                    {msg.sender_id !== user?.id && (
                      <div className="text-sm text-blue-400 mb-1">{msg.sender_name}</div>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${
                      msg.sender_id === user?.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-white'
                    } ${msg._error ? 'ring-2 ring-red-400' : ''}`}>
                      {msg.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === user?.id && (
                        <span className="inline-flex items-center">
                          {msg.delivery_status === 'read' ? (
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" />
                            </svg>
                          ) : msg.delivery_status === 'delivered' ? (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      )}
        </div>
              </div>
            </div>
          ))}
              {!messages.length && (
                <div className="text-center text-gray-400 mt-8">
                  Say hi to start the conversation! 👋
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
                    <div className="absolute bottom-12 left-0 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg w-80 max-h-40 overflow-y-auto">
                      <div className="text-sm text-gray-300 mb-2">Smileys</div>
                      <div className="grid grid-cols-8 gap-1">
                        {emojis.map((emoji, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addEmoji(emoji)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
          )}
        </div>
                <button type="button" className="p-2 text-gray-400 hover:text-white">📎</button>
                <div className="flex-1">
                  <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleComposerKey}
                    placeholder="Type a message..."
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim() || isSending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white font-medium"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
        </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-gray-400">Choose a conversation from the sidebar to start chatting</p>
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
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setShowNewChatModal(false)
                  setShowGroupModal(true)
                }}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <span>Create New Group</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">👥</span>
                Create New Group
              </h3>
              <button 
                onClick={() => setShowGroupModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Add Members</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Enter member name..."
                    className="flex-1 bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addGroupMember}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                {groupMembers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {groupMembers.map((member, i) => (
                      <div key={i} className="text-sm text-gray-300">• {member}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}