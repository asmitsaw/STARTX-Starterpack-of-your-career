import express from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

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

export default function postRoutes(io){
const router = express.Router()

router.post('/', requireAuth, upload.single('media'), async (req, res, next) => {
  try {
    const { content, media_type } = req.body
    if (!content) return res.status(400).json({ error: 'content_required' })
    const base = req.app.get('PUBLIC_API_BASE') || ''
    const media_url = req.file ? `${base}/uploads/${req.file.filename}` : null
    const { rows } = await query(
      'INSERT INTO posts (author_id, content, media_url, media_type) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, content, media_url, media_type || null]
    )
    const created = rows[0]
    res.status(201).json(created)
    // broadcast new post to feed listeners
    io.emit('post:created', { post: created, originClientId: req.headers['x-client-id'] || null })
  } catch (e) { next(e) }
})

router.get('/feed', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
    const cursor = req.query.cursor || null
    const params = [req.user.id, limit]
    let cursorClause = ''
    if (cursor) {
      params.push(cursor)
      cursorClause = 'AND p.created_at < $3::timestamptz'
    }
    const sql = `
      SELECT p.*, u.name, u.headline
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE (
        p.author_id = $1 OR p.author_id IN (
          SELECT connection_id FROM connections WHERE user_id=$1 AND status='accepted'
        )
      )
      ${cursorClause}
      ORDER BY p.created_at DESC
      LIMIT $2
    `
    const { rows } = await query(sql, params)
    res.json({ items: rows, nextCursor: rows.length ? rows[rows.length - 1].created_at : null })
  } catch (e) { next(e) }
})

router.put('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const client = await (await import('../db.js')).pool.connect()
    try {
      await client.query('BEGIN')
      const liked = await client.query('SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2', [id, req.user.id])
      if (liked.rowCount) {
        await client.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [id, req.user.id])
        await client.query('UPDATE posts SET likes_count = GREATEST(likes_count-1,0) WHERE id=$1', [id])
        await client.query('COMMIT')
        res.json({ liked: false })
        io.emit('post:liked', { postId: id, delta: -1, userId: req.user.id, originClientId: req.headers['x-client-id'] || null })
        return
      } else {
        await client.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, req.user.id])
        await client.query('UPDATE posts SET likes_count = likes_count+1 WHERE id=$1', [id])
        await client.query('COMMIT')
        res.json({ liked: true })
        io.emit('post:liked', { postId: id, delta: 1, userId: req.user.id, originClientId: req.headers['x-client-id'] || null })
        return
      }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (e) { next(e) }
})

router.post('/:id/comment', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'text_required' })
    const client = await (await import('../db.js')).pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        'INSERT INTO comments (post_id, user_id, text) VALUES ($1,$2,$3) RETURNING *',
        [id, req.user.id, text]
      )
      await client.query('UPDATE posts SET comments_count = comments_count+1 WHERE id=$1', [id])
      await client.query('COMMIT')
      const created = rows[0]
      res.status(201).json(created)
      io.emit('post:commented', { postId: id, comment: created, originClientId: req.headers['x-client-id'] || null })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (e) { next(e) }
})

router.put('/:id/share', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    await query('UPDATE posts SET shares_count = shares_count+1 WHERE id=$1', [id])
    res.json({ ok: true })
    io.emit('post:shared', { postId: id, delta: 1, userId: req.user.id, originClientId: req.headers['x-client-id'] || null })
  } catch (e) { next(e) }
})

// Fetch comments for a post
router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { rows } = await query(
      `SELECT c.id, c.text, c.created_at, u.id as user_id, u.name, u.headline
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

return router
}


