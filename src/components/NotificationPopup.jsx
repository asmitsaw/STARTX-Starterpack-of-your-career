import React, { useState, useEffect } from 'react';

const NotificationPopup = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for new post notifications
    const handleNewPost = (data) => {
      setNotifications(prev => [
        ...prev, 
        {
          id: Date.now(),
          user: data.user.name,
          avatar: data.user.avatar_url,
          content: data.content || '',
          mediaType: data.media_type,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== Date.now()));
      }, 5000);
    };

    // Setup event listener
    window.addEventListener('new-post-notification', (e) => {
      handleNewPost(e.detail);
    });

    return () => {
      window.removeEventListener('new-post-notification');
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-3">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 w-80 border border-slate-200 dark:border-slate-700 animate-fade-in-up"
        >
          <div className="flex items-start">
            <img 
              src={notification.avatar} 
              alt={notification.user}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {notification.user}
                </span>
                <span className="text-xs text-slate-500">
                  {notification.timestamp}
                </span>
              </div>
              
              {notification.mediaType ? (
                <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                  Posted a new {notification.mediaType}
                </p>
              ) : (
                <p className="text-sm mt-1 text-slate-700 dark:text-slate-300 truncate">
                  {notification.content || 'Shared an update'}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
