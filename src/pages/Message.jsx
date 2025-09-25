import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174'

export default function Message() {
  const { currentUser, token } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const socketRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/messages/conversations`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
      .then(r => r.json())
      .then(setConversations)
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    const socket = io(API_BASE, { withCredentials: true })
    socketRef.current = socket
    return () => socket.disconnect()
  }, [token])

  useEffect(() => {
    if (!activeConversationId || !token) return
    // Load messages
    fetch(`${API_BASE}/api/messages/conversations/${activeConversationId}/messages`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
      .then(r => r.json())
      .then(setMessages)
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
    const res = await fetch(`${API_BASE}/api/messages/conversations/${activeConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ text })
    })
    const data = await res.json()
    if (res.ok) {
      setText('')
      setMessages(prev => [...prev, data])
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <aside className="md:col-span-1 rounded-lg border border-white/10 bg-dark-800/60 backdrop-blur p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold">Messages</h2>
          <button className="btn-outline text-xs" onClick={() => navigate('/profile')}>New chat</button>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {conversations.map(c => (
            <button
              key={c.conversation_id}
              onClick={() => setActiveConversationId(c.conversation_id)}
              className={`w-full text-left p-3 rounded-md transition-colors ${activeConversationId===c.conversation_id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="text-slate-100 truncate">Conversation</div>
              <div className="text-slate-400 text-xs truncate">{c.last_text || 'No messages yet'}</div>
            </button>
          ))}
          {!conversations.length && (
            <div className="text-sm text-slate-400">No conversations yet</div>
          )}
        </div>
      </aside>
      <section className="md:col-span-2 rounded-lg border border-white/10 bg-dark-800/60 backdrop-blur flex flex-col h-[78vh]">
        <div className="border-b border-white/10 p-3">
          <h3 className="text-slate-200 font-medium">{activeConversationId ? 'Chat' : 'Select a conversation'}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" id="messages-scroll">
          {messages.map(m => (
            <div key={m.id} className={`max-w-[80%] ${m.sender_id===currentUser?.id ? 'ml-auto text-right' : ''}`}>
              <div className={`inline-block px-3 py-2 rounded-xl ${m.sender_id===currentUser?.id ? 'bg-startx-500 text-white' : 'bg-white/10 text-slate-100'}`}>
                {m.text}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {!messages.length && activeConversationId && (
            <div className="text-sm text-slate-400">Say hi 👋</div>
          )}
        </div>
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
          <input
            className="flex-1 bg-dark-700 rounded-md px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-startx-500"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary" type="submit">Send</button>
        </form>
      </section>
    </div>
  )
}


