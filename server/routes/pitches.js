import express from 'express';
const router = express.Router();
import db from '../db.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

// Get all pitches
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, COUNT(pc.id) as comment_count, 
       COALESCE(SUM(CASE WHEN pv.vote_type = 'upvote' THEN 1 ELSE 0 END), 0) as upvotes,
       COALESCE(SUM(CASE WHEN pv.vote_type = 'downvote' THEN 1 ELSE 0 END), 0) as downvotes
       FROM pitches p 
       LEFT JOIN pitch_comments pc ON p.id = pc.pitch_id 
       LEFT JOIN pitch_votes pv ON p.id = pv.pitch_id
       GROUP BY p.id 
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pitches:', error);
    res.status(500).json({ error: 'Failed to fetch pitches' });
  }
});

// Vote on a pitch
router.post('/:id/vote', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;
    
    // Validate vote type
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    // Check if pitch exists
    const pitchResult = await db.query('SELECT * FROM pitches WHERE id = $1', [id]);
    if (pitchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    // Check if user already voted
    const existingVote = await db.query(
      'SELECT * FROM pitch_votes WHERE pitch_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    let result;
    if (existingVote.rows.length > 0) {
      // Update existing vote
      result = await db.query(
        'UPDATE pitch_votes SET vote_type = $1 WHERE pitch_id = $2 AND user_id = $3 RETURNING *',
        [voteType, id, userId]
      );
    } else {
      // Create new vote
      result = await db.query(
        'INSERT INTO pitch_votes (pitch_id, user_id, vote_type) VALUES ($1, $2, $3) RETURNING *',
        [id, userId, voteType]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error voting on pitch:', error);
    res.status(500).json({ error: 'Failed to vote on pitch' });
  }
});

// Request to connect with pitch creator
router.post('/:id/connect', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    
    // Check if pitch exists
    const pitchResult = await db.query('SELECT * FROM pitches WHERE id = $1', [id]);
    if (pitchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    const pitchOwnerId = pitchResult.rows[0].user_id;
    
    // Don't allow self-connection
    if (pitchOwnerId === userId) {
      return res.status(400).json({ error: 'Cannot connect with your own pitch' });
    }
    
    // Check if connection request already exists
     const existingRequest = await db.query(
       'SELECT * FROM pitch_connect_requests WHERE pitch_id = $1 AND requester_id = $2',
       [id, userId]
     );
     
     if (existingRequest.rows.length > 0) {
       return res.status(400).json({ error: 'Connection request already exists' });
     }
     
     // Create connection request
     const result = await db.query(
       'INSERT INTO pitch_connect_requests (pitch_id, requester_id, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
       [id, userId, message, 'pending']
     );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating connection request:', error);
    res.status(500).json({ error: 'Failed to create connection request' });
  }
});

// Get a single pitch with comments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pitch details
    const pitchResult = await db.query('SELECT * FROM pitches WHERE id = $1', [id]);
    
    if (pitchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    // Get comments for this pitch
    const commentsResult = await db.query(
      `SELECT pc.*, u.name as user_name 
       FROM pitch_comments pc
       LEFT JOIN users u ON pc.user_id = u.clerk_id
       WHERE pc.pitch_id = $1 
       ORDER BY pc.created_at ASC`, 
      [id]
    );
    
    res.json({
      pitch: pitchResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching pitch details:', error);
    res.status(500).json({ error: 'Failed to fetch pitch details' });
  }
});

// Create a new pitch
router.post('/', clerkAuth, async (req, res) => {
  try {
    const { title, summary } = req.body;
    
    // Validate input
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('User not authenticated or user ID missing:', req.user);
      return res.status(401).json({ error: 'user_not_found' });
    }
    
    const userId = req.user.id;
    console.log('Creating pitch with user ID:', userId);
    console.log('User object:', req.user);
    
    const result = await db.query(
      'INSERT INTO pitches (user_id, title, summary) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, summary]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pitch:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create pitch: ' + error.message });
  }
});

// Update a pitch
router.put('/:id', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, status } = req.body;
    const userId = req.user.id;
    
    // Check if pitch exists and belongs to user
    const checkResult = await db.query(
      'SELECT * FROM pitches WHERE id = $1', 
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this pitch' });
    }
    
    // Update the pitch
    const result = await db.query(
      `UPDATE pitches 
       SET title = $1, summary = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [title, summary, status, id, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pitch:', error);
    res.status(500).json({ error: 'Failed to update pitch' });
  }
});

// Delete a pitch
router.delete('/:id', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if pitch exists and belongs to user
    const checkResult = await db.query(
      'SELECT * FROM pitches WHERE id = $1', 
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this pitch' });
    }
    
    // Delete the pitch (comments will be cascade deleted)
    await db.query('DELETE FROM pitches WHERE id = $1 AND user_id = $2', [id, userId]);
    
    res.json({ message: 'Pitch deleted successfully' });
  } catch (error) {
    console.error('Error deleting pitch:', error);
    res.status(500).json({ error: 'Failed to delete pitch' });
  }
});

// Add a comment to a pitch
router.post('/:id/comments', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Check if pitch exists
    const pitchResult = await db.query('SELECT * FROM pitches WHERE id = $1', [id]);
    
    if (pitchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    // Add the comment
    const result = await db.query(
      'INSERT INTO pitch_comments (pitch_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, userId, content]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a comment
router.delete('/:pitchId/comments/:commentId', clerkAuth, async (req, res) => {
  try {
    const { pitchId, commentId } = req.params;
    const userId = req.user.id;
    
    // Check if comment exists and belongs to user
    const checkResult = await db.query(
      'SELECT * FROM pitch_comments WHERE id = $1 AND pitch_id = $2', 
      [commentId, pitchId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Delete the comment
    await db.query('DELETE FROM pitch_comments WHERE id = $1', [commentId]);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;