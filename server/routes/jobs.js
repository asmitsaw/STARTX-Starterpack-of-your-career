import express from 'express'
import { query as dbQuery } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// POST /api/jobs - create a new job
router.post('/', async (req, res, next) => {
  try {
    const {
      title, company, location, salaryLpa,
      workMode, type, experience,
    } = req.body

    const { rows } = await dbQuery(
      `INSERT INTO jobs (title, company, location, salary_lpa, work_mode, type, experience)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title, company, location, salaryLpa, workMode, type, experience]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

// GET /api/jobs - list jobs
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await dbQuery(
      `SELECT * FROM jobs ORDER BY created_at DESC`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/jobs/suggested - latest jobs for the sidebar
router.get('/suggested', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await dbQuery(
      `SELECT id, title, company, location, logo_url
       FROM jobs
       ORDER BY created_at DESC
       LIMIT 6`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/jobs/:id/apply - submit application
router.post('/:id/apply', async (req, res, next) => {
  try {
    const { id } = req.params
    const { applicantName, applicantEmail } = req.body

    const { rows } = await dbQuery(
      `INSERT INTO applications (job_id, applicant_name, applicant_email)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [id, applicantName, applicantEmail]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

export default router


