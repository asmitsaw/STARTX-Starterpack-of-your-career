import React, { useState } from 'react'
import { useAuth } from '../App.jsx'

export default function Pitch() {
  const { openAuthModal } = useAuth()
  const [openCommentIndex, setOpenCommentIndex] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentsByPitch, setCommentsByPitch] = useState({})

  const handlePostComment = (idx) => {
    const text = (commentDrafts[idx] || '').trim()
    if (!text) return
    setCommentsByPitch((prev) => ({
      ...prev,
      [idx]: [...(prev[idx] || []), { id: Date.now(), text }],
    }))
    setCommentDrafts((s) => ({ ...s, [idx]: '' }))
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Innovation Pitch</h1>
            <span className="badge">Community</span>
          </div>
          <p className="mt-2 text-slate-600">Share a product idea, startup concept, or research demo. Get feedback and potential collaborators.</p>
          <form className="mt-4 grid gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="e.g., AI Career Coach" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Summary</label>
              <textarea rows="4" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="One-liner value prop and who it helps"></textarea>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="btn-primary">Post Pitch</button>
              <button type="button" className="btn-outline">Save Draft</button>
            </div>
          </form>
        </div>
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <article key={i} className="card">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">AI Career Coach #{i}</h3>
                 <span className="badge">Pitch</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Personalized interview prep and job guidance using LLMs. Looking for frontend collaborator.</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline" onClick={() => setOpenCommentIndex(i)}>Comment</button>
                <button className="btn-outline">Connect</button>
              </div>
              {openCommentIndex === i && (
                <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  <label className="block text-sm font-medium text-slate-700">Add a comment</label>
                  <textarea
                    rows="3"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                    placeholder="Share feedback or ask a question..."
                    value={commentDrafts[i] || ''}
                    onChange={(e) => setCommentDrafts((s) => ({ ...s, [i]: e.target.value }))}
                  />
                  <div className="mt-2 flex justify-end">
                    <button type="button" className="btn-primary" onClick={() => handlePostComment(i)}>Post</button>
                  </div>

                  {(commentsByPitch[i] || []).length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-700">Comments</p>
                      <ul className="mt-2 list-disc pl-6 text-sm text-slate-700">
                        {commentsByPitch[i].map((c) => (
                          <li key={c.id}>{c.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}


