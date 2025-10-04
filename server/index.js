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
import uploadRoutes from './routes/upload.js'
import pitchesRoutes from './routes/pitches.js'
import interviewRoutes from './routes/interview.js'
import certificatesRoutes from './routes/certificates.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }
})

app.set('io', io)

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}))
// Increase JSON/body size limits to prevent PayloadTooLargeError when sending
// larger payloads (e.g., base64 images from profile edits)
app.use(express.json({ limit: process.env.BODY_LIMIT || '5mb' }))
app.use(express.urlencoded({ limit: process.env.BODY_LIMIT || '5mb', extended: true }))
app.use(cookieParser())
const uploadsDir = path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

// Public base used to build absolute media URLs in responses
const PUBLIC_API_BASE = process.env.PUBLIC_API_BASE || ''
app.set('PUBLIC_API_BASE', PUBLIC_API_BASE)

io.on('connection', (socket) => {
  console.log('New client connected')
  
  // You could join user-specific rooms later
  socket.on('conversation:join', (conversationId) => {
    if (!conversationId) return
    socket.join(`conversation:${conversationId}`)
  })
  
  // Join user-specific room for connection updates
  socket.on('user:join', (userId) => {
    if (!userId) return
    socket.join(`user:${userId}`)
    console.log(`User ${userId} joined their room`)
    
    // Join the feed room to receive broadcast updates
    socket.join('feed')
  })
  
  // Handle post creation broadcasts
  socket.on('post:create', async (postData) => {
    try {
      const { authorId, connectedUserIds } = postData;
      
      // Broadcast to all connected users
      if (Array.isArray(connectedUserIds)) {
        connectedUserIds.forEach(userId => {
          io.to(`user:${userId}`).emit('post:created', postData);
        });
      }
      
      // Also broadcast to the author
      io.to(`user:${authorId}`).emit('post:created', postData);
    } catch (error) {
      console.error('Error broadcasting post:', error);
    }
  });
  
  // Handle post like broadcasts
  socket.on('post:like', async (likeData) => {
    try {
      const { postId, userId, liked, authorId } = likeData;
      
      // Broadcast to post author
      io.to(`user:${authorId}`).emit('post:liked', { postId, userId, liked });
      
      // Broadcast to the user who liked
      if (userId !== authorId) {
        io.to(`user:${userId}`).emit('post:liked', { postId, userId, liked });
      }
    } catch (error) {
      console.error('Error broadcasting like:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected')
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
app.use('/api/messages', messagesRoutes)
app.use('/api/preview', previewRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/pitches', pitchesRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/certificates', certificatesRoutes)

app.use(errorHandler)

// --- Serve built frontend (SPA) when running only the API server ---
// This lets you open http://localhost:5174/ directly after `npm run build`
// Commented out for development mode to avoid port conflict
/*
try {
  const clientDir = path.resolve(process.cwd(), 'dist')
  const clientIndexHtml = path.join(clientDir, 'index.html')

  // Serve static assets from /dist
  app.use(express.static(clientDir))

  // SPA fallback for any non-API route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(clientIndexHtml)
  })
} catch {}
*/

// Start server with auto port fallback when the desired port is busy
let currentPort = parseInt(process.env.PORT, 10) || 5174

function start() {
  server.listen(currentPort, () => {
    console.log(`API listening on :${currentPort}`)
  })
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Port ${currentPort} is in use. Trying ${currentPort + 1}...`)
    currentPort += 1
    start()
  } else {
    throw err
  }
})

start()

