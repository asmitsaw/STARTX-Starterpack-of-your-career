import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import crypto from 'crypto'

const TOKEN_NAME = 'token'

// Generate encryption key from JWT secret
const getEncryptionKey = (secret) => {
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
}

// Encrypt data
export const encryptData = (text) => {
  try {
    const key = getEncryptionKey(process.env.JWT_SECRET);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to plaintext if encryption fails
  }
}

// Decrypt data
export const decryptData = (text) => {
  try {
    if (!text || !text.includes(':')) return text;
    
    const key = getEncryptionKey(process.env.JWT_SECRET);
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original text if decryption fails
  }
}

export async function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization || ''
    const fromCookie = req.cookies?.[TOKEN_NAME]
    const raw = fromCookie || (bearer.startsWith('Bearer ') ? bearer.slice(7) : null)
    if (!raw) return res.status(401).json({ error: 'unauthorized' })
    const payload = jwt.verify(raw, process.env.JWT_SECRET)
    
    const { rows } = await query('SELECT id, email, name FROM users WHERE id = $1', [payload.sub])
    if (!rows.length) return res.status(401).json({ error: 'user_not_found' })
    
    req.user = rows[0]
    
    // Add encryption/decryption utilities to the request object
    req.security = {
      encrypt: encryptData,
      decrypt: decryptData
    }
    
    return next()
  } catch (e) {
    console.error('Auth error:', e.message)
    return res.status(401).json({ error: 'invalid_token' })
  }
}

export function issueToken(userId, res) {
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d' })
  
  console.log('[Auth] Issuing JWT token for user:', userId)
  
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Must be false for localhost
    domain: 'localhost', // Explicitly set domain
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  
  console.log('[Auth] Cookie set:', TOKEN_NAME)
  return token
}


