import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { fetchPitches, createPitch, addComment, votePitch, requestConnect } from '../services/pitchService.js'
import axios from 'axios'

export default function Pitch() {
  const { openAuthModal } = useAuth()
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174'
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLocalDemo, setIsLocalDemo] = useState(false)
  const [openCommentIndex, setOpenCommentIndex] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [formData, setFormData] = useState({ title: '', summary: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [votingInProgress, setVotingInProgress] = useState({})
  const [connectingPitch, setConnectingPitch] = useState(null)

  useEffect(() => {
    loadPitches()
  }, [])

  const generateSamplePitches = () => {
    const items = [
      {
        title: 'AI Career Coach',
        summary: 'A conversational agent that reviews resumes, suggests role transitions, and generates tailored interview prep plans using your GitHub and LinkedIn data.'
      },
      {
        title: 'Smart Garden Monitor',
        summary: 'Solar-powered sensor nodes track moisture, pH, and temperature; an app recommends watering and fertilizing schedules based on plant type.'
      },
      {
        title: 'Nexus Hiring Graph',
        summary: 'A talent graph that connects skills → projects → outcomes, enabling skills-first matching across companies and open-source work.'
      },
      {
        title: 'Code Reviewer Bot',
        summary: 'PR assistant that flags risky diffs, generates unit-test scaffolds, and summarizes changes for non-technical stakeholders.'
      },
      {
        title: 'AR Home Designer',
        summary: 'Drop true-scale furniture into your room with LiDAR and export a shopping list with best-price alerts.'
      },
      {
        title: 'Personal Finance Copilot',
        summary: 'Connects bank accounts and categorizes spend; proposes actionable weekly goals and simulates long-term outcomes.'
      },
      {
        title: 'Realtime Whiteboard',
        summary: 'Low-latency canvas with cursors, audio rooms, and AI sticky-notes that cluster ideas into themes automatically.'
      },
      {
        title: 'Carbon Footprint Tracker',
        summary: 'Email-receipt parser that estimates product emissions and offers greener alternatives and offsets.'
      },
      {
        title: 'Auto Video Summarizer',
        summary: 'Serverless pipeline that splits long videos, transcribes, and generates chaptered summaries with key moments.'
      },
      {
        title: 'Voice Meeting Notes',
        summary: 'Multi-speaker diarization with action-item extraction and Slack/Jira sync in one click.'
      },
      {
        title: 'Developer Portfolio Kit',
        summary: 'A template that turns GitHub repos into a polished portfolio with live demos and case-study writeups.'
      },
      {
        title: 'Community Learning Hub',
        summary: 'Peer-led micro-courses; creators earn tips and badges while learners get quizzes and project feedback.'
      }
    ]

    const commentBank = [
      'Love the problem framing and the go-to-market sounds realistic.',
      'Would be great to see an early mock or demo link.',
      'How are you thinking about data privacy here?',
      'This could integrate nicely with Slack/MS Teams.',
      'Pricing model idea: usage-based with a generous free tier.',
      'Strong value prop for small teams—what about enterprise SSO?',
      'Consider an API-first approach so others can extend it.'
    ]

    // Pick first 8 with randomized votes and seeded comments
    return items.slice(0, 8).map((it, i) => {
      const numComments = Math.floor(Math.random()*2) + 1 // 1..2
      const comments = Array.from({ length: numComments }).map((_, idx) => ({
        id: `c-${i}-${idx}`,
        user_name: ['Sarah','Marcus','Priya','Kenji','Lina','David','Emily'][Math.floor(Math.random()*7)],
        content: commentBank[Math.floor(Math.random()*commentBank.length)],
        created_at: new Date(Date.now()- (i*2+idx)*3600_000).toISOString()
      }))
      return {
        id: `demo-${i+1}`,
        title: it.title,
        summary: it.summary,
        upvotes: Math.floor(Math.random()*50)+5,
        downvotes: Math.floor(Math.random()*6),
        comment_count: comments.length,
        comments,
        created_at: new Date(Date.now()- i*86400000).toISOString()
      }
    })
  }

  const loadPitches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPitches()
      const sorted = Array.isArray(data)
        ? [...data].sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))
        : []
      setPitches(sorted)
      setIsLocalDemo(false)
    } catch (err) {
      console.error('Error loading pitches:', err)
      // Seed local demo data so the page remains functional
      const seeded = generateSamplePitches()
      setPitches(seeded.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)))
      setIsLocalDemo(true)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formError) setFormError(null)
    if (successMessage) setSuccessMessage(null)
  }

  const handleSubmitPitch = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.summary.trim()) {
      setFormError('Title and summary are required')
      return
    }
    
    if (!user) {
      openAuthModal()
      return
    }
    
    try {
      setSubmitting(true)
      setFormError(null)
      let newPitch
      if (isLocalDemo) {
        newPitch = {
          id: `demo-${Date.now()}`,
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          upvotes: 0,
          downvotes: 0,
          comments: [],
          comment_count: 0,
          created_at: new Date().toISOString()
        }
      } else {
        newPitch = await createPitch({
          title: formData.title.trim(),
          summary: formData.summary.trim(),
        })
      }
      
      setFormData({ title: '', summary: '' })
      setSuccessMessage('Your pitch has been posted successfully!')
      setPitches(prev => [newPitch, ...prev])
      
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      if (err && err.message && /unauthor/i.test(err.message)) {
        setFormError('Please sign in to post a pitch.')
        openAuthModal()
      } else {
        setFormError(`Failed to post your pitch: ${err.message || 'Please try again.'}`)
      }
      console.error('Error submitting pitch:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (pitchId, voteType) => {
    if (!user) {
      openAuthModal()
      return
    }
    
    try {
      setVotingInProgress(prev => ({ ...prev, [pitchId]: true }))
      if (isLocalDemo) {
        setPitches(prev => prev.map(p => p.id===pitchId ? {
          ...p,
          upvotes: voteType==='upvote' ? (parseInt(p.upvotes||0)+1) : p.upvotes,
          downvotes: voteType==='downvote' ? (parseInt(p.downvotes||0)+1) : p.downvotes
        } : p))
      } else {
        await votePitch(pitchId, voteType)
        setPitches(prev => prev.map(p => {
          if (p.id === pitchId) {
            return {
              ...p,
              upvotes: voteType === 'upvote' ? (parseInt(p.upvotes || 0) + 1) : p.upvotes,
              downvotes: voteType === 'downvote' ? (parseInt(p.downvotes || 0) + 1) : p.downvotes
            }
          }
          return p
        }))
      }
    } catch (err) {
      console.error('Error voting:', err)
      setError('Failed to vote. Please try again.')
    } finally {
      setVotingInProgress(prev => ({ ...prev, [pitchId]: false }))
    }
  }
  
  const handleConnect = async (pitch) => {
    if (!user) {
      openAuthModal()
      return
    }
    
    // Don't allow connecting to own pitch
    if (pitch.user_id === user.id) {
      setError('You cannot connect with your own pitch')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    try {
      setConnectingPitch(pitch.id)
      
      // Create or get existing conversation with pitch owner
      const response = await axios.post(
        `${API_BASE}/api/messages/conversations`,
        { participantId: pitch.user_id },
        { withCredentials: true }
      )
      
      const conversationId = response.data.id
      
      // Send initial message about interest in the pitch
      await axios.post(
        `${API_BASE}/api/messages/conversations/${conversationId}/messages`,
        { 
          text: `Hi! I'm interested in your pitch "${pitch.title}". I'd love to discuss this further!` 
        },
        { withCredentials: true }
      )
      
      // Navigate to messages
      navigate('/message')
    } catch (err) {
      console.error('Error connecting:', err)
      setError('Failed to send message. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setConnectingPitch(null)
    }
  }

  const handlePostComment = async (pitchId) => {
    if (!user) {
      openAuthModal()
      return
    }
    
    const text = (commentDrafts[pitchId] || '').trim()
    if (!text) return
    
    try {
      let newComment
      if (isLocalDemo) {
        newComment = {
          id: `c-${Date.now()}`,
          content: text,
          user_name: user?.fullName || user?.firstName || 'You',
          created_at: new Date().toISOString()
        }
      } else {
        newComment = await addComment(pitchId, text)
      }
      setPitches(prev => prev.map(p => p.id===pitchId ? {
        ...p,
        comments: [...(p.comments||[]), newComment],
        comment_count: (p.comment_count||0)+1
      } : p))
      setCommentDrafts(s => ({ ...s, [pitchId]: '' }))
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* Pitch Form */}
        <div className="card bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Innovation Pitch</h1>
            <span className="badge bg-startx-500 text-white px-3 py-1 rounded-full text-xs font-medium">Community</span>
          </div>
          <p className="mt-2 text-slate-600">Share a product idea, startup concept, or research demo.</p>

          {successMessage && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg border">{successMessage}</div>}
          {formError && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border">{formError}</div>}
          
          <form className="mt-4 grid gap-4" onSubmit={handleSubmitPitch}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium">Title</label>
              <input id="title" name="title" value={formData.title} onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-slate-900 placeholder-slate-500" placeholder="e.g., AI Career Coach" disabled={submitting} />
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-medium">Summary</label>
              <textarea id="summary" name="summary" value={formData.summary} onChange={handleInputChange}
                rows="4" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-slate-900 placeholder-slate-500" placeholder="Describe your idea..." disabled={submitting}></textarea>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="bg-startx-600 text-white px-4 py-2 rounded-lg" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Pitch'}
              </button>
              <button type="button" className="border px-4 py-2 rounded-lg" onClick={() => setFormData({ title: '', summary: '' })} disabled={submitting}>
                Clear
              </button>
            </div>
          </form>
        </div>
        
        {/* Pitches */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Recent Pitches</h2>
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border">{error}</div>
          ) : pitches.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-lg border">No pitches yet. Be the first!</div>
          ) : (
            pitches.map((pitch) => (
              <article key={pitch.id} className="rounded-2xl border border-white/10 bg-white dark:bg-dark-800 shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{pitch.title}</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{pitch.summary}</p>
                  </div>
                  <span className="inline-flex items-center text-xs px-2 py-1 rounded-full ring-1 ring-slate-200 dark:ring-white/10 text-slate-600 dark:text-slate-300">Pitch</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <div>{new Date(pitch.created_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => handleVote(pitch.id, 'upvote')} disabled={votingInProgress[pitch.id]} className="inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                      <span>👍</span><span>{pitch.upvotes || 0}</span>
                    </button>
                    <button onClick={() => handleVote(pitch.id, 'downvote')} disabled={votingInProgress[pitch.id]} className="inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                      <span>👎</span><span>{pitch.downvotes || 0}</span>
                    </button>
                    <div className="inline-flex items-center gap-2"><span>💬</span><span>{pitch.comment_count || 0}</span></div>
                    <button 
                      onClick={() => handleConnect(pitch)} 
                      disabled={connectingPitch === pitch.id}
                      className="inline-flex items-center gap-2 text-startx-600 hover:text-startx-700 disabled:opacity-50">
                      {connectingPitch === pitch.id ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </div>
                {pitch.comments && pitch.comments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {pitch.comments.map(c => (
                      <li key={c.id} className="rounded-lg bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200 dark:ring-white/10 p-3">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{c.user_name || 'Anonymous'}</span>
                          <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

