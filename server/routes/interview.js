import express from 'express'
import { query } from '../db.js'
import { clerkAuth } from '../middleware/clerkAuth.js'

async function callAgent(prompt, context = {}) {
    const geminiKey = process.env.GEMINI_API_KEY
    console.log('[Interview] Gemini API Key present:', !!geminiKey)
    console.log('[Interview] Gemini API Key first 10 chars:', geminiKey?.substring(0, 10))
	const role = context.role || 'General'
	const experience = context.experience || 'Fresher'
    const company = context.company || 'Unknown Company'
    const description = context.description || ''
	
const sys = `You are an expert technical interviewer conducting a ${experience} level ${role} interview for ${company}. 

Your role:
- Balance between VERBAL questions (concepts, theory, experience) and CODING questions
- Start with verbal questions about concepts, then ask for code demonstrations
- Mix question types: theory → code → system design → behavioral
- For coding questions, say: "Can you write code to demonstrate this?" or "Show me how you'd implement that"
- For verbal questions, ask about: architecture, trade-offs, past projects, debugging approaches
- When appropriate, request code for: algorithms, API endpoints, database queries, design patterns
- Evaluate both communication skills AND technical implementation
- Ask about time/space complexity when discussing algorithms
- Provide hints when they're stuck
- Keep responses concise (1-2 sentences max)
- Be encouraging but thorough

Current focus: ${role} development
Company context and role description: ${description}
Experience level: ${experience}

IMPORTANT: Balance is key - alternate between verbal and coding questions naturally.

Respond naturally as a human interviewer would.`

	const user = `Candidate response: "${prompt}"

Please provide your next question or feedback as the interviewer.`

    // Use Gemini only
    if (geminiKey) {
        try {
            const gprompt = `${sys}\n\nCandidate response: ${prompt}\n\nReply strictly as the interviewer in 1-2 sentences.`
            // Try recommended aliases first, then fall back
            let text
            for (const url of [
                // Use v1 API with correct model name
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                // Fallback to pro model
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
                // Fallback to older flash
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`
            ]) {
                const resp = await fetch(url, {
				method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: gprompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } })
                })
                if (resp.ok) {
                    const data = await resp.json()
                    console.log('[Interview] Gemini API response:', JSON.stringify(data).substring(0, 200))
                    
                    // Check for blocked content or other issues
                    if (data?.candidates?.[0]?.finishReason === 'SAFETY' || data?.candidates?.[0]?.finishReason === 'RECITATION') {
                        console.log('[Interview] Content blocked by safety filters, trying simpler prompt')
                        continue
                    }
                    
                    text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
                    if (text) {
                        console.log('[Interview] Got response from Gemini:', text.substring(0, 50))
                        return text
                    } else {
                        console.log('[Interview] No text in response, finish reason:', data?.candidates?.[0]?.finishReason)
                    }
                } else {
                    const errorText = await resp.text()
                    console.log('[Interview] Gemini API error:', resp.status, errorText)
                }
            }
            
            // If all attempts failed, return a generic follow-up
            console.log('[Interview] All Gemini endpoints failed, using fallback')
            return "That's interesting. Can you elaborate on that approach? What challenges have you faced with it?"
		} catch (e) {
            console.error('[Interview] Gemini callAgent exception:', e.message, e.stack)
            return `AI error: ${e.message}`
		}
	} else {
        console.log('[Interview] No Gemini API key found')
    }
    return 'AI not configured. Set GEMINI_API_KEY to enable the interviewer.'
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
                `INSERT INTO interview_sessions (user_id, role, mode, experience, candidate_name, candidate_email, status)
                 VALUES ($1,$2,$3,$4,$5,$6,'in_progress') RETURNING id`,
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
        const { text, code, questionId, role, experience, company, notes, description } = req.body || {}
		const prompt = text || code || ''
        const reply = await callAgent(prompt, { role, experience, company, description: description || notes || '' })
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
        try { await query(`UPDATE interview_sessions SET score = $2, status = 'completed' WHERE id = $1`, [req.params.id, score]) } catch {}
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
        // Try selecting with status/score (new schema)
        const rows = (await query(`
            SELECT id, user_id, role, mode, experience, candidate_name, candidate_email, created_at, status, score
            FROM interview_sessions
            ORDER BY created_at DESC
            LIMIT 100`)).rows
        res.json(rows)
    } catch (err) {
        // Fallback for older DBs without status/score columns
	try {
		const rows = (await query(`
			SELECT id, user_id, role, mode, experience, candidate_name, candidate_email, created_at
			FROM interview_sessions
			ORDER BY created_at DESC
			LIMIT 100`)).rows
            // Map missing fields with sensible defaults so the UI can render
            res.json(rows.map(r => ({ ...r, status: 'in_progress', score: null })))
        } catch (err2) {
            next(err2)
        }
    }
})

// Generate self-assessment questions (5 total: 1 easy, 2 moderate, 2 advanced) based on role and type
router.get('/assessment', async (req, res, next) => {
    try {
        const { role = 'javascript', type = 'technical', description = '', company = '' } = req.query

        // Preferred: Gemini generation when key is present
        const geminiKey = process.env.GEMINI_API_KEY
        if (geminiKey) {
            try {
                const prompt = `Generate exactly 5 multiple-choice self-assessment questions tailored to the user's target interview.
Target:
- Company: ${company}
- Role: ${role}
- Type: ${type}
- Description/Skills: ${description}

Requirements:
- Mix of difficulty: 1 easy, 2 moderate, 2 advanced.
- Return STRICT JSON array of objects with fields: id (string), question (string), options (array of 4 strings), correct (number index 0-3), difficulty (1-10).
- Do NOT include any text before/after the JSON.`
                let text = ''
                for (const url of [
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${geminiKey}`,
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
                ]) {
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                        })
                    })
                    if (resp.ok) {
                        const data = await resp.json()
                        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                        if (text) break
                    }
                }
                if (!text) throw new Error('No content returned by Gemini')
                let parsed = []
                try { parsed = JSON.parse(text) } catch {
                    // try to extract JSON block if model returned extra text
                    const match = text.match(/\[([\s\S]*?)\]/)
                    if (match) parsed = JSON.parse(match[0])
                }
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // sanitize
                    const questions = parsed.slice(0, 5).map((q, i) => ({
                        id: String(q.id || `g-${Date.now()}-${i}`),
                        question: String(q.question || ''),
                        options: Array.isArray(q.options) ? q.options.slice(0,4).map(String) : ['A','B','C','D'],
                        correct: Number.isInteger(q.correct) ? q.correct : 0,
                        difficulty: typeof q.difficulty === 'number' ? q.difficulty : 3,
                    }))
                    return res.json(questions)
                }
            } catch (e) {
                console.warn('Gemini generation failed, falling back to local bank:', e.message)
            }
        }

        if (type !== 'technical') {
            // Basic HR placeholders; in real app, replace with LLM generation
            const hrQuestions = [
                { id: 'hr-1', question: 'Tell me about a challenging workplace situation and how you handled it.', options: ['Skipped', 'Provided a detailed STAR response', 'Blamed others', 'Gave a one-line answer'], correct: 1, difficulty: 1 },
                { id: 'hr-2', question: 'How do you prioritize tasks when everything is important?', options: ['Randomly', 'Delegate everything', 'Use frameworks like Eisenhower Matrix', 'Ignore deadlines'], correct: 2, difficulty: 2 },
                { id: 'hr-3', question: 'Describe your leadership style with an example.', options: ['Directive only', 'Servant/Coaching with example', 'Avoid leadership', 'Micromanage'], correct: 1, difficulty: 3 },
                { id: 'hr-4', question: 'How do you handle conflicts within a team?', options: ['Escalate immediately', 'Avoid discussion', 'Address directly with empathy and facts', 'Send angry email'], correct: 2, difficulty: 2 },
                { id: 'hr-5', question: 'What motivates you at work?', options: ['Only salary', 'Learning, impact, and ownership', 'Nothing', 'Titles only'], correct: 1, difficulty: 2 },
            ]
            return res.json(hrQuestions)
        }

        const key = (role || '').toLowerCase()
        let bank = technicalQuestions.javascript
        if (key.includes('react')) bank = technicalQuestions.react
        else if (key.includes('algo') || key.includes('ds') || key.includes('dsa')) bank = technicalQuestions.algorithms

        const pick = (min, max, count) => {
            const pool = bank.filter(q => q.difficulty >= min && q.difficulty <= max)
            const chosen = []
            const used = new Set()
            for (let i = 0; i < count && pool.length > 0; i++) {
                let idx = Math.floor(Math.random() * pool.length)
                let guard = 0
                while (used.has(idx) && guard++ < 20) idx = Math.floor(Math.random() * pool.length)
                used.add(idx)
                chosen.push(pool[idx])
            }
            return chosen
        }

        const easy = pick(1, 2, 1)
        const moderate = pick(3, 5, 2)
        const advanced = pick(6, 10, 2)
        const questions = [...easy, ...moderate, ...advanced].slice(0, 5).map(q => ({
            id: q.id,
            question: q.question || q.prompt,
            options: q.options || ['True', 'False'],
            correct: q.correct ?? 0,
            difficulty: q.difficulty || 3,
        }))
        res.json(questions)
    } catch (err) {
        next(err)
    }
})

