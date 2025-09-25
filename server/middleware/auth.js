import jwt from 'jsonwebtoken'

const TOKEN_NAME = 'token'

export function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization || ''
    const fromCookie = req.cookies?.[TOKEN_NAME]
    const raw = fromCookie || (bearer.startsWith('Bearer ') ? bearer.slice(7) : null)
    if (!raw) return res.status(401).json({ error: 'unauthorized' })
    const payload = jwt.verify(raw, process.env.JWT_SECRET)
    req.user = { id: payload.sub }
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

export function issueToken(userId, res) {
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d' })
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  return token
}


