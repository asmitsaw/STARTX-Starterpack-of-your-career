import express from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { clerkAuth } from '../middleware/clerkAuth.js'
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

router.post('/', clerkAuth, upload.single('media'), async (req, res, next) => {
  try {
    const { content, media_type, media_metadata } = req.body
    if (!content) return res.status(400).json({ error: 'content_required' })
    
    // User is already created/synced by clerkAuth middleware
    // No need to check again
    
    // Check connection status for visibility rules
    const connectionCheck = await query(`
      SELECT status FROM connections 
      WHERE (user_id = $1 OR connected_user_id = $1)
      AND status = 'accepted'
    `, [req.user.id])
    
    const base = req.app.get('PUBLIC_API_BASE') || ''
    let media_url = req.file ? `${base}/uploads/${req.file.filename}` : null
    let media_urls = null
    
    // If media_metadata is provided (from ImageKit), use that instead of local upload
    if (media_metadata) {
      try {
        const metadata = JSON.parse(media_metadata)
        media_url = metadata.url
        media_urls = JSON.stringify({
          small: metadata.small || metadata.url,
          medium: metadata.medium || metadata.url,
          large: metadata.large || metadata.url,
          original: metadata.url
        })
      } catch (err) {
        console.error('Failed to parse media metadata:', err)
      }
    }
    
    // Insert post with enhanced media information and encryption flag
    const { rows } = await query(
      `INSERT INTO posts 
       (author_id, content, media_url, media_type, media_urls, visibility, is_encrypted) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        req.user.id, 
        content, 
        media_url, 
        media_type || null, 
        media_urls, 
        'connections', // Changed from public to connections for better privacy
        true // Enable encryption for content
      ]
    )
    
    const created = rows[0]
    
    // Add connection information to the response
    created.connections = connectionCheck.rows.map(c => c.status)
    
    res.status(201).json(created)
    
    // Get all users who are connected with the post creator
    const { rows: connectedUsers } = await query(
      `SELECT 
        CASE 
          WHEN user_id = $1 THEN connected_user_id 
          WHEN connected_user_id = $1 THEN user_id 
        END AS connected_id
      FROM connections 
      WHERE (user_id = $1 OR connected_user_id = $1) 
      AND status = 'accepted'`,
      [req.user.id]
    );
    
    // Emit to the post creator
    io.to(`user:${req.user.id}`).emit('post:created', { 
      post: created, 
      originClientId: req.headers['x-client-id'] || null,
      hasMedia: !!media_url
    });
    
    // Emit to all connected users
    connectedUsers.forEach(connection => {
      io.to(`user:${connection.connected_id}`).emit('post:created', { 
        post: created, 
        originClientId: req.headers['x-client-id'] || null,
        hasMedia: !!media_url
      });
    });
  } catch (e) { next(e) }
})

router.get('/feed', clerkAuth, async (req, res, next) => {
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
      SELECT p.*, u.name, u.headline, u.avatar_url, u.id as user_id
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE (
        p.author_id = $1 OR p.author_id IN (
          SELECT connected_user_id FROM connections WHERE user_id=$1 AND status='accepted'
        )
      )
      ${cursorClause}
      ORDER BY p.created_at DESC
      LIMIT $2
    `
    const { rows } = await query(sql, params)
    
    // Decrypt content if encrypted
    const posts = rows.map(post => {
      if (post.is_encrypted && post.content) {
        return {
          ...post,
          content: req.security.decrypt(post.content)
        }
      }
      return post
    })
    
    res.json({ items: posts, nextCursor: posts.length ? posts[posts.length - 1].created_at : null })
  } catch (e) { next(e) }
})

router.put('/:id/like', clerkAuth, async (req, res, next) => {
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

router.post('/:id/comment', clerkAuth, async (req, res, next) => {
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

router.put('/:id/share', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    await query('UPDATE posts SET shares_count = shares_count+1 WHERE id=$1', [id])
    res.json({ ok: true })
    io.emit('post:shared', { postId: id, delta: 1, userId: req.user.id, originClientId: req.headers['x-client-id'] || null })
  } catch (e) { next(e) }
})

// Fetch comments for a post
router.get('/:id/comments', clerkAuth, async (req, res, next) => {
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


