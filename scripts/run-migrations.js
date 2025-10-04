import fs from 'fs'
import path from 'path'
import url from 'url'
import pg from 'pg'
import dns from 'dns'
import 'dotenv/config'

const { Client } = pg

async function runMigrations() {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env')
    process.exit(1)
  }

  const migrationsDir = path.resolve(__dirname, '../server/migrations')

  // Force public DNS to avoid ISP DNS refusal of Neon hostnames
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  } catch {}

  // Parse connection string to extract components
  const dbUrl = new URL(connectionString)
  const hostname = dbUrl.hostname
  const port = dbUrl.port || 5432
  const database = dbUrl.pathname.slice(1)
  const username = dbUrl.username
  const password = dbUrl.password
  
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
      servername: hostname
    }
  })
  
  try {
    await client.connect()
    console.log('Connected to database successfully!')
  } catch (err) {
    console.error('Failed to connect to database:', err.message)
    process.exit(1)
  }

  try {
    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`Found ${files.length} migration files`)

    for (const file of files) {
      console.log(`\nRunning migration: ${file}`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('COMMIT')
        console.log(`✓ ${file} completed successfully`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`✗ ${file} failed:`, err.message)
        // Continue with other migrations
      }
    }

    console.log('\nAll migrations completed!')
  } catch (err) {
    console.error('Migration process failed:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

runMigrations()