// Delete a session
router.delete('/session/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        await query(`DELETE FROM interview_sessions WHERE id=$1`, [id])
        res.json({ ok: true })
    } catch (err) {
        next(err)
    }
})

// Update a session (status and/or score). Allows saving partial scores while in progress
router.patch('/session/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const { status, score } = req.body || {}
        if (status === undefined && score === undefined) return res.status(400).json({ error: 'No fields to update' })
        const fields = []
        const values = []
        let i = 1
        if (status !== undefined) { fields.push(`status = $${i++}`); values.push(status) }
        if (score !== undefined) { fields.push(`score = $${i++}`); values.push(score) }
        values.push(id)
        await query(`UPDATE interview_sessions SET ${fields.join(', ')} WHERE id = $${i}` , values)
        res.json({ ok: true })
	} catch (err) {
		next(err)
	}
})

// Get analytics data
router.get('/analytics', clerkAuth, async (req, res, next) => {
	try {
		// Use authenticated user ID from clerkAuth middleware
		const userId = req.user.id
		
		// Get all completed interviews for the user
		const interviews = await query(
			`SELECT score, mode, created_at, status FROM interview_sessions WHERE user_id=$1 ORDER BY created_at DESC`,
			[userId]
		)
		
		const sessions = interviews.rows
		const totalInterviews = sessions.length
		
		// Calculate average score
		const totalScore = sessions.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0)
		const averageScore = totalInterviews > 0 ? (totalScore / totalInterviews).toFixed(1) : 0
		
		// Calculate hire rate (score >= 7)
		const passedInterviews = sessions.filter(s => parseFloat(s.score) >= 7).length
		const hireRate = totalInterviews > 0 ? ((passedInterviews / totalInterviews) * 100).toFixed(1) : 0
		
		// Find top interview type
		const typeCounts = {}
		sessions.forEach(s => {
			const type = s.mode || 'technical'
			typeCounts[type] = (typeCounts[type] || 0) + 1
		})
		const topInterviewType = Object.keys(typeCounts).length > 0 
			? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b) 
			: 'technical'
		
		// Score distribution
		const scoreDistribution = [
			{ range: '0-2', count: sessions.filter(s => parseFloat(s.score) >= 0 && parseFloat(s.score) <= 2).length },
			{ range: '3-4', count: sessions.filter(s => parseFloat(s.score) > 2 && parseFloat(s.score) <= 4).length },
			{ range: '5-6', count: sessions.filter(s => parseFloat(s.score) > 4 && parseFloat(s.score) <= 6).length },
			{ range: '7-8', count: sessions.filter(s => parseFloat(s.score) > 6 && parseFloat(s.score) <= 8).length },
			{ range: '9-10', count: sessions.filter(s => parseFloat(s.score) > 8 && parseFloat(s.score) <= 10).length }
		]
		
		// Weekly trends (last 8 weeks)
		const weeklyTrends = []
		const now = new Date()
		for (let i = 7; i >= 0; i--) {
			const weekStart = new Date(now)
			weekStart.setDate(now.getDate() - (i * 7))
			const weekEnd = new Date(weekStart)
			weekEnd.setDate(weekStart.getDate() + 7)
			
			const weekSessions = sessions.filter(s => {
				const sessionDate = new Date(s.created_at)
				return sessionDate >= weekStart && sessionDate < weekEnd
			})
			
			const completed = weekSessions.filter(s => s.status === 'completed').length
			
			weeklyTrends.push({
				date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				total: weekSessions.length,
				completed
			})
		}
		
		res.json({
			stats: {
				averageScore: parseFloat(averageScore),
				totalInterviews,
				hireRate: `${hireRate}%`,
				topInterviewType
			},
			scoreDistribution,
			weeklyTrends
		})
	} catch (err) {
		console.error('Analytics error:', err)
		next(err)
	}
})

