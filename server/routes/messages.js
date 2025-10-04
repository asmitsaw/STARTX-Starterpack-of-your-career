import express from 'express'
import { query } from '../db.js'
import { clerkAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

// List conversations for current user with last message preview
router.get('/conversations', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { rows } = await query(
      `WITH member_convos AS (
         SELECT c.id
         FROM conversation_members cm
         JOIN conversations c ON c.id = cm.conversation_id
         WHERE cm.user_id = $1
       ), last_messages AS (
         SELECT DISTINCT ON (m.conversation_id)
                m.conversation_id, m.text, m.attachment_url, m.created_at
         FROM messages m
         WHERE m.conversation_id IN (SELECT id FROM member_convos)
         ORDER BY m.conversation_id, m.created_at DESC
       )
       SELECT c.id as conversation_id,
              lm.text as last_text,
              lm.attachment_url as last_attachment_url,
              lm.created_at as last_at
       FROM conversations c
       LEFT JOIN last_messages lm ON lm.conversation_id = c.id
       WHERE c.id IN (SELECT id FROM member_convos)
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`
      , [userId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Create (or get existing) 1:1 conversation with another user
router.post('/conversations', clerkAuth, async (req, res, next) => {
  const clientUserId = req.user.id
  const { participantId } = req.body || {}
  if (!participantId) return res.status(400).json({ error: 'participant_required' })
  try {
    // Check if a conversation already exists with exactly these two users
    const existing = await query(
      `SELECT cm1.conversation_id AS id
       FROM conversation_members cm1
       JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
       GROUP BY cm1.conversation_id
       HAVING COUNT(*) = 2 AND BOOL_AND(cm1.user_id IN ($1,$2)) AND BOOL_AND(cm2.user_id IN ($1,$2))`,
      [clientUserId, participantId]
    )
    let conversationId
    if (existing.rows.length) {
      conversationId = existing.rows[0].id
    } else {
      const inserted = await query('INSERT INTO conversations DEFAULT VALUES RETURNING id', [])
      conversationId = inserted.rows[0].id
      await query(
        'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3)',
        [conversationId, clientUserId, participantId]
      )
    }
    res.json({ id: conversationId })
  } catch (e) { next(e) }
})

// Get messages in a conversation
router.get('/conversations/:id/messages', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    // Ensure membership
    const { rows: member } = await query(
      'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',
      [id, userId]
    )
    if (!member.length) return res.status(403).json({ error: 'not_member' })
    const { rows } = await query(
      `SELECT id, sender_id, text, attachment_url, created_at
       FROM messages
       WHERE conversation_id=$1
       ORDER BY created_at ASC
       LIMIT 200`,
      [id]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Send a message
router.post('/conversations/:id/messages', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { text, attachmentUrl } = req.body || {}
    if (!text && !attachmentUrl) return res.status(400).json({ error: 'content_required' })
    // Ensure membership
    const { rows: member } = await query(
      'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',
      [id, userId]
    )
    if (!member.length) return res.status(403).json({ error: 'not_member' })
    const { rows } = await query(
      `INSERT INTO messages (conversation_id, sender_id, text, attachment_url)
       VALUES ($1,$2,$3,$4)
       RETURNING id, conversation_id, sender_id, text, attachment_url, created_at`,
      [id, userId, text || null, attachmentUrl || null]
    )
    // Emit via Socket.IO to room for this conversation
    const io = req.app.get('io')
    if (io) io.to(`conversation:${id}`).emit('message:new', rows[0])
    res.status(201).json(rows[0])
  } catch (e) { next(e) }
})

// Join a conversation room via HTTP (client should also join over socket side)
router.post('/conversations/:id/join', clerkAuth, (req, res) => {
  res.json({ ok: true })
})

export default router


