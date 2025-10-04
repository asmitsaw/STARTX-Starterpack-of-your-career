import express from 'express'
import { query, pool } from '../db.js'
import { clerkAuth, optionalClerkAuth } from '../middleware/clerkAuth.js'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

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

// Get current user profile
router.get('/me', clerkAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, clerk_id, email, name, headline, bio, skills, highlights FROM users WHERE clerk_id = $1',
      [req.user.id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Search users by name or attributes
router.get('/search', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { q } = req.query
    
    if (!q || q.trim() === '') {
      return res.json({ users: [] })
    }
    
    const searchTerm = `%${q.trim()}%`
    const { rows } = await query(
      `SELECT u.id, u.name, u.headline, u.avatar_url, p.title, p.location,
              CASE WHEN c.status IS NOT NULL THEN c.status ELSE 'none' END as connection_status
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN connections c ON (c.user_id = $1 AND c.connected_user_id = u.id) OR (c.user_id = u.id AND c.connected_user_id = $1)
       WHERE u.id != $1 AND (
         u.name ILIKE $2 OR 
         u.headline ILIKE $2 OR 
         p.title ILIKE $2 OR 
         p.location ILIKE $2
       )
       ORDER BY 
         CASE WHEN u.name ILIKE $2 THEN 0 ELSE 1 END,
         u.name
       LIMIT 20`,
      [userId, searchTerm]
    )
    return res.json({ users: rows })
  } catch (e) { next(e) }
})

// Get user suggestions
router.get('/suggestions', clerkAuth, async (req, res, next) => {
  try {
    // Don't suggest users that the current user is already connected to
    const currentUserId = req.user.id
    const { rows } = await query(
      `SELECT id, name, headline, avatar_url
       FROM users
       WHERE id <> $1 AND id NOT IN (
         SELECT connected_user_id FROM connections WHERE user_id=$1
       )
       ORDER BY created_at DESC
       LIMIT 10`,
      [currentUserId]
    )
    return res.json({ users: rows })
  } catch (e) { next(e) }
})

// Update current user profile
router.put('/me', clerkAuth, async (req, res) => {
  try {
    const { skills, highlights, addCertification } = req.body
    const userId = req.user.id
    
    // Get current user data
    const currentUser = await query(
      'SELECT skills, highlights FROM users WHERE clerk_id = $1',
      [userId]
    )
    
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Merge new skills with existing ones
    let updatedSkills = currentUser.rows[0].skills || []
    if (skills && Array.isArray(skills)) {
      updatedSkills = [...new Set([...updatedSkills, ...skills])]
    }
    
    // Merge new highlights with existing ones
    let updatedHighlights = currentUser.rows[0].highlights || []
    if (highlights && Array.isArray(highlights)) {
      updatedHighlights = [...highlights, ...updatedHighlights]
    }
    
    // Update user profile
    const { rows } = await query(
      `UPDATE users 
       SET skills = $1, highlights = $2, updated_at = NOW()
       WHERE clerk_id = $3
       RETURNING id, clerk_id, email, name, headline, bio, skills, highlights`,
      [updatedSkills, updatedHighlights, userId]
    )
    
    res.json({ success: true, user: rows[0] })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Server error', message: error.message })
  }
})

