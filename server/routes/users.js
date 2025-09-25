import express from 'express'
import { query, pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

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

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { rows } = await query(
      'SELECT id, name, headline, email, profile_views, post_impressions, created_at, avatar_url FROM users WHERE id=$1',
      [id]
    )
    if (!rows.length) return res.status(404).json({ error: 'not_found' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

// Aggregated current user's profile
router.get('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const base = await query(
      `SELECT u.id, u.name, u.headline, u.email, u.avatar_url,
              p.title, p.location, p.about, p.banner_url, p.highlights, p.connections_count
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [userId]
    )
    if (!base.rows.length) return res.status(404).json({ error: 'not_found' })
    const [experiences, education, skills] = await Promise.all([
      query(`SELECT id, company, role, period, summary, skills, sort_order FROM user_experiences WHERE user_id=$1 ORDER BY sort_order, created_at`, [userId]),
      query(`SELECT id, school, degree, period, sort_order FROM user_education WHERE user_id=$1 ORDER BY sort_order, created_at`, [userId]),
      query(`SELECT skill FROM user_skills WHERE user_id=$1 ORDER BY skill`, [userId])
    ])
    const row = base.rows[0]
    res.json({
      id: row.id,
      name: row.name,
      headline: row.headline,
      email: row.email,
      title: row.title || '',
      location: row.location || '',
      about: row.about || '',
      bannerUrl: row.banner_url || null,
      avatarUrl: row.avatar_url || null,
      highlights: row.highlights || [],
      connections: row.connections_count ?? 0,
      experience: experiences.rows.map(r => ({ id: r.id, company: r.company, role: r.role, period: r.period, summary: r.summary, skills: r.skills || [] })),
      education: education.rows.map(r => ({ id: r.id, school: r.school, degree: r.degree, period: r.period })),
      skills: skills.rows.map(r => r.skill),
    })
  } catch (e) { next(e) }
})

// Update current user's profile. Replaces arrays transactionally when provided
router.put('/me/profile', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const userId = req.user.id
    const {
      title,
      location,
      about,
      bannerUrl,
      highlights,
      connections,
      experience,
      education,
      skills,
    } = req.body || {}

    await client.query('BEGIN')

    // Upsert scalar profile fields
    if (
      title !== undefined ||
      location !== undefined ||
      about !== undefined ||
      bannerUrl !== undefined ||
      highlights !== undefined ||
      connections !== undefined
    ) {
      // Read current to merge partials
      const current = await client.query(
        'SELECT title, location, about, banner_url, highlights, connections_count FROM user_profiles WHERE user_id=$1',
        [userId]
      )
      const cur = current.rows[0] || {}
      const nextTitle = title !== undefined ? title : cur.title || ''
      const nextLocation = location !== undefined ? location : cur.location || ''
      const nextAbout = about !== undefined ? about : cur.about || ''
      const nextBanner = bannerUrl !== undefined ? bannerUrl : cur.banner_url || null
      const nextHighlights = highlights !== undefined ? highlights : cur.highlights || []
      const nextConnections = connections !== undefined ? connections : cur.connections_count || 0
      await client.query(
        `INSERT INTO user_profiles (user_id, title, location, about, banner_url, highlights, connections_count, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (user_id) DO UPDATE
           SET title=EXCLUDED.title,
               location=EXCLUDED.location,
               about=EXCLUDED.about,
               banner_url=EXCLUDED.banner_url,
               highlights=EXCLUDED.highlights,
               connections_count=EXCLUDED.connections_count,
               updated_at=now()`,
        [userId, nextTitle, nextLocation, nextAbout, nextBanner, nextHighlights, nextConnections]
      )
    }

    // Replace experiences if provided
    if (Array.isArray(experience)) {
      await client.query('DELETE FROM user_experiences WHERE user_id=$1', [userId])
      for (let i = 0; i < experience.length; i++) {
        const exp = experience[i] || {}
        await client.query(
          `INSERT INTO user_experiences (user_id, company, role, period, summary, skills, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [userId, exp.company || '', exp.role || '', exp.period || '', exp.summary || '', Array.isArray(exp.skills) ? exp.skills : [], i]
        )
      }
    }

    // Replace education if provided
    if (Array.isArray(education)) {
      await client.query('DELETE FROM user_education WHERE user_id=$1', [userId])
      for (let i = 0; i < education.length; i++) {
        const ed = education[i] || {}
        await client.query(
          `INSERT INTO user_education (user_id, school, degree, period, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [userId, ed.school || '', ed.degree || '', ed.period || '', i]
        )
      }
    }

    // Replace skills if provided
    if (Array.isArray(skills)) {
      await client.query('DELETE FROM user_skills WHERE user_id=$1', [userId])
      const unique = Array.from(new Set(skills.map(s => String(s || '').trim()).filter(Boolean)))
      for (const s of unique) {
        await client.query('INSERT INTO user_skills (user_id, skill) VALUES ($1,$2)', [userId, s])
      }
    }

    await client.query('COMMIT')

    // Return the fresh state using the same shape as GET /me/profile
    const base = await query(
      `SELECT u.id, u.name, u.headline, u.email, u.avatar_url,
              p.title, p.location, p.about, p.banner_url, p.highlights, p.connections_count
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [userId]
    )
    const [experiences, educationRows, skillRows] = await Promise.all([
      query(`SELECT id, company, role, period, summary, skills, sort_order FROM user_experiences WHERE user_id=$1 ORDER BY sort_order, created_at`, [userId]),
      query(`SELECT id, school, degree, period, sort_order FROM user_education WHERE user_id=$1 ORDER BY sort_order, created_at`, [userId]),
      query(`SELECT skill FROM user_skills WHERE user_id=$1 ORDER BY skill`, [userId])
    ])
    const row = base.rows[0]
    return res.json({
      id: row.id,
      name: row.name,
      headline: row.headline,
      email: row.email,
      title: row.title || '',
      location: row.location || '',
      about: row.about || '',
      bannerUrl: row.banner_url || null,
      avatarUrl: row.avatar_url || null,
      highlights: row.highlights || [],
      connections: row.connections_count ?? 0,
      experience: experiences.rows.map(r => ({ id: r.id, company: r.company, role: r.role, period: r.period, summary: r.summary, skills: r.skills || [] })),
      education: educationRows.rows.map(r => ({ id: r.id, school: r.school, degree: r.degree, period: r.period })),
      skills: skillRows.rows.map(r => r.skill),
    })
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    next(e)
  } finally {
    client.release()
  }
})

router.get('/suggestions', requireAuth, async (req, res, next) => {
  try {
    const currentUserId = req.user.id
    const { rows } = await query(
      `SELECT id, name, headline, avatar_url
       FROM users
       WHERE id <> $1 AND id NOT IN (
         SELECT connection_id FROM connections WHERE user_id=$1
       )
       ORDER BY created_at DESC
       LIMIT 10`,
      [currentUserId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Upload/update current user's avatar
router.put('/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' })
    const base = req.app.get('PUBLIC_API_BASE') || ''
    const avatarUrl = `${base}/uploads/${req.file.filename}`
    const { rows } = await query('UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING avatar_url', [avatarUrl, req.user.id])
    res.json({ avatar_url: rows[0].avatar_url })
  } catch (e) { next(e) }
})

// Upload/update current user's banner
router.put('/banner', requireAuth, upload.single('banner'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' })
    const base = req.app.get('PUBLIC_API_BASE') || ''
    const bannerUrl = `${base}/uploads/${req.file.filename}`
    await query(
      `INSERT INTO user_profiles(user_id, banner_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET banner_url=EXCLUDED.banner_url, updated_at=now()`,
      [req.user.id, bannerUrl]
    )
    res.json({ banner_url: bannerUrl })
  } catch (e) { next(e) }
})

export default router


