import pg from 'pg'
import dns from 'dns'

const { Pool } = pg

// Force reliable public DNS to avoid ISP DNS refusal (safe no-op if fails)
try { dns.setServers(['8.8.8.8', '1.1.1.1']) } catch {}

// Build an explicit config to avoid hostname DNS at connect time
function buildPool() {
  if (!process.env.DATABASE_URL) return null
  const dbUrl = new URL(process.env.DATABASE_URL)
  const neonHostname = dbUrl.hostname
  const ipHost = process.env.DB_HOST_IP || '44.198.216.75' // same IP used by migrate
  return new Pool({
    host: ipHost, // connect via IP to bypass DNS
    port: Number(dbUrl.port || 5432),
    database: dbUrl.pathname.slice(1),
    user: dbUrl.username,
    password: dbUrl.password,
    ssl: {
      rejectUnauthorized: false,
      servername: neonHostname // present original hostname for TLS SNI
    },
    // Small idle timeout to recycle connections on flaky networks
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

export const pool = buildPool()

export async function query(text, params) {
  if (!pool) {
    console.log('Database not connected - running without persistence')
    return { rows: [], rowCount: 0 }
  }

  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

// Default export for easier importing
export default { query, pool }


