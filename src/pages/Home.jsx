import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { icons } from '../assets/icons.jsx'
import { io } from 'socket.io-client'

// API base for dev/prod
const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5174'
// API helper: sends cookies for JWT
const apiFetch = (path, opts = {}) =>
  fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts })

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

export default function Home() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const [rolesCount, setRolesCount] = useState(32)

  // App state wired to backend
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [postFile, setPostFile] = useState(null)
  const [clientId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)
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
        apiFetch(`/api/users/${userId}`).then(r => r.ok ? r.json() : null).then(setProfile).catch(() => {})
      }
    }
    boot()
  }, [])

  // Load feed
  useEffect(() => {
    let ignore = false
    // connect socket once
    const socket = io(API_BASE, { withCredentials: true })
    socket.on('post:created', ({ post, originClientId }) => {
      if (originClientId === clientId) return
      setPosts((prev) => [post, ...prev])
    })
    socket.on('post:liked', ({ postId, delta, originClientId }) => {
      if (originClientId === clientId) return
      setPosts((prev) => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) } : p))
    })
    socket.on('post:commented', ({ postId, originClientId }) => {
      if (originClientId === clientId) return
      setPosts((prev) => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
    })
    socket.on('post:shared', ({ postId, originClientId }) => {
      if (originClientId === clientId) return
      setPosts((prev) => prev.map(p => p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p))
    })
    const load = async () => {
      try {
        setLoadingFeed(true)
        const res = await apiFetch('/api/posts/feed?limit=10')
        const data = await res.json()
        if (!ignore) {
          setPosts(data.items || [])
          setNextCursor(data.nextCursor || null)
        }
      } finally {
        setLoadingFeed(false)
      }
    }
    load()
    return () => { ignore = true; socket.close() }
  }, [])

  // Load suggestions and trending
  useEffect(() => {
    apiFetch('/api/users/suggestions').then(r => r.ok ? r.json() : []).then(setSuggestions).catch(() => {})
    apiFetch('/api/trending').then(r => r.ok ? r.json() : []).then(setTrending).catch(() => {})
    apiFetch('/api/jobs/suggested').then(r => r.ok ? r.json() : []).then(setSuggestedJobs).catch(() => {})
  }, [])

  // Handlers
  const handlePost = async () => {
    if (!postContent.trim() && !postFile) return
    const temp = {
      id: `temp-${Date.now()}`,
      name: profile?.name || 'You',
      headline: profile?.headline || '',
      content: postContent,
      media_url: postFile ? 'uploading...' : null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
    }
    setPosts(prev => [temp, ...prev])
    setPostContent('')
    setPostFile(null)
    try {
      const form = new FormData()
      form.append('content', temp.content)
      if (postFile) form.append('media', postFile)
      const res = await fetch(`${API_BASE}/api/posts`, { method: 'POST', credentials: 'include', headers: { 'x-client-id': clientId }, body: form })
      const created = await res.json()
      setPosts(prev => prev.map(p => p.id === temp.id ? created : p))
    } catch {
      setPosts(prev => prev.filter(p => p.id !== temp.id))
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900">
     

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="card p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-startx-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                  U
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">Your Name</h3>
                <p className="text-sm text-slate-600">Software Developer</p>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Profile views</span>
                    <span className="font-medium text-slate-900">89</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600">Post impressions</span>
                    <span className="font-medium text-slate-900">1,234</span>
                  </div>
                </div>
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
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            {/* Post Creation Box */}
            <div className="card focus-within-glow animate-fade-in">
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name || 'You'} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" />
                ) : (
                  <div className="w-10 h-10 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                    {(profile?.name || 'U').charAt(0)}
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
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-startx-700" title="Attach media">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 dark:bg-dark-800 dark:border-white/10">
                      {icons.paperclip}
                    </span>
                    <input className="hidden" type="file" accept="image/*,video/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-startx-700" title="Attach image">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white text-startx-700 hover:bg-slate-50 dark:bg-dark-800 dark:border-white/10">
                      {icons.image}
                    </span>
                    <input className="hidden" type="file" accept="image/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                  </label>
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
                  {(!postContent.trim() && !postFile) ? (
                    <button className="btn-outline rounded-full opacity-70 cursor-not-allowed" disabled>Post</button>
                  ) : (
                    <button className="btn-primary rounded-full" onClick={handlePost}>Post</button>
                  )}
                </div>
              </div>
            </div>

            {loadingFeed && <div className="card">Loading feed…</div>}
            {!loadingFeed && posts.map((post) => (
              <div key={post.id} className="card animate-fade-in">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-startx-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                    {(post.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-slate-900 text-base">{post.name || 'User'}</h4>
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
                      return (
                        <a href={url} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10 overflow-hidden hover:bg-white/5">
                          <div className="flex gap-3 p-3">
                            {meta.image && (
                              <img src={meta.image} alt="preview" className="h-16 w-24 object-cover rounded" />
                            )}
                            <div className="min-w-0">
                              {meta.title && <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{meta.title}</div>}
                              {meta.description && <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{meta.description}</div>}
                              <div className="text-[11px] text-slate-500 truncate">{new URL(url).hostname}</div>
                            </div>
                          </div>
                        </a>
                      )
                    })()}
                    {post.media_url && post.media_url !== 'uploading...' && (() => {
                      const src = post.media_url.startsWith('/') ? `${API_BASE}${post.media_url}` : post.media_url
                      return post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video className="mt-3 w-full rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10" controls src={src} />
                      ) : (
                        <img className="mt-3 w-full rounded-lg ring-1 ring-slate-200/70 dark:ring-white/10" src={src} alt="attachment" />
                      )
                    })()}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <button onClick={() => onLike(post.id)} className="inline-flex items-center gap-2 text-slate-600 hover:text-startx-700 transition-colors">
                        <span>👍</span>
                        <span className="text-sm">{post.likes_count || 0}</span>
                      </button>
                      <button onClick={() => openComments(post.id)} className="inline-flex items-center gap-2 text-slate-600 hover:text-startx-700 transition-colors">
                        <span>💬</span>
                        <span className="text-sm">{post.comments_count || 0} comments</span>
                      </button>
                      <button onClick={() => onShare(post.id)} className="inline-flex items-center gap-2 text-slate-600 hover:text-startx-700 transition-colors">
                        <span>🔄</span>
                        <span className="text-sm">{post.shares_count || 0} reposts</span>
                      </button>
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
          <div className="lg:col-span-3 space-y-6">
            {/* People You May Know */}
            <div className="card p-6">
              <h4 className="font-semibold text-slate-900 mb-4">People you may know</h4>
              <div className="space-y-4">
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
                    <button className="text-startx-600 hover:text-white hover:bg-startx-600 border border-startx-300/60 rounded-full px-3 py-1.5 font-medium text-sm transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending News */}
            <div className="card">
              <h4 className="font-semibold text-slate-900 mb-4">Trending in Tech</h4>
              <div className="space-y-3">
                {trending.map((t, i) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <span className="text-startx-600" title="Trending">{icons.flame}</span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">#{t.title}</p>
                      <p className="text-[12px] text-slate-500">{t.post_count} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Snapshot */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Your Weekly Snapshot</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Opportunities trending up</p>
                </div>
                <span className="badge">Insights</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-100 dark:bg-dark-700 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{rolesCount}</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-startx-100 text-startx-700 dark:bg-white/10 dark:text-slate-300">💼 New roles</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-100 dark:bg-dark-700 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">12</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-300">⭐ Saves</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-100 dark:bg-dark-700 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">5</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">🎤 Interviews</span>
                  </p>
                </div>
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
                    <button className="btn-outline px-3 py-1 text-sm rounded-full">View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* Comments modal */}
    {showCommentsFor && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowCommentsFor(null)} />
        <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-dark-800 rounded-t-2xl sm:rounded-2xl shadow-xl p-4 max-h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Comments</h3>
            <button className="text-slate-500 hover:text-slate-700" onClick={() => setShowCommentsFor(null)}>Close</button>
          </div>
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-startx-600 text-white grid place-items-center">
                  {(c.name || 'U').charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{c.name || 'User'}</div>
                  <div className="text-sm text-slate-700">{c.text}</div>
                  <div className="text-xs text-slate-500">{formatRelativeTime(c.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input className="input flex-1" placeholder="Add a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <button className="btn-primary" onClick={submitComment} disabled={!newComment.trim()}>Post</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}


