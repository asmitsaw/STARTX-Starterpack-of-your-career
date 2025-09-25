import React, { useMemo, useRef, useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser.js'

export default function Profile() {
  const { profile, updateProfile, clearProfileOverrides } = useCurrentUser()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const onStartEdit = () => {
    setDraft({
      name: profile?.name || '',
      title: profile?.title || '',
      location: profile?.location || '',
      about: profile?.about || '',
      connections: profile?.connections || 0,
      experience: profile?.experience || [],
      education: profile?.education || [],
      skills: profile?.skills || [],
      avatarUrl: profile?.avatarUrl || null,
      bannerUrl: profile?.bannerUrl || null,
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

  const onSave = () => {
    if (!draft) return
    updateProfile(draft)
    setIsEditing(false)
    setDraft(null)
  }

  if (!profile) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="text-slate-600">Loading profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="card p-0 overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-startx-600 to-startx-400 relative overflow-hidden">
            {profile.bannerUrl && (
              <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            )}
            {isEditing && (
              <button onClick={() => bannerInputRef.current?.click()} className="absolute bottom-3 right-3 btn text-sm">
                Change Cover
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onBannerPick} />
          </div>
          <div className="p-6">
            <div className="-mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-white ring-4 ring-white shadow-md grid place-items-center text-3xl font-bold text-startx-700 overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              {isEditing && (
                <div className="mt-2">
                  <button onClick={() => avatarInputRef.current?.click()} className="btn-outline text-sm">Change Photo</button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                </div>
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
                    <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                    <p className="text-slate-700">{profile.title}</p>
                  </>
                )}
                <div className="mt-1 text-sm text-slate-600">
                  {isEditing ? (
                    <input value={draft?.location || ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="input input-sm" placeholder="Location" />
                  ) : (
                    <span>{profile.location}</span>
                  )}
                  <span className="mx-2">•</span>
                  {isEditing ? (
                    <input type="number" value={draft?.connections ?? 0} onChange={(e) => setDraft({ ...draft, connections: Number(e.target.value || 0) })} className="input input-sm w-28" />
                  ) : (
                    <span>{profile.connections}+ connections</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={onSave} className="btn">Save</button>
                    <button onClick={onCancel} className="btn-outline">Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn">Connect</button>
                    <button className="btn-outline">Message</button>
                    <button onClick={onStartEdit} className="btn-outline">Edit Profile</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              {isEditing ? (
                <textarea value={draft?.about || ''} onChange={(e) => setDraft({ ...draft, about: e.target.value })} className="textarea" rows={4} placeholder="Tell your story" />
              ) : (
                <p className="mt-2 text-slate-700 leading-relaxed">{profile.about}</p>
              )}
            </section>

            {/* Experience */}
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
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
                      <textarea value={exp.summary} onChange={(e) => setDraft((d) => ({ ...d, experience: d.experience.map((x, idx) => idx === i ? { ...x, summary: e.target.value } : x) }))} className="textarea mt-2" rows={3} placeholder="Summary" />
                    ) : (
                      <p className="mt-2 text-slate-700">{exp.summary}</p>
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
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">Education</h2>
              <div className="mt-4 space-y-4">
                {(isEditing ? draft?.education : profile.education).map((ed, i) => (
                  <div key={i}>
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
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
              {isEditing ? (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {(draft?.skills || []).map((s, i) => (
                      <span key={i} className="badge flex items-center gap-2">{s}
                        <button className="text-slate-500 hover:text-slate-700" onClick={() => setDraft((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }))}>×</button>
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
                    <button className="btn" onClick={(e) => {
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
                    <span key={i} className="badge">{s}</span>
                  ))}
                </div>
              )}
            </section>

            {/* Highlights */}
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
              <ul className="mt-3 space-y-2 text-slate-700 text-sm">
                <li>• Open-source contributor</li>
                <li>• Mentored 10+ developers</li>
                <li>• Speaker at local meetups</li>
              </ul>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-outline" onClick={clearProfileOverrides}>Reset to defaults</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


