import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import Modal from '../components/Modal.jsx'
import { useUser, useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

export default function Profile() {
  const { profile, updateProfile, clearProfileOverrides } = useCurrentUser()
  const { user, isLoaded, isSignedIn } = useUser()
  const { signIn } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  
  // User search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Connection state
  const [connections, setConnections] = useState([])
  const [connectionStatus, setConnectionStatus] = useState({})
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [socket, setSocket] = useState(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  // API base URL
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5173";
  
  // Determine if the signed-in user is viewing their own profile
  const isOwnProfile = !!(user?.id && profile?.id && user.id === profile.id)
  // Initialize socket connection
  useEffect(() => {
    if (!user || !profile) return;
    
    const newSocket = io(import.meta?.env?.VITE_SOCKET_URL || API_BASE);
    setSocket(newSocket);
    
    // Join user-specific room for connection updates
    newSocket.emit('user:join', user.id);
    
    // Listen for connection updates
    newSocket.on('connection:updated', (data) => {
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          direction: data.userId === user.id ? 'outgoing' : 'incoming'
        }
      }));
      
      // Add notification for incoming connection requests
      if (data.status === 'pending' && data.userId !== user.id) {
        setNotifications(prev => [
          { 
            id: Date.now(), 
            type: 'connection_request', 
            message: `${data.userName || 'Someone'} sent you a connection request`, 
            userId: data.userId,
            timestamp: new Date()
          },
          ...prev
        ]);
      }
      
      // Refresh connections list
      loadConnections();
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [user, profile]);

  const onStartEdit = () => {
    setDraft({
      name: user?.fullName || profile?.name || '',
      title: user?.publicMetadata?.role || profile?.title || '',
      location: user?.publicMetadata?.location || profile?.location || '',
      about: user?.publicMetadata?.about || profile?.about || '',
      connections: profile?.connections || 0,
      experience: user?.publicMetadata?.experience || profile?.experience || [],
      education: user?.publicMetadata?.education || profile?.education || [],
      skills: user?.publicMetadata?.skills || profile?.skills || [],
      avatarUrl: user?.imageUrl || profile?.avatarUrl || null,
      bannerUrl: user?.publicMetadata?.bannerUrl || profile?.bannerUrl || null,
    })
    setIsEditing(true)
  }

  const onCancel = () => {
    setIsEditing(false)
    setDraft(null)
  }

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setDraft((d) => ({ ...d, avatarUrl: dataUrl }))
  }

  const onBannerPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setDraft((d) => ({ ...d, bannerUrl: dataUrl }))
  }

  const onSave = async () => {
    if (!draft) return
    
    try {
      // Update local profile
      updateProfile(draft)
      
      // Update Clerk metadata if user is authenticated
      if (user) {
        await user.update({
          firstName: draft.name.split(' ')[0],
          lastName: draft.name.split(' ').slice(1).join(' '),
          publicMetadata: {
            ...user.publicMetadata,
            role: draft.title,
            location: draft.location,
            about: draft.about,
            experience: draft.experience,
            education: draft.education,
            skills: draft.skills,
            bannerUrl: draft.bannerUrl,
            avatarUrl: draft.avatarUrl
          }
        });
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
    
    setIsEditing(false)
    setDraft(null)
  }

  // Modal states
  const [openModal, setOpenModal] = useState(null) // 'about' | 'experience' | 'education' | 'skills' | 'highlights'

  const openSection = (key) => setOpenModal(key)
  const closeModal = () => setOpenModal(null)

  const saveSection = (key, value) => {
    updateProfile({ [key]: value })
    setOpenModal(null)
  }
  
  // Search users function
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const response = await axios.get(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`)
      setSearchResults(response.data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Load connections
  const loadConnections = async () => {
    if (!user) return;
    
    setIsLoadingConnections(true)
    try {
      const response = await axios.get(`${API_BASE}/api/users/connections/${user.id}`)
      setConnections(response.data.connections || [])
      
      // Create a map of user IDs to connection status
      const statusMap = {}
      response.data.connections.forEach(conn => {
        statusMap[conn.id] = {
          status: conn.status,
          direction: conn.direction
        }
      })
      setConnectionStatus(statusMap)
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load connections')
    } finally {
      setIsLoadingConnections(false)
    }
  }
  
  // Load connections on mount
  useEffect(() => {
    if (profile && user) {
      loadConnections()
    }
  }, [profile, user])
  
  // Send connection request
  const sendConnectionRequest = async (userId) => {
    // Check if user is authenticated
    if (!isSignedIn) {
      // Redirect to sign-in if not authenticated
      signIn();
      return;
    }
    
    try {
      await axios.post(`${API_BASE}/api/users/connections/${userId}`, { 
        status: 'pending',
        from: user.id,
        to: userId,
        fromName: user.fullName || user.firstName || 'User'
      })
      
      // Show success notification
      toast.success('Connection request sent successfully!');
      
      // Refresh connections
      loadConnections()
      
      // Update search results to reflect new status
      setSearchResults(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, connection_status: 'pending' } 
            : u
        )
      )
      
      // Emit socket event for real-time notification
      if (socket) {
        socket.emit('connection:request', {
          from: user.id,
          to: userId,
          fromName: user.fullName || user.firstName || 'User'
        });
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('Failed to send connection request. Please try again.');
    }
  }
  
  // Accept connection request
  const acceptConnection = async (userId) => {
    try {
      await axios.post(`${API_BASE}/api/users/connections/${userId}`, { status: 'accepted' })
      // Refresh connections
      loadConnections()
    } catch (error) {
      console.error('Error accepting connection:', error)
    }
  }
  
  // Reject connection request
  const rejectConnection = async (userId) => {
    try {
      await axios.post(`${API_BASE}/api/users/connections/${userId}`, { status: 'rejected' })
      // Refresh connections
      loadConnections()
    } catch (error) {
      console.error('Error rejecting connection:', error)
    }
  }

  // Handle loading and authentication states
  if (!isLoaded) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="text-slate-600">Loading...</div>
    </div>
  )
  
  if (!isSignedIn) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="text-slate-600">Please sign in to view your profile</div>
    </div>
  )
  
  if (!profile) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="text-slate-600">Loading profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Bell */}
        <div className="fixed top-4 right-4 z-50">
          <div className="relative">
            <button 
              className="p-2 rounded-full bg-white shadow-md hover:bg-slate-50 transition-colors"
              onClick={() => setShowNotification(!showNotification)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotification && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No new notifications
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.map(notification => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                          {notification.type === 'connection_request' && (
                            <div className="mt-2 flex space-x-2">
                              <button 
                                className="px-2 py-1 text-xs font-medium text-white bg-startx-600 rounded hover:bg-startx-700"
                                onClick={() => {
                                  acceptConnection(notification.userId);
                                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                }}
                              >
                                Accept
                              </button>
                              <button 
                                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => {
                                  rejectConnection(notification.userId);
                                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Header */}
        <div className="card p-0 overflow-hidden accent-ribbon">
          <div className="h-56 banner-gradient relative overflow-hidden glow-accent">
            {(isEditing ? draft?.bannerUrl : profile.bannerUrl) && (
              <>
                <img src={isEditing ? draft?.bannerUrl : profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </>
            )}
            {isEditing && (
              <button onClick={() => bannerInputRef.current?.click()} className="absolute bottom-3 right-3 btn text-sm">
                Change Cover
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onBannerPick} />
          </div>
          <div className="p-6">
            <div className="-mt-16 mb-4">
              <div className="group w-28 h-28 rounded-full bg-white ring-4 ring-white shadow-md overflow-hidden relative -ml-2">
                <div className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.03]">
                  {(isEditing ? draft?.avatarUrl : (user?.imageUrl || profile.avatarUrl)) ? (
                    <img src={isEditing ? draft?.avatarUrl : (user?.imageUrl || profile.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-3xl font-bold text-startx-700">
                      {(user?.fullName || profile.name || "U").charAt(0)}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm flex items-center justify-center">
                    Change Photo
                  </button>
                )}
              </div>
              {isEditing && (
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input value={draft?.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" placeholder="Your name" />
                    <input value={draft?.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" placeholder="Headline / Title" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900">{user?.fullName || profile.name}</h1>
                    <p className="text-lg text-slate-700">{user?.publicMetadata?.role || profile.title}</p>
                  </>
                )}
                <div className="mt-2 text-sm text-slate-700 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {isEditing ? (
                      <input value={draft?.location || ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="input input-sm" placeholder="Location" />
                    ) : (
                      <span>{user?.publicMetadata?.location || profile.location}</span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M5 17.13A4 4 0 0 0 2 19v2" /></svg>
                    {isEditing ? (
                      <input type="number" value={draft?.connections ?? 0} onChange={(e) => setDraft({ ...draft, connections: Number(e.target.value || 0) })} className="input input-sm w-28" />
                    ) : (
                      <span>{profile.connections}+ connections</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={onSave} className="btn-gradient">Save</button>
                    <button onClick={onCancel} className="btn-outline">Cancel</button>
                  </>
                ) : (
                  <>
                    {isOwnProfile ? (
                      <button onClick={onStartEdit} className="btn-outline">Edit Profile</button>
                    ) : (
                      <>
                        {connectionStatus[profile.id]?.status === 'accepted' ? (
                          <button className="btn-outline">Message</button>
                        ) : connectionStatus[profile.id]?.status === 'pending' ? (
                          <button className="btn-gradient" disabled>Pending</button>
                        ) : (
                          <button className="btn-gradient" onClick={() => sendConnectionRequest(profile.id)}>Connect</button>
                        )}
                        <button className="btn-outline">Message</button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Connections Section */}
        <div className="card p-4 mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Connections</h2>
          
          {isLoadingConnections ? (
            <div className="text-center py-4 text-slate-500">Loading connections...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No connections yet. Start connecting with others!</div>
          ) : (
            <div className="space-y-4">
              {/* Pending Requests */}
              {connections.filter(conn => conn.status === 'pending' && conn.direction === 'incoming').length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-slate-800 mb-2">Pending Requests</h3>
                  <ul className="space-y-2">
                    {connections
                      .filter(conn => conn.status === 'pending' && conn.direction === 'incoming')
                      .map(conn => (
                        <li key={conn.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                              {conn.avatar_url ? (
                                <img src={conn.avatar_url} alt={conn.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-lg font-bold text-startx-700">
                                  {conn.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{conn.name}</div>
                              <div className="text-sm text-slate-600">{conn.title || conn.headline}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="btn-gradient btn-sm"
                              onClick={() => acceptConnection(conn.id)}
                            >
                              Accept
                            </button>
                            <button 
                              className="btn-outline btn-sm"
                              onClick={() => rejectConnection(conn.id)}
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              
              {/* Connected Users */}
              <div>
                <h3 className="text-md font-medium text-slate-800 mb-2">Connected</h3>
                <ul className="space-y-2">
                  {connections
                    .filter(conn => conn.status === 'accepted')
                    .map(conn => (
                      <li key={conn.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            {conn.avatar_url ? (
                              <img src={conn.avatar_url} alt={conn.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-lg font-bold text-startx-700">
                                {conn.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{conn.name}</div>
                            <div className="text-sm text-slate-600">{conn.title || conn.headline}</div>
                          </div>
                        </div>
                        <button className="btn-outline btn-sm">Message</button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="card diagonal-section overlap-up">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">About</h2>
                {isEditing && (
                  <span className="text-xs text-slate-500">{(draft?.about || '').length}/400</span>
                )}
              </div>
              {isEditing ? (
                <>
                  <textarea
                    className="textarea w-full mt-2 resize-none bg-slate-800/60 text-slate-100 placeholder:text-slate-400 border border-slate-700 focus:border-startx-500 focus:ring-startx-500 rounded-md"
                    rows={6}
                    maxLength={400}
                    value={draft?.about || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
                    placeholder="Summarize who you are, what you do, and what you care about"
                  />
                  <p className="mt-1 text-xs text-slate-500">Keep it concise and personable. Links are okay.</p>
                </>
              ) : (
                <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">{profile.about}</p>
              )}
            </section>

            {/* Experience */}
            <section className="card diagonal-section-alt overlap-up">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
              </div>
              <div className="mt-4 space-y-5">
                {(isEditing ? draft?.experience : profile.experience).map((exp, i) => (
                  <div key={i} className="">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {isEditing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input value={exp.role} onChange={(e) => setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x) }))} className="input" placeholder="Role" />
                            <input value={exp.company} onChange={(e) => setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x) }))} className="input" placeholder="Company" />
                            <input value={exp.period} onChange={(e) => setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, period: e.target.value } : x) }))} className="input" placeholder="Period" />
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-slate-900">{exp.role}</p>
                            <p className="text-sm text-slate-700">{exp.company}</p>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-slate-600 whitespace-nowrap">{exp.period}</span>
                    </div>
                    {isEditing ? (
                      <div className="mt-2">
                        <textarea
                          className="textarea w-full resize-none bg-slate-800/60 text-slate-100 placeholder:text-slate-400 border border-slate-700 focus:border-startx-500 focus:ring-startx-500 rounded-md"
                          rows={4}
                          maxLength={600}
                          value={exp.summary}
                          onChange={(e) => setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, summary: e.target.value } : x) }))}
                          placeholder="Describe your key impact, technologies used, and measurable outcomes"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {(exp.skills || []).map((s, idx) => (
                            <span key={idx} className="badge flex items-center gap-2">{s}
                              <button className="text-slate-500 hover:text-slate-700" onClick={() => setDraft((d) => ({ ...d, experience: d.experience.map((x, eidx) => eidx === i ? { ...x, skills: x.skills.filter((_, si) => si !== idx) } : x) }))}>×</button>
                            </span>
                          ))}
                          <input
                            className="input flex-1 min-w-[160px]"
                            placeholder="Add skill (Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = e.currentTarget.value.trim()
                                if (v) setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, skills: [...(x.skills || []), v] } : x) }))
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-500 text-right">{(exp.summary || '').length}/600</div>
                      </div>
                    ) : (
                      <p className="mt-2 text-slate-700 whitespace-pre-line">{exp.summary}</p>
                    )}
                    {exp.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {exp.skills.map((s, idx) => (
                          <span key={idx} className="badge">{s}</span>
                        ))}
                      </div>
                    )}
                    {isEditing && (
                      <div className="mt-3 flex gap-2">
                        <button className="btn-outline" onClick={() => setDraft((d) => ({ ...d, experience: d.experience.filter((_, idx) => idx !== i) }))}>Remove</button>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button className="btn mt-2" onClick={() => setDraft((d) => ({ ...d, experience: [...(d.experience || []), { company: '', role: '', period: '', summary: '', skills: [] }] }))}>Add Experience</button>
                )}
              </div>
            </section>

            {/* Education */}
            <section className="card diagonal-section overlap-more">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Education</h2>
              </div>
              <div className="mt-4 space-y-4 timeline">
                {(isEditing ? draft?.education : profile.education).map((ed, i) => (
                  <div key={i} className="timeline-item">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input value={ed.school} onChange={(e) => setDraft((d) => ({ ...d, education: d.education.map((x, idx) => idx === i ? { ...x, school: e.target.value } : x) }))} className="input" placeholder="School" />
                        <input value={ed.degree} onChange={(e) => setDraft((d) => ({ ...d, education: d.education.map((x, idx) => idx === i ? { ...x, degree: e.target.value } : x) }))} className="input" placeholder="Degree" />
                        <input value={ed.period} onChange={(e) => setDraft((d) => ({ ...d, education: d.education.map((x, idx) => idx === i ? { ...x, period: e.target.value } : x) }))} className="input" placeholder="Period" />
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-slate-900">{ed.school}</p>
                        <p className="text-sm text-slate-700">{ed.degree}</p>
                        <p className="text-sm text-slate-600">{ed.period}</p>
                      </>
                    )}
                    {isEditing && (
                      <div className="mt-3">
                        <button className="btn-outline" onClick={() => setDraft((d) => ({ ...d, education: d.education.filter((_, idx) => idx !== i) }))}>Remove</button>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button className="btn mt-2" onClick={() => setDraft((d) => ({ ...d, education: [...(d.education || []), { school: '', degree: '', period: '' }] }))}>Add Education</button>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <section className="card diagonal-section-alt overlap-up">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {(draft?.skills || []).map((s, i) => (
                      <span key={i} className={`badge pill-vibrant ${i % 4 === 0 ? 'pill-cyan' : i % 4 === 1 ? 'pill-magenta' : i % 4 === 2 ? 'pill-purple' : 'pill-azure'} ${i % 3 === 0 ? 'skill-lg' : i % 3 === 1 ? 'skill-md' : 'skill-sm'} flex items-center gap-2`}>{s}
                        <button className="text-white/80 hover:text-white" onClick={() => setDraft((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }))}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input className="input" placeholder="Add skill" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = e.currentTarget.value.trim()
                        if (v) setDraft((d) => ({ ...d, skills: [...(d.skills || []), v] }))
                        e.currentTarget.value = ''
                      }
                    }} />
                    <button className="btn-gradient" onClick={(e) => {
                      const input = e.currentTarget.previousSibling
                      if (input && input.value) {
                        const v = input.value.trim()
                        if (v) setDraft((d) => ({ ...d, skills: [...(d.skills || []), v] }))
                        input.value = ''
                      }
                    }}>Add</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className={`badge pill-vibrant ${i % 4 === 0 ? 'pill-cyan' : i % 4 === 1 ? 'pill-magenta' : i % 4 === 2 ? 'pill-purple' : 'pill-azure'} ${i % 3 === 0 ? 'skill-lg' : i % 3 === 1 ? 'skill-md' : 'skill-sm'}`}>{s}</span>
                  ))}
                </div>
              )}
            </section>

            {/* Highlights */}
            <section className="card">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(draft?.highlights || []).map((h, i) => (
                      <span key={i} className="badge flex items-center gap-2">
                        {h}
                        <button className="text-slate-500 hover:text-slate-700" onClick={() => setDraft((d) => ({ ...d, highlights: (d.highlights || []).filter((_, idx) => idx !== i) }))}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Add highlight" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = e.currentTarget.value.trim()
                        if (v) setDraft((d) => ({ ...d, highlights: [...(d.highlights || []), v] }))
                        e.currentTarget.value = ''
                      }
                    }} />
                    <button className="btn" onClick={(e) => {
                      const input = e.currentTarget.previousSibling
                      if (input && input.value) {
                        const v = input.value.trim()
                        if (v) setDraft((d) => ({ ...d, highlights: [...(d.highlights || []), v] }))
                        input.value = ''
                      }
                    }}>Add</button>
                    <button className="btn-outline" onClick={clearProfileOverrides}>Reset</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.highlights || ['Open-source contributor','Mentored 10+ developers','Speaker at local meetups']).map((h, i) => (
                    <span key={i} className="badge">{h}</span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      {openModal === 'about' && (
        <AboutModal
          initial={profile.about}
          onClose={closeModal}
          onSave={saveSection}
        />
      )}
      {openModal === 'skills' && (
        <SkillsModal
          initial={profile.skills}
          onClose={closeModal}
          onSave={saveSection}
        />
      )}
      {openModal === 'experience' && (
        <ListModal
          title="Edit Experience"
          initial={profile.experience}
          onClose={closeModal}
          onSave={saveSection}
          itemShape={{ company: '', role: '', period: '', summary: '', skills: [] }}
          labels={{ key: 'experience', fields: [
            { key: 'role', label: 'Role' },
            { key: 'company', label: 'Company' },
            { key: 'period', label: 'Period' },
          ]}}
        />
      )}
      {openModal === 'education' && (
        <ListModal
          title="Edit Education"
          initial={profile.education}
          onClose={closeModal}
          onSave={saveSection}
          itemShape={{ school: '', degree: '', period: '' }}
          labels={{ key: 'education', fields: [
            { key: 'school', label: 'School' },
            { key: 'degree', label: 'Degree' },
            { key: 'period', label: 'Period' },
          ]}}
        />
      )}
      {openModal === 'highlights' && (
        <ListModal
          title="Edit Highlights"
          initial={(profile.highlights || []).map((h) => ({ value: h }))}
          onClose={closeModal}
          onSave={(key, items) => saveSection('highlights', items.map((x) => x.value || ''))}
          itemShape={{ value: '' }}
          labels={{ key: 'highlights', fields: [
            { key: 'value', label: 'Highlight' },
          ]}}
        />
      )}
    </div>
  )
}

function AboutModal({ initial, onClose, onSave }) {
  const [value, setValue] = useState(initial || '')
  return (
    <Modal title="Edit About" onClose={onClose} onSave={() => onSave('about', value)}>
      <textarea className="textarea w-full" rows={8} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Tell your story" />
    </Modal>
  )
}

function SkillsModal({ initial, onClose, onSave }) {
  const [skills, setSkills] = useState(Array.isArray(initial) ? initial : [])
  const inputRef = useRef(null)
  const add = () => {
    const v = inputRef.current?.value?.trim()
    if (!v) return
    setSkills((s) => [...s, v])
    inputRef.current.value = ''
  }
  const remove = (idx) => setSkills((s) => s.filter((_, i) => i !== idx))
  return (
    <Modal title="Edit Skills" onClose={onClose} onSave={() => onSave('skills', skills)}>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((s, i) => (
          <span key={i} className="badge flex items-center gap-2">{s}<button className="text-slate-500 hover:text-slate-700" onClick={() => remove(i)}>×</button></span>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} className="input" placeholder="Add skill" onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        <button className="btn" onClick={add}>Add</button>
      </div>
    </Modal>
  )
}

function ListModal({ title, initial, itemShape, labels, onClose, onSave }) {
  const [items, setItems] = useState(Array.isArray(initial) ? initial : [])
  const update = (i, key, val) => setItems((arr) => arr.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
  const remove = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const add = () => setItems((arr) => [...arr, { ...itemShape }])
  return (
    <Modal title={title} onClose={onClose} onSave={() => onSave(labels.key, items)} widthClass="max-w-3xl">
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {labels.fields.map((f) => (
              <input key={f.key} className="input" placeholder={f.label} value={it[f.key] || ''} onChange={(e) => update(i, f.key, e.target.value)} />
            ))}
            <div className="flex items-center">
              <button className="btn-outline" onClick={() => remove(i)}>Remove</button>
            </div>
          </div>
        ))}
        <button className="btn" onClick={add}>Add</button>
      </div>
    </Modal>
  )
}


