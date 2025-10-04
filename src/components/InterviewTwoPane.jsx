import React, { useEffect, useRef, useState } from 'react'
import { useTTS } from '../hooks/useTTS'
import { useSTT } from '../hooks/useSTT'
import { useAudioStream } from '../hooks/useAudioStream'
import usePerformanceTracking from '../hooks/usePerformanceTracking'
import InterviewerAvatar from './InterviewerAvatar'
import TranscriptPane from './TranscriptPane'
import QuestionPanel from './QuestionPanel'
import Recommendations from './Recommendations'
import InterviewSetupModal from './InterviewSetupModal'

const InterviewTwoPane = ({ role, mode, experience, candidateName, questionCount, timeDuration, level: difficultyLevel, email, notes }) => {
	const videoRef = useRef(null)
	const [transcript, setTranscript] = useState([])
	const [question, setQuestion] = useState(null)
  const [sessionId, setSessionId] = useState(null)
	const [showQuestions, setShowQuestions] = useState(true)
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

  useEffect(() => {
		(async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				if (videoRef.current) videoRef.current.srcObject = stream
			} catch (e) {
				console.error('camera error', e)
			}
		})()
	}, [])

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
            notes
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
        
        setTranscript([{ speaker: 'ai', text: welcomeMessage }])
        speak(welcomeMessage)

        // Start with an introduction prompt before technical questions
        setQuestion({ id: 'intro-1', type: 'text', prompt: 'To begin, please introduce yourself and share a quick overview of your background.' })
      } catch (e) {
        console.error('Error initializing interview:', e)
        setSessionId(`boot-${Date.now()}`)
        setQuestion({ id: 'intro-1', type: 'text', prompt: 'Hello! Welcome to the interview. Please introduce yourself and tell me about your background.' })
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
					setTranscript(t => [...t, { speaker: 'ai', text: 'Thank you for your time. The interview has ended. We will review your responses and get back to you soon.' }])
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
				setTranscript((t) => [...t, { speaker: 'ai', text: data.reply }])
          speak(data.reply)
        }
		} catch (e) {
			console.error('API error:', e)
			setTranscript((t) => [...t, { speaker: 'ai', text: 'Sorry, there was an error processing your response. Please try again.' }])
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

	const handleEndInterview = () => {
		if (sessionId) {
			const result = completeSession()
			if (result) {
				setFeedback(result.feedback)
    } else {
				setFeedback({ type: 'good', message: 'Interview ended.', details: 'Thanks for participating. Your responses have been recorded.' })
			}
			setInterviewEnded(true)
		}
	}

	return (
		<div className="flex h-full bg-slate-900 text-slate-100">
			{/* Setup Modal */}
			<InterviewSetupModal
				isOpen={showSetup}
				onClose={() => setShowSetup(false)}
				onStart={handleStartInterview}
				userLevel={userLevel}
			/>

			{/* Feedback Modal */}
			{feedback && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
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
								onClick={() => {
									setFeedback(null)
									setShowSetup(true)
									setInterviewEnded(false)
									setTranscript([])
									setQuestion(null)
									setSessionId(null)
									setTimeLeft(30 * 60)
								}}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
							>
								Start New Interview
							</button>
							<button
								onClick={() => setFeedback(null)}
								className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
							>
								Close
							</button>
          </div>
          </div>
        </div>
			)}

			{!showSetup && (
				<div className="flex-1 flex flex-col">
					{/* Timer and Controls */}
					<div className="flex justify-between items-center p-4 bg-slate-800">
						<div className="flex items-center gap-4">
							<div className="text-lg font-semibold">
								Time Remaining: <span className={timeLeft < 300 ? 'text-red-400' : 'text-green-400'}>{formatTime(timeLeft)}</span>
							</div>
							<div className="text-sm text-slate-400">
								Level: <span className="text-blue-400 capitalize">{userLevel}</span>
							</div>
						</div>
						<div className="flex gap-2">
          <button
                onClick={() => setShowQuestions(!showQuestions)}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
							>
								{showQuestions ? '← Back to Cameras' : 'Questions →'}
          </button>
          <button
                onClick={() => {
                  if (listening) { setMicDesiredOn(false); stop() } else { setMicDesiredOn(true); start() }
                }} 
								className={`px-4 py-2 rounded-lg ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
							>
								{listening ? 'Stop Mic' : 'Start Mic'}
          </button>
          <button
								onClick={handleEndInterview}
								className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg"
							>
								End Interview
          </button>
        </div>
      </div>

					{/* Main Content Area */}
					<div className="flex-1 flex">
						{!showQuestions ? (
							/* Two Camera View */
							<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
								{/* AI Interviewer Camera */}
								<div className="bg-slate-800 rounded-lg p-4">
									<div className="text-sm text-slate-400 mb-2">AI Interviewer</div>
						<InterviewerAvatar speaking={speaking} level={audioLevel} />
									<div className="mt-3 h-48 bg-slate-800 rounded flex items-center justify-center text-slate-400">
										{micError ? (
											<p className="text-sm">Microphone blocked. Allow mic access in the browser.</p>
										) : (
											<div className="w-48 h-24 bg-slate-900 border border-slate-700 rounded flex items-end p-2">
								<div style={{ height: `${Math.max(8, audioLevel * 100)}%` }} className="w-full bg-sky-500/70 transition-all duration-100 rounded" />
											</div>
										)}
									</div>
								</div>
								
								{/* User Camera */}
								<div className="bg-slate-800 rounded-lg p-4">
									<div className="text-sm text-slate-400 mb-2">Your Camera</div>
									<div className="relative bg-slate-700 rounded-lg h-64 flex items-center justify-center">
										<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
										{micError && <div className="absolute top-2 left-2 text-red-400 text-xs">Mic error: {micError}</div>}
          </div>
        </div>

							{/* Transcript under cameras */}
        <div className="lg:col-span-2">
								<div className="bg-slate-800 rounded-lg p-4">
									<TranscriptPane items={transcript} interim={interim} />
								</div>
							</div>
							</div>
						) : (
							/* Questions View */
							<div className="flex-1 flex">
								{/* Left Side - Cameras and Transcript */}
								<div className="w-1/2 flex flex-col gap-4 p-4">
									<div className="grid grid-cols-2 gap-4">
										{/* AI Interviewer */}
										<div className="bg-slate-800 rounded-lg p-4">
											<div className="text-sm text-slate-400 mb-2">AI Interviewer</div>
							<InterviewerAvatar speaking={speaking} level={audioLevel} />
										</div>
										
										{/* User Camera */}
										<div className="bg-slate-800 rounded-lg p-4">
											<div className="text-sm text-slate-400 mb-2">Your Camera</div>
											<div className="relative bg-slate-700 rounded-lg h-32 flex items-center justify-center">
												<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
											</div>
										</div>
									</div>
									
									{/* Transcript */}
									<div className="flex-1 bg-slate-800 rounded-lg p-4">
										<TranscriptPane items={transcript} interim={interim} />
          </div>
        </div>

								{/* Right Side - Questions */}
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
              <button
                onClick={() => getNextQuestion(sessionId, userLevel)}
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && <QuestionPanel question={question} onSubmit={handleSubmit} />}
        </div>
              </div>
                </div>
              )}
            </div>

					{/* Bottom Recommendations */}
					{!showQuestions && (
						<div className="p-4">
							<div className="bg-slate-800 rounded-lg p-4">
								<Recommendations sessionId={sessionId || 'boot'} />
          </div>
        </div>
					)}
      </div>
			)}
    </div>
  )
}

export default InterviewTwoPane
