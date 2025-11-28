import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { io } from 'socket.io-client'
import { useUser } from '@clerk/clerk-react'

export default function PostNotification() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState([])
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!user) return

    const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5173'
    const SOCKET_URL = import.meta?.env?.VITE_SOCKET_URL || 'http://localhost:5174'
    
    console.log('[PostNotification] Connecting to socket:', SOCKET_URL)
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })
    setSocket(newSocket)

    newSocket.on('connect', async () => {
      console.log('[PostNotification] Socket connected!')
      // Join user room
      newSocket.emit('user:join', user.id)
      console.log('[PostNotification] Joined user room:', user.id)
      
      // Fetch missed notifications when coming online
      try {
        console.log('[PostNotification] Fetching missed notifications...')
        const response = await fetch(`${SOCKET_URL}/api/posts/missed-notifications`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('[PostNotification] Failed to fetch missed notifications:', response.status)
          return
        }
        
        const data = await response.json()
        console.log('[PostNotification] Missed notifications:', data)
        
        if (data.posts && data.posts.length > 0) {
          console.log(`[PostNotification] Showing ${data.posts.length} missed notifications`)
          // Show missed posts as notifications
          data.posts.forEach((post, index) => {
            setTimeout(() => {
              const notification = {
                id: Date.now() + Math.random(),
                authorName: post.author_name,
                authorAvatar: post.author_avatar,
                content: post.content,
                timestamp: new Date(post.created_at),
                postId: post.id,
                isMissed: true
              }
              console.log('[PostNotification] Adding missed notification:', notification)
              setNotifications(prev => [...prev, notification])

              // Auto-remove after 5 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id))
              }, 5000)
            }, index * 500) // Stagger notifications
          })
        }
      } catch (error) {
        console.error('[PostNotification] Error fetching missed notifications:', error)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('[PostNotification] Socket connection error:', error)
    })

    // Listen for new posts
    newSocket.on('post:new', (data) => {
      console.log('[PostNotification] Received post:new event:', data)
      
      // Don't show notification for own posts
      if (data.author_id === user.id) {
        console.log('[PostNotification] Skipping own post')
        return
      }

      const notification = {
        id: Date.now() + Math.random(),
        authorName: data.author_name,
        authorAvatar: data.author_avatar,
        content: data.content,
        timestamp: new Date(data.created_at),
        postId: data.post_id
      }

      console.log('[PostNotification] Adding notification:', notification)
      setNotifications(prev => [...prev, notification])

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 5000)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const truncateContent = (content, maxLength = 80) => {
    if (!content) return ''
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <img
              src={notif.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.authorName)}&background=random`}
              alt={notif.authorName}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white text-sm">
                  {notif.authorName}
                </p>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-xs text-gray-400 mt-0.5">
                {notif.isMissed && '📬 While you were away • '}
                {notif.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              
              <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                {truncateContent(notif.content)}
              </p>
              
              <button
                onClick={() => window.location.href = '/feed'}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-medium"
              >
                View Post →
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
