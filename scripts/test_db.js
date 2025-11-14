const { Pool } = require('pg')

const url = process.env.NEON_DATABASE_URL
if (!url) {
  console.error('[test-db] NEON_DATABASE_URL is not set')
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: url })
  try {
    const res = await pool.query('SELECT NOW() as now')
    console.log('[test-db] Connected to DB, now:', res.rows[0].now)
    // Check if orders table exists
    const tableCheck = await pool.query(
      "SELECT to_regclass('public.orders') as orders_table"
    )
    console.log('[test-db] orders table present:', !!tableCheck.rows[0].orders_table)
  } catch (err) {
    console.error('[test-db] Connection or query failed:', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
