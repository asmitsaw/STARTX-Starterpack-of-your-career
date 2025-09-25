import express from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, title, post_count FROM trending_topics ORDER BY post_count DESC LIMIT 10')
    res.json(rows)
  } catch (e) { next(e) }
})

export default router


