import fs from 'fs'
import path from 'path'
import url from 'url'
import pg from 'pg'
import dns from 'dns'
import 'dotenv/config'

const { Client } = pg

async function run() {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env')
    console.log('Please set up a database connection in your .env file')
    console.log('You can:')
    console.log('1. Set up a local PostgreSQL database')
    console.log('2. Create a new Neon database at https://neon.tech')
    console.log('3. Use any other PostgreSQL database service')
    process.exit(1)
  }

  const schemaPath = path.resolve(__dirname, '../db/schema.sql')
  const seedPath = path.resolve(__dirname, '../db/seed.sql')

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const seedSql = fs.readFileSync(seedPath, 'utf8')

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
      servername: hostname // Use original hostname for SSL
    }
  })
  
  try {
    await client.connect()
    console.log('Connected to database successfully!')
  } catch (err) {
    console.error('Failed to connect to database:', err.message)
    console.log('\nTo fix this issue:')
    console.log('1. Check if your DATABASE_URL in .env is correct')
    console.log('2. Ensure the database server is running and accessible')
    console.log('3. For Neon databases, verify the connection string is up to date')
    console.log('4. For local databases, ensure PostgreSQL is installed and running')
    console.log('\nThe application will run without database persistence until this is fixed.')
    process.exit(1)
  }

  try {
    console.log('Applying schema...')
    await client.query('BEGIN')
    await client.query(schemaSql)
    await client.query('COMMIT')
    console.log('Schema applied successfully.')

    console.log('Seeding data...')
    await client.query('BEGIN')
    await client.query(seedSql)
    await client.query('COMMIT')
    console.log('Seed completed successfully.')
    console.log('Database migration completed!')
  } catch (err) {
    console.error('Migration failed:', err)
    try { await client.query('ROLLBACK') } catch {}
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()