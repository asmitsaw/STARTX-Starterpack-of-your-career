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
    console.log('📝 Post creation request:', {
      content: req.body.content,
      media_type: req.body.media_type,
      has_file: !!req.file,
      has_metadata: !!req.body.media_metadata,
      user_id: req.user?.id
    })
    
    const { content, media_type, media_metadata } = req.body
    // Allow posts with either content OR media (or both)
    if (!content && !req.file && !media_metadata) {
      console.log('❌ Rejected: No content or media')
      return res.status(400).json({ error: 'content_or_media_required' })
    }
    
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
        // Store the parsed JSON object for JSONB column
        media_urls = metadata
      } catch (err) {
        console.error('Failed to parse media metadata:', err)
      }
    }
    
    // Insert post with enhanced media information
    const { rows } = await query(
      `INSERT INTO posts 
       (author_id, content, media_url, media_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        req.user.id, 
        content || '', // Allow empty content if media is present
        media_url, 
        media_type || null
      ]
    )
    
    const created = rows[0]
    
    // Add user information to the response
    created.name = req.user.name
    created.avatar_url = req.user.avatar_url
    created.user_id = req.user.id
    created.headline = req.user.headline || ''
    
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
    console.log(`[Posts] Emitting to ${connectedUsers.length} connected users`)
    connectedUsers.forEach(connection => {
      console.log(`[Posts] Emitting post:new to user:${connection.connected_id}`)
      
      io.to(`user:${connection.connected_id}`).emit('post:created', { 
        post: created, 
        originClientId: req.headers['x-client-id'] || null,
        hasMedia: !!media_url
      });
      
      // Also emit notification event for toast notifications
      const notificationData = {
        post_id: created.id,
        author_id: req.user.id,
        author_name: req.user.name,
        author_avatar: req.user.avatar_url,
        content: created.content,
        created_at: created.created_at
      }
      console.log('[Posts] Notification data:', notificationData)
      io.to(`user:${connection.connected_id}`).emit('post:new', notificationData);
    });
  } catch (e) { next(e) }
})

router.get('/feed', clerkAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
    const cursor = req.query.cursor || null
    const requestedUserId = req.query.userId // Specific user's posts (for profile page)
    const currentUserId = req.user.id // Authenticated user
    
    const params = [currentUserId, limit]
    let cursorClause = ''
    if (cursor) {
      params.push(cursor)
      cursorClause = 'AND p.created_at < $3::timestamptz'
    }
    
    let sql
    
    // If userId is specified, show ONLY that user's posts (for profile page)
    if (requestedUserId) {
      console.log(`[Feed] Fetching posts for specific user: ${requestedUserId}`)
      params[0] = requestedUserId
      sql = `
        SELECT p.*, u.name, u.headline, u.avatar_url, u.id as user_id
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.author_id = $1
        ${cursorClause}
        ORDER BY p.created_at DESC
        LIMIT $2
      `
    } else {
      // No userId specified - show current user's posts + connections' posts (for home feed)
      console.log(`[Feed] Fetching feed for user: ${currentUserId} (own + connections)`)
      sql = `
        SELECT DISTINCT p.*, u.name, u.headline, u.avatar_url, u.id as user_id
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE 
          p.author_id = $1
          OR p.author_id IN (
            SELECT connected_user_id FROM connections 
            WHERE user_id = $1 AND status = 'accepted'
            UNION
            SELECT user_id FROM connections 
            WHERE connected_user_id = $1 AND status = 'accepted'
          )
        ${cursorClause}
        ORDER BY p.created_at DESC
        LIMIT $2
      `
    }
    
    const { rows } = await query(sql, params)
    
    console.log(`[Feed] Returning ${rows.length} posts`)
    
    res.json({ items: rows, nextCursor: rows.length ? rows[rows.length - 1].created_at : null })
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

// Delete a post (only by author)
router.delete('/:id', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Check if user is the author
    const { rows } = await query('SELECT author_id, media_url FROM posts WHERE id = $1', [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    const post = rows[0]
    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' })
    }
    
    // Delete associated media file if it exists locally
    if (post.media_url && post.media_url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), post.media_url)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    // Delete the post (cascade will delete likes and comments)
    await query('DELETE FROM posts WHERE id = $1', [id])
    
    res.json({ ok: true })
    
    // Emit deletion event
    io.emit('post:deleted', { postId: id, userId: req.user.id })
  } catch (e) { next(e) }
})

// Get missed notifications (posts created while user was offline)
router.get('/missed-notifications', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    
    // Get user's last seen time (you can track this in a user_activity table)
    // For now, get posts from last 24 hours
    const { rows } = await query(
      `SELECT p.id, p.content, p.created_at, p.author_id,
              u.name as author_name, u.avatar_url as author_avatar
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.author_id != $1
         AND p.created_at > NOW() - INTERVAL '24 hours'
         AND (
           p.author_id IN (
             SELECT connected_user_id FROM connections 
             WHERE user_id = $1 AND status = 'accepted'
           )
           OR p.author_id IN (
             SELECT user_id FROM connections 
             WHERE connected_user_id = $1 AND status = 'accepted'
           )
         )
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [userId]
    )
    
    res.json({ posts: rows })
  } catch (e) { next(e) }
})

return router
}


