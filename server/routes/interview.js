import express from 'express'
import { query } from '../db.js'

async function callAgent(prompt, context = {}) {
	const groqKey = process.env.GROQ_API_KEY
	const role = context.role || 'General'
	const experience = context.experience || 'Fresher'
	
	const sys = `You are an expert technical interviewer conducting a ${experience} level ${role} interview. 

Your role:
- Ask follow-up questions based on the candidate's responses
- Provide hints when they're stuck
- Evaluate their technical knowledge and problem-solving approach
- Keep responses concise (1-2 sentences max)
- Be encouraging but thorough
- Ask about time/space complexity for algorithms
- Request code examples when discussing technical concepts

Current focus: ${role} development
Experience level: ${experience}

Respond naturally as a human interviewer would.`

	const user = `Candidate response: "${prompt}"

Please provide your next question or feedback as the interviewer.`

	if (groqKey) {
		try {
			console.log('Calling Groq API with key:', groqKey.substring(0, 10) + '...')
			const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${groqKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
					messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ],
					temperature: 0.7
				})
			})
			console.log('Groq response status:', resp.status)
			if (!resp.ok) {
				const errorText = await resp.text()
				console.log('Groq error response:', errorText)
				if (resp.status === 401) return 'Your Groq key appears invalid or expired. Check GROQ_API_KEY.'
				if (resp.status === 429) return 'Groq rate limited. Try again later.'
				return `Groq API error (${resp.status}): ${errorText}`
			}
			const data = await resp.json()
			console.log('Groq response data:', data)
			return data.choices?.[0]?.message?.content || 'Thanks. Next, explain your approach briefly.'
		} catch (e) {
			console.error('Groq API error:', e)
			return `Groq API error: ${e.message}`
		}
	}
	return 'AI not configured. Set GROQ_API_KEY to enable the interviewer.'
}

// Technical interview questions database with difficulty levels
const technicalQuestions = {
	javascript: [
		// Simple (1-3)
		{
			id: 'js-1',
			type: 'mcq',
			question: 'What is the output of console.log(typeof null) in JavaScript?',
			options: ['object', 'null', 'undefined', 'string'],
			correct: 0,
			explanation: 'In JavaScript, typeof null returns "object" due to a historical bug.',
			difficulty: 2
		},
		{
			id: 'js-2',
			type: 'mcq',
			question: 'What is the correct way to declare a variable in JavaScript?',
			options: ['var name = "John"', 'variable name = "John"', 'v name = "John"', 'declare name = "John"'],
			correct: 0,
			explanation: 'var, let, and const are the correct ways to declare variables in JavaScript.',
			difficulty: 1
		},
		{
			id: 'js-3',
			type: 'coding',
			question: 'Write a function to add two numbers.',
			language: 'javascript',
			solution: 'function add(a, b) {\n  return a + b;\n}',
			difficulty: 1
		},
		// Moderate (3-5)
		{
			id: 'js-4',
			type: 'mcq',
			question: 'What is the difference between let and var in JavaScript?',
			options: ['No difference', 'let has block scope, var has function scope', 'var is faster', 'let is deprecated'],
			correct: 1,
			explanation: 'let has block scope while var has function scope.',
			difficulty: 3
		},
		{
			id: 'js-5',
			type: 'coding',
			question: 'Write a function to reverse a string in JavaScript.',
			language: 'javascript',
			solution: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
			difficulty: 3
		},
		{
			id: 'js-6',
			type: 'mcq',
			question: 'What is a closure in JavaScript?',
			options: ['A function inside another function', 'A variable declaration', 'A loop structure', 'A data type'],
			correct: 0,
			explanation: 'A closure is a function that has access to variables in its outer scope.',
			difficulty: 4
		},
		// Advanced (5-7)
		{
			id: 'js-7',
			type: 'coding',
			question: 'Implement a function to check if a string is a palindrome.',
			language: 'javascript',
			solution: 'function isPalindrome(str) {\n  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return cleaned === cleaned.split("").reverse().join("");\n}',
			difficulty: 5
		},
		{
			id: 'js-8',
			type: 'mcq',
			question: 'What is the output of: (function() { return this; })()',
			options: ['undefined', 'null', 'window object', 'Error'],
			correct: 2,
			explanation: 'In non-strict mode, this refers to the global object (window in browsers).',
			difficulty: 6
		},
		// Outstanding (7-10)
		{
			id: 'js-9',
			type: 'coding',
			question: 'Implement a debounce function that limits the rate of function execution.',
			language: 'javascript',
			solution: 'function debounce(func, wait) {\n  let timeout;\n  return function executedFunction(...args) {\n    const later = () => {\n      clearTimeout(timeout);\n      func(...args);\n    };\n    clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n}',
			difficulty: 8
		},
		{
			id: 'js-10',
			type: 'mcq',
			question: 'What is the time complexity of Array.prototype.sort() in JavaScript?',
			options: ['O(n)', 'O(n log n)', 'O(n²)', 'Depends on implementation'],
			correct: 3,
			explanation: 'JavaScript sort() implementation varies by engine, typically O(n log n) but can be O(n²) for certain inputs.',
			difficulty: 9
		}
	],
	react: [
		// Simple (1-3)
		{
			id: 'react-1',
			type: 'mcq',
			question: 'What is React?',
			options: ['A database', 'A JavaScript library for building UIs', 'A server framework', 'A programming language'],
			correct: 1,
			explanation: 'React is a JavaScript library for building user interfaces.',
			difficulty: 1
		},
		{
			id: 'react-2',
			type: 'mcq',
			question: 'What is the purpose of useEffect in React?',
			options: ['To create components', 'To handle side effects', 'To manage state', 'To render JSX'],
			correct: 1,
			explanation: 'useEffect is used to handle side effects in functional components.',
			difficulty: 2
		},
		// Moderate (3-5)
		{
			id: 'react-3',
			type: 'coding',
			question: 'Create a simple counter component using React hooks.',
			language: 'javascript',
			solution: 'import React, { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}',
			difficulty: 3
		},
		{
			id: 'react-4',
			type: 'mcq',
			question: 'What is the virtual DOM in React?',
			options: ['A real DOM element', 'A JavaScript representation of the DOM', 'A database', 'A server component'],
			correct: 1,
			explanation: 'Virtual DOM is a JavaScript representation of the real DOM for efficient updates.',
			difficulty: 4
		},
		// Advanced (5-7)
		{
			id: 'react-5',
			type: 'coding',
			question: 'Implement a custom hook for fetching data with loading and error states.',
			language: 'javascript',
			solution: 'import { useState, useEffect } from "react";\n\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    fetch(url)\n      .then(res => res.json())\n      .then(data => {\n        setData(data);\n        setLoading(false);\n      })\n      .catch(err => {\n        setError(err);\n        setLoading(false);\n      });\n  }, [url]);\n\n  return { data, loading, error };\n}',
			difficulty: 6
		},
		// Outstanding (7-10)
		{
			id: 'react-6',
			type: 'mcq',
			question: 'What is the difference between useCallback and useMemo?',
			options: ['No difference', 'useCallback memoizes functions, useMemo memoizes values', 'useMemo memoizes functions, useCallback memoizes values', 'Both are deprecated'],
			correct: 1,
			explanation: 'useCallback memoizes functions to prevent unnecessary re-renders, useMemo memoizes computed values.',
			difficulty: 8
		}
	],
	algorithms: [
		// Simple (1-3)
		{
			id: 'algo-1',
			type: 'mcq',
			question: 'Which data structure uses LIFO order?',
			options: ['Queue', 'Stack', 'Heap', 'Graph'],
			correct: 1,
			explanation: 'Stack uses Last In First Out (LIFO) order.',
			difficulty: 2
		},
		{
			id: 'algo-2',
			type: 'coding',
			question: 'Write a function to find the maximum element in an array.',
			language: 'javascript',
			solution: 'function findMax(arr) {\n  return Math.max(...arr);\n  // Or: return arr.reduce((max, num) => num > max ? num : max, arr[0]);\n}',
			difficulty: 2
		},
		// Moderate (3-5)
		{
			id: 'algo-3',
			type: 'mcq',
			question: 'What is the time complexity of binary search?',
			options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
			correct: 1,
			explanation: 'Binary search has O(log n) time complexity.',
			difficulty: 3
		},
		{
			id: 'algo-4',
			type: 'coding',
			question: 'Implement a function to find the factorial of a number.',
			language: 'javascript',
			solution: 'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
			difficulty: 4
		},
		// Advanced (5-7)
		{
			id: 'algo-5',
			type: 'coding',
			question: 'Implement a function to check if a linked list has a cycle.',
			language: 'javascript',
			solution: 'function hasCycle(head) {\n  let slow = head;\n  let fast = head;\n  \n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}',
			difficulty: 6
		},
		// Outstanding (7-10)
		{
			id: 'algo-6',
			type: 'mcq',
			question: 'What is the time complexity of quicksort in the worst case?',
			options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
			correct: 2,
			explanation: 'Quicksort has O(n²) time complexity in the worst case when the pivot is always the smallest or largest element.',
			difficulty: 8
		}
	]
}

