import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTTS } from '../hooks/useTTS'
import { useSTT } from '../hooks/useSTT'
import { useAudioStream } from '../hooks/useAudioStream'
import usePerformanceTracking from '../hooks/usePerformanceTracking'
import InterviewerAvatar from './InterviewerAvatar'
import TranscriptPane from './TranscriptPane'
import QuestionPanel from './QuestionPanel'
import Recommendations from './Recommendations'
import InterviewSetupModal from './InterviewSetupModal'

const InterviewTwoPane = ({ role, mode, experience, candidateName, questionCount, timeDuration, level: difficultyLevel, email, notes, company }) => {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const [cameraFacingMode, setCameraFacingMode] = useState('user') // 'user' | 'environment'
	const [transcript, setTranscript] = useState([])
	const [question, setQuestion] = useState(null)
  const [sessionId, setSessionId] = useState(null)
	const [showQuestions, setShowQuestions] = useState(false)
	const [showCodeEditor, setShowCodeEditor] = useState(false)
	const [userCode, setUserCode] = useState('')
	const [cameraOn, setCameraOn] = useState(true)
    const [transcriptVisible, setTranscriptVisible] = useState(true)
    const [toast, setToast] = useState('')
	const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
	const [interviewEnded, setInterviewEnded] = useState(false)
	const [showSetup, setShowSetup] = useState(false)
	const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
	const { speaking, speak } = useTTS()
	const { listening, interim, results, start, stop } = useSTT()
	const [micDesiredOn, setMicDesiredOn] = useState(false)
	const { stream: micStream, error: micError } = useAudioStream(true)
	const [audioLevel, setAudioLevel] = useState(0)
	
	// Performance tracking
  const { 
		userLevel,
		updatePerformance,
		completeSession,
		getDifficultyRange,
		getStats,
		setUserLevel
	} = usePerformanceTracking('user123') // You can make this dynamic
	
	// Control microphone based on speaking state and user preference
	useEffect(() => {
		if (speaking && listening) {
			// AI is speaking - stop microphone to prevent recording AI's voice
			console.log('[Interview] AI is speaking, stopping microphone')
			stop()
		} else if (!speaking && micDesiredOn && !listening) {
			// AI finished speaking and user wants mic on - restart microphone
			console.log('[Interview] AI finished speaking, restarting microphone')
			setTimeout(() => {
				try {
					start()
				} catch (error) {
					console.error('[Interview] Error restarting microphone:', error)
				}
			}, 500) // Small delay to avoid overlap
		}
	}, [speaking, listening, micDesiredOn, start, stop])
	
	// Handle user toggling microphone on/off
	const toggleMic = () => {
		if (micDesiredOn) {
			// User wants to turn mic off
			console.log('[Interview] User turning mic off')
			setMicDesiredOn(false)
			if (listening) stop()
		} else {
			// User wants to turn mic on
			console.log('[Interview] User turning mic on')
			setMicDesiredOn(true)
			if (!speaking && !listening) {
				try {
					start()
				} catch (error) {
					console.error('[Interview] Error starting microphone:', error)
				}
			}
		}
	}

  // Start or restart camera with desired facing mode
  const startCamera = async (facing = 'user') => {
        try {
            // Stop any existing tracks first
            mediaStreamRef.current?.getTracks()?.forEach(t => t.stop())
            const constraints = {
                audio: true,
                video: {
                    facingMode: { ideal: facing },
                }
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            mediaStreamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            // Apply current cameraOn state
            stream.getVideoTracks().forEach(t => (t.enabled = cameraOn))
        } catch (e) {
            console.error('camera error', e)
        }
    }

    // Initialize camera on mount
    useEffect(() => {
        startCamera(cameraFacingMode)
        return () => {
            mediaStreamRef.current?.getTracks()?.forEach(t => t.stop())
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Re-attach stream whenever returning to cameras view
    useEffect(() => {
        if (!showQuestions && mediaStreamRef.current && videoRef.current) {
            try { videoRef.current.srcObject = mediaStreamRef.current } catch {}
        }
    }, [showQuestions])

    // Switch camera when facing mode changes
    useEffect(() => {
        startCamera(cameraFacingMode)
    }, [cameraFacingMode])

    // Toggle camera tracks when cameraOn changes
    useEffect(() => {
        if (!mediaStreamRef.current) return
        mediaStreamRef.current.getVideoTracks().forEach(t => (t.enabled = cameraOn))
    }, [cameraOn])

  // Initialize interview automatically with provided parameters
  useEffect(() => {
    if (!role || !mode || !experience) return
    
    (async () => {
      try {
        const res = await fetch('/api/interview/session', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            role, 
            mode, 
            experience,
            level: difficultyLevel || 'moderate',
            questionCount: questionCount || 5,
            timeDuration: timeDuration || 15,
            candidateName,
            email,
            notes,
            company
          }) 
        })
        const data = await res.json()
        const sid = data.sessionId || `boot-${Date.now()}`
        setSessionId(sid)
        
        // Set timer based on provided time duration
        setTimeLeft(parseInt(timeDuration || 15) * 60)
        
        // Add welcome message and intro question first
        const welcomeMessage = candidateName 
          ? `Hello ${candidateName}! Welcome to your ${role} interview. I'm your AI interviewer and I'll be asking you questions about ${mode.toLowerCase()} topics. Let's begin!`
          : `Hello! Welcome to your ${role} interview. I'm your AI interviewer and I'll be asking you questions about ${mode.toLowerCase()} topics. Let's begin!`
        
        setTranscript([{ speaker: 'interviewer', text: welcomeMessage }])
        speak(welcomeMessage)

        // Start with an introduction prompt before technical questions
        setQuestion({ id: 'intro-1', type: 'text', prompt: `To begin, please introduce yourself and share a quick overview of your background. Also briefly summarize your experience relevant to ${role} at ${company || 'the company'}, referencing ${notes ? 'the role description provided' : 'the job description'}.` })
        // Don't auto-start microphone - user must click to enable
        setMicDesiredOn(false)
      } catch (e) {
        console.error('Error initializing interview:', e)
        setSessionId(`boot-${Date.now()}`)
        setQuestion({ id: 'intro-1', type: 'text', prompt: 'Hello! Welcome to the interview. Please introduce yourself and tell me about your background.' })
        setMicDesiredOn(false)
      }
    })()
  }, [role, mode, experience, difficultyLevel, questionCount, timeDuration, candidateName, email, notes, speak])

  const getNextQuestion = async (sessionId, level) => {
    setLoading(true)
    setError(null)
    try {
      const stats = getStats()
      const recentAccuracy = stats?.recentPerformance?.length > 0 
        ? stats.recentPerformance.reduce((sum, session) => sum + (session.performance.correct / session.performance.total), 0) / stats.recentPerformance.length
        : undefined
      
      const queryParams = new URLSearchParams({
        role,
        level,
        ...(recentAccuracy !== undefined && { recentAccuracy: recentAccuracy.toString() })
      })
      
      console.log('Fetching question with params:', { sessionId, role, level, recentAccuracy })
      const res = await fetch(`/api/interview/session/${sessionId}/next?${queryParams}`)
			
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`)
      }
			
      const questionData = await res.json()
      console.log('Received question data:', questionData)
			
      if (!questionData || !questionData.id) {
        throw new Error('Invalid question data received')
      }
			
      setQuestion(questionData)
    } catch (e) {
      console.error('Error fetching next question:', e)
      setError(e.message)
			// Set a fallback question if API fails
      setQuestion({ 
				id: 'fallback-1',
        type: 'text', 
				question: 'Tell me about yourself and your experience with programming.',
				prompt: 'Please introduce yourself and describe your programming background.'
      })
    } finally {
      setLoading(false)
    }
  }

	// Timer countdown
	useEffect(() => {
		if (interviewEnded) return
		const timer = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					setInterviewEnded(true)
					setTranscript(t => [...t, { speaker: 'interviewer', text: 'Thank you for your time. The interview has ended. We will review your responses and get back to you soon.' }])
					speak('Thank you for your time. The interview has ended. We will review your responses and get back to you soon.')
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(timer)
	}, [interviewEnded, speak])

	useEffect(() => {
		if (!micStream) return
		let rafId
		const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
		const source = audioCtx.createMediaStreamSource(micStream)
		const analyser = audioCtx.createAnalyser()
		analyser.fftSize = 2048
		source.connect(analyser)
		const data = new Uint8Array(analyser.fftSize)
		const tick = () => {
			analyser.getByteTimeDomainData(data)
			let sum = 0
			for (let i = 0; i < data.length; i++) {
				const v = (data[i] - 128) / 128
				sum += v * v
			}
			const rms = Math.sqrt(sum / data.length)
			setAudioLevel(Math.min(1, rms * 4))
			rafId = requestAnimationFrame(tick)
		}
		tick()
		return () => {
			if (rafId) cancelAnimationFrame(rafId)
			try { source.disconnect(); analyser.disconnect(); audioCtx.close() } catch {}
		}
	}, [micStream])

  // Prevent TTS voice from being captured by STT: pause mic while speaking
  useEffect(() => {
    if (speaking && listening) {
      try { stop() } catch {}
    } else if (!speaking && micDesiredOn && !listening) {
      try { start() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking])

	const handleSubmit = async (payload, skipTranscript = false) => {
		if (interviewEnded) return
		const userText = payload.text || (payload.code ? '[Code submitted]' : '')
		if (userText && !skipTranscript) setTranscript((t) => [...t, { speaker: 'user', text: userText }])
		
		// Track performance for MCQ questions
		if (question?.type === 'mcq' && payload.choice !== undefined) {
			const isCorrect = payload.choice === question.correct
			updatePerformance(question, isCorrect, 0) // 0 time for now
		}
		
		try {
			const res = await fetch(`/api/interview/session/${sessionId || 'boot'}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
					text: payload.text || '', 
					code: payload.code || '', 
					questionId: payload.questionId, 
          role,
					experience,
					level: userLevel
        })
      })
        const data = await res.json()
			if (data?.reply) {
				setTranscript((t) => [...t, { speaker: 'interviewer', text: data.reply }])
          speak(data.reply)
        }
		} catch (e) {
			console.error('API error:', e)
			setTranscript((t) => [...t, { speaker: 'interviewer', text: 'Sorry, there was an error processing your response. Please try again.' }])
		}
		
		// Get next question after a short delay
		setTimeout(async () => {
			try {
      await getNextQuestion(sessionId, userLevel)
			} catch {}
		}, 2000)
	}

	useEffect(() => {
		if (!results || results.length === 0) return
		const last = results[results.length - 1]
		setTranscript((t) => [...t, last])
		handleSubmit({ questionId: question?.id, text: last.text }, true) // skipTranscript = true
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [results])

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const handleStartInterview = (config) => {
		setInterviewConfig(config)
		setShowSetup(false)
	}

	const handleEndInterview = async () => {
        if (!sessionId) return
        
        // Show loading state
        setLoading(true)
        openToast('Generating AI feedback...')
        
        try {
            // Get AI-generated feedback from backend
            const response = await fetch(`http://localhost:5174/api/interview/session/${sessionId}/ai-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    transcript: transcript.map(t => `${t.speaker}: ${t.text}`).join('\n'),
                    role,
                    experience,
                    duration: timeDuration || 30
                })
            })
            
            const data = await response.json()
            
            if (data.feedback) {
                setFeedback({
                    type: 'detailed',
                    aiFeedback: data.feedback,
                    score: data.score || 0,
                    strengths: data.strengths || [],
                    improvements: data.improvements || [],
                    summary: data.summary || ''
                })
            } else {
                // Fallback if AI fails
                const result = completeSession()
                setFeedback(result?.feedback || { 
                    type: 'good', 
                    message: 'Interview ended.', 
                    details: 'Thanks for participating. Your responses have been recorded.' 
                })
            }
        } catch (error) {
            console.error('Error getting AI feedback:', error)
            const result = completeSession()
            setFeedback(result?.feedback || { 
                type: 'good', 
                message: 'Interview ended.', 
                details: 'Thanks for participating.' 
            })
        } finally {
            setLoading(false)
            setInterviewEnded(true)
        }
    }

  const openToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

	return (
		<div className="flex h-full bg-gradient-to-br from-[#0A0F1C] via-[#111827] to-[#0A0F1C] text-slate-100">
			{/* Setup Modal */}
			<InterviewSetupModal
				isOpen={showSetup}
				onClose={() => setShowSetup(false)}
				onStart={handleStartInterview}
				userLevel={userLevel}
			/>

			{/* Feedback Modal */}
			{feedback && (
				<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
						{feedback.type === 'detailed' ? (
							<>
								{/* AI-Generated Detailed Feedback */}
								<div className="text-center mb-6">
									<h3 className="text-3xl font-bold text-slate-100 mb-2">Interview Complete! 🎉</h3>
									<p className="text-slate-400">Here's your comprehensive performance analysis</p>
								</div>

								{/* Score Display */}
								<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 mb-6 text-center">
									<div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
										{feedback.score}/100
									</div>
									<p className="text-slate-300 text-lg">Overall Performance Score</p>
								</div>

								{/* Summary */}
								<div className="bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-700">
									<h4 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-400">
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
										</svg>
										Summary
									</h4>
									<p className="text-slate-300 leading-relaxed">{feedback.summary}</p>
								</div>

								{/* Strengths */}
								<div className="bg-green-900/10 border border-green-500/30 rounded-xl p-5 mb-6">
									<h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
										</svg>
										What You Did Well
									</h4>
									<ul className="space-y-2">
										{feedback.strengths?.map((strength, idx) => (
											<li key={idx} className="flex items-start gap-2 text-slate-300">
												<span className="text-green-400 mt-1">✓</span>
												<span>{strength}</span>
											</li>
										))}
									</ul>
								</div>

								{/* Areas for Improvement */}
								<div className="bg-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 mb-6">
									<h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
										</svg>
										Areas to Improve
									</h4>
									<ul className="space-y-2">
										{feedback.improvements?.map((improvement, idx) => (
											<li key={idx} className="flex items-start gap-2 text-slate-300">
												<span className="text-yellow-400 mt-1">→</span>
												<span>{improvement}</span>
											</li>
										))}
									</ul>
								</div>

								{/* Detailed Feedback */}
								<div className="bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-700">
									<h4 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-purple-400">
											<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
										</svg>
										Detailed Analysis
									</h4>
									<p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{feedback.aiFeedback}</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 justify-end">
									<button
										onClick={() => navigate('/interview-dashboard')}
										className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
									>
										Back to Dashboard
									</button>
								</div>
							</>
						) : (
							<>
								{/* Fallback Simple Feedback */}
								<h3 className="text-xl font-bold text-slate-100 mb-4">Interview Complete!</h3>
								<div className={`p-4 rounded-lg mb-4 ${
									feedback.type === 'level_change' ? 'bg-green-900/20 border border-green-500' :
									feedback.type === 'excellent' ? 'bg-blue-900/20 border border-blue-500' :
									feedback.type === 'good' ? 'bg-yellow-900/20 border border-yellow-500' :
									'bg-red-900/20 border border-red-500'
								}`}>
									<p className="text-slate-100 font-medium">{feedback.message}</p>
									<p className="text-slate-300 text-sm mt-2">{feedback.details}</p>
								</div>
								<div className="flex justify-end space-x-3">
									<button
										onClick={() => navigate('/interview-dashboard')}
										className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
									>
										Back to Dashboard
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{!showSetup && (
				<div className="flex-1 flex flex-col">
					{/* Timer Display */}
					<div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl px-8 py-3 rounded-full border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20">
						<div className="flex items-center gap-3">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-400">
								<path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
							</svg>
							<span className={`text-xl font-mono font-bold tracking-wider ${timeLeft < 60 ? 'text-red-400 animate-pulse' : timeLeft < 300 ? 'text-yellow-400' : 'text-blue-300'}`}>
								{formatTime(timeLeft)}
							</span>
						</div>
					</div>
					{/* Main Content Area */}
					<div className="flex-1 flex pb-32 pt-20 max-h-screen overflow-hidden">
						{!showQuestions ? (
							<div className="flex-1 flex gap-6 p-6 min-h-0 max-h-full overflow-hidden">
								{/* Left Column - AI Interviewer & Transcript */}
								<div className="w-[70%] flex flex-col gap-6 min-h-0 max-h-full">
									{/* AI Interviewer Card */}
									<div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-700/30 h-[250px] flex-shrink-0">
										<div className="absolute top-6 left-6 z-10 flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
													<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
												</svg>
											</div>
											<div>
												<div className="text-sm font-semibold text-white">AI Interviewer</div>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
													<span className="text-xs text-green-400">Active</span>
												</div>
											</div>
										</div>
										<div className="flex items-center justify-center h-full">
											<InterviewerAvatar speaking={speaking} level={audioLevel} />
										</div>
										{listening && (
											<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
												<div className="w-1 h-8 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
												<div className="w-1 h-12 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '100ms'}}></div>
												<div className="w-1 h-6 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
												<div className="w-1 h-10 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
												<div className="w-1 h-7 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
											</div>
										)}
									</div>
									{/* Transcript Card */}
									<div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-700/30 flex-1 min-h-0 flex flex-col overflow-hidden">
										<div className="flex items-center gap-2 mb-4">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-400">
												<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
												<circle cx="8" cy="10" r="1.5"/>
												<circle cx="12" cy="10" r="1.5"/>
												<circle cx="16" cy="10" r="1.5"/>
											</svg>
											<h3 className="text-sm font-semibold text-slate-200">Conversation</h3>
										</div>
										<div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
											{transcript.map((item, i) => (
												<div key={i} className={`flex ${item.speaker === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
													<div className={`max-w-[80%] rounded-2xl px-4 py-3 ${item.speaker === 'interviewer' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' : 'bg-purple-600/20 border border-purple-500/30 text-purple-100'}`}>
														<div className="text-xs font-medium mb-1 opacity-70">{item.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}</div>
														<div className="text-sm leading-relaxed">{item.text}</div>
													</div>
												</div>
											))}
											{interim && (
												<div className="flex justify-end">
													<div className="max-w-[80%] rounded-2xl px-4 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-200">
														<div className="text-xs font-medium mb-1 opacity-70">You (typing...)</div>
														<div className="text-sm leading-relaxed opacity-60">{interim}</div>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
								{/* Right Column - Camera */}
								<div className="w-[40%] flex flex-col">
									<div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-700/30 h-full overflow-hidden">
										<div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-full">
											<div className={`w-2 h-2 rounded-full ${cameraOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
											<span className="text-xs font-medium text-slate-200">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
										</div>
										<div className="relative rounded-2xl h-full overflow-hidden bg-slate-900/50">
											<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
											{listening && (
												<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
													<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
													<span className="text-xs font-semibold text-white">Recording</span>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="flex-1 flex">
								<div className="w-1/2 flex flex-col gap-4 p-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="bg-slate-800 rounded-lg p-4">
											<div className="text-sm text-slate-400 mb-2">AI Interviewer</div>
											<InterviewerAvatar speaking={speaking} level={audioLevel} />
										</div>
										<div className="bg-slate-800 rounded-lg p-4">
											<div className="text-sm text-slate-400 mb-2">Your Camera</div>
											<div className="relative bg-slate-700 rounded-lg h-32 flex items-center justify-center">
												<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
											</div>
										</div>
									</div>
									<div className="flex-1 bg-slate-800 rounded-lg p-4">
										<TranscriptPane items={transcript} interim={interim} />
									</div>
								</div>
								<div className="w-1/2 p-4">
									<div className="bg-slate-800 rounded-lg p-4 h-full">
										{loading && (
											<div className="flex items-center justify-center h-32">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
												<span className="ml-3 text-white">Loading question...</span>
											</div>
										)}
										{error && (
											<div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
												<p className="text-red-300 text-sm">Error: {error}</p>
												<button onClick={() => getNextQuestion(sessionId, userLevel)} className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">Retry</button>
											</div>
										)}
										{!loading && <QuestionPanel question={question} onSubmit={handleSubmit} />}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Floating controls */}
					<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
						<div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/50 backdrop-blur-xl px-4 py-3 rounded-full shadow-2xl">
							<button onClick={() => setCameraOn(v => !v)} className={`px-4 h-11 rounded-full text-[10px] font-medium flex items-center gap-2 border transition-all duration-200 hover:scale-105 ${cameraOn ? 'bg-blue-600/90 border-blue-400/40 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700/80 border-slate-600/40 text-slate-300 hover:bg-slate-600/80'}`}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M15 10.25V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.25l4 2V8.25l-4 2Z"/></svg>
								<span>{cameraOn ? 'Camera On' : 'Camera Off'}</span>
							</button>
							<button onClick={toggleMic} className={`px-4 h-11 rounded-full text-[10px] font-medium flex items-center gap-2 border transition-all duration-200 hover:scale-105 ${micDesiredOn ? 'bg-emerald-600/90 border-emerald-400/40 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-600/90 border-rose-400/40 text-white shadow-lg shadow-rose-500/20'}`}>
							{micDesiredOn ? (
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 14 0h-2Z"/></svg>
							) : (
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 11h-2a5 5 0 0 1-8.58 3.53l1.42-1.42A3 3 0 0 0 14 11H5a7 7 0 0 0 12 0Zm-6-8a3 3 0 0 1 3 3v2.59l-5.59 5.6A3 3 0 0 1 8 11V6a3 3 0 0 1 3-3Zm-8.73.27L3 4.54 19.46 21l1.27-1.27-2.44-2.44A6.97 6.97 0 0 0 19 11h-2c0 .5-.07.98-.2 1.44L4.27 3.27Z"/></svg>
							)}
							<span>{micDesiredOn ? 'Mic On' : 'Mic Off'}</span>
						</button>
							<button onClick={() => setShowCodeEditor(!showCodeEditor)} className={`px-4 h-11 rounded-full text-[10px] font-medium flex items-center gap-2 border transition-all duration-200 hover:scale-105 ${showCodeEditor ? 'bg-purple-600/90 border-purple-400/40 text-white shadow-lg shadow-purple-500/20' : 'border-purple-400/40 bg-purple-600/70 text-white shadow-lg shadow-purple-500/20'}`}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8.59 16.59 4 12l4.59-4.59L10 8.83 6.83 12 10 15.17l-1.41 1.42Zm6.82 0L14 15.17 17.17 12 14 8.83l1.41-1.42L20 12l-4.59 4.59Z"/></svg>
								<span>Code Editor</span>
							</button>
							<button onClick={toggleFullscreen} className="px-4 h-11 rounded-full text-[10px] font-medium flex items-center gap-2 border border-slate-600/40 bg-slate-700/80 text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-slate-600/80">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M3 3h7v2H5v5H3V3Zm16 0h2v7h-2V5h-5V3h5ZM3 14h2v5h5v2H3v-7Zm16 5v-5h2v7h-7v-2h5Z"/></svg>
								<span>Fullscreen</span>
							</button>
							<button onClick={handleEndInterview} className="px-4 h-11 rounded-full text-[10px] font-medium flex items-center gap-2 border border-rose-400/40 bg-rose-600/90 text-white shadow-lg shadow-rose-500/20 transition-all duration-200 hover:scale-105">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M3.8 8.1C6.5 6.9 9.2 6 12 6s5.5.9 8.2 2.1c.5.2.8.7.8 1.2v2.6c0 .9-1 1.5-1.8 1.2-1.5-.5-3.5-1.1-5.2-1.1s-3.7.6-5.2 1.1c-.8.3-1.8-.3-1.8-1.2V9.3c0-.5.3-1 .8-1.2Z"/></svg>
								<span>End</span>
							</button>
						</div>
					</div>

					{toast && (
						<div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl text-slate-100 shadow-2xl text-sm font-medium animate-fade-in">{toast}</div>
					)}

					{/* Code Editor Modal */}
					{showCodeEditor && (
						<div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
							<div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
								{/* Header */}
								<div className="flex items-center justify-between p-4 border-b border-slate-700">
									<div className="flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-purple-400">
											<path d="M8.59 16.59 4 12l4.59-4.59L10 8.83 6.83 12 10 15.17l-1.41 1.42Zm6.82 0L14 15.17 17.17 12 14 8.83l1.41-1.42L20 12l-4.59 4.59Z"/>
										</svg>
										<h3 className="text-lg font-semibold text-slate-100">Code Editor</h3>
									</div>
									<button onClick={() => setShowCodeEditor(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
											<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
										</svg>
									</button>
								</div>
								{/* Code Editor */}
								<div className="flex-1 p-4 overflow-hidden">
									<textarea
										value={userCode}
										onChange={(e) => setUserCode(e.target.value)}
										placeholder="Write your code here..."
										className="w-full h-full bg-slate-950 text-slate-100 font-mono text-sm p-4 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
										spellCheck="false"
									/>
								</div>
								{/* Footer */}
								<div className="flex items-center justify-between p-4 border-t border-slate-700">
									<div className="text-xs text-slate-400">
										Tip: Write your solution and explain it to the interviewer
									</div>
									<button 
										onClick={async () => {
											if (userCode.trim()) {
												// Add code to transcript
												setTranscript(prev => [...prev, { speaker: 'you', text: `Here's my code:\n\`\`\`\n${userCode}\n\`\`\`` }])
												openToast('Sending code to AI for review...')
												setShowCodeEditor(false)
												
												// Send code to AI for analysis
												try {
													console.log('[Code Submit] Sending code for analysis:', { code: userCode.substring(0, 50), role, experience })
													const response = await fetch(`http://localhost:5174/api/interview/analyze-code`, {
														method: 'POST',
														headers: { 'Content-Type': 'application/json' },
														credentials: 'include',
														body: JSON.stringify({
															code: userCode,
															role,
															experience,
															sessionId,
															previousContext: transcript.slice(-5).map(t => `${t.speaker}: ${t.text}`).join('\n')
														})
													})
													
													if (!response.ok) {
														console.error('[Code Submit] Server error:', response.status)
														throw new Error(`Server returned ${response.status}`)
													}
													
													const data = await response.json()
													console.log('[Code Submit] Received feedback:', JSON.stringify(data, null, 2))
													console.log('[Code Submit] Feedback text:', data.feedback)
													
													if (data.feedback) {
														setTranscript(prev => [...prev, { speaker: 'interviewer', text: data.feedback }])
														speak(data.feedback)
														openToast('Code analyzed successfully!')
													} else {
														console.error('[Code Submit] No feedback in response')
														openToast('No feedback received')
													}
												} catch (error) {
													console.error('[Code Submit] Error analyzing code:', error)
													openToast('Failed to analyze code - check console')
													// Add fallback response
													const fallbackMsg = "Thank you for sharing your code. Can you walk me through your logic and explain the time complexity?"
													setTranscript(prev => [...prev, { speaker: 'interviewer', text: fallbackMsg }])
													speak(fallbackMsg)
												}
											}
										}}
										className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
									>
										Submit Code
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default InterviewTwoPane
