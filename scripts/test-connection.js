import pg from 'pg'
import 'dotenv/config'
import dns from 'dns'

const { Client } = pg

async function main() {
  // Force reliable public DNS to avoid ISP DNS refusal
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  } catch {}
  
  // Parse connection string to extract components
  const url = new URL(process.env.DATABASE_URL)
  const hostname = url.hostname
  const port = url.port || 5432
  const database = url.pathname.slice(1)
  const username = url.username
  const password = url.password
  
  // Use IP address to bypass DNS issues
  const ipAddress = '44.198.216.75'
  
  console.log(`Connecting to ${ipAddress}:${port} (${hostname})`)
  
  const client = new Client({
    host: ipAddress,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: {
      rejectUnauthorized: false,
      servername: hostname // Use original hostname for SSL
    }
  })
  
  try {
    await client.connect()
    const { rows } = await client.query('select current_database() as db, current_user as user, now() as now')
    console.log(rows[0])
  } finally {
    await client.end()
  }
}

main()