import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchPitches, createPitch, addComment, votePitch, requestConnect } from '../services/pitchService.js'

export default function Pitch() {
  const { openAuthModal, user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openCommentIndex, setOpenCommentIndex] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [formData, setFormData] = useState({ title: '', summary: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [connectPitchId, setConnectPitchId] = useState(null)
  const [connectMessage, setConnectMessage] = useState('')
  const [votingInProgress, setVotingInProgress] = useState({})

  // Load pitches on component mount
  useEffect(() => {
    loadPitches()
  }, [])

  // Function to load pitches from API
  const loadPitches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPitches()
      setPitches(data)
    } catch (err) {
      setError(`Error fetching pitches: ${err.message}`)
      console.error('Error loading pitches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle pitch submission
  const handleSubmitPitch = async (e) => {
    e.preventDefault()
    
    // Validate form
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
      
      // Log the request for debugging
      console.log('Submitting pitch:', formData)
      
      // Add user_id to the form data if available
      const pitchToSubmit = {
        ...formData,
        user_id: user.id || user.userId || null
      }
      
      await createPitch(pitchToSubmit)
      
      // Reset form and show success message
      setFormData({ title: '', summary: '' })
      setSuccessMessage('Your pitch has been posted successfully!')
      
      // Reload pitches to show the new one
      await loadPitches()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setFormError(`Failed to post your pitch: ${err.message || 'Please try again.'}`)
      console.error('Error submitting pitch:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle voting on a pitch
  const handleVote = async (pitchId, voteType) => {
    if (!user) {
      openAuthModal()
      return
    }
    
    try {
      setVotingInProgress(prev => ({ ...prev, [pitchId]: true }))
      await votePitch(pitchId, voteType)
      
      // Optimistically update UI
      setPitches(prev => prev.map(pitch => {
        if (pitch.id === pitchId) {
          return {
            ...pitch,
            upvotes: voteType === 'upvote' ? (parseInt(pitch.upvotes || 0) + 1) : pitch.upvotes,
            downvotes: voteType === 'downvote' ? (parseInt(pitch.downvotes || 0) + 1) : pitch.downvotes
          }
        }
        return pitch
      }))
    } catch (err) {
      console.error('Error voting:', err)
      setError('Failed to vote. Please try again.')
    } finally {
      setVotingInProgress(prev => ({ ...prev, [pitchId]: false }))
    }
  }
  
  // Handle opening connect modal
  const handleOpenConnectModal = (pitchId) => {
    if (!user) {
      openAuthModal()
      return
    }
    setConnectPitchId(pitchId)
    setConnectMessage('')
    setConnectModalOpen(true)
  }
  
  // Handle sending connect request
  const handleSendConnectRequest = async () => {
    try {
      await requestConnect(connectPitchId, connectMessage)
      setSuccessMessage('Connection request sent successfully!')
      setConnectModalOpen(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      console.error('Error sending connect request:', err)
      setError('Failed to send connection request. Please try again.')
    }
  }

  // Handle posting a comment
  const handlePostComment = async (pitchId) => {
    if (!user) {
      openAuthModal()
      return
    }
    
    const text = (commentDrafts[pitchId] || '').trim()
    if (!text) return
    
    try {
      await addComment(pitchId, text)
      
      // Optimistically update UI
      setPitches(prevPitches => 
        prevPitches.map(pitch => {
          if (pitch.id === pitchId) {
            return {
              ...pitch,
              comments: [...(pitch.comments || []), { id: Date.now(), content: text, user_name: user.name }],
              comment_count: (pitch.comment_count || 0) + 1
            }
          }
          return pitch
        })
      )
      
      // Clear comment draft
      setCommentDrafts((s) => ({ ...s, [pitchId]: '' }))
      
      // Reload pitches to get updated data
      loadPitches()
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* Pitch Creation Form */}
        <div className="card bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Innovation Pitch</h1>
            <span className="badge bg-startx-500 text-white px-3 py-1 rounded-full text-xs font-medium">Community</span>
          </div>
          <p className="mt-2 text-slate-600">Share a product idea, startup concept, or research demo. Get feedback and potential collaborators.</p>
          
          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
              {successMessage}
            </div>
          )}
          
          {formError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {formError}
            </div>
          )}
          
          <form className="mt-4 grid gap-4" onSubmit={handleSubmitPitch}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
              <input 
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200" 
                placeholder="e.g., AI Career Coach"
                aria-required="true"
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-slate-700">Summary</label>
              <textarea 
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows="4" 
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200" 
                placeholder="Describe your idea, who it helps, and what you're looking for"
                aria-required="true"
                disabled={submitting}
              ></textarea>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="submit" 
                className="btn-primary bg-startx-600 hover:bg-startx-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Pitch'}
              </button>
              <button 
                type="button" 
                className="btn-outline border border-slate-300 px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setFormData({ title: '', summary: '' })}
                disabled={submitting}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
        
        {/* Pitches List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Recent Pitches</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-startx-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          ) : pitches.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600">No pitches yet. Be the first to share your idea!</p>
            </div>
          ) : (
            pitches.map((pitch) => (
              <article key={pitch.id} className="card bg-white shadow-sm transition-shadow hover:shadow-md p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{pitch.title}</h3>
                  <span className="badge bg-startx-100 text-startx-800 px-2 py-1 rounded-full text-xs font-medium">Pitch</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{pitch.summary}</p>
                <div className="mt-3 flex items-center text-xs text-slate-500">
                  <span>{new Date(pitch.created_at).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>{pitch.comment_count || 0} comments</span>
                </div>
                <div className="mt-4 flex gap-2">
                  {/* Voting buttons */}
                  <div className="flex items-center gap-2 mr-2">
                    <button
                      onClick={() => handleVote(pitch.id, 'upvote')}
                      disabled={votingInProgress[pitch.id]}
                      className="text-slate-500 hover:text-green-600 disabled:opacity-50 flex items-center"
                      aria-label="Upvote"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="ml-1">{pitch.upvotes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(pitch.id, 'downvote')}
                      disabled={votingInProgress[pitch.id]}
                      className="text-slate-500 hover:text-red-600 disabled:opacity-50 flex items-center"
                      aria-label="Downvote"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="ml-1">{pitch.downvotes || 0}</span>
                    </button>
                  </div>
                  <button 
                    className="btn-outline border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                    onClick={() => setOpenCommentIndex(openCommentIndex === pitch.id ? null : pitch.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {openCommentIndex === pitch.id ? 'Hide Comments' : 'Comment'}
                  </button>
                  <button 
                    className="btn-outline border border-startx-300 px-3 py-1.5 rounded-lg text-sm font-medium text-startx-700 hover:bg-startx-50 transition-colors flex items-center gap-1"
                    onClick={() => handleOpenConnectModal(pitch.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Connect
                  </button>
                </div>
                
                {/* Comments Section */}
                {openCommentIndex === pitch.id && (
                  <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <label className="block text-sm font-medium text-slate-700">Add a comment</label>
                    <textarea
                      rows="3"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                      placeholder="Share feedback or ask a question..."
                      value={commentDrafts[pitch.id] || ''}
                      onChange={(e) => setCommentDrafts((s) => ({ ...s, [pitch.id]: e.target.value }))}
                      aria-label="Comment text"
                    />
                    <div className="mt-2 flex justify-end">
                      <button 
                        type="button" 
                        className="btn-primary bg-startx-600 hover:bg-startx-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handlePostComment(pitch.id)}
                      >
                        Post Comment
                      </button>
                    </div>

                    {pitch.comments && pitch.comments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700">Comments</p>
                        <ul className="mt-2 space-y-3">
                          {pitch.comments.map((comment) => (
                            <li key={comment.id} className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700">{comment.user_name || 'Anonymous'}</span>
                                <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{comment.content || comment.text}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>

      {/* Connect Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Connect with Pitch Creator</h3>
            <p className="text-gray-600 mb-4">Send a message to express your interest in this pitch.</p>
            
            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Explain why you're interested in this pitch..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4 h-32"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConnectModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendConnectRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