// Get adaptive question based on role, level, and performance
const getAdaptiveQuestion = (role, level, performance = {}) => {
	const questions = technicalQuestions[role.toLowerCase()] || technicalQuestions.javascript
	
	// Define difficulty ranges for each level
	const difficultyRanges = {
		simple: { min: 1, max: 3 },
		moderate: { min: 2, max: 5 },
		advanced: { min: 4, max: 7 },
		outstanding: { min: 6, max: 10 }
	}
	
	const range = difficultyRanges[level] || difficultyRanges.moderate
	
	// Filter questions by difficulty range
	const filteredQuestions = questions.filter(q => 
		q.difficulty >= range.min && q.difficulty <= range.max
	)
	
	// If no questions in range, fallback to all questions
	const availableQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions
	
	// Adaptive selection based on recent performance
	let selectedQuestion
	if (performance.recentAccuracy !== undefined) {
		// If performing well, slightly increase difficulty
		if (performance.recentAccuracy > 0.7) {
			const harderQuestions = availableQuestions.filter(q => q.difficulty > range.min + 1)
			selectedQuestion = harderQuestions.length > 0 ? 
				harderQuestions[Math.floor(Math.random() * harderQuestions.length)] :
				availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
		}
		// If struggling, slightly decrease difficulty
		else if (performance.recentAccuracy < 0.4) {
			const easierQuestions = availableQuestions.filter(q => q.difficulty < range.max - 1)
			selectedQuestion = easierQuestions.length > 0 ? 
				easierQuestions[Math.floor(Math.random() * easierQuestions.length)] :
				availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
		}
		// Normal selection
		else {
			selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
		}
	} else {
		// First question - start with medium difficulty for the level
		const mediumQuestions = availableQuestions.filter(q => 
			q.difficulty >= range.min + 1 && q.difficulty <= range.max - 1
		)
		selectedQuestion = mediumQuestions.length > 0 ? 
			mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)] :
			availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
	}
	
	return selectedQuestion
}

// Legacy function for backward compatibility
const getRandomQuestion = (role, experience) => {
	return getAdaptiveQuestion(role, 'moderate', {})
}

const router = express.Router()

// Placeholder interview session create
router.post('/session', async (req, res, next) => {
	try {
		const { role, mode, experience, userId = null, candidateName = null, email = null } = req.body || {}
		let sessionId
		try {
			const result = await query(
				`INSERT INTO interview_sessions (user_id, role, mode, experience, candidate_name, candidate_email)
				 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
				[userId, role, mode, experience, candidateName, email]
			)
			sessionId = result.rows[0].id
		} catch {
			sessionId = `${Date.now()}-boot`
		}
		res.json({ sessionId, role, mode, experience, candidateName, email, status: 'created' })
	} catch (err) {
		next(err)
	}
})

// Placeholder to receive user transcript/answer
router.post('/session/:id/answer', async (req, res, next) => {
	try {
		const { id } = req.params
		const { text, code, questionId, role, experience } = req.body || {}
		const prompt = text || code || ''
		const reply = await callAgent(prompt, { role, experience })
		try { if (text) await query(`INSERT INTO transcripts (session_id, speaker, text) VALUES ($1,'user',$2)`, [id, text]) } catch {}
		try { if (reply) await query(`INSERT INTO transcripts (session_id, speaker, text) VALUES ($1,'ai',$2)`, [id, reply]) } catch {}
		try { if (questionId) await query(`INSERT INTO responses (session_id, question_id, code, text) VALUES ($1,$2,$3,$4)`, [id, questionId, code || null, text || null]) } catch {}
		res.json({ sessionId: id, accepted: true, questionId, reply })
	} catch (err) {
		next(err)
	}
})

// Get next question
router.get('/session/:id/next', async (req, res, next) => {
	try {
		const { id } = req.params
		const { role = 'javascript', level = 'moderate', recentAccuracy } = req.query
		
		// Parse recent accuracy if provided
		const performance = recentAccuracy ? { recentAccuracy: parseFloat(recentAccuracy) } : {}
		
		// Get adaptive question based on level and performance
		const question = getAdaptiveQuestion(role, level, performance)
		res.json(question)
	} catch (err) {
		next(err)
	}
})

// Feedback and recommendations (placeholder)
router.post('/session/:id/feedback', async (req, res, next) => {
	try {
		const { answers = [] } = req.body || {}
		const score = Math.min(100, 50 + (answers.length * 5))
		const strengths = ['Clear communication']
		const improvements = ['Provide more concrete examples']
		res.json({ score, strengths, improvements })
	} catch (err) {
		next(err)
	}
})

router.get('/session/:id/recommendations', async (req, res, next) => {
	try {
		res.json({
			courses: [
				{ id: 'course-js', title: 'JavaScript Fundamentals', price: 0 },
				{ id: 'course-dsa', title: 'DSA Interview Prep', price: 499 },
			],
			articles: [
				{ title: 'Big-O Notation Basics', url: 'https://example.com/bigo' },
			],
		})
	} catch (err) {
		next(err)
	}
})

// List sessions (real data from DB)
router.get('/sessions', async (req, res, next) => {
	try {
		const rows = (await query(`
			SELECT id, user_id, role, mode, experience, candidate_name, candidate_email, created_at
			FROM interview_sessions
			ORDER BY created_at DESC
			LIMIT 100`)).rows
		res.json(rows)
	} catch (err) {
		next(err)
	}
})

// Fetch transcripts of a session (new)
router.get('/session/:id/transcripts', async (req, res, next) => {
	try {
		const { id } = req.params
		const rows = (await query(
			`SELECT speaker, text, created_at FROM transcripts WHERE session_id=$1 ORDER BY created_at ASC`,
			[id]
		)).rows
		res.json(rows)
	} catch (err) {
		next(err)
	}
})

export default router