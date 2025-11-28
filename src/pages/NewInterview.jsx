import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import InterviewLayout from '../components/InterviewLayout'

const NewInterview = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    company: '',
    jobRole: '',
    questionCount: '5-10',
    timeDuration: '15',
    level: 'moderate',
    interviewType: 'Technical',
    jobDescription: '',
    useSelfAssessment: false
  })
  const [selfAssessmentAnswers, setSelfAssessmentAnswers] = useState({})
  const [assessedLevel, setAssessedLevel] = useState(null)
  const [isAssessing, setIsAssessing] = useState(false)
  const [assessmentQuestions, setAssessmentQuestions] = useState([])
  const [loadingAssessment, setLoadingAssessment] = useState(false)

  // Load AI-generated assessment questions when entering step 2 with self-assessment selected
  React.useEffect(() => {
    const shouldLoad = currentStep === 2 && formData.level === 'self'
    if (!shouldLoad) return
    ;(async () => {
      try {
        setLoadingAssessment(true)
        const params = new URLSearchParams({
          role: formData.jobRole || 'javascript',
          type: (formData.interviewType || 'Technical').toLowerCase(),
          company: formData.company || '',
          description: formData.jobDescription || ''
        })
        const res = await fetch(`/api/interview/assessment?${params.toString()}`)
        const qs = await res.json()
        setAssessmentQuestions(Array.isArray(qs) ? qs : [])
        setSelfAssessmentAnswers({})
      } catch {
        setAssessmentQuestions([])
      } finally {
        setLoadingAssessment(false)
      }
    })()
  }, [currentStep, formData.level, formData.jobRole, formData.interviewType, formData.company, formData.jobDescription])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssessmentAnswer = (questionId, choiceIndex) => {
    setSelfAssessmentAnswers(prev => ({ ...prev, [questionId]: choiceIndex }))
  }

  const calculateLevel = () => {
    if (assessmentQuestions.length === 0) return null
    const answered = Object.keys(selfAssessmentAnswers).length
    if (answered !== assessmentQuestions.length) return null
    let score = 0
    let max = 0
    for (const q of assessmentQuestions) {
      const weight = Math.min(10, Math.max(1, q.difficulty || 3))
      max += weight
      const chosen = selfAssessmentAnswers[q.id]
      if (typeof chosen === 'number' && chosen === (q.correct ?? -1)) {
        score += weight
      }
    }
    const pct = max > 0 ? score / max : 0
    if (pct >= 0.7) return 'advanced'
    if (pct >= 0.4) return 'moderate'
    return 'simple'
  }

  const runSelfAssessment = async () => {
    setIsAssessing(true)
    await new Promise(r => setTimeout(r, 500))
    const calculated = calculateLevel()
    setAssessedLevel(calculated)
    setFormData(prev => ({ ...prev, level: calculated }))
    setIsAssessing(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const getQuestionCount = (range) => {
      switch(range){
        case '1-5': return Math.floor(Math.random()*5)+1
        case '5-10': return Math.floor(Math.random()*6)+5
        case '15-20': return Math.floor(Math.random()*6)+15
        case '20+': return Math.floor(Math.random()*10)+20
        default: return 5
      }
    }
    const questionCount = getQuestionCount(formData.questionCount)
    const candidateName = user?.fullName || user?.firstName || 'Anonymous'
    const candidateEmail = user?.primaryEmailAddress?.emailAddress || ''
    navigate('/interview-session', { state: { interviewParams: {
      role: formData.jobRole,
      experience: formData.level,
      mode: formData.interviewType,
      candidateName,
      questionCount,
      timeDuration: parseInt(formData.timeDuration),
      level: formData.level,
      email: candidateEmail,
      notes: formData.jobDescription,
      company: formData.company
    }}})
  }

  const getLevelDescription = (level) => {
    const descriptions = {
      simple: 'Beginner level - Basic concepts and simple problems',
      moderate: 'Intermediate level - Standard problems with some complexity',
      advanced: 'Advanced level - Complex problems requiring deep understanding'
    }
    return descriptions[level] || ''
  }

  const getLevelColor = (level) => {
    const colors = {
      simple: 'bg-green-100 text-green-800',
      moderate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-orange-100 text-orange-800'
    }
    return colors[level] || ''
  }

  return (
    <InterviewLayout>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Setup New Interview</h1>
          <p className="text-slate-600 mt-2">Configure your interview preferences and let AI adapt to your level</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4"><svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg><h2 className="text-lg font-medium">Basic Information</h2></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-white mb-1">Company Name *</label>
                    <input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Acme Corp" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label htmlFor="jobRole" className="block text-sm font-medium text-white mb-1">Job Role (applying) *</label>
                    <input id="jobRole" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Full‑Stack Developer" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>
                <div>
                  <label htmlFor="jobDescription" className="block text-sm font-medium text-white mb-1">Role Description / Skills</label>
                  <textarea id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows="3" placeholder="Tech stack, frameworks, responsibilities, things to manage..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"></textarea>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="questionCount" className="block text-sm font-medium text-white mb-1">Number of Questions *</label>
                    <select id="questionCount" name="questionCount" value={formData.questionCount} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <option value="1-5">1-5 questions (Quick)</option>
                      <option value="5-10">5-10 questions (Standard)</option>
                      <option value="15-20">15-20 questions (Comprehensive)</option>
                      <option value="20+">20+ questions (Intensive)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeDuration" className="block text-sm font-medium text-white mb-1">Interview Duration *</label>
                    <select id="timeDuration" name="timeDuration" value={formData.timeDuration} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20+ minutes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-white mb-1">Difficulty Level *</label>
                    <select id="level" name="level" value={formData.level} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <option value="simple">Beginner</option>
                      <option value="moderate">Moderate (Intermediate)</option>
                      <option value="advanced">Advanced (Senior)</option>
                      <option value="self">Self-assessment (AI)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="interviewType" className="block text-sm font-medium text-white mb-1">Interview Type *</label>
                    <select id="interviewType" name="interviewType" value={formData.interviewType} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  {formData.level === 'self' ? (
                    <button type="button" onClick={() => setCurrentStep(2)} className="btn-primary flex items-center gap-2" disabled={!formData.jobRole}>Start Self-Assessment<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z"/></svg></button>
                  ) : (
                    <button type="submit" className="btn-primary flex items-center gap-2" disabled={!formData.jobRole}>Start Interview<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2z"/></svg></button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4"><svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/></svg><h2 className="text-lg font-medium">Self Assessment</h2></div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><div className="flex items-start"><svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9z"/></svg><div><h3 className="text-sm font-medium text-blue-900">AI-Powered Level Assessment</h3><p className="text-sm text-blue-700 mt-1">Questions are tailored for {formData.jobRole || 'the role'} at {formData.company || 'the company'}.</p></div></div></div>
                {loadingAssessment ? (
                  <div className="flex items-center justify-center h-24 text-slate-300">Loading questions...</div>
                ) : (
                  <div className="space-y-6">{assessmentQuestions.map((q, idx) => (
                    <div key={q.id} className="border border-slate-600 rounded-lg p-4 bg-slate-800">
                      <h3 className="text-sm font-medium text-white mb-3">{idx+1}. {q.question}</h3>
                      <div className="space-y-2">
                        {(q.options || []).map((opt, i) => (
                          <label key={i} className="flex items-start">
                            <input type="radio" name={`question_${q.id}`} checked={selfAssessmentAnswers[q.id]===i} onChange={() => handleAssessmentAnswer(q.id, i)} className="mt-1 h-4 w-4 text-blue-600 border-slate-400 focus:ring-blue-500"/>
                            <span className="ml-3 text-sm text-white">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}</div>
                )}
                <div className="flex justify-between"><button type="button" onClick={() => setCurrentStep(1)} className="btn-secondary flex items-center gap-2"><svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z"/></svg>Back</button><button type="button" onClick={runSelfAssessment} disabled={Object.keys(selfAssessmentAnswers).length!==assessmentQuestions.length||isAssessing} className="btn-primary flex items-center gap-2">{isAssessing? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</>): (<>Analyze My Level<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z"/></svg></>)}
                </button></div>
                {assessedLevel && (<div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"><div className="flex items-center"><svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"/></svg><div><h3 className="text-sm font-medium text-green-900">Assessment Complete!</h3><p className="text-sm text-green-700 mt-1">Based on your responses, we recommend: <span className="font-medium capitalize">{assessedLevel}</span> level</p><p className="text-xs text-green-600 mt-1">{getLevelDescription(assessedLevel)}</p></div></div><div className="mt-3"><button type="button" onClick={() => setCurrentStep(3)} className="btn-primary text-sm">Continue to Review</button></div></div>)}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4"><svg className="h-5 w-5 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z"/><path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg><h2 className="text-lg font-medium">Review & Start Interview</h2></div>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Interview Configuration</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-medium text-slate-300">Company</label><p className="text-sm text-white">{formData.company}</p></div>
                    <div><label className="text-sm font-medium text-slate-300">Job Role</label><p className="text-sm text-white">{formData.jobRole}</p></div>
                    <div><label className="text-sm font-medium text-slate-300">Questions</label><p className="text-sm text-white">{formData.questionCount} questions</p></div>
                    <div><label className="text-sm font-medium text-slate-300">Duration</label><p className="text-sm text-white">{formData.timeDuration} minutes</p></div>
                    <div><label className="text-sm font-medium text-slate-300">Type</label><p className="text-sm text-white">{formData.interviewType}</p></div>
                    <div><label className="text-sm font-medium text-slate-300">Level</label><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(formData.level)}`}>{formData.level.charAt(0).toUpperCase()+formData.level.slice(1)}</span></div>
                  </div>
                  {formData.jobDescription && (<div className="mt-4"><label className="text-sm font-medium text-slate-300">Role Description / Skills</label><p className="text-sm text-white mt-1">{formData.jobDescription}</p></div>)}
                  {assessedLevel && (<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex items-center"><svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9z"/></svg><span className="text-sm text-blue-700"><strong>AI Recommendation:</strong> Level automatically adjusted to <span className="font-medium capitalize">{assessedLevel}</span> based on your self-assessment</span></div></div>)}
                </div>
                <div className="flex justify-between"><button type="button" onClick={() => setCurrentStep(2)} className="btn-secondary flex items-center gap-2"><svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z"/></svg>Back</button><button type="submit" className="btn-primary flex items-center gap-2 text-lg px-6 py-3"><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2z"/></svg>Start Interview</button></div>
              </div>
            )}
          </form>
        </div>
      </div>
    </InterviewLayout>
  )
}

export default NewInterview