import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import JobFilters from '../components/JobFilters'
import { useAuth } from '../App.jsx'

export default function Feed() {
  const { openAuthModal } = useAuth()
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5174'
  const initialItems = [
    // Remote (4+)
    { id: 1, title: 'Frontend Engineer — React + Tailwind', company: 'Nebula Labs', location: 'Remote — Global', tags: ['Remote', 'Full‑time', 'Junior'], salaryLpa: 4, description: 'Build delightful UIs with React and Tailwind.\nShip features in a product-led startup.\nWork closely with design and backend teams.\nOwn components, accessibility, and performance.' },
    { id: 2, title: 'Platform Engineer — DX Tooling', company: 'OrbitWorks', location: 'Remote — North America', tags: ['Remote', 'Full‑time', 'Mid'], salaryLpa: 18, description: 'Improve developer experience and CI/CD.\nScale internal tooling and shared libraries.\nPartner with product teams to remove friction.\nAutomate workflows and observability.' },
    { id: 3, title: 'AI Engineer — LLM Ops', company: 'Insight AI', location: 'Remote — Europe', tags: ['Remote', 'Contract', 'Senior'], salaryLpa: 28, description: 'Design, evaluate, and deploy LLM pipelines.\nOptimize prompts and retrieval quality.\nMonitor latency, cost, and safety.\nShip measurable improvements to users.' },
    { id: 4, title: 'Web Developer — Next.js', company: 'PixelForge', location: 'Remote — India', tags: ['Remote', 'Full‑time', 'Junior'], salaryLpa: 3, description: 'Build marketing and product sites in Next.js.\nOwn responsive layouts and SEO.\nCollaborate with designers on animations.\nMaintain high Lighthouse scores.' },

    // Hybrid (4+)
    { id: 5, title: 'Backend Developer — Node.js', company: 'DataForge', location: 'Bengaluru, IN (Hybrid)', tags: ['Hybrid', 'Full‑time', 'Junior'], salaryLpa: 12, description: 'Design REST/GraphQL services in Node.js.\nWork with PostgreSQL and caching layers.\nWrite robust tests and docs.\nCollaborate on code reviews and design.' },
    { id: 6, title: 'SRE — Cloud & Observability', company: 'CloudVista', location: 'Austin, TX (Hybrid)', tags: ['Hybrid', 'Full‑time', 'Mid'], salaryLpa: 9, description: 'Own reliability and incident response.\nScale Kubernetes and IaC pipelines.\nImprove metrics, logging, and tracing.\nReduce toil through automation.' },
    { id: 7, title: 'Tech Lead — API Platform', company: 'BlueRiver', location: 'Berlin, DE (Hybrid)', tags: ['Hybrid', 'Full‑time', 'Senior'], salaryLpa: 30, description: 'Lead API platform architecture and roadmap.\nMentor engineers and raise the bar.\nDrive standards for security and performance.\nPartner with product to deliver outcomes.' },
    { id: 8, title: 'Mobile Engineer — React Native', company: 'AppNest', location: 'Toronto, CA (Hybrid)', tags: ['Hybrid', 'Contract', 'Mid'], salaryLpa: 16, description: 'Build cross‑platform features in React Native.\nOptimize performance and offline flows.\nImplement clean navigation and theming.\nShip polished UX with analytics.' },

    // Onsite (4+)
    { id: 9, title: 'Product Designer — Design Systems', company: 'FlowCraft', location: 'San Francisco, CA', tags: ['Onsite', 'Full‑time', 'Junior'], salaryLpa: 4, description: 'Design tokens, UI kits, and Figma libraries.\nPartner with engineering on implementation.\nRun audits for accessibility and quality.\nEvolve brand and component guidelines.' },
    { id: 10, title: 'Data Engineer — ETL Pipelines', company: 'DataQuarry', location: 'London, UK', tags: ['Onsite', 'Full‑time', 'Mid'], salaryLpa: 22, description: 'Build reliable ETL/ELT pipelines.\nModel data for analytics and ML.\nOwn data quality, lineage, and SLAs.\nCollaborate with analysts and stakeholders.' },
    { id: 11, title: 'Security Engineer — AppSec', company: 'FortiStack', location: 'Singapore, SG', tags: ['Onsite', 'Full‑time', 'Senior'], salaryLpa: 26, description: 'Threat model critical services.\nAutomate SAST/DAST and secure SDLC.\nLead security reviews and training.\nDrive remediation and hardening.' },
    { id: 12, title: 'DevOps Engineer — IaC', company: 'InfraLabs', location: 'Sydney, AU', tags: ['Onsite', 'Contract', 'Senior'], salaryLpa: 24, description: 'Own Terraform modules and CI.\nScale multi‑cloud infrastructure.\nImprove deployment reliability.\nChampion cost and performance.' },
  ]

  const salaryRanges = ['Any', '0-5 LPA', '5-10 LPA', '10-20 LPA', '20+ LPA']

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [customizeTab, setCustomizeTab] = useState(0)
  const [salaryRange, setSalaryRange] = useState('Any')
  const [workMode, setWorkMode] = useState('Any') // Any | Remote | Hybrid | Onsite
  const [experience, setExperience] = useState('Any') // Any | Junior | Mid | Senior
  const [items, setItems] = useState(initialItems)
  // Load jobs from API
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`)
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
          setItems(
            data.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              tags: [j.work_mode, j.type, j.experience],
              salaryLpa: Number(j.salary_lpa),
              description: 'Role posted via API.',
            }))
          )
        }
      } catch {}
    })()
  }, [])


  // Post a job slide-over state
  const [isPostOpen, setIsPostOpen] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [postData, setPostData] = useState({
    title: '',
    company: '',
    location: '',
    workMode: 'Remote',
    type: 'Full‑time',
    experience: 'Junior',
    salaryLpa: 10,
  })

  

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Work mode filter
      if (workMode !== 'Any' && !item.tags.includes(workMode)) {
        return false
      }
      // Experience filter
      if (experience !== 'Any' && !item.tags.includes(experience)) {
        return false
      }
      // Salary filter
      if (salaryRange !== 'Any') {
        const s = item.salaryLpa
        if (typeof s !== 'number') return false
        if (salaryRange === '0-5 LPA' && !(s <= 5)) return false
        if (salaryRange === '5-10 LPA' && !(s > 5 && s <= 10)) return false
        if (salaryRange === '10-20 LPA' && !(s > 10 && s <= 20)) return false
        if (salaryRange === '20+ LPA' && !(s > 20)) return false
      }
      return true
    })
  }, [items, workMode, experience, salaryRange])

  // Reusable customize content now delegates to JobFilters component
  const CustomizePanelContent = ({ inline = false, onClose }) => (
    <JobFilters
      customizeTab={customizeTab}
      setCustomizeTab={setCustomizeTab}
      workMode={workMode}
      setWorkMode={setWorkMode}
      experience={experience}
      setExperience={setExperience}
      salaryRange={salaryRange}
      setSalaryRange={setSalaryRange}
      salaryRanges={salaryRanges}
      inline={inline}
      onClose={onClose}
    />
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Personalized Feed</h1>
        <button className="btn-outline lg:hidden" onClick={() => setIsCustomizeOpen(true)}>Customize</button>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar now hosts the full Customize panel inline on large screens */}
        <aside className="sticky top-24 hidden w-80 shrink-0 lg:block">
          <div className="card">
            <h3 className="section-title mb-4">Customize</h3>
            <CustomizePanelContent inline />
          </div>
        </aside>

        {/* Feed content */}
        <section className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-slate-600">{filteredItems.length} roles</div>
            <button className="btn-primary" onClick={() => setIsPostOpen(true)}>Post a job</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5">
                {/* Left accent bar */}
                <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-startx-500 to-accent-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.company}</p>
                    {item.location && (
                      <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                    )}
                  </div>
                  <span className="badge">Recommended</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))}
                  {typeof item.salaryLpa === 'number' && (
                    <span className="badge">₹{item.salaryLpa} LPA</span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={() => setActiveJob(item)}>Apply</button>
                    <button className="btn-outline">Save</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Customize Panel */}
      <AnimatePresence>
        {isCustomizeOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomizeOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl sm:rounded-l-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              aria-modal="true"
              role="dialog"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Customize your feed</h2>
                <button className="btn-outline" onClick={() => setIsCustomizeOpen(false)}>Close</button>
              </div>
              <CustomizePanelContent onClose={() => setIsCustomizeOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Apply preview modal */}
      <AnimatePresence>
        {activeJob && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveJob(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 grid place-items-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-100">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{activeJob.title}</h3>
                    <p className="text-sm text-slate-600">{activeJob.company}</p>
                    {activeJob.location && (
                      <p className="text-xs text-slate-500">{activeJob.location}</p>
                    )}
                  </div>
                  <button className="btn-outline" onClick={() => setActiveJob(null)}>Close</button>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {activeJob.tags.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))}
                  {typeof activeJob.salaryLpa === 'number' && (
                    <span className="badge">₹{activeJob.salaryLpa} LPA</span>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm text-slate-700">
                  {activeJob.description}
                </p>
                <div className="mt-5 flex gap-2">
                  <button className="btn-primary flex-1" onClick={async () => {
                    const applicantName = prompt('Your Name') || ''
                    const applicantEmail = prompt('Your Email') || ''
                    if (!applicantName || !applicantEmail) return
                    try {
                      await fetch(`${API_BASE}/api/jobs/${activeJob.id}/apply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicantName, applicantEmail }),
                      })
                      alert('Application submitted!')
                      setActiveJob(null)
                    } catch {}
                  }}>Proceed to application</button>
                  <button className="btn-outline" onClick={() => setActiveJob(null)}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Post a job Panel */}
      <AnimatePresence>
        {isPostOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl sm:rounded-l-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              aria-modal="true"
              role="dialog"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Post a job</h2>
                <button className="btn-outline" onClick={() => setIsPostOpen(false)}>Close</button>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  ;(async () => {
                    const payload = {
                      title: postData.title.trim(),
                      company: postData.company.trim(),
                      location: postData.location.trim(),
                      salaryLpa: Number(postData.salaryLpa),
                      workMode: postData.workMode,
                      type: postData.type,
                      experience: postData.experience,
                    }
                    try {
                      const res = await fetch(`${API_BASE}/api/jobs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                      if (res.ok) {
                        const j = await res.json()
                        const newItem = {
                          id: j.id,
                          title: j.title,
                          company: j.company,
                          location: j.location,
                          tags: [j.work_mode, j.type, j.experience],
                          salaryLpa: Number(j.salary_lpa),
                          description: 'New role posted via StartX.\nKey responsibilities shared in the application.\nCollaborative team and impact.\nCompetitive benefits and growth.',
                        }
                        setItems((prev) => [newItem, ...prev])
                        // Ensure the job is visible even if filters were restrictive
                        setWorkMode('Any')
                        setExperience('Any')
                        setSalaryRange('Any')
                      } else {
                        const msg = await res.text().catch(() => '')
                        alert('Failed to publish job. ' + (msg || 'Please try again.'))
                      }
                    } catch (err) {
                      console.error('Publish job error', err)
                      alert('Failed to publish job. Check your server and try again.')
                    }
                    setIsPostOpen(false)
                    setPostData({ title: '', company: '', location: '', workMode: 'Remote', type: 'Full‑time', experience: 'Junior', salaryLpa: 10 })
                  })()
                }}
              >
                <div>
                  <label className="label">Job title</label>
                  <input
                    className="input"
                    type="text"
                    required
                    value={postData.title}
                    onChange={(e) => setPostData((s) => ({ ...s, title: e.target.value }))}
                    placeholder="e.g., Frontend Engineer — React + Tailwind"
                  />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input
                    className="input"
                    type="text"
                    required
                    value={postData.company}
                    onChange={(e) => setPostData((s) => ({ ...s, company: e.target.value }))}
                    placeholder="e.g., Nebula Labs"
                  />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    className="input"
                    type="text"
                    required
                    value={postData.location}
                    onChange={(e) => setPostData((s) => ({ ...s, location: e.target.value }))}
                    placeholder="e.g., Remote — Global or City, Country"
                  />
                </div>

                <div>
                  <label className="label">Salary (LPA)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={postData.salaryLpa}
                    onChange={(e) => setPostData((s) => ({ ...s, salaryLpa: e.target.value }))}
                    placeholder="e.g., 12"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Work mode</label>
                    <select
                      className="input"
                      value={postData.workMode}
                      onChange={(e) => setPostData((s) => ({ ...s, workMode: e.target.value }))}
                    >
                      {['Remote', 'Hybrid', 'Onsite'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      className="input"
                      value={postData.type}
                      onChange={(e) => setPostData((s) => ({ ...s, type: e.target.value }))}
                    >
                      {['Full‑time', 'Part‑time', 'Contract', 'Internship', 'Temporary'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Experience</label>
                    <select
                      className="input"
                      value={postData.experience}
                      onChange={(e) => setPostData((s) => ({ ...s, experience: e.target.value }))}
                    >
                      {['Junior', 'Mid', 'Senior'].map((eLevel) => (
                        <option key={eLevel} value={eLevel}>{eLevel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="btn-primary w-full">Publish job</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


