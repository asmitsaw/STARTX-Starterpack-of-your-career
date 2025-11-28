import React, { useEffect, useRef, useState, Suspense, Component } from 'react'
import { Link } from 'react-router-dom'
import { icons } from '../assets/icons.jsx'
import { io } from 'socket.io-client'
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

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
  const [rolesCount, setRolesCount] = useState(32)
  // Ensure isAuthenticated is always defined to prevent blank page issues

  // App state wired to backend
  const [profile, setProfile] = useState(null)
  const [dbUserId, setDbUserId] = useState(null) // Store database user ID separately
  const [posts, setPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [postFile, setPostFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [clientId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollChoice, setPollChoice] = useState(null)
  
  // Cleanup preview URL when file changes
  useEffect(() => {
    if (postFile) {
      const url = URL.createObjectURL(postFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [postFile])
  
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
  const [loadingComments, setLoadingComments] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [trending, setTrending] = useState([])
  const [suggestedJobs, setSuggestedJobs] = useState([])
  const [techNews, setTechNews] = useState([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [linkPreviews, setLinkPreviews] = useState({})
  const [showEmoji, setShowEmoji] = useState(false)
  const gifInputRef = useRef(null)
  
  // Post type states
  const [postType, setPostType] = useState('text') // 'text', 'poll', 'article', 'event'
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [articleTitle, setArticleTitle] = useState('')
  const [articleBody, setArticleBody] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')

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

  // Load profile from database to get the correct DB user ID
  useEffect(() => {
    if (user) {
      // Fetch user profile from database to get DB ID
      const fetchProfile = async () => {
        try {
          const BACKEND_URL = 'http://localhost:5174'
          const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
            withCredentials: true
          })
          console.log('[Home] Fetched user profile:', response.data)
          setProfile(response.data)
          setDbUserId(response.data.id) // Store DB user ID
        } catch (error) {
          console.error('Error fetching user profile:', error)
          console.error('Error details:', error.response?.data)
          // Fallback to Clerk data
          setProfile({
            id: user.id,
            name: user.fullName || user.firstName || 'You',
            headline: user.primaryEmailAddress?.emailAddress || '',
            avatar_url: user.imageUrl
          })
          // Try to extract DB user ID from the first post's author_id if it matches current user
          // This is a workaround when /api/users/me fails
        }
      }
      fetchProfile()
    }
  }, [user])

  // Fallback: Extract DB user ID from posts if /api/users/me failed
  useEffect(() => {
    if (!dbUserId && posts.length > 0 && user) {
      // Find a post where the name matches the current user's name
      const userPost = posts.find(p => 
        p.name === user.fullName || 
        p.name === `${user.firstName} ${user.lastName}`.trim()
      )
      if (userPost && userPost.author_id) {
        console.log('[Home] Extracted DB user ID from posts:', userPost.author_id)
        setDbUserId(userPost.author_id)
        setProfile(prev => ({ ...prev, id: userPost.author_id }))
        // Store in localStorage for Profile page to use
        localStorage.setItem('sx_db_user_id', userPost.author_id)
      }
    }
  }, [posts, dbUserId, user])

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
          
          console.log('[Feed Loaded]', { 
            total: mergedPosts.length, 
            withMedia: mergedPosts.filter(p => p.media_url).length,
            posts: mergedPosts.map(p => ({ id: p.id, media_url: p.media_url }))
          });
          
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
  }, [])

  // Load suggestions, trending, jobs, and tech news
  useEffect(() => {
    let cancelled = false
    const safeSet = (setter) => (data) => { if (!cancelled) setter(Array.isArray(data) ? data : (data?.items || [])) }
    
    // Load user suggestions
    apiFetch('/api/users/suggestions').then(r => r.ok ? r.json() : []).then(safeSet(setSuggestions)).catch(() => safeSet(setSuggestions)([]))
    
    // Load trending topics
    apiFetch('/api/trending').then(r => r.ok ? r.json() : []).then(data => {
      if (!cancelled) {
        setTrending(Array.isArray(data) ? data : [])
      }
    }).catch(() => {
      if (!cancelled) setTrending([])
    })
    
    // Load suggested jobs with fallback data
    setLoadingJobs(true)
    const fallbackJobs = [
      { id: 1, title: 'Frontend Engineer — React + Tailwind', company: 'Nebula Labs', location: 'Remote — Global', tags: ['Remote', 'Full‑time', 'Junior'], salaryLpa: 4 },
      { id: 2, title: 'Platform Engineer — DX Tooling', company: 'OrbitWorks', location: 'Remote — North America', tags: ['Remote', 'Full‑time', 'Mid'], salaryLpa: 18 },
      { id: 3, title: 'AI Engineer — LLM Ops', company: 'Insight AI', location: 'Remote — Europe', tags: ['Remote', 'Contract', 'Senior'], salaryLpa: 28 },
      { id: 5, title: 'Backend Developer — Node.js', company: 'DataForge', location: 'Bengaluru, IN (Hybrid)', tags: ['Hybrid', 'Full‑time', 'Junior'], salaryLpa: 12 },
      { id: 6, title: 'SRE — Cloud & Observability', company: 'CloudVista', location: 'Austin, TX (Hybrid)', tags: ['Hybrid', 'Full‑time', 'Mid'], salaryLpa: 9 },
      { id: 10, title: 'Data Engineer — ETL Pipelines', company: 'DataQuarry', location: 'London, UK', tags: ['Onsite', 'Full‑time', 'Mid'], salaryLpa: 22 },
    ]
    
    apiFetch('/api/jobs').then(r => r.ok ? r.json() : []).then(data => {
      if (!cancelled) {
        if (Array.isArray(data) && data.length > 0) {
          // Use API data if available
          setSuggestedJobs(data.slice(0, 6))
        } else {
          // Use fallback data
          setSuggestedJobs(fallbackJobs)
        }
        setLoadingJobs(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setSuggestedJobs(fallbackJobs)
        setLoadingJobs(false)
      }
    })
    
    // Load tech news from NewsData API
    const loadTechNews = async () => {
      try {
        setLoadingNews(true)
        const apiKey = import.meta.env.VITE_NEWSDATA_API_KEY
        if (!apiKey) {
          console.warn('NewsData API key not configured')
          setLoadingNews(false)
          return
        }
        
        const response = await fetch(
          `https://newsdata.io/api/1/news?apikey=${apiKey}&category=technology&language=en&size=5`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (!cancelled && data.results) {
            setTechNews(data.results.slice(0, 5))
          }
        }
      } catch (error) {
        console.error('Failed to load tech news:', error)
      } finally {
        if (!cancelled) setLoadingNews(false)
      }
    }
    
    loadTechNews()
    
    return () => { cancelled = true }
  }, [])

  // No hardcoded fallbacks; rely on live API only

  // Handlers
  const handlePost = async () => {
    // Validate based on post type
    if (postType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
      alert('Please add at least 2 poll options');
      return;
    }
    if (postType === 'article' && !articleTitle.trim()) {
      alert('Please add an article title');
      return;
    }
    if (postType === 'event' && (!eventTitle.trim() || !eventDate)) {
      alert('Please add event title and date');
      return;
    }
    if (postType === 'text' && !postContent.trim() && !postFile) return
    // Build content based on post type
    let finalContent = postContent;
    let metadata = {};
    
    if (postType === 'poll') {
      const validOptions = pollOptions.filter(o => o.trim());
      finalContent = postContent || 'Poll';
      metadata = {
        type: 'poll',
        question: postContent,
        options: validOptions,
        votes: validOptions.map(() => 0)
      };
    } else if (postType === 'article') {
      finalContent = articleTitle;
      metadata = {
        type: 'article',
        title: articleTitle,
        body: articleBody
      };
    } else if (postType === 'event') {
      finalContent = eventTitle;
      metadata = {
        type: 'event',
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        location: eventLocation
      };
    }
    
    const temp = {
      id: generateUUID(),
      name: profile?.name || 'You',
      headline: profile?.headline || '',
      content: finalContent,
      media_url: postFile ? 'uploading...' : null,
      post_type: postType,
      metadata: metadata,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      user_id: profile?.id || localStorage.getItem('sx_user_id') || 'anonymous',
      persisted: true
    }
    
    // Add to UI immediately
    setPosts(prev => [temp, ...prev])
    
    // Save to localStorage for persistence across sessions
    const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
    localPosts.unshift(temp);
    localStorage.setItem('sx_posts', JSON.stringify(localPosts));
    
    setPostContent('')
    setPostFile(null)
    setPostType('text')
    setPollOptions(['', ''])
    setArticleTitle('')
    setArticleBody('')
    setEventTitle('')
    setEventDate('')
    setEventTime('')
    setEventLocation('')
    
    
    try {
      // Send to server with media file directly
      const form = new FormData();
      form.append('content', temp.content);
      form.append('client_post_id', temp.id);
      form.append('post_type', postType);
      if (Object.keys(metadata).length > 0) {
        form.append('metadata', JSON.stringify(metadata));
      }
      // Attach the file directly - backend will handle upload
      if (postFile) {
        form.append('media', postFile);
        console.log('[Uploading Media]', { fileName: postFile.name, size: postFile.size, type: postFile.type });
      }
      
      const res = await fetch(`${API_BASE}/api/posts`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'x-client-id': clientId },
        body: form 
      });
      
      if (res.ok) {
        const created = await res.json();
        console.log('[Post Created]', { created, hasMedia: !!created.media_url, media_url: created.media_url });
        
        // Use the media_url from server response
        const finalPost = {
          ...created,
          persisted: true
        };
        
        // Update in localStorage
        const updatedLocalPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
        const updatedPosts = updatedLocalPosts.map(p => 
          p.id === temp.id ? finalPost : p
        );
        localStorage.setItem('sx_posts', JSON.stringify(updatedPosts));
        
        // Update in UI
        setPosts(prev => prev.map(p => p.id === temp.id ? finalPost : p));
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
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (p.__liked ? -1 : 1), __liked: !p.__liked, __disliked: false } : p))
    try {
      await apiFetch(`/api/posts/${postId}/like`, { method: 'PUT', headers: { 'x-client-id': clientId } })
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (p.__liked ? 1 : -1), __liked: !p.__liked } : p))
    }
  }

  const onDislike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, dislikes_count: (p.dislikes_count || 0) + (p.__disliked ? -1 : 1), __disliked: !p.__disliked, __liked: false } : p))
    try {
      await apiFetch(`/api/posts/${postId}/dislike`, { method: 'PUT', headers: { 'x-client-id': clientId } })
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, dislikes_count: (p.dislikes_count || 0) + (p.__disliked ? 1 : -1), __disliked: !p.__disliked } : p))
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
    setComments([]) // Reset comments first
    setLoadingComments(true)
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(Array.isArray(data) ? data : [])
      } else {
        setComments([])
      }
    } catch (error) { 
      console.error('Error loading comments:', error)
      setComments([]) 
    } finally {
      setLoadingComments(false)
    }
  }
  const submitComment = async () => {
    const text = newComment.trim()
    if (!text || !showCommentsFor) return
    const temp = { 
      id: `temp-${Date.now()}`, 
      text, 
      user_id: profile?.id || user?.id, 
      name: profile?.name || user?.fullName || 'You', 
      avatar_url: profile?.avatar_url || user?.imageUrl,
      created_at: new Date().toISOString() 
    }
    setComments(prev => [...prev, temp])
    setPosts(prev => prev.map(p => p.id === showCommentsFor ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
    setNewComment('')
    try {
      await apiFetch(`/api/posts/${showCommentsFor}/comment`, { method: 'POST', headers: { 'x-client-id': clientId }, body: JSON.stringify({ text }) })
    } catch {
      // Rollback on error
      setComments(prev => prev.filter(c => c.id !== temp.id))
      setPosts(prev => prev.map(p => p.id === showCommentsFor ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p))
    }
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
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
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
                <Link to="/feed" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.feed}</span>
                  <span>Find Jobs</span>
                </Link>
                <Link to="/profile" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
                  <span className="text-startx-600">{icons.news}</span>
                  <span>My Network</span>
                </Link>
                <Link to="/interview-dashboard" className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
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
                  placeholder={postType === 'poll' ? 'Ask a question...' : postType === 'article' ? 'Write your article...' : postType === 'event' ? 'Describe your event...' : 'Start a post...'}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Poll Options */}
              {postType === 'poll' && (
                <div className="mt-3 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Poll Options:</label>
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-slate-100 dark:bg-dark-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none text-sm"
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[idx] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-sm text-startx-600 hover:text-startx-700 font-medium"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              )}
              
              {/* Article Fields */}
              {postType === 'article' && (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    className="w-full bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none font-semibold"
                    placeholder="Article Title"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none"
                    placeholder="Write your article content..."
                    value={articleBody}
                    onChange={(e) => setArticleBody(e.target.value)}
                    rows={6}
                  />
                </div>
              )}
              
              {/* Event Fields */}
              {postType === 'event' && (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    className="w-full bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none font-semibold"
                    placeholder="Event Title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      className="bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-slate-100 dark:bg-dark-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none"
                    placeholder="Location (optional)"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                  />
                </div>
              )}
              
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
                  <button type="button" onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')} className={`inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border text-sm ${postType === 'poll' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-slate-200 bg-white text-emerald-600 hover:bg-slate-50'} dark:bg-dark-800 dark:border-white/10`}><span>📊</span><span>Poll</span></button>
                  <button type="button" onClick={() => setPostType(postType === 'article' ? 'text' : 'article')} className={`inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border text-sm ${postType === 'article' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-slate-200 bg-white text-purple-600 hover:bg-slate-50'} dark:bg-dark-800 dark:border-white/10`}><span>📰</span><span>Article</span></button>
                  <button type="button" onClick={() => setPostType(postType === 'event' ? 'text' : 'event')} className={`inline-flex items-center gap-2 justify-center h-9 px-3 rounded-full border text-sm ${postType === 'event' ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-slate-200 bg-white text-orange-600 hover:bg-slate-50'} dark:bg-dark-800 dark:border-white/10`}><span>📅</span><span>Event</span></button>
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
                  
                  <input ref={gifInputRef} className="hidden" type="file" accept="image/gif" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex items-center gap-3">
                  {postFile && previewUrl && (
                    <div className="relative mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                      {postFile.type.startsWith('video/') ? (
                        <video 
                          src={previewUrl} 
                          className="w-full max-h-64 object-contain bg-slate-50 dark:bg-dark-700"
                          controls
                        />
                      ) : (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full max-h-64 object-contain bg-slate-50 dark:bg-dark-700"
                        />
                      )}
                      <button 
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                        onClick={() => setPostFile(null)}
                        title="Remove media"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {postFile.name}
                      </div>
                    </div>
                  )}
                  <button
                    disabled={
                      (postType === 'text' && !postContent.trim() && !postFile) ||
                      (postType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) ||
                      (postType === 'article' && !articleTitle.trim()) ||
                      (postType === 'event' && (!eventTitle.trim() || !eventDate))
                    }
                    className="rounded-full bg-startx-600 hover:bg-startx-700 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePost}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>



            {loadingFeed && <div className="card">Loading feed…</div>}
            {!loadingFeed && posts.map((post) => {
              // Debug: log ownership check
              const currentUserId = dbUserId || profile?.id
              if (post.id && currentUserId) {
                console.log('[Delete Button Check]', {
                  postId: post.id,
                  postName: post.name,
                  authorId: post.author_id,
                  userId: post.user_id,
                  currentUserId: currentUserId,
                  canDelete: post.author_id === currentUserId || post.user_id === currentUserId
                })
              }
              return (
              <div key={post.id} className="card animate-fade-in">
                <div className="flex items-start space-x-3">
                  {post.avatar_url ? (
                    <img src={post.avatar_url} alt={post.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                  ) : (
                    <div className="w-12 h-12 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {(post.name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
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
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-600">{formatRelativeTime(post.created_at)}</span>
                    </div>
                    {/* Delete button - only for the post author */}
                    {user && (dbUserId || profile?.id) && (post.author_id === (dbUserId || profile?.id) || post.user_id === (dbUserId || profile?.id)) && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this post?')) {
                            try {
                              const resp = await fetch(`${API_BASE}/api/posts/${post.id}`, { 
                                method: 'DELETE',
                                credentials: 'include'
                              });
                              if (!resp.ok) {
                                const err = await resp.json().catch(() => ({}))
                                throw new Error(err.error || 'Delete failed')
                              }
                              setPosts(prev => prev.filter(p => p.id !== post.id));
                              // Also remove from localStorage
                              const localPosts = JSON.parse(localStorage.getItem('sx_posts') || '[]');
                              localStorage.setItem('sx_posts', JSON.stringify(localPosts.filter(p => p.id !== post.id)));
                            } catch (error) {
                              console.error('Error deleting post:', error);
                              alert('Failed to delete post');
                            }
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete post"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    </div>
                    {post.headline && <p className="text-[13px] text-slate-600">{post.headline}</p>}
                    
                    {/* Regular text post */}
                    {(!post.post_type || post.post_type === 'text') && (
                      <p className="mt-3 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">{post.content}</p>
                    )}
                    
                    {/* Poll post */}
                    {post.post_type === 'poll' && post.metadata && (
                      <div className="mt-3">
                        <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100 mb-3">{post.metadata.question || post.content}</p>
                        <div className="space-y-2">
                          {post.metadata.options?.map((option, idx) => {
                            const totalVotes = post.metadata.votes?.reduce((a, b) => a + b, 0) || 0;
                            const votes = post.metadata.votes?.[idx] || 0;
                            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                            return (
                              <button
                                key={idx}
                                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition relative overflow-hidden"
                                onClick={() => {
                                  // Handle poll vote
                                  const newVotes = [...(post.metadata.votes || [])];
                                  newVotes[idx] = (newVotes[idx] || 0) + 1;
                                  setPosts(prev => prev.map(p => 
                                    p.id === post.id 
                                      ? {...p, metadata: {...p.metadata, votes: newVotes}}
                                      : p
                                  ));
                                }}
                              >
                                <div className="absolute inset-0 bg-startx-100 dark:bg-startx-900/20" style={{width: `${percentage}%`}}></div>
                                <div className="relative flex items-center justify-between">
                                  <span className="text-sm text-slate-900 dark:text-slate-100">{option}</span>
                                  <span className="text-xs text-slate-600 dark:text-slate-400">{percentage}% ({votes})</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {post.metadata.votes && (
                          <p className="mt-2 text-xs text-slate-500">{post.metadata.votes.reduce((a, b) => a + b, 0)} total votes</p>
                        )}
                      </div>
                    )}
                    
                    {/* Article post */}
                    {post.post_type === 'article' && post.metadata && (
                      <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-white/10">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{post.metadata.title || post.content}</h3>
                        <div className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {post.metadata.body?.substring(0, 300)}{post.metadata.body?.length > 300 ? '...' : ''}
                        </div>
                        {post.metadata.body?.length > 300 && (
                          <button className="mt-2 text-sm text-startx-600 hover:text-startx-700 font-medium">Read more</button>
                        )}
                      </div>
                    )}
                    
                    {/* Event post */}
                    {post.post_type === 'event' && post.metadata && (
                      <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-lg flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-medium">{new Date(post.metadata.date).toLocaleDateString('en-US', {month: 'short'}).toUpperCase()}</span>
                            <span className="text-lg font-bold">{new Date(post.metadata.date).getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{post.metadata.title || post.content}</h3>
                            <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {post.metadata.time && (
                                <div className="flex items-center gap-2">
                                  <span>🕐</span>
                                  <span>{post.metadata.time}</span>
                                </div>
                              )}
                              {post.metadata.location && (
                                <div className="flex items-center gap-2">
                                  <span>📍</span>
                                  <span>{post.metadata.location}</span>
                                </div>
                              )}
                            </div>
                            <button className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition">
                              RSVP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                        <a href={url} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10 overflow-hidden hover:bg-white/5">
                          <div className="flex gap-3 p-3">
                            {meta.image && (
                              <img src={meta.image} alt="preview" className="h-16 w-24 object-cover rounded" />
                            )}
                            <div className="min-w-0">
                              {meta.title && <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{meta.title}</div>}
                              {meta.description && <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{meta.description}</div>}
                              <div className="text-[11px] text-slate-500 truncate">{hostname}</div>
                            </div>
                          </div>
                        </a>
                        )
                      } catch {
                        return null
                      }
                    })()}
                    {post.media_url && post.media_url !== 'uploading...' && (() => {
                      const src = post.media_url.startsWith('/') ? `${API_BASE}${post.media_url}` : post.media_url
                      console.log('[Post Media]', { postId: post.id, media_url: post.media_url, src });
                      return post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video className="mt-3 w-full rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10" controls src={src} />
                      ) : (
                        <div className="mt-3 w-full rounded-lg overflow-hidden ring-1 ring-slate-200/70 dark:ring-white/10">
                          <img 
                            className="w-full h-auto object-contain max-h-[500px]" 
                            src={src} 
                            alt="attachment"
                            onLoad={() => console.log('[Image Loaded]', src)}
                            onError={(e) => {
                              console.error('[Image Load Error]', src);
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )
                    })()}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <button 
                          onClick={() => onLike(post.id)} 
                          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all ${
                            post.__liked ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          title="Like"
                        >
                          <svg className="w-5 h-5" fill={post.__liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span className="text-sm font-medium">{post.likes_count || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => onDislike(post.id)} 
                          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
                            post.__disliked ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : ''
                          }`}
                          title="Dislike"
                        >
                          <svg className="w-5 h-5" fill={post.__disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                          <span className="text-sm font-medium">{post.dislikes_count || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => openComments(post.id)} 
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                          title="Comments"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-medium">{post.comments_count || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => onShare(post.id)} 
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                          title="Repost"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="text-sm font-medium">{post.shares_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
            })}
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

            {/* Tech News */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-startx-700/20 via-dark-800 to-accent-600/20 ring-1 ring-white/10">
              <h4 className="font-semibold text-white mb-4">Tech News</h4>
              <div className="space-y-3">
                {loadingNews ? (
                  <div className="text-sm text-slate-400">Loading news...</div>
                ) : techNews.length === 0 ? (
                  <div className="text-sm text-slate-400">No tech news available.</div>
                ) : (
                  techNews.map((news, idx) => (
                    <a 
                      key={idx} 
                      href={news.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group block rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-startx-300 text-lg">📰</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-100 text-sm group-hover:text-white line-clamp-2">
                            {news.title}
                          </p>
                          {news.source_id && (
                            <p className="text-[11px] text-slate-400 mt-1">{news.source_id}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            

            {/* Suggested Jobs */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Suggested Jobs</h4>
                <Link to="/feed" className="text-xs text-startx-600 hover:text-startx-700 font-medium">View all</Link>
              </div>
              <div className="space-y-4">
                {loadingJobs ? (
                  <div className="text-sm text-slate-500">Loading jobs...</div>
                ) : suggestedJobs.length === 0 ? (
                  <div className="text-sm text-slate-500">No suggestions yet. Check back soon.</div>
                ) : (
                  suggestedJobs.map(job => (
                    <Link 
                      key={job.id} 
                      to="/jobs"
                      className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-startx-200 dark:hover:border-startx-800"
                    >
                      <div className="flex items-start gap-3">
                        {job.logo_url ? (
                          <img src={job.logo_url} alt={job.company} className="h-10 w-10 rounded bg-white object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gradient-to-br from-startx-500 to-accent-500 grid place-items-center text-white text-sm font-bold shadow-sm">
                            {(job.company||'')[0]||'J'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{job.title}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{job.company}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {job.location && (
                              <span className="text-xs text-slate-500 dark:text-slate-500">📍 {job.location}</span>
                            )}
                            {(job.salaryLpa || job.salary_lpa) && (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                ₹{job.salaryLpa || job.salary_lpa} LPA
                              </span>
                            )}
                          </div>
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {job.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
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
      
      {/* Comments Modal */}
      {showCommentsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCommentsFor(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments</h3>
              <button 
                onClick={() => setShowCommentsFor(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-startx-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <div className="flex-shrink-0">
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt={comment.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-startx-500 to-accent-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                          {(comment.name || 'U').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{comment.name || 'Anonymous'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Comment Input */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user?.fullName || 'You'} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.name || 'You'} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                  ) : (
                    <div className="w-10 h-10 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {(user?.fullName || profile?.name || 'U').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-100 dark:bg-dark-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-startx-300 focus:outline-none placeholder:text-slate-500"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submitComment()
                      }
                    }}
                  />
                  <button
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2.5 bg-startx-600 hover:bg-startx-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

           



           

     

    

   

    

   



