import express from 'express'
import { query, pool } from '../db.js'
import { clerkAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

// Get all connections for current user
router.get('/', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    
    // Check if connections table exists
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'connections'
      ) as exists`
    )
    
    if (!tableCheck.rows[0].exists) {
      return res.json([])
    }
    
    const { rows } = await query(
      `SELECT 
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.user_id = $1 THEN u2.id
          ELSE u1.id
        END as user_id,
        CASE 
          WHEN c.user_id = $1 THEN u2.name
          ELSE u1.name
        END as name,
        CASE 
          WHEN c.user_id = $1 THEN u2.avatar_url
          ELSE u1.avatar_url
        END as avatar_url,
        CASE 
          WHEN c.user_id = $1 THEN u2.headline
          ELSE u1.headline
        END as headline,
        CASE 
          WHEN c.user_id = $1 THEN 'sent'
          ELSE 'received'
        END as direction
      FROM connections c
      JOIN users u1 ON u1.id = c.user_id
      JOIN users u2 ON u2.id = c.connected_user_id
      WHERE (c.user_id = $1 OR c.connected_user_id = $1)
      ORDER BY c.updated_at DESC`,
      [userId]
    )
    
    res.json(rows)
  } catch (e) {
    next(e)
  }
})

// Get pending connection requests (received)
router.get('/requests', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    
    // Check if connections table exists
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'connections'
      ) as exists`
    )
    
    if (!tableCheck.rows[0].exists) {
      return res.json([])
    }
    
    const { rows } = await query(
      `SELECT 
        c.id,
        c.created_at,
        u.id as user_id,
        u.name,
        u.avatar_url,
        u.headline
      FROM connections c
      JOIN users u ON u.id = c.user_id
      WHERE c.connected_user_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC`,
      [userId]
    )
    
    res.json(rows)
  } catch (e) {
    next(e)
  }
})

// Send connection request
router.post('/request', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { targetUserId } = req.body
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' })
    }
    
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' })
    }
    
    // Check if connections table exists
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'connections'
      ) as exists`
    )
    
    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({ 
        error: 'connections_table_missing',
        message: 'Connections table not found. Please run: npm run migrate:connections' 
      })
    }
    
    // Check if connection already exists
    const existing = await query(
      `SELECT id, status FROM connections
       WHERE (user_id = $1 AND connected_user_id = $2)
          OR (user_id = $2 AND connected_user_id = $1)`,
      [userId, targetUserId]
    )
    
    if (existing.rows.length > 0) {
      const status = existing.rows[0].status
      if (status === 'accepted') {
        return res.status(400).json({ error: 'Already connected' })
      } else if (status === 'pending') {
        return res.status(400).json({ error: 'Request already sent' })
      } else if (status === 'rejected') {
        // Update to pending again
        await query(
          `UPDATE connections SET status = 'pending', updated_at = NOW()
           WHERE id = $1`,
          [existing.rows[0].id]
        )
        return res.json({ message: 'Request sent again', status: 'pending' })
      }
    }
    
    // Create new connection request
    const { rows } = await query(
      `INSERT INTO connections (user_id, connected_user_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, status, created_at`,
      [userId, targetUserId]
    )
    
    // TODO: Create notification for target user
    await query(
      `INSERT INTO notifications (user_id, type, message, related_user_id)
       VALUES ($1, 'connection_request', $2, $3)`,
      [
        targetUserId,
        'sent you a connection request',
        userId
      ]
    )
    
    res.json({ 
      message: 'Connection request sent',
      connection: rows[0]
    })
  } catch (e) {
    next(e)
  }
})

// Accept connection request
router.post('/accept/:connectionId', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { connectionId } = req.params
    
    // Verify this request is for current user
    const { rows: connection } = await query(
      `SELECT user_id, connected_user_id FROM connections
       WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'`,
      [connectionId, userId]
    )
    
    if (connection.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' })
    }
    
    // Update status to accepted
    await query(
      `UPDATE connections SET status = 'accepted', updated_at = NOW()
       WHERE id = $1`,
      [connectionId]
    )
    
    // Create notification for requester
    await query(
      `INSERT INTO notifications (user_id, type, message, related_user_id)
       VALUES ($1, 'connection_accepted', $2, $3)`,
      [
        connection[0].user_id,
        'accepted your connection request',
        userId
      ]
    )
    
    res.json({ message: 'Connection accepted', status: 'accepted' })
  } catch (e) {
    next(e)
  }
})

// Reject connection request
router.post('/reject/:connectionId', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { connectionId } = req.params
    
    // Verify this request is for current user
    const { rows: connection } = await query(
      `SELECT user_id FROM connections
       WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'`,
      [connectionId, userId]
    )
    
    if (connection.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' })
    }
    
    // Update status to rejected
    await query(
      `UPDATE connections SET status = 'rejected', updated_at = NOW()
       WHERE id = $1`,
      [connectionId]
    )
    
    res.json({ message: 'Connection rejected', status: 'rejected' })
  } catch (e) {
    next(e)
  }
})

// Remove/unfollow connection
router.delete('/:connectionId', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { connectionId } = req.params
    
    // Verify user is part of this connection
    const { rows: connection } = await query(
      `SELECT id FROM connections
       WHERE id = $1 AND (user_id = $2 OR connected_user_id = $2)`,
      [connectionId, userId]
    )
    
    if (connection.length === 0) {
      return res.status(404).json({ error: 'Connection not found' })
    }
    
    // Delete the connection
    await query('DELETE FROM connections WHERE id = $1', [connectionId])
    
    res.json({ message: 'Connection removed' })
  } catch (e) {
    next(e)
  }
})

// Check connection status with a user
router.get('/status/:targetUserId', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { targetUserId } = req.params
    
    const { rows } = await query(
      `SELECT get_connection_status($1, $2) as status`,
      [userId, targetUserId]
    )
    
    res.json({ status: rows[0].status })
  } catch (e) {
    next(e)
  }
})

export default router
