const { Pool } = require('pg')

const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
if (!url) {
  console.error('[insert-test] NEON_DATABASE_URL is not set')
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: url })
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items JSONB NOT NULL,
        delivery JSONB NOT NULL,
        subtotal INTEGER NOT NULL,
        tax INTEGER NOT NULL,
        total INTEGER NOT NULL,
        payment_status TEXT NOT NULL,
        order_status TEXT NOT NULL,
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
    `)

    const now = new Date()
    const id = `TEST-${now.getTime()}`

    const items = [
      { cakeId: 1, cakeName: 'Test Cake', weight: '1kg', quantity: 1, pricePerUnit: 500, customMessage: 'Happy' }
    ]
    const delivery = { name: 'Alice', phone: '9999999999', address: '123 Test St', postalCode: '12345', deliveryDate: now.toISOString(), timeWindow: '10-12' }
    const subtotal = 500
    const tax = 25
    const total = 525

    const insertText = `INSERT INTO orders (id, items, delivery, subtotal, tax, total, payment_status, order_status, razorpay_order_id, razorpay_payment_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`
    await client.query(insertText, [
      id,
      JSON.stringify(items),
      JSON.stringify(delivery),
      subtotal,
      tax,
      total,
      'paid',
      'pending',
      'rzp_test_order',
      'rzp_test_payment',
      now,
      now,
    ])

    const res = await client.query('SELECT * FROM orders WHERE id = $1', [id])
    console.log('[insert-test] Inserted row:', res.rows[0])

  } catch (err) {
    console.error('[insert-test] Error:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
