import React from 'react'
import { Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, isOwnMessage, senderAvatar, senderName }) {
  // Render delivery status ticks
  const renderTicks = () => {
    if (!isOwnMessage) return null
    
    const { delivery_status } = message
    
    if (delivery_status === 'read') {
      // Blue double tick
      return (
        <span className="inline-flex items-center ml-1" title="Read">
          <CheckCheck size={14} className={isOwnMessage ? 'text-blue-200' : 'text-blue-500'} />
        </span>
      )
    } else if (delivery_status === 'delivered') {
      // Gray double tick
      return (
        <span className="inline-flex items-center ml-1" title="Delivered">
          <CheckCheck size={14} className={isOwnMessage ? 'text-white/80' : 'text-gray-400'} />
        </span>
      )
    } else {
      // Single gray tick (sent)
      return (
        <span className="inline-flex items-center ml-1" title="Sent">
          <Check size={14} className={isOwnMessage ? 'text-white/80' : 'text-gray-400'} />
        </span>
      )
    }
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - show for all messages */}
      <img
        src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'User')}&background=random`}
        alt={senderName}
        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
      />
      
      {/* Message bubble */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-700 text-white rounded-bl-none'
        }`}
      >
        {/* Sender name for group chats (not own messages) */}
        {!isOwnMessage && senderName && (
          <div className="text-xs text-gray-300 mb-1 font-semibold">
            {senderName}
          </div>
        )}
        
        {/* Message content */}
        <div className="break-words whitespace-pre-wrap">
          {message.content}
        </div>
        
        {/* Time and ticks */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-400'
        }`}>
          <span>
            {(() => {
              const date = new Date(message.created_at)
              // Add 5.5 hours for IST (UTC+5:30)
              const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
              return istDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            })()}
          </span>
          {renderTicks()}
        </div>
      </div>
    </div>
  )
}
