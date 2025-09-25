import pg from 'pg'
import 'dotenv/config'

const { Client } = pg

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    const { rows } = await client.query('select current_database() as db, current_user as user, now() as now')
    console.log(rows[0])
  } finally {
    await client.end()
  }
}

main()