// Helper function to update connection counts
async function updateConnectionCounts(userId) {
  try {
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM connections 
       WHERE (user_id = $1 OR connected_user_id = $1) AND status = 'accepted'`,
      [userId]
    )
    
    const count = parseInt(rows[0].count || 0)
    
    await query(
      `INSERT INTO user_profiles (user_id, connections_count, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
       connections_count = $2, updated_at = NOW()`,
      [userId, count]
    )
    
    return count
  } catch (error) {
    console.error('Error updating connection count:', error)
    return 0
  }
}

// Get connection status with a specific user
router.get('/connections/:userId/status', clerkAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const targetUserId = req.params.userId
    
    // Verify that the target user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [targetUserId])
    if (userCheck.rows.length === 0) {
       return res.status(404).json({ error: 'User not found' })
      }
    
    // Check connection status
    const { rows } = await query(
      `SELECT status FROM connections 
       WHERE (user_id = $1 AND connected_user_id = $2) OR (user_id = $2 AND connected_user_id = $1)`,
      [userId, targetUserId]
    )
    
    if (rows.length > 0) {
      return res.json({ status: rows[0].status })
    } else {
      return res.json({ status: 'none' })
    }
  } catch (error) {
    console.error('Error checking connection status:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Create or update connection
router.post('/connections/:userId', clerkAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const connectedUserId = req.params.userId
    const { status } = req.body
    const io = req.app.get('io')
    
    if (userId === connectedUserId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' })
    }
    
    // Check if valid status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid connection status' })
    }
    
    // Check if connection exists
    const existingConnection = await query(
      `SELECT * FROM connections 
       WHERE (user_id = $1 AND connected_user_id = $2) OR (user_id = $2 AND connected_user_id = $1)`,
      [userId, connectedUserId]
    )
    
    let updatedStatus = status
    
    if (existingConnection.rows.length > 0) {
      const conn = existingConnection.rows[0]
      
      // Only the recipient can accept/reject a pending request
      if (status !== 'pending' && conn.status === 'pending' && conn.user_id !== userId) {
        await query(
          `UPDATE connections SET status = $3, updated_at = NOW()
           WHERE (user_id = $1 AND connected_user_id = $2) OR (user_id = $2 AND connected_user_id = $1)`,
          [userId, connectedUserId, status]
        )
      } else if (conn.user_id === userId) {
        // The sender can update their own request
        await query(
          `UPDATE connections SET status = $3, updated_at = NOW()
           WHERE user_id = $1 AND connected_user_id = $2`,
          [userId, connectedUserId, status]
        )
      } else {
        return res.status(400).json({ error: 'Cannot modify this connection' })
      }
    } else {
      // Create new connection (always as pending)
      await query(
        `INSERT INTO connections (user_id, connected_user_id, status, created_at, updated_at)
         VALUES ($1, $2, 'pending', NOW(), NOW())`,
        [userId, connectedUserId]
      )
      updatedStatus = 'pending'
    }
    
    // Update connection counts for both users
    await updateConnectionCounts(userId)
    await updateConnectionCounts(connectedUserId)
    
    // Emit real-time events to both users
    if (io) {
      // Get user details for the notification
      const userDetails = await query(
        `SELECT name, avatar_url FROM users WHERE id = $1`,
        [userId]
      )
      
      const connectedUserDetails = await query(
        `SELECT name, avatar_url FROM users WHERE id = $1`,
        [connectedUserId]
      )
      
      // Emit to the user who initiated the action
      io.to(`user:${userId}`).emit('connection:updated', {
        userId: connectedUserId,
        status: updatedStatus,
        user: connectedUserDetails.rows[0] || {}
      })
      
      // Emit to the connected user
      io.to(`user:${connectedUserId}`).emit('connection:updated', {
        userId: userId,
        status: updatedStatus,
        user: userDetails.rows[0] || {}
      })
      
      // If a connection was accepted, emit a special event
      if (updatedStatus === 'accepted') {
        io.to(`user:${userId}`).emit('connection:accepted', {
          userId: connectedUserId,
          user: connectedUserDetails.rows[0] || {}
        })
        
        io.to(`user:${connectedUserId}`).emit('connection:accepted', {
          userId: userId,
          user: userDetails.rows[0] || {}
        })
      }
    }
    
    return res.json({ success: true, status: updatedStatus })
  } catch (error) {
    console.error('Error updating connection:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Upload/update current user's avatar
router.put('/avatar', clerkAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    const userId = req.user.id
    const file = req.file
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    // Update user's avatar URL
    const avatarUrl = `/uploads/${file.filename}`
    const { rows } = await query(
      `UPDATE users SET avatar_url = $1, updated_at = NOW() 
       WHERE clerk_id = $2 
       RETURNING id, clerk_id, email, name, headline, bio, avatar_url`,
      [avatarUrl, userId]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ success: true, user: rows[0] })
  } catch (error) {
    console.error('Error updating avatar:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router