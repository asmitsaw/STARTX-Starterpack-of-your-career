import express from 'express'
import { query, pool } from '../db.js'
import { clerkAuth } from '../middleware/clerkAuth.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export default function messageRoutes(io) {
const router = express.Router()

// List conversations for current user with last message preview
router.get('/conversations', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { rows } = await query(
      `SELECT 
        c.id,
        c.type,
        c.name,
        c.updated_at,
        (
          SELECT json_agg(json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar_url', u.avatar_url
          ))
          FROM conversation_participants cp
          JOIN users u ON u.id = cp.user_id
          WHERE cp.conversation_id = c.id AND cp.user_id != $1::uuid
        ) as participants,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'sender_id', m.sender_id,
            'created_at', m.created_at,
            'is_ai_message', m.is_ai_message
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)::int
          FROM messages m
          LEFT JOIN message_read_receipts mrr ON mrr.message_id = m.id AND mrr.user_id = $1::uuid
          WHERE m.conversation_id = c.id 
            AND (m.sender_id IS NULL OR m.sender_id::uuid != $1::uuid)
            AND mrr.id IS NULL
        ) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.user_id = $1::uuid
      ORDER BY c.updated_at DESC`,
      [userId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Get total unread message count for current user
router.get('/unread-count', clerkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { rows } = await query(
      `SELECT COUNT(DISTINCT m.id)::int as unread_count
       FROM messages m
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
       WHERE cp.user_id = $1::uuid
         AND (m.sender_id IS NULL OR m.sender_id::uuid != $1::uuid)
         AND m.delivery_status != 'read'
         AND m.deleted_at IS NULL`,
      [userId]
    )
    res.json({ unreadCount: rows[0]?.unread_count || 0 })
  } catch (e) { next(e) }
})

// Create (or get existing) 1:1 conversation with another user
router.post('/conversations', clerkAuth, async (req, res, next) => {
  const clientUserId = req.user.id
  const { participantId, type } = req.body || {}
  
  try {
    // For AI conversations
    if (type === 'ai') {
      // Check if user already has an AI conversation
      const existing = await query(
        `SELECT c.id FROM conversations c
         JOIN conversation_participants cp ON cp.conversation_id = c.id
         WHERE c.type = 'ai' AND cp.user_id = $1::uuid`,
        [clientUserId]
      )
      
      if (existing.rows.length) {
        return res.json({ id: existing.rows[0].id })
      }
      
      // Create new AI conversation
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const conv = await client.query(
          `INSERT INTO conversations (type, name) VALUES ('ai', 'Gemini AI') RETURNING id`
        )
        const conversationId = conv.rows[0].id
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`,
          [conversationId, clientUserId]
        )
        await client.query(
          `INSERT INTO ai_chat_sessions (user_id, conversation_id, context) VALUES ($1, $2, '{}'::jsonb)`,
          [clientUserId, conversationId]
        )
        await client.query('COMMIT')
        return res.json({ id: conversationId })
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
    
    // For direct messages
    if (!participantId) return res.status(400).json({ error: 'participant_required' })
    
    // Check if users are connected
    const { rows: connCheck } = await query(
      `SELECT are_users_connected($1::uuid, $2::uuid) as connected`,
      [clientUserId, participantId]
    )
    
    if (!connCheck[0].connected) {
      return res.status(403).json({ 
        error: 'not_connected',
        message: 'You must be connected with this user to start a conversation'
      })
    }
    
    // Check if conversation exists
    const existing = await query(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
       WHERE c.type = 'direct'
         AND cp1.user_id = $1::uuid
         AND cp2.user_id = $2::uuid
       LIMIT 1`,
      [clientUserId, participantId]
    )
    
    if (existing.rows.length) {
      return res.json({ id: existing.rows[0].id })
    }
    
    // Create new conversation
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const conv = await client.query(
        `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`
      )
      const conversationId = conv.rows[0].id
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [conversationId, clientUserId, participantId]
      )
      await client.query('COMMIT')
      res.json({ id: conversationId })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (e) { next(e) }
})

// Get messages in a conversation
router.get('/conversations/:id/messages', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    // Ensure membership
    const { rows: member } = await query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id=$1::uuid AND user_id=$2::uuid',
      [id, userId]
    )
    if (!member.length) return res.status(403).json({ error: 'not_member' })
    
    const { rows } = await query(
      `SELECT m.id, m.sender_id, m.content, m.media_url, m.message_type, m.is_ai_message, m.created_at,
              m.delivery_status, m.delivered_at, m.read_at,
              u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       LEFT JOIN users u ON u.id::text = m.sender_id
       WHERE m.conversation_id=$1::uuid AND m.deleted_at IS NULL
       ORDER BY m.created_at ASC
       LIMIT 500`,
      [id]
    )
    
    // Mark messages as read and update delivery status
    await query(
      `UPDATE messages 
       SET delivery_status = 'read', read_at = NOW()
       WHERE conversation_id = $1::uuid
         AND (sender_id IS NULL OR sender_id != $2)
         AND delivery_status != 'read'`,
      [id, userId]
    )
    
    await query(
      `INSERT INTO message_read_receipts (message_id, user_id)
       SELECT m.id, $2::uuid
       FROM messages m
       WHERE m.conversation_id = $1 
         AND (m.sender_id IS NULL OR m.sender_id::uuid != $2::uuid)
         AND NOT EXISTS (
           SELECT 1 FROM message_read_receipts mrr 
           WHERE mrr.message_id = m.id AND mrr.user_id = $2::uuid
         )
       ON CONFLICT DO NOTHING`,
      [id, userId]
    )
    
    res.json(rows)
  } catch (e) { next(e) }
})

// Send a message
router.post('/conversations/:id/messages', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { content, mediaUrl, messageType } = req.body || {}
    
    console.log('📨 Message received:', {
      conversationId: id,
      userId,
      content,
      messageType
    })
    
    if (!content && !mediaUrl) return res.status(400).json({ error: 'content_required' })
    
    // Ensure membership
    const { rows: member } = await query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id=$1::uuid AND user_id=$2::uuid',
      [id, userId]
    )
    if (!member.length) return res.status(403).json({ error: 'not_member' })
    
    // Check if this is an AI conversation and message mentions @gemini
    const isAIConvo = await query(
      `SELECT type FROM conversations WHERE id = $1::uuid`,
      [id]
    )
    
    const { rows } = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, media_url, message_type, delivery_status)
       VALUES ($1,$2,$3,$4,$5,'sent')
       RETURNING id, conversation_id, sender_id, content, media_url, message_type, is_ai_message, created_at, delivery_status`,
      [id, userId, content || null, mediaUrl || null, messageType || 'text']
    )
    
    const message = rows[0]
    
    // Emit via Socket.IO
    io.to(`conversation:${id}`).emit('message:new', message)
    
    // If AI conversation or @gemini mentioned, get AI response
    if (isAIConvo.rows[0]?.type === 'ai' || content?.includes('@gemini')) {
      console.log('🤖 AI conversation detected, generating response...')
      console.log('   Conversation type:', isAIConvo.rows[0]?.type)
      console.log('   User message:', content)
      
      try {
        // Try gemini-1.5-pro which is more stable
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' })
        const userPrompt = content.replace('@gemini', '').trim()
        console.log('   Sending to Gemini:', userPrompt)
        
        const result = await model.generateContent(userPrompt)
        const aiResponse = result.response.text()
        console.log('   ✅ Gemini response:', aiResponse.substring(0, 100) + '...')
        
        const { rows: aiMsg } = await query(
          `INSERT INTO messages (conversation_id, sender_id, content, is_ai_message, message_type)
           VALUES ($1, NULL, $2, true, 'text')
           RETURNING id, conversation_id, sender_id, content, is_ai_message, created_at`,
          [id, aiResponse]
        )
        
        // Add AI metadata for frontend
        const aiMessageWithMeta = {
          ...aiMsg[0],
          sender_name: 'Gemini AI',
          sender_avatar: null,
          message_type: 'text'
        }
        
        console.log('   📤 Emitting AI message to room:', `conversation:${id}`)
        io.to(`conversation:${id}`).emit('message:new', aiMessageWithMeta)
      } catch (aiError) {
        console.error('❌ AI response error:', aiError.message)
        console.error('   Full error:', aiError)
      }
    }
    
    res.status(201).json(message)
  } catch (e) { next(e) }
})

// Typing indicator - start
router.post('/conversations/:id/typing', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    await query(
      `INSERT INTO typing_indicators (conversation_id, user_id)
       VALUES ($1::uuid, $2::uuid)
       ON CONFLICT (conversation_id, user_id) 
       DO UPDATE SET started_at = NOW()`,
      [id, userId]
    )
    
    io.to(`conversation:${id}`).emit('typing:start', { userId, conversationId: id })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Typing indicator - stop
router.delete('/conversations/:id/typing', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    await query(
      `DELETE FROM typing_indicators WHERE conversation_id = $1::uuid AND user_id = $2::uuid`,
      [id, userId]
    )
    
    io.to(`conversation:${id}`).emit('typing:stop', { userId, conversationId: id })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Mark conversation as read
router.post('/conversations/:id/read', clerkAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    await query(
      `UPDATE conversation_participants 
       SET last_read_at = NOW() 
       WHERE conversation_id = $1::uuid AND user_id = $2::uuid`,
      [id, userId]
    )
    
    res.json({ ok: true })
  } catch (e) { next(e) }
})

return router
}


