import express from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '')
    cb(null, `${Date.now()}-${base}${ext}`)
  }
})
const upload = multer({ storage })

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { rows } = await query(
      'SELECT id, name, headline, email, profile_views, post_impressions, created_at, avatar_url FROM users WHERE id=$1',
      [id]
    )
    if (!rows.length) return res.status(404).json({ error: 'not_found' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

router.get('/suggestions', requireAuth, async (req, res, next) => {
  try {
    const currentUserId = req.user.id
    const { rows } = await query(
      `SELECT id, name, headline, avatar_url
       FROM users
       WHERE id <> $1 AND id NOT IN (
         SELECT connection_id FROM connections WHERE user_id=$1
       )
       ORDER BY created_at DESC
       LIMIT 10`,
      [currentUserId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Upload/update current user's avatar
router.put('/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' })
    const base = req.app.get('PUBLIC_API_BASE') || ''
    const avatarUrl = `${base}/uploads/${req.file.filename}`
    const { rows } = await query('UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING avatar_url', [avatarUrl, req.user.id])
    res.json({ avatar_url: rows[0].avatar_url })
  } catch (e) { next(e) }
})

export default router


