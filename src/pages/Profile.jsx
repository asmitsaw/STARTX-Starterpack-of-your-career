import React, { useMemo, useRef, useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import Modal from '../components/Modal.jsx'

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

  // Modal states
  const [openModal, setOpenModal] = useState(null) // 'about' | 'experience' | 'education' | 'skills' | 'highlights'

  const openSection = (key) => setOpenModal(key)
  const closeModal = () => setOpenModal(null)

  const saveSection = (key, value) => {
    updateProfile({ [key]: value })
    setOpenModal(null)
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
        <div className="card p-0 overflow-hidden accent-ribbon">
          <div className="h-56 banner-gradient relative overflow-hidden glow-accent">
            {profile.bannerUrl && (
              <>
                <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
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
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-3xl font-bold text-startx-700">{profile.name.charAt(0)}</div>
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
                    <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                    <p className="text-lg text-slate-700">{profile.title}</p>
                  </>
                )}
                <div className="mt-2 text-sm text-slate-700 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {isEditing ? (
                      <input value={draft?.location || ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="input input-sm" placeholder="Location" />
                    ) : (
                      <span>{profile.location}</span>
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
                    <button className="btn-gradient">Connect</button>
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
            <section className="card diagonal-section overlap-up">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">About</h2>
                <button className="btn-outline btn-sm" onClick={() => openSection('about')}>Edit</button>
              </div>
              <p className="mt-2 text-slate-700 leading-relaxed">{profile.about}</p>
            </section>

            {/* Experience */}
            <section className="card diagonal-section-alt overlap-up">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
                <button className="btn-outline btn-sm" onClick={() => openSection('experience')}>Edit</button>
              </div>
              <div className="mt-4 space-y-5 timeline">
                {(isEditing ? draft?.experience : profile.experience).map((exp, i) => (
                  <div key={i} className="timeline-item">
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
            <section className="card diagonal-section overlap-more">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Education</h2>
                <button className="btn-outline btn-sm" onClick={() => openSection('education')}>Edit</button>
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
                <button className="btn-outline btn-sm" onClick={() => openSection('skills')}>Edit</button>
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
                <button className="btn-outline btn-sm" onClick={() => openSection('highlights')}>Edit</button>
              </div>
              <ul className="mt-3 space-y-2 text-slate-700 text-sm">
                {(isEditing ? (draft?.highlights || []) : (profile.highlights || ['Open-source contributor','Mentored 10+ developers','Speaker at local meetups']))
                  .map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-startx-600"><polygon points="12 2 15 8.5 22 9 17 13.5 18.5 21 12 17.5 5.5 21 7 13.5 2 9 9 8.5 12 2" /></svg>
                      <span>{h}</span>
                    </li>
                  ))}
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


