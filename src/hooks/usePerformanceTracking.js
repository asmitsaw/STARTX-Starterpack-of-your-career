import { useState, useEffect } from 'react'

const usePerformanceTracking = (userId) => {
	const [userLevel, setUserLevel] = useState('moderate')
	const [performanceHistory, setPerformanceHistory] = useState([])
	const [currentSession, setCurrentSession] = useState({
		correct: 0,
		total: 0,
		avgDifficulty: 0,
		timeSpent: 0,
		questions: []
	})

	// Load user data from localStorage
	useEffect(() => {
		const savedLevel = localStorage.getItem(`userLevel_${userId}`)
		const savedHistory = localStorage.getItem(`performanceHistory_${userId}`)
		
		if (savedLevel) setUserLevel(savedLevel)
		if (savedHistory) setPerformanceHistory(JSON.parse(savedHistory))
	}, [userId])

	// Save user data to localStorage
	useEffect(() => {
		localStorage.setItem(`userLevel_${userId}`, userLevel)
	}, [userLevel, userId])

	useEffect(() => {
		localStorage.setItem(`performanceHistory_${userId}`, JSON.stringify(performanceHistory))
	}, [performanceHistory, userId])

	// Calculate level based on performance
	const calculateLevel = (performance) => {
		const { correct, total, avgDifficulty } = performance
		const accuracy = total > 0 ? correct / total : 0
		
		// Level calculation algorithm
		if (accuracy >= 0.8 && avgDifficulty >= 7) return 'outstanding'
		if (accuracy >= 0.6 && avgDifficulty >= 5) return 'advanced'
		if (accuracy >= 0.4 && avgDifficulty >= 3) return 'moderate'
		return 'simple'
	}

	// Update performance after each question
	const updatePerformance = (questionData, isCorrect, timeSpent) => {
		const newQuestion = {
			id: questionData.id,
			difficulty: questionData.difficulty || 5,
			isCorrect,
			timeSpent,
			timestamp: Date.now()
		}

		setCurrentSession(prev => {
			const updated = {
				...prev,
				correct: prev.correct + (isCorrect ? 1 : 0),
				total: prev.total + 1,
				questions: [...prev.questions, newQuestion]
			}

			// Calculate average difficulty
			updated.avgDifficulty = updated.questions.reduce((sum, q) => sum + q.difficulty, 0) / updated.questions.length

			return updated
		})
	}

	// Complete session and update level
	const completeSession = () => {
		if (currentSession.total === 0) return

		const newLevel = calculateLevel(currentSession)
		const levelChanged = newLevel !== userLevel

		// Add to performance history
		const sessionRecord = {
			id: Date.now(),
			level: newLevel,
			performance: currentSession,
			timestamp: Date.now(),
			levelChanged
		}

		setPerformanceHistory(prev => [...prev, sessionRecord])
		
		// Update user level if it changed
		if (levelChanged) {
			setUserLevel(newLevel)
		}

		// Reset current session
		setCurrentSession({
			correct: 0,
			total: 0,
			avgDifficulty: 0,
			timeSpent: 0,
			questions: []
		})

		return {
			newLevel,
			levelChanged,
			feedback: generateFeedback(newLevel, currentSession, levelChanged)
		}
	}

	// Generate feedback based on performance
	const generateFeedback = (level, performance, levelChanged) => {
		const accuracy = performance.total > 0 ? performance.correct / performance.total : 0
		
		if (levelChanged) {
			const levelNames = {
				simple: 'Simple',
				moderate: 'Moderate', 
				advanced: 'Advanced',
				outstanding: 'Outstanding'
			}
			
			return {
				type: 'level_change',
				message: `🎉 Congratulations! We're upgrading you to ${levelNames[level]} level based on your performance!`,
				details: `You answered ${performance.correct}/${performance.total} questions correctly (${Math.round(accuracy * 100)}% accuracy)`
			}
		}

		if (accuracy >= 0.8) {
			return {
				type: 'excellent',
				message: '🌟 Excellent performance! You\'re doing great!',
				details: `You answered ${performance.correct}/${performance.total} questions correctly (${Math.round(accuracy * 100)}% accuracy)`
			}
		}

		if (accuracy >= 0.6) {
			return {
				type: 'good',
				message: '👍 Good job! Keep up the great work!',
				details: `You answered ${performance.correct}/${performance.total} questions correctly (${Math.round(accuracy * 100)}% accuracy)`
			}
		}

		if (accuracy >= 0.4) {
			return {
				type: 'fair',
				message: '📚 Keep practicing! You\'re making progress!',
				details: `You answered ${performance.correct}/${performance.total} questions correctly (${Math.round(accuracy * 100)}% accuracy). Consider reviewing some concepts.`
			}
		}

		return {
			type: 'needs_improvement',
			message: '💪 Don\'t give up! Practice makes perfect!',
			details: `You answered ${performance.correct}/${performance.total} questions correctly (${Math.round(accuracy * 100)}% accuracy). We recommend starting with simpler questions.`
		}
	}

	// Get level-based question difficulty range
	const getDifficultyRange = (level) => {
		const ranges = {
			simple: { min: 1, max: 3 },
			moderate: { min: 2, max: 5 },
			advanced: { min: 4, max: 7 },
			outstanding: { min: 6, max: 10 }
		}
		return ranges[level] || ranges.moderate
	}

	// Get performance statistics
	const getStats = () => {
		if (performanceHistory.length === 0) return null

		const totalSessions = performanceHistory.length
		const totalCorrect = performanceHistory.reduce((sum, session) => sum + session.performance.correct, 0)
		const totalQuestions = performanceHistory.reduce((sum, session) => sum + session.performance.total, 0)
		const overallAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0

		const levelDistribution = performanceHistory.reduce((dist, session) => {
			dist[session.level] = (dist[session.level] || 0) + 1
			return dist
		}, {})

		return {
			totalSessions,
			overallAccuracy: Math.round(overallAccuracy * 100),
			levelDistribution,
			currentLevel: userLevel,
			recentPerformance: performanceHistory.slice(-5)
		}
	}

	return {
		userLevel,
		performanceHistory,
		currentSession,
		updatePerformance,
		completeSession,
		getDifficultyRange,
		getStats,
		setUserLevel
	}
}

export default usePerformanceTracking
