import React, { useMemo, useRef, useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Resume() {
  const { openAuthModal } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    // Step 0 — Basics
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    // Step 1 — Experience
    experiences: [
      { company: '', role: '', start: '', end: '', details: '' },
    ],
    // Step 2 — Education
    education: [
      { school: '', degree: '', year: '' },
    ],
    // Step 3 — Skills
    skills: '',
  })

  const previewRef = useRef(null)

  const addExperience = () => {
    setForm((s) => ({
      ...s,
      experiences: [...s.experiences, { company: '', role: '', start: '', end: '', details: '' }],
    }))
  }

  const addEducation = () => {
    setForm((s) => ({ ...s, education: [...s.education, { school: '', degree: '', year: '' }] }))
  }

  const handlePrint = () => {
    if (!previewRef.current) return
    const html = previewRef.current.innerHTML
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume</title>
          <style>
            @page { size: A4; margin: 24pt; }
            body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; }
            h1 { font-size: 20pt; margin: 0; }
            h2 { font-size: 13pt; margin: 0 0 6pt 0; }
            h3 { font-size: 12pt; margin: 0 0 4pt 0; }
            p, li { font-size: 10pt; line-height: 1.45; }
            .text-slate-500, .text-slate-600, .text-slate-700, .text-slate-800, .text-slate-900 { color: #111 !important; }
            .border-slate-200 { border-color: #000 !important; }
            .pb-3 { padding-bottom: 8pt !important; }
            .mt-1 { margin-top: 4pt !important; }
            .mt-2 { margin-top: 8pt !important; }
            .mt-4 { margin-top: 12pt !important; }
            .space-y-5 > * + * { margin-top: 12pt !important; }
            .badge, .btn-primary, .btn-outline { display: none !important; }
          </style>
        </head>
        <body>
          <div>${html}</div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const tabs = useMemo(() => ['Basics', 'Experience', 'Education', 'Skills'], [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Build Your Resume</h1>
      </div>

      <div className="mb-6">
        <SegmentedTabs tabs={tabs} value={step} onChange={setStep} fitToLabel />
      </div>

      {/* Form/Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} placeholder="e.g., Jordan Patel" />
              </div>
              <div>
                <label className="label">Headline / Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g., Frontend Engineer" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="(+91) 00000 00000" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} placeholder="City, Country" />
                </div>
              </div>
              <div>
                <label className="label">Professional Summary</label>
                <textarea className="input" rows={4} value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} placeholder="2–3 lines that highlight your strengths and impact." />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {form.experiences.map((exp, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Company</label>
                      <input className="input" value={exp.company} onChange={(e) => setForm((s) => { const list=[...s.experiences]; list[idx].company=e.target.value; return { ...s, experiences: list } })} />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <input className="input" value={exp.role} onChange={(e) => setForm((s) => { const list=[...s.experiences]; list[idx].role=e.target.value; return { ...s, experiences: list } })} />
                    </div>
                    <div>
                      <label className="label">Start</label>
                      <input className="input" value={exp.start} onChange={(e) => setForm((s) => { const list=[...s.experiences]; list[idx].start=e.target.value; return { ...s, experiences: list } })} />
                    </div>
                    <div>
                      <label className="label">End</label>
                      <input className="input" value={exp.end} onChange={(e) => setForm((s) => { const list=[...s.experiences]; list[idx].end=e.target.value; return { ...s, experiences: list } })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="label">Key achievements</label>
                    <textarea className="input" rows={3} value={exp.details} onChange={(e) => setForm((s) => { const list=[...s.experiences]; list[idx].details=e.target.value; return { ...s, experiences: list } })} placeholder="Use action verbs and quantify impact where possible." />
                  </div>
                </div>
              ))}
              <button className="btn-outline" onClick={addExperience}>Add another experience</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {form.education.map((ed, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="label">School</label>
                      <input className="input" value={ed.school} onChange={(e) => setForm((s) => { const list=[...s.education]; list[idx].school=e.target.value; return { ...s, education: list } })} />
                    </div>
                    <div>
                      <label className="label">Degree</label>
                      <input className="input" value={ed.degree} onChange={(e) => setForm((s) => { const list=[...s.education]; list[idx].degree=e.target.value; return { ...s, education: list } })} />
                    </div>
                    <div>
                      <label className="label">Year</label>
                      <input className="input" value={ed.year} onChange={(e) => setForm((s) => { const list=[...s.education]; list[idx].year=e.target.value; return { ...s, education: list } })} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn-outline" onClick={addEducation}>Add another education</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="label">Skills (comma-separated)</label>
                <input className="input" value={form.skills} onChange={(e) => setForm((s) => ({ ...s, skills: e.target.value }))} placeholder="React, Node.js, Tailwind, SQL" />
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="mt-6 flex items-center justify-between">
              <button className="btn-outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
              <button className="btn-primary" onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="card" ref={previewRef}>
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900">{form.fullName || 'Full Name'}</h2>
            <p className="text-sm text-slate-600">{form.title || 'Job Title'}</p>
            <p className="mt-1 text-xs text-slate-500">{[form.email, form.phone, form.location].filter(Boolean).join(' • ') || 'email@example.com • (+91) 00000 00000 • City, Country'}</p>
          </div>

          <div className="mt-4 space-y-5">
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{form.summary || 'Experienced professional with a track record of delivering results.'}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-700">Experience</h3>
              <div className="mt-2 space-y-3">
                {form.experiences.map((exp, idx) => (
                  <div key={idx}>
                    <p className="text-sm font-medium text-slate-900">{exp.role || 'Role'} — <span className="text-slate-700">{exp.company || 'Company'}</span></p>
                    <p className="text-xs text-slate-500">{[exp.start || 'Start', exp.end || 'Present'].filter(Boolean).join(' – ')}</p>
                    <p className="mt-1 text-sm text-slate-800 whitespace-pre-line">{exp.details || 'Describe your impact and key achievements.'}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-700">Education</h3>
              <div className="mt-2 space-y-2">
                {form.education.map((ed, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-slate-900">{ed.school || 'School'}</span> — {ed.degree || 'Degree'} ({ed.year || 'Year'})
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-700">Skills</h3>
              <p className="mt-1 text-sm text-slate-800">{(form.skills || 'React, Tailwind, Node.js, SQL')}</p>
            </section>
          </div>
        </div>
      </div>

      {/* Download button under the main content - black & white */}
      <div className="mt-6">
        <button
          onClick={() => openAuthModal('signin')}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 font-medium text-white transition hover:bg-black/90"
        >
          Download PDF
        </button>
      </div>
    </div>
  )
}


