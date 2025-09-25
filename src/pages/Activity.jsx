import React, { useMemo, useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import { useAuth } from '../App.jsx'

export default function Activity() {
  const { openAuthModal } = useAuth()
  const [tab, setTab] = useState(0)

  // Demo placeholder data; in a real app, fetch user-specific data
  const pitches = useMemo(() => [
    { id: 1, title: 'AI Career Coach', summary: 'Interview prep using LLMs.' },
    { id: 2, title: 'Campus Connect', summary: 'Connecting students to mentors.' },
  ], [])
  const posts = useMemo(() => [
    { id: 3, title: 'Announcement: New feature', summary: 'We launched the resume builder.' },
  ], [])
  const reactions = useMemo(() => [
    { id: 4, target: 'Pitch: DevOps Automation', type: '👍 Like' },
    { id: 5, target: 'News: React 19 RC', type: '💬 Commented' },
  ], [])

  const tabs = ['Pitches', 'Posts', 'Reactions']

  const renderList = (items, kind) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">No {kind.toLowerCase()} yet.</div>
      ) : (
        items.map((it) => (
          <article key={it.id} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
            <p className="font-semibold text-slate-900">{'title' in it ? it.title : it.type}</p>
            <p className="mt-1 text-sm text-slate-700">{'summary' in it ? it.summary : it.target}</p>
          </article>
        ))
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Posts & Activity</h1>
      </div>

      <div className="mb-6">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} instant />
      </div>

      {tab === 0 && renderList(pitches, 'Pitches')}
      {tab === 1 && renderList(posts, 'Posts')}
      {tab === 2 && renderList(reactions, 'Reactions')}
    </div>
  )
}


