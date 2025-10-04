import React, { useState } from 'react'

const InterviewSetupModal = ({ isOpen, onClose, onStart, userLevel = 'moderate' }) => {
	const [formData, setFormData] = useState({
		questionCount: '10-15',
		timeDuration: '15',
		difficultyLevel: userLevel,
		useSelfAssessment: false
	})
	const [showSelfAssessment, setShowSelfAssessment] = useState(false)
	const [assessmentAnswers, setAssessmentAnswers] = useState({})
	const [assessmentStep, setAssessmentStep] = useState(0)

	// Self-assessment questions
	const assessmentQuestions = [
		{
			id: 'q1',
			question: 'What is the time complexity of binary search?',
			options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
			correct: 1,
			difficulty: 3
		},
		{
			id: 'q2',
			question: 'What does the following JavaScript code output: console.log(typeof null)',
			options: ['"null"', '"object"', '"undefined"', 'null'],
			correct: 1,
			difficulty: 2
		},
		{
			id: 'q3',
			question: 'Which React hook is used for side effects?',
			options: ['useState', 'useEffect', 'useContext', 'useReducer'],
			correct: 1,
			difficulty: 2
		},
		{
			id: 'q4',
			question: 'What is the output of: [1,2,3].map(x => x * 2)',
			options: ['[1,2,3]', '[2,4,6]', 'undefined', 'Error'],
			correct: 1,
			difficulty: 1
		},
		{
			id: 'q5',
			question: 'Which data structure uses LIFO (Last In First Out)?',
			options: ['Queue', 'Stack', 'Array', 'Object'],
			correct: 1,
			difficulty: 2
		},
		{
			id: 'q6',
			question: 'What is the purpose of the virtual DOM in React?',
			options: ['To store data', 'To improve performance', 'To handle events', 'To manage state'],
			correct: 1,
			difficulty: 3
		},
		{
			id: 'q7',
			question: 'What is the time complexity of quicksort in the average case?',
			options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
			correct: 1,
			difficulty: 4
		},
		{
			id: 'q8',
			question: 'What does CSS Grid allow you to do?',
			options: ['Style text', 'Create 2D layouts', 'Animate elements', 'Handle events'],
			correct: 1,
			difficulty: 2
		}
	]

	const calculateLevel = (answers) => {
		let totalScore = 0
		let totalDifficulty = 0
		let correctAnswers = 0

		Object.entries(answers).forEach(([questionId, answer]) => {
			const question = assessmentQuestions.find(q => q.id === questionId)
			if (question) {
				totalDifficulty += question.difficulty
				if (answer === question.correct) {
					correctAnswers++
					totalScore += question.difficulty
				}
			}
		})

		const accuracy = correctAnswers / assessmentQuestions.length
		const avgDifficulty = totalDifficulty / assessmentQuestions.length
		const weightedScore = (totalScore / totalDifficulty) * accuracy

		if (weightedScore >= 0.6 && avgDifficulty >= 2.5) return 'advanced'
		if (weightedScore >= 0.4 && avgDifficulty >= 1.5) return 'moderate'
		return 'simple'
	}

	const handleAssessmentAnswer = (questionId, answer) => {
		setAssessmentAnswers(prev => ({ ...prev, [questionId]: answer }))
	}

	const nextAssessmentQuestion = () => {
		if (assessmentStep < assessmentQuestions.length - 1) {
			setAssessmentStep(prev => prev + 1)
		} else {
			// Assessment complete
			const recommendedLevel = calculateLevel(assessmentAnswers)
			setFormData(prev => ({ ...prev, difficultyLevel: recommendedLevel }))
			setShowSelfAssessment(false)
		}
	}

	const handleStart = () => {
		onStart(formData)
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				{!showSelfAssessment ? (
					<>
						<h2 className="text-2xl font-bold text-slate-100 mb-6">Interview Setup</h2>
						
						<div className="space-y-6">
							{/* Question Count */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									Number of Questions
								</label>
								<div className="grid grid-cols-2 gap-2">
									{['1-5', '5-10', '10-15', '15-20', '20+'].map(option => (
										<button
											key={option}
											onClick={() => setFormData(prev => ({ ...prev, questionCount: option }))}
											className={`p-3 rounded-lg border transition-colors ${
												formData.questionCount === option
													? 'border-blue-500 bg-blue-900/30 text-blue-300'
													: 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
											}`}
										>
											{option}
										</button>
									))}
								</div>
							</div>

							{/* Time Duration */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									Interview Duration
								</label>
								<div className="grid grid-cols-3 gap-2">
									{['5', '10', '15', '20', '30', '45'].map(option => (
										<button
											key={option}
											onClick={() => setFormData(prev => ({ ...prev, timeDuration: option }))}
											className={`p-3 rounded-lg border transition-colors ${
												formData.timeDuration === option
													? 'border-blue-500 bg-blue-900/30 text-blue-300'
													: 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
											}`}
										>
											{option} min
										</button>
									))}
								</div>
							</div>

				{/* Difficulty Level */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									Difficulty Level
								</label>
								<div className="grid grid-cols-2 gap-2">
						{[
							{ value: 'simple', label: 'Beginner', color: 'green' },
							{ value: 'moderate', label: 'Moderate', color: 'yellow' },
							{ value: 'advanced', label: 'Advanced', color: 'orange' }
						].map(option => (
										<button
											key={option.value}
											onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: option.value }))}
											className={`p-3 rounded-lg border transition-colors ${
												formData.difficultyLevel === option.value
													? `border-${option.color}-500 bg-${option.color}-900/30 text-${option.color}-300`
													: 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
							</div>

							{/* Self Assessment Option */}
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									id="selfAssessment"
									checked={formData.useSelfAssessment}
									onChange={(e) => setFormData(prev => ({ ...prev, useSelfAssessment: e.target.checked }))}
									className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
								/>
								<label htmlFor="selfAssessment" className="text-sm text-slate-300">
									Take self-assessment quiz to auto-detect my level
								</label>
							</div>

							{formData.useSelfAssessment && (
								<button
									onClick={() => setShowSelfAssessment(true)}
									className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
								>
									Start Self-Assessment Quiz
								</button>
							)}
						</div>

						<div className="flex justify-end space-x-3 mt-6">
							<button
								onClick={onClose}
								className="px-4 py-2 text-slate-400 hover:text-slate-300"
							>
								Cancel
							</button>
							<button
								onClick={handleStart}
								className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
							>
								Start Interview
							</button>
						</div>
					</>
				) : (
					<>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-slate-100">Self-Assessment Quiz</h2>
							<span className="text-sm text-slate-400">
								{assessmentStep + 1} of {assessmentQuestions.length}
							</span>
						</div>

						<div className="mb-6">
							<div className="w-full bg-slate-700 rounded-full h-2">
								<div 
									className="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${((assessmentStep + 1) / assessmentQuestions.length) * 100}%` }}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="text-lg font-medium text-slate-100">
								{assessmentQuestions[assessmentStep].question}
							</h3>
							
							<div className="space-y-2">
								{assessmentQuestions[assessmentStep].options.map((option, idx) => (
									<button
										key={idx}
										onClick={() => handleAssessmentAnswer(assessmentQuestions[assessmentStep].id, idx)}
										className={`w-full p-3 text-left rounded-lg border transition-colors ${
											assessmentAnswers[assessmentQuestions[assessmentStep].id] === idx
												? 'border-blue-500 bg-blue-900/30 text-blue-300'
												: 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
										}`}
									>
										{option}
									</button>
								))}
							</div>
						</div>

						<div className="flex justify-between mt-6">
							<button
								onClick={() => setShowSelfAssessment(false)}
								className="px-4 py-2 text-slate-400 hover:text-slate-300"
							>
								Back to Setup
							</button>
							<button
								onClick={nextAssessmentQuestion}
								disabled={assessmentAnswers[assessmentQuestions[assessmentStep].id] === undefined}
								className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
							>
								{assessmentStep === assessmentQuestions.length - 1 ? 'Complete Assessment' : 'Next Question'}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default InterviewSetupModal
