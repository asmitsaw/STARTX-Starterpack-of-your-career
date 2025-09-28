import express from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { issueToken } from '../middleware/auth.js'

const router = express.Router()

// Dev/demo endpoint: create or fetch demo user and issue JWT
router.post('/demo', async (req, res, next) => {
  try {
    const email = 'demo@startx.app'
    const name = 'Demo User'
    const headline = 'Aspiring Engineer'
    const { rows: existing } = await query('SELECT id, name, email, headline FROM users WHERE email=$1', [email])
    if (existing.length) {
      const token = issueToken(existing[0].id, res)
      return res.json({ user: existing[0], token })
    }
    const hash = await bcrypt.hash('demo', 10)
    const { rows } = await query(
      'INSERT INTO users (name, email, password, headline) VALUES ($1,$2,$3,$4) RETURNING id, name, email, headline',
      [name, email, hash, headline]
    )
    const token = issueToken(rows[0].id, res)
    res.status(201).json({ user: rows[0], token })
  } catch (e) { next(e) }
})

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, headline } = req.body
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })
    const { rows: existing } = await query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.length) return res.status(409).json({ error: 'email_exists' })
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await query(
      'INSERT INTO users (name, email, password, headline) VALUES ($1,$2,$3,$4) RETURNING id, name, email, headline, created_at',
      [name || null, email, hash, headline || null]
    )
    const user = rows[0]
    const token = issueToken(user.id, res)
    res.status(201).json({ user, token })
  } catch (e) { next(e) }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })
    const { rows } = await query('SELECT id, password FROM users WHERE email=$1', [email])
    if (!rows.length) return res.status(401).json({ error: 'invalid_credentials' })
    const ok = await bcrypt.compare(password, rows[0].password)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
    const token = issueToken(rows[0].id, res)
    res.json({ ok: true, token, userId: rows[0].id })
  } catch (e) { next(e) }
})

// Ensure user exists in database (for Clerk authentication)
router.post('/ensure-user', async (req, res, next) => {
  try {
    // Get Clerk user data from request body
    const { clerkUserId, clerkEmail, clerkName, clerkImageUrl } = req.body
    
    if (!clerkUserId) {
      return res.status(400).json({ error: 'missing_clerk_user_id' })
    }

    // Check if user already exists by clerk_id or email
    const { rows: existing } = await query(
      'SELECT id, name, email, headline, avatar_url FROM users WHERE clerk_id = $1 OR email = $2', 
      [clerkUserId, clerkEmail]
    )

    if (existing.length > 0) {
      // User exists, update clerk_id if missing and return their data
      if (!existing[0].clerk_id) {
        await query('UPDATE users SET clerk_id = $1 WHERE id = $2', [clerkUserId, existing[0].id])
      }
      return res.json({ user: existing[0] })
    }

    // User doesn't exist, create them
    const { rows: newUser } = await query(
      'INSERT INTO users (clerk_id, name, email, headline, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, headline, avatar_url, created_at',
      [clerkUserId, clerkName || null, clerkEmail || null, null, clerkImageUrl || null]
    )

    res.status(201).json({ user: newUser[0] })
  } catch (e) { 
    console.error('Ensure user error:', e)
    next(e) 
  }
})

export default router


