import express from 'express'
import db from '../db.js'

const router = express.Router()

// Create/Issue a new certificate
router.post('/', async (req, res) => {
  try {
    const {
      certificateCode,
      userId,
      courseId,
      courseName,
      studentName,
      completionDate
    } = req.body

    // Check if certificate already exists
    const existing = await db.query(
      'SELECT * FROM certificates WHERE certificate_code = $1',
      [certificateCode]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Certificate already exists' })
    }

    // Insert new certificate
    const result = await db.query(
      `INSERT INTO certificates 
       (certificate_code, user_id, course_id, course_name, student_name, completion_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [certificateCode, userId, courseId, courseName, studentName, completionDate]
    )

    res.status(201).json({
      success: true,
      certificate: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating certificate:', error)
    res.status(500).json({ error: 'Failed to create certificate' })
  }
})

// Verify a certificate by code
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params

    const result = await db.query(
      'SELECT * FROM certificates WHERE certificate_code = $1',
      [code]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Certificate not found' 
      })
    }

    res.json({
      valid: true,
      certificate: result.rows[0]
    })
  } catch (error) {
    console.error('Error verifying certificate:', error)
    res.status(500).json({ error: 'Failed to verify certificate' })
  }
})

// Get all certificates for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const result = await db.query(
      'SELECT * FROM certificates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    res.json({
      success: true,
      certificates: result.rows
    })
  } catch (error) {
    console.error('Error fetching user certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
})

// Get all certificates (admin)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM certificates ORDER BY created_at DESC LIMIT 100'
    )

    res.json({
      success: true,
      certificates: result.rows
    })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
})

export default router
