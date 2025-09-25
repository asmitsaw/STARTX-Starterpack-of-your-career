import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutesFactory from './routes/posts.js'
import trendingRoutes from './routes/trending.js'
import previewRoutes from './routes/preview.js'
import { errorHandler } from './middleware/error.js'
import jobsRoutes from './routes/jobs.js'
import messagesRoutes from './routes/messages.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }
})

app.set('io', io)

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
const uploadsDir = path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

// Public base used to build absolute media URLs in responses
const PUBLIC_API_BASE = process.env.PUBLIC_API_BASE || ''
app.set('PUBLIC_API_BASE', PUBLIC_API_BASE)

io.on('connection', (socket) => {
  // You could join user-specific rooms later
  socket.on('conversation:join', (conversationId) => {
    if (!conversationId) return
    socket.join(`conversation:${conversationId}`)
  })
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutesFactory(io))
app.use('/api/trending', trendingRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/preview', previewRoutes)
app.use('/api/messages', messagesRoutes)

app.use(errorHandler)

const port = process.env.PORT || 5174
server.listen(port, () => {
  console.log(`API listening on :${port}`)
})