// Test endpoint to verify route works
router.post('/test-code', async (req, res) => {
	console.log('[TEST] Test endpoint hit!')
	res.json({ message: 'Test endpoint works!', received: req.body })
})

// Analyze submitted code (removed clerkAuth for testing)
router.post('/analyze-code', async (req, res, next) => {
	console.log('[Code Analysis] ===== ENDPOINT HIT =====')
	console.log('[Code Analysis] Request body:', req.body)
	try {
		const { code, role, experience, sessionId, previousContext } = req.body
		console.log('[Code Analysis] Received request:', { 
			codeLength: code?.length, 
			role, 
			experience,
			hasContext: !!previousContext 
		})
		
		const geminiKey = process.env.GEMINI_API_KEY
		if (!geminiKey) {
			console.log('[Code Analysis] No Gemini API key found')
			return res.json({ feedback: 'Code received. Please explain your approach.' })
		}
		
		console.log('[Code Analysis] Gemini key present, analyzing code...')
		
		// Create a detailed prompt for code analysis
		const analysisPrompt = `You are an expert technical interviewer for a ${experience} level ${role} position.

The candidate just submitted this code:
\`\`\`
${code}
\`\`\`

Previous conversation context:
${previousContext}

Your task - Provide detailed feedback in this structure:

1. **Correctness**: Is the code correct? Does it solve the problem? Mention any bugs or logical errors.
2. **Issues Found**: List specific bugs, edge cases not handled, or errors (if any)
3. **What's Good**: Mention 2-3 positive aspects (good practices, clean code, correct approach)
4. **Improvements**: Suggest 2-3 specific improvements (optimization, edge cases, better practices)
5. **Follow-up Question**: Ask 1 technical question about time/space complexity, edge cases, or alternative approaches

Be specific, constructive, and encouraging. Mention line numbers or specific code parts when pointing out issues.
Keep response conversational but thorough (4-6 sentences total).

Example format:
"Good approach! Your code correctly handles the main logic. However, I notice you're not handling the case when the input is null/empty - this could cause an error. The time complexity looks good at O(n). One improvement would be to add input validation at the start. What would happen if the array contains duplicate values? How would you optimize this for very large inputs?"`

		try {
			const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
			console.log('[Code Analysis] Calling Gemini API...')
			const resp = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					contents: [{ parts: [{ text: analysisPrompt }] }], 
					generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } 
				})
			})
			
			if (resp.ok) {
				const data = await resp.json()
				console.log('[Code Analysis] Gemini API response received')
				const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
				if (feedback) {
					console.log('[Code Analysis] Feedback generated:', feedback.substring(0, 100))
					return res.json({ feedback })
				} else {
					console.log('[Code Analysis] No feedback text in response')
				}
			} else {
				const errorText = await resp.text()
				console.error('[Code Analysis] Gemini API error:', resp.status, errorText)
			}
		} catch (error) {
			console.error('[Code Analysis] Exception:', error.message)
		}
		
		res.json({ feedback: 'Thank you for sharing your code. Can you walk me through your logic and explain the time complexity?' })
	} catch (error) {
		next(error)
	}
})

// Generate AI feedback after interview ends
router.post('/session/:id/ai-feedback', clerkAuth, async (req, res, next) => {
	try {
		const { transcript, role, experience, duration } = req.body
		const geminiKey = process.env.GEMINI_API_KEY
		
		if (!geminiKey) {
			return res.json({
				feedback: 'Interview completed successfully.',
				score: 75,
				strengths: ['Good communication', 'Clear explanations'],
				improvements: ['Practice more coding problems'],
				summary: 'Thank you for participating in the interview.'
			})
		}
		
		// Create comprehensive feedback prompt
		const feedbackPrompt = `You are an expert technical interviewer. Analyze this ${experience} level ${role} interview transcript and provide detailed feedback.

Interview Transcript:
${transcript}

Duration: ${duration} minutes

Provide a JSON response with:
1. "score": Overall performance score (0-100)
2. "strengths": Array of 3-5 things the candidate did well (be specific and encouraging)
3. "improvements": Array of 3-5 areas to improve (be constructive and actionable)
4. "summary": 2-3 sentence overall assessment
5. "feedback": Detailed paragraph covering technical skills, communication, problem-solving approach

Be encouraging but honest. Focus on both technical competence and soft skills.

Respond ONLY with valid JSON, no markdown or extra text.`

		try {
			const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
			const resp = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					contents: [{ parts: [{ text: feedbackPrompt }] }], 
					generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } 
				})
			})
			
			if (resp.ok) {
				const data = await resp.json()
				let feedbackText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
				
				if (feedbackText) {
					// Try to parse JSON from response
					try {
						// Remove markdown code blocks if present
						feedbackText = feedbackText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
						const feedbackData = JSON.parse(feedbackText)
						return res.json(feedbackData)
					} catch (parseError) {
						console.error('[Interview] Failed to parse AI feedback JSON:', parseError)
						// Return the text as feedback if JSON parsing fails
						return res.json({
							feedback: feedbackText,
							score: 75,
							strengths: ['Completed the interview', 'Engaged with questions'],
							improvements: ['Continue practicing'],
							summary: 'Thank you for your time and effort.'
						})
					}
				}
			}
		} catch (error) {
			console.error('[Interview] AI feedback generation error:', error)
		}
		
		// Fallback response
		res.json({
			feedback: 'Thank you for completing the interview. Your responses have been recorded and will be reviewed.',
			score: 70,
			strengths: ['Completed the interview', 'Demonstrated effort'],
			improvements: ['Keep practicing technical skills'],
			summary: 'We appreciate your time and will be in touch soon.'
		})
	} catch (error) {
		next(error)
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