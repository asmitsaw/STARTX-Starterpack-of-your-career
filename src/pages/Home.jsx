import React, { useEffect, useRef, useState, Suspense, Component } from 'react'
import { Link } from 'react-router-dom'
import { icons } from '../assets/icons.jsx'
import { io } from 'socket.io-client'
import IMAGEKIT_CONFIG from '../config/imagekit.js'
import IMAGEKIT_CONFIG from '../config/imagekit.js'
import MeCard from '../components/MeCard.jsx'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import Header from '../components/Header.jsx' // Used in conditional renders

// Error boundary to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Something went wrong</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                We're having trouble displaying this page. Please try refreshing or contact support if the problem persists.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-startx-600 text-white px-4 py-2 rounded-md hover:bg-startx-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import Header from '../components/Header.jsx' // Used in conditional renders

// Error boundary to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Something went wrong</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                We're having trouble displaying this page. Please try refreshing or contact support if the problem persists.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-startx-600 text-white px-4 py-2 rounded-md hover:bg-startx-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// API base for dev/prod
const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5174'
// API helper: sends cookies for JWT with error handling
const apiFetch = async (path, opts = {}) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      credentials: 'include', 
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, 
      ...opts 
    });
    
    if (!response.ok) {
      console.warn(`API response not OK for ${path}: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API fetch error for ${path}:`, error);
    // Return a mock response to prevent UI from breaking
    return {
      ok: false,
      status: 500,
      statusText: "Error",
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('')
    };
  }
}
// API helper: sends cookies for JWT with error handling
const apiFetch = async (path, opts = {}) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      credentials: 'include', 
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, 
      ...opts 
    });
    
    if (!response.ok) {
      console.warn(`API response not OK for ${path}: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API fetch error for ${path}:`, error);
    // Return a mock response to prevent UI from breaking
    return {
      ok: false,
      status: 500,
      statusText: "Error",
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('')
    };
  }
}

// Relative time helper
const formatRelativeTime = (dateLike) => {
  try {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike
    const diffMs = date.getTime() - Date.now()
    const abs = Math.abs(diffMs)
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const minutes = Math.round(abs / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return rtf.format(Math.sign(diffMs) * -minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (hours < 24) return rtf.format(Math.sign(diffMs) * -hours, 'hour')
    const days = Math.round(hours / 24)
    if (days < 7) return rtf.format(Math.sign(diffMs) * -days, 'day')
    const weeks = Math.round(days / 7)
    if (weeks < 5) return rtf.format(Math.sign(diffMs) * -weeks, 'week')
    const months = Math.round(days / 30)
    if (months < 12) return rtf.format(Math.sign(diffMs) * -months, 'month')
    const years = Math.round(days / 365)
    return rtf.format(Math.sign(diffMs) * -years, 'year')
  } catch {
    return ''
  }
}

function Home() {
  const { user } = useUser()
  const isAuthenticated = !!user
function Home() {
  const { user } = useUser()
  const isAuthenticated = !!user
  const [rolesCount, setRolesCount] = useState(32)
  // Ensure isAuthenticated is always defined to prevent blank page issues
  // Ensure isAuthenticated is always defined to prevent blank page issues

  // App state wired to backend
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [postFile, setPostFile] = useState(null)
  const [clientId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollChoice, setPollChoice] = useState(null)
  
  // Connection state
  const [connections, setConnections] = useState([])
  const [connectionStatus, setConnectionStatus] = useState({})
  
  // Load user connections
  useEffect(() => {
    if (user && isAuthenticated) {
      loadConnections()
      
      // Setup socket connection for real-time updates
      let socket;
      try {
        // Check if API_BASE is valid before creating socket connection
        if (API_BASE) {
          socket = io(API_BASE, { 
            reconnection: true,
            reconnectionAttempts: 3,
            timeout: 10000
          })
          
          if (socket && user && user.id) {
            socket.on('connect', () => {
              socket.emit('user:join', { userId: user.id })
            })
            
            socket.on('connection:updated', () => {
              loadConnections()
            })
            
            socket.on('connect_error', (error) => {
              console.error('Socket connection error:', error)
              // Continue with app functionality even if socket fails
            })
          }
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
        // Continue with app functionality even if socket fails
      }
      
      return () => {
        if (socket) socket.disconnect()
      }
    }
  }, [user, isAuthenticated])
  
  const loadConnections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/connections`)
      setConnections(response.data)
      
      // Create a map of connection statuses for easy lookup
      const statusMap = {}
      response.data.forEach(conn => {
        statusMap[conn.connected_user_id] = conn.status
      })
      setConnectionStatus(statusMap)
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }
  
  const sendConnectionRequest = async (userId) => {
    try {
      await axios.post(`${API_BASE}/api/users/connections/${userId}`, {
        status: 'pending'
      })
      loadConnections()
    } catch (error) {
      console.error('Error sending connection request:', error)
    }
  }
  
  const getConnectionStatus = (userId) => {
    return connectionStatus[userId] || null
  }
  const [showCommentsFor, setShowCommentsFor] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [trending, setTrending] = useState([])
  const [suggestedJobs, setSuggestedJobs] = useState([])
  const [linkPreviews, setLinkPreviews] = useState({})
  const [showEmoji, setShowEmoji] = useState(false)
  const gifInputRef = useRef(null)

  useEffect(() => {
    // Animate the counter on mount to a random-ish value near 32
    const target = 28 + Math.floor(Math.random() * 10) // 28–37
    const durationMs = 1200
    const steps = 24
    const delta = (target - 32) / steps
    let current = 32
    let i = 0
    const id = setInterval(() => {
      i += 1
      current += delta
      setRolesCount(Math.round(current))
      if (i >= steps) {
        setRolesCount(target)
        clearInterval(id)
      }
    }, Math.max(16, Math.floor(durationMs / steps)))
    return () => clearInterval(id)
  }, [])

  // Ensure demo auth + Load profile
  useEffect(() => {
    const boot = async () => {
      let userId = localStorage.getItem('sx_user_id')
      if (!userId) {
        try {
          const res = await apiFetch('/api/auth/demo', { method: 'POST' })
          const data = await res.json()
          if (data?.user?.id) {
            userId = data.user.id
            localStorage.setItem('sx_user_id', userId)
          }
        } catch {}
      }
      if (userId) {
        apiFetch(`/api/users/${userId}`).then(r => r.ok ? r.json() : null).then((p) => setProfile(p)).catch(() => {})
      }
      // Fallback: if API profile fails/slow, hydrate from Clerk so card renders
      setTimeout(() => {
        setProfile(prev => prev || (user ? {
          id: user.id,
          name: user.fullName || user.firstName || 'You',
          headline: user.primaryEmailAddress?.emailAddress || '',
          avatar_url: user.imageUrl
        } : prev))
      }, 800)
    }
    boot()
  }, [])

  // Load feed
  useEffect(() => {
    let ignore = false
    // connect socket once
    let socket;
    // Fallback to ensure UI doesn't stay in loading state
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    try {
      if (API_BASE) {
        // Use port 5174 instead of 3000 for socket connection
        socket = io(API_BASE, { 
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 15000,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling']
        })
        socket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsLoading(false);
        });
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsLoading(false);
          // Continue rendering the UI even if socket connection fails
        });
        socket.on('post:created', ({ post, originClientId }) => {
          // Accept all posts regardless of client ID to ensure visibility across sessions
          setPosts((prev) => {
            // Check if post already exists to avoid duplicates
            if (prev.some(p => p.id === post.id)) return prev;
            return [post, ...prev];
          })
        });
        socket.on('post:liked', ({ postId, delta, originClientId }) => {
          // Accept all like updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) } : p))
        });
        socket.on('post:commented', ({ postId, originClientId }) => {
          // Accept all comment updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
        });
        socket.on('post:shared', ({ postId, originClientId }) => {
          // Accept all share updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p))
        });
      }
    } catch (error) {
       console.error('Socket initialization error:', error);
       setIsLoading(false);
       // Continue rendering the UI even if socket initialization fails
     }
    let socket;
    // Fallback to ensure UI doesn't stay in loading state
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    try {
      if (API_BASE) {
        // Use port 5174 instead of 3000 for socket connection
        socket = io(API_BASE, { 
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 15000,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling']
        })
        socket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsLoading(false);
        });
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsLoading(false);
          // Continue rendering the UI even if socket connection fails
        });
        socket.on('post:created', ({ post, originClientId }) => {
          // Accept all posts regardless of client ID to ensure visibility across sessions
          setPosts((prev) => {
            // Check if post already exists to avoid duplicates
            if (prev.some(p => p.id === post.id)) return prev;
            return [post, ...prev];
          })
        });
        socket.on('post:liked', ({ postId, delta, originClientId }) => {
          // Accept all like updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) } : p))
        });
        socket.on('post:commented', ({ postId, originClientId }) => {
          // Accept all comment updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
        });
        socket.on('post:shared', ({ postId, originClientId }) => {
          // Accept all share updates regardless of client ID
          setPosts((prev) => prev.map(p => p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p))
        });
      }
    } catch (error) {
       console.error('Socket initialization error:', error);
       setIsLoading(false);
       // Continue rendering the UI even if socket initialization fails
     }
    const load = async () => {
      try {
        setLoadingFeed(true)
        const res = await apiFetch('/api/posts/feed?limit=10')
        const data = await res.json()
        if (!ignore) {
          // Merge with local storage posts if available
          const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
          const mergedPosts = [...(data.items || [])];
          
          // Add local posts that aren't in the server response
          localPosts.forEach(localPost => {
            if (!mergedPosts.some(p => p.id === localPost.id)) {
              mergedPosts.push(localPost);
            }
          });
          
          // Sort by creation date (newest first)
          mergedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setPosts(mergedPosts);
          // Merge with local storage posts if available
          const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
          const mergedPosts = [...(data.items || [])];
          
          // Add local posts that aren't in the server response
          localPosts.forEach(localPost => {
            if (!mergedPosts.some(p => p.id === localPost.id)) {
              mergedPosts.push(localPost);
            }
          });
          
          // Sort by creation date (newest first)
          mergedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setPosts(mergedPosts);
          setNextCursor(data.nextCursor || null)
        }
      } finally {
        setLoadingFeed(false)
      }
    }
    load()
    return () => { 
      ignore = true; 
      clearTimeout(loadingTimeout)
      if (socket) socket.close() 
    }
    return () => { 
      ignore = true; 
      clearTimeout(loadingTimeout)
      if (socket) socket.close() 
    }
  }, [])

  // Load suggestions and trending
  useEffect(() => {
    let cancelled = false
    const safeSet = (setter) => (data) => { if (!cancelled) setter(Array.isArray(data) ? data : (data?.items || [])) }
    apiFetch('/api/users/suggestions').then(r => r.ok ? r.json() : []).then(safeSet(setSuggestions)).catch(() => safeSet(setSuggestions)([]))
    apiFetch('/api/trending').then(r => r.ok ? r.json() : []).then(safeSet(setTrending)).catch(() => safeSet(setTrending)([]))
    apiFetch('/api/jobs/suggested').then(r => r.ok ? r.json() : []).then(safeSet(setSuggestedJobs)).catch(() => safeSet(setSuggestedJobs)([]))
    return () => { cancelled = true }
  }, [])

  // No hardcoded fallbacks; rely on live API only

  // Handlers
  const handlePost = async () => {
    if (!postContent.trim() && !postFile) return
    const temp = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      name: profile?.name || 'You',
      headline: profile?.headline || '',
      content: postContent,
      media_url: postFile ? 'uploading...' : null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      user_id: profile?.id || localStorage.getItem('sx_user_id') || 'anonymous',
      persisted: true // Flag to identify locally persisted posts
      user_id: profile?.id || localStorage.getItem('sx_user_id') || 'anonymous',
      persisted: true // Flag to identify locally persisted posts
    }
    
    // Add to UI immediately
    
    // Add to UI immediately
    setPosts(prev => [temp, ...prev])
    
    // Save to localStorage for persistence across sessions
    const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
    localPosts.unshift(temp);
    localStorage.setItem('sx_posts', JSON.stringify(localPosts));
    
    
    // Save to localStorage for persistence across sessions
    const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
    localPosts.unshift(temp);
    localStorage.setItem('sx_posts', JSON.stringify(localPosts));
    
    setPostContent('')
    setPostFile(null)
    
    
    try {
      // Upload to ImageKit.io if there's a file
      let mediaUrl = null;
      if (postFile) {
        try {
          // Create a FormData for the file upload
          const imageKitData = new FormData();
          imageKitData.append('file', postFile);
          imageKitData.append('fileName', `startx_${Date.now()}`);
          imageKitData.append('publicKey', IMAGEKIT_CONFIG.publicKey); // Using global ImageKit config
          
          // Use server-side proxy for ImageKit upload to avoid CORS issues
          // This prevents the white page issue by handling the upload properly
          const imageKitResponse = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            credentials: 'include',
            body: imageKitData
          });
          
          if (imageKitResponse.ok) {
            const imageKitResult = await imageKitResponse.json();
            mediaUrl = imageKitResult.url;
            
            // Update the post in localStorage with the real media URL
            const updatedLocalPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
            const updatedPosts = updatedLocalPosts.map(p => 
              p.id === temp.id ? {...p, media_url: mediaUrl} : p
            );
            localStorage.setItem('sx_posts', JSON.stringify(updatedPosts));
            
            // Update UI
            setPosts(prev => prev.map(p => 
              p.id === temp.id ? {...p, media_url: mediaUrl} : p
            ));
          }
        } catch (err) {
          console.error('Media upload failed:', err);
          // Continue with post creation even if media upload fails
        }
      }
      
      // Send to server
      const form = new FormData();
      form.append('content', temp.content);
      form.append('client_post_id', temp.id); // Send the client-generated ID
      if (mediaUrl) {
        // Server expects 'media_metadata' JSON, not 'media_url'
        form.append('media_metadata', JSON.stringify({ url: mediaUrl }));
      } else if (postFile) {
        form.append('media', postFile); // Fallback to server upload
      }
      
      const res = await fetch(`${API_BASE}/api/posts`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'x-client-id': clientId },
        body: form 
      });
      
      if (res.ok) {
        const created = await res.json();
        
        // Update in localStorage
        const updatedLocalPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
        const updatedPosts = updatedLocalPosts.map(p => 
          p.id === temp.id ? {...created, persisted: true} : p
        );
        localStorage.setItem('sx_posts', JSON.stringify(updatedPosts));
        
        // Update in UI
        setPosts(prev => prev.map(p => p.id === temp.id ? {...created, persisted: true} : p));
      }
    } catch (err) {
      console.error('Post creation error:', err);
      // Keep the post in UI and localStorage even if server sync fails
      // This ensures posts remain visible across sessions
    }
  }

  // Extract first URL for preview
  const extractFirstUrl = (text) => {
    const m = text?.match(/https?:\/\/[^\s]+/i)
    return m ? m[0] : null
  }

  const ensurePreview = async (url) => {
    if (!url || linkPreviews[url]) return
    try {
      const res = await apiFetch(`/api/preview?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      setLinkPreviews((prev) => ({ ...prev, [url]: data }))
    } catch {}
  }

  const onLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (p.__liked ? -1 : 1), __liked: !p.__liked } : p))
    try {
      await apiFetch(`/api/posts/${postId}/like`, { method: 'PUT', headers: { 'x-client-id': clientId } })
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (p.__liked ? 1 : -1), __liked: !p.__liked } : p))
    }
  }

  const onComment = async (postId) => {
    const text = prompt('Write a comment')
    if (!text?.trim()) return
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
    try {
      await apiFetch(`/api/posts/${postId}/comment`, { method: 'POST', headers: { 'x-client-id': clientId }, body: JSON.stringify({ text }) })
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p))
    }
  }

  const onShare = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p))
    try {
      await apiFetch(`/api/posts/${postId}/share`, { method: 'PUT', headers: { 'x-client-id': clientId } })
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares_count: Math.max(0, (p.shares_count || 0) - 1) } : p))
    }
  }

  // Comments modal helpers
  const openComments = async (postId) => {
    setShowCommentsFor(postId)
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`)
      const data = await res.json()
      setComments(data)
    } catch { setComments([]) }
  }
  const submitComment = async () => {
    const text = newComment.trim()
    if (!text || !showCommentsFor) return
    const temp = { id: `temp-${Date.now()}`, text, user_id: profile?.id, name: profile?.name, created_at: new Date().toISOString() }
    setComments(prev => [...prev, temp])
    setNewComment('')
    try {
      await apiFetch(`/api/posts/${showCommentsFor}/comment`, { method: 'POST', headers: { 'x-client-id': clientId }, body: JSON.stringify({ text }) })
    } catch {}
  }

  // Show a loading state while data is being fetched
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-startx-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show an error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <h3 className="text-red-800 dark:text-red-400 font-medium">Error loading page</h3>
            <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Always render the page, even if some data is missing
  // Show a loading state while data is being fetched
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-startx-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show an error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <h3 className="text-red-800 dark:text-red-400 font-medium">Error loading page</h3>
            <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Always render the page, even if some data is missing
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
      {/* Header is already included in conditional renders, no need to duplicate it here */}

      {/* Main Content Layout - Guaranteed to render */}
      {/* Header is already included in conditional renders, no need to duplicate it here */}

      {/* Main Content Layout - Guaranteed to render */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            {profile ? (
              <MeCard
                profile={profile}
                contactText="Contact Me"
              />
            ) : (
              <div className="card p-6 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full mt-2"></div>
                </div>
              </div>
            )}

            {/* People You May Know (moved from right sidebar) */}
            <div className="card p-6 hidden lg:hidden">
              <h4 className="font-semibold text-slate-900 mb-4">People you may know</h4>
              <div className="space-y-4">
                {suggestions.length === 0 && (
                  <div className="text-sm text-slate-500">No suggestions right now.</div>
                )}
                {suggestions.map((person) => (
                  <div key={person.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                          {(person.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{person.name}</p>
                        <p className="text-xs text-slate-600">{person.headline || ''}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendConnectionRequest(person.id)}
                      className={`${
                        getConnectionStatus(person.id) === 'connected' 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : getConnectionStatus(person.id) === 'pending' 
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'text-startx-600 hover:text-white hover:bg-startx-600 border border-startx-300/60'
                      } rounded-full px-3 py-1.5 font-medium text-sm transition-colors`}
                    >
                      {getConnectionStatus(person.id) === 'connected' 
                        ? 'Connected' 
                        : getConnectionStatus(person.id) === 'pending' 
                          ? 'Pending' 
                          : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Link to="/jobs" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.feed}</span>
                  <span>Find Jobs</span>
                </Link>
                <Link to="/network" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.news}</span>
                  <span>My Network</span>
                </Link>
                <Link to="/mock-interview" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.interview}</span>
                  <span>Practice Interview</span>
                </Link>
                <Link to="/learning" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.learning}</span>
                  <span>Learning</span>
                </Link>
              </div>
            </div>

            {/* This Week's Poll - moved to left */}
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <h4 className="font-semibold text-white mb-2">This Week's Poll</h4>
              <p className="text-slate-300 text-sm mb-3">What's your ideal work environment?</p>
              {['Remote','Hybrid','Office'].map((opt, idx) => (
                <button key={opt} onClick={() => setPollChoice(idx)} className={`w-full text-left px-3 py-2 rounded-lg border mb-2 transition ${pollChoice===idx ? 'bg-startx-600 text-white border-startx-500' : 'border-white/10 text-slate-200 hover:bg-white/5'}`}>{opt}</button>
              ))}
              {pollChoice!=null && (
                <div className="mt-2 space-y-2">
                  {[45,32,23].map((v,i)=> (
                    <div key={i} className="h-2 rounded bg-white/10">
                      <div className={`h-2 rounded ${i===0?'bg-startx-500':i===1?'bg-accent-500':'bg-slate-400'}`} style={{width:`${v}%`}} />
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-400">100+ votes</div>
                </div>
              )}
            </div>

            {/* Upcoming Events - moved to left */}
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <h4 className="font-semibold text-white mb-3">Upcoming Events</h4>
              {[{
                title:'Tech Networking Mixer', time:'Jan 25, 6:00 PM', place:'Virtual', attendees:156
              },{
                title:'Product Design Workshop', time:'Jan 28, 2:00 PM', place:'San Francisco, CA', attendees:89
              }].map((ev,i)=>(
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 ring-1 ring-white/10 p-3 mb-3">
                  <div>
                    <div className="text-sm font-medium text-white">{ev.title}</div>
                    <div className="text-[12px] text-slate-400">{ev.time} • {ev.place} • {ev.attendees} attending</div>
                  </div>
                  <button className="px-3 py-1 text-sm rounded bg-startx-600 hover:bg-startx-700 text-white">RSVP</button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            

            {/* Post Creation Box */}
            <div className="card focus-within-glow animate-fade-in">
              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user?.fullName || 'You'} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name || 'You'} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                ) : (
                  <div className="w-10 h-10 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                    {(user?.fullName || profile?.name || 'U').charAt(0)}
                  </div>
                )}
                <textarea
                  className="flex-1 bg-slate-100 dark:bg-dark-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none transition placeholder:text-slate-500 focus:min-h-[72px]"
                  placeholder="Start a post..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-startx-700" title="Attach media">
                    <span className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 dark:bg-dark-800 dark:border-white/10">
                      📷 Photo
                    </span>
                    <input className="hidden" type="file" accept="image/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-startx-700" title="Attach video">
                    <span className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 dark:bg-dark-800 dark:border-white/10">
                      🎬 Video
                    </span>
                    <input className="hidden" type="file" accept="video/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                  </label>
                  <button type="button" className="inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-emerald-600 hover:bg-slate-50 text-sm dark:bg-dark-800 dark:border-white/10"><span>📊</span><span>Poll</span></button>
                  <button type="button" className="inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-purple-600 hover:bg-slate-50 text-sm dark:bg-dark-800 dark:border-white/10"><span>📰</span><span>Article</span></button>
                  <button type="button" className="inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-orange-600 hover:bg-slate-50 text-sm dark:bg-dark-800 dark:border-white/10"><span>📅</span><span>Event</span></button>
                  <div className="relative">
                    <button type="button" title="Add emoji" onClick={() => setShowEmoji(v => !v)} className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 dark:bg-dark-800 dark:border-white/10">
                      {icons.emoji}
                    </button>
                    {showEmoji && (
                      <div className="absolute z-10 mt-2 w-56 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-800 p-2 shadow-lg">
                        <div className="grid grid-cols-8 gap-1 text-xl">
                          {['😀','😁','😂','🤣','😊','😍','🤩','😎','😇','😉','🙌','👏','👍','🔥','✨','💡','💪','🎉','🧠','🫶','🙏','🤝','🚀','⚡','📚','📝','🔗','💼','👀','✅','❗','❓','💬','📈','🧑\u200d💻','🛠️','🔍','🧩','🏷️'].map(e => (
                            <button key={e} type="button" className="hover:bg-slate-100 dark:hover:bg-white/10 rounded" onClick={() => { setPostContent(prev => (prev || '') + e); }} aria-label={`emoji ${e}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="button" title="Add GIF" onClick={() => gifInputRef.current?.click()} className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 text-sm dark:bg-dark-800 dark:border-white/10">
                    GIF
                  </button>
                  <input ref={gifInputRef} className="hidden" type="file" accept="image/gif" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex items-center gap-3">
                  {postFile && (
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="max-w-[180px] truncate">{postFile.name}</span>
                      <button className="text-slate-500 hover:text-slate-700" onClick={() => setPostFile(null)}>Remove</button>
                    </div>
                  )}
                  <button
                    disabled={!postContent.trim() && !postFile}
                    className="rounded-full bg-startx-600 hover:bg-startx-700 text-white px-4 py-2 disabled:opacity-50"
                    onClick={handlePost}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>



            {loadingFeed && <div className="card">Loading feed…</div>}
            {!loadingFeed && posts.map((post) => (
              <div key={post.id} className="card animate-fade-in">
                <div className="flex items-start space-x-3">
                  {post.avatar_url ? (
                    <img src={post.avatar_url} alt={post.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                  ) : (
                    <div className="w-12 h-12 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {(post.name || 'U').charAt(0)}
                    </div>
                  )}
                  {post.avatar_url ? (
                    <img src={post.avatar_url} alt={post.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                  ) : (
                    <div className="w-12 h-12 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {(post.name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link to={`/profile/${post.user_id}`} className="font-semibold text-slate-900 text-base hover:text-startx-600">{post.name || 'User'}</Link>
                      {post.user_id && post.user_id !== user?.id && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          getConnectionStatus(post.user_id) === 'connected' 
                            ? 'bg-green-100 text-green-700' 
                            : getConnectionStatus(post.user_id) === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {getConnectionStatus(post.user_id) === 'connected' 
                            ? '• Connected' 
                            : getConnectionStatus(post.user_id) === 'pending' 
                              ? '• Pending' 
                              : ''}
                        </span>
                      )}
                      <Link to={`/profile/${post.user_id}`} className="font-semibold text-slate-900 text-base hover:text-startx-600">{post.name || 'User'}</Link>
                      {post.user_id && post.user_id !== user?.id && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          getConnectionStatus(post.user_id) === 'connected' 
                            ? 'bg-green-100 text-green-700' 
                            : getConnectionStatus(post.user_id) === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {getConnectionStatus(post.user_id) === 'connected' 
                            ? '• Connected' 
                            : getConnectionStatus(post.user_id) === 'pending' 
                              ? '• Pending' 
                              : ''}
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-600">{formatRelativeTime(post.created_at)}</span>
                    </div>
                    {post.headline && <p className="text-[13px] text-slate-600">{post.headline}</p>}
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">{post.content}</p>
                    {(() => {
                      const url = extractFirstUrl(post.content || '')
                      if (url) ensurePreview(url)
                      const meta = url ? linkPreviews[url] : null
                      if (!meta) return null
                      try {
                        // Guard URL parsing to avoid runtime errors
                        // in cases where the content contains malformed URLs
                        const hostname = new URL(url).hostname
                        return (
                      try {
                        // Guard URL parsing to avoid runtime errors
                        // in cases where the content contains malformed URLs
                        const hostname = new URL(url).hostname
                        return (
                        <a href={url} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10 overflow-hidden hover:bg-white/5">
                          <div className="flex gap-3 p-3">
                            {meta.image && (
                              <img src={meta.image} alt="preview" className="h-16 w-24 object-cover rounded" />
                            )}
                            <div className="min-w-0">
                              {meta.title && <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{meta.title}</div>}
                              {meta.description && <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{meta.description}</div>}
                              <div className="text-[11px] text-slate-500 truncate">{hostname}</div>
                              <div className="text-[11px] text-slate-500 truncate">{hostname}</div>
                            </div>
                          </div>
                        </a>
                        )
                      } catch {
                        return null
                      }
                        )
                      } catch {
                        return null
                      }
                    })()}
                    {post.media_url && post.media_url !== 'uploading...' && (() => {
                      const src = post.media_url.startsWith('/') ? `${API_BASE}${post.media_url}` : post.media_url
                      return post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video className="mt-3 w-full rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10" controls src={src} />
                      ) : (
                        <div className="mt-3 w-full rounded-lg overflow-hidden ring-1 ring-slate-200/70 dark:ring-white/10">
                          <img 
                            className="w-full h-auto object-contain max-h-[500px]" 
                            src={src} 
                            alt="attachment"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = './src/assets/avatar.png'; // Fallback image with relative path
                            }}
                          />
                        </div>
                        <div className="mt-3 w-full rounded-lg overflow-hidden ring-1 ring-slate-200/70 dark:ring-white/10">
                          <img 
                            className="w-full h-auto object-contain max-h-[500px]" 
                            src={src} 
                            alt="attachment"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = './src/assets/avatar.png'; // Fallback image with relative path
                            }}
                          />
                        </div>
                      )
                    })()}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300 text-sm">
                        <button onClick={() => onLike(post.id)} className="inline-flex items-center gap-1 hover:text-white/90 transition" title="Like">
                          <span>⬆️</span>
                          <span>{post.likes_count || 0}</span>
                        </button>
                        <button className="inline-flex items-center gap-1 hover:text-white/90 transition" title="Dislike">
                          <span>⬇️</span>
                          <span>{post.downvotes || 0}</span>
                        </button>
                        <button onClick={() => openComments(post.id)} className="inline-flex items-center gap-1 hover:text-white/90 transition" title="Comments">
                          <span>💬</span>
                          <span>{post.comments_count || 0}</span>
                        </button>
                        <button onClick={() => onShare(post.id)} className="inline-flex items-center gap-1 hover:text-white/90 transition" title="Share">
                          <span>🔗</span>
                          <span>{post.shares_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Floating New Post button */}
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('textarea[placeholder="Start a post..."]')
              if (el) el.focus()
            }}
            className="fixed bottom-6 right-6 z-20 rounded-full bg-startx-600 hover:bg-startx-700 text-white shadow-lg px-5 py-3 md:hidden"
          >
            + New Post
          </button>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-4">

            {/* Trending Topics */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-startx-700/20 via-dark-800 to-accent-600/20 ring-1 ring-white/10">
              <h4 className="font-semibold text-white mb-4">Trending Topics</h4>
              <div className="space-y-3">
                {trending.length === 0 && (
                  <div className="text-sm text-slate-400">No trending topics yet.</div>
                )}
                {trending.map((t) => (
                  <a key={t.id} href={`#/search?tag=${encodeURIComponent(t.title)}`} className="group flex items-center justify-between rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-start gap-3">
                      <span className="text-startx-300" title="Trending">{icons.flame}</span>
                      <div>
                        <p className="font-medium text-slate-100 text-sm group-hover:text-white">#{t.title}</p>
                        <p className="text-[12px] text-slate-400">{t.post_count} posts</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-300">+{Math.floor(Math.random()*30)+5}%</span>
                  </a>
                ))}
              </div>
            </div>

            

            {/* Suggested Jobs */}
            <div className="card p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Suggested Jobs</h4>
              <div className="space-y-4">
                {suggestedJobs.length === 0 && (
                  <div className="text-sm text-slate-500">No suggestions yet. Check back soon.</div>
                )}
                {suggestedJobs.map(job => (
                  <div key={job.id} className="flex items-start gap-3">
                    {job.logo_url ? (
                      <img src={job.logo_url} alt={job.company} className="h-9 w-9 rounded bg-white object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                    ) : (
                      <div className="h-9 w-9 rounded bg-slate-200 grid place-items-center text-slate-600 text-xs font-medium">{(job.company||'')[0]||'J'}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">{job.title}</div>
                      <div className="text-xs text-slate-600 truncate">{job.company} • {job.location}</div>
                    </div>
                    <button className="px-3 py-1 text-sm rounded-full bg-startx-600 text-white hover:bg-startx-700">Apply Now</button>
                  </div>
                ))}
              </div>
            </div>

           
            <div className="card">
              <h4 className="font-semibold text-slate-900 mb-3">Top Features</h4>
              <ul className="space-y-3">
                {[{
                  icon:'👤', title:'Professional Profiles', desc:'Showcase skills and achievements.'
                },{ icon:'🤝', title:'Smart Matching', desc:'Find roles and collaborators.'
                },{ icon:'🗣️', title:'Dynamic Pitches', desc:'Present interactive ideas.'
                }].map(f => (
                  <li key={f.title} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/5 ring-1 ring-white/10 grid place-items-center text-base">{f.icon}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{f.title}</div>
                      <div className="text-[12px] text-slate-600 dark:text-slate-400">{f.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <h4 className="font-semibold text-white">What users say</h4>
              <div className="mt-3 space-y-3">
                {[
                  'Helped me meet great collaborators.',
                  'Smart matching led me to a role I love.',
                  'Pitches made it easy to connect with investors.',
                ].map((q, i) => (
                  <div key={i} className="text-slate-300 text-sm">“{q}”</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

           



           

     

    

   

    

   



