import express from 'express'
import { query } from '../db.js'
import { clerkAuth, optionalClerkAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

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

export default router


