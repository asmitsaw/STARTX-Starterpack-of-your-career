import fs from 'fs'
import path from 'path'
import url from 'url'
import pg from 'pg'
import 'dotenv/config'

const { Client } = pg

async function run() {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env')
    process.exit(1)
  }

  const schemaPath = path.resolve(__dirname, '../db/schema.sql')
  const seedPath = path.resolve(__dirname, '../db/seed.sql')

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const seedSql = fs.readFileSync(seedPath, 'utf8')

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    console.log('Applying schema...')
    await client.query('BEGIN')
    await client.query(schemaSql)
    await client.query('COMMIT')
    console.log('Schema applied.')

    console.log('Seeding data...')
    await client.query('BEGIN')
    await client.query(seedSql)
    await client.query('COMMIT')
    console.log('Seed completed.')
  } catch (err) {
    console.error('Migration failed:', err)
    try { await client.query('ROLLBACK') } catch {}
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()


