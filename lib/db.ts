import { Pool } from "pg"

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || ""

if (!connectionString) {
  console.warn("[db] No database connection string provided. Set NEON_DATABASE_URL or DATABASE_URL to use Postgres.")
}

const pool = new Pool({ 
  connectionString,
  // Add connection pool settings for better reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Handle pool errors
pool.on("error", (err) => {
  console.error("[db] Unexpected error on idle client", err)
})

// Test database connection
export async function testConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!connectionString) {
    return { connected: false, error: "No database connection string provided" }
  }
  
  const client = await pool.connect()
  try {
    await client.query("SELECT 1")
    return { connected: true }
  } catch (err: any) {
    console.error("[db] Connection test failed:", err)
    return { connected: false, error: err.message || "Connection failed" }
  } finally {
    client.release()
  }
}

interface CartItem {
  cakeId: number
  cakeName: string
  weight: string
  quantity: number
  pricePerUnit: number
  customMessage?: string
}

interface DeliveryDetails {
  name: string
  phone: string
  address: string
  postalCode?: string
  deliveryDate?: string
  timeWindow?: string
}

export interface Order {
  id: string
  items: CartItem[]
  delivery: DeliveryDetails
  subtotal: number
  tax: number
  total: number
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: "pending" | "preparing" | "out_for_delivery" | "delivered"
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: string
  updatedAt: string
}

async function ensureTable() {
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
  } finally {
    client.release()
  }
}

function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    items: row.items,
    delivery: row.delivery,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    razorpayOrderId: row.razorpay_order_id || undefined,
    razorpayPaymentId: row.razorpay_payment_id || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureTable()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT * FROM orders ORDER BY created_at ASC")
    return res.rows.map(mapRowToOrder)
  } finally {
    client.release()
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!connectionString) {
    console.error("[db] getOrderById: No database connection string")
    throw new Error("Database not configured")
  }
  
  // Trim and normalize the ID to handle any whitespace issues
  const normalizedId = id.trim()
  
  await ensureTable()
  const client = await pool.connect()
  try {
    // Try exact match first
    let res = await client.query("SELECT * FROM orders WHERE id = $1", [normalizedId])
    console.log(`[db] getOrderById: Query for "${normalizedId}" returned ${res.rowCount} rows`)
    
    // If not found, try case-insensitive search (in case of any case issues)
    if (res.rowCount === 0) {
      res = await client.query("SELECT * FROM orders WHERE LOWER(id) = LOWER($1)", [normalizedId])
      console.log(`[db] getOrderById: Case-insensitive query for "${normalizedId}" returned ${res.rowCount} rows`)
    }
    
    // If still not found, try to find similar IDs for debugging
    if (res.rowCount === 0) {
      const allRes = await client.query("SELECT id FROM orders ORDER BY created_at DESC LIMIT 10")
      const allIds = allRes.rows.map((r: any) => r.id)
      console.log(`[db] getOrderById: Order "${normalizedId}" not found. Recent order IDs:`, allIds)
    }
    
    if (res.rowCount === 0) return null
    return mapRowToOrder(res.rows[0])
  } catch (err: any) {
    console.error(`[db] getOrderById error for "${normalizedId}":`, err.message)
    throw err
  } finally {
    client.release()
  }
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
  await ensureTable()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT * FROM orders WHERE razorpay_order_id = $1", [razorpayOrderId])
    if (res.rowCount === 0) return null
    return mapRowToOrder(res.rows[0])
  } finally {
    client.release()
  }
}

export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
  if (!connectionString) {
    console.error("[db] createOrder: No database connection string")
    throw new Error("Database not configured")
  }
  
  await ensureTable()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Count orders created today to generate a daily-resetting sequence
    const countRes = await client.query("SELECT COUNT(*)::int AS cnt FROM orders WHERE created_at::date = CURRENT_DATE")
    const todaysCount = countRes.rows[0]?.cnt || 0
    const seq = todaysCount + 1

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    const dateKey = `${yyyy}${mm}${dd}`
    const seqStr = String(seq).padStart(4, "0")
    const id = `ORD-${dateKey}-${seqStr}`

    const now = new Date()

    const insertText = `INSERT INTO orders
      (id, items, delivery, subtotal, tax, total, payment_status, order_status, razorpay_order_id, razorpay_payment_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`

    await client.query(insertText, [
      id,
      JSON.stringify(order.items),
      JSON.stringify(order.delivery),
      order.subtotal,
      order.tax,
      order.total,
      order.paymentStatus,
      order.orderStatus,
      order.razorpayOrderId || null,
      order.razorpayPaymentId || null,
      now,
      now,
    ])

    await client.query("COMMIT")
    
    console.log(`[db] createOrder: Successfully created order ${id}`)
    
    // Verify the order was inserted by reading it back immediately using the same connection
    // This ensures we see the committed data even with read replicas
    const verifyRes = await client.query("SELECT * FROM orders WHERE id = $1", [id])
    if (verifyRes.rowCount === 0) {
      console.error(`[db] createOrder: WARNING - Order ${id} not found immediately after insert`)
      // Try one more time after a small delay
      await new Promise(resolve => setTimeout(resolve, 100))
      const retryVerify = await client.query("SELECT * FROM orders WHERE id = $1", [id])
      if (retryVerify.rowCount > 0) {
        console.log(`[db] createOrder: Verified order ${id} exists after retry`)
      } else {
        console.error(`[db] createOrder: Order ${id} still not found after retry`)
      }
    } else {
      console.log(`[db] createOrder: Verified order ${id} exists in database`)
    }

    // Return the order object
    const createdOrder = {
      ...order,
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    
    return createdOrder
  } catch (err: any) {
    try {
      await client.query("ROLLBACK")
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    console.error("[db] createOrder error:", err.message)
    throw err
  } finally {
    client.release()
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  await ensureTable()
  const client = await pool.connect()
  try {
    // Build dynamic update
    const fields: string[] = []
    const values: any[] = []
    let idx = 1
    for (const key of Object.keys(updates)) {
      if (key === "id" || key === "createdAt") continue
      const col = key.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
      fields.push(`${col} = $${idx}`)
      // If updating JSONB fields, stringify them for safe insertion
      // @ts-ignore
      const rawVal = (updates as any)[key]
      if (key === "items" || key === "delivery") {
        values.push(JSON.stringify(rawVal))
      } else {
        values.push(rawVal)
      }
      idx++
    }
    values.push(new Date()) // updated_at
    const setClause = fields.length ? fields.join(", ") + `, updated_at = $${idx}` : `updated_at = $${idx}`
    const query = `UPDATE orders SET ${setClause} WHERE id = $${idx + 1} RETURNING *`
    values.push(id)

    const res = await client.query(query, values)
    if (res.rowCount === 0) return null
    return mapRowToOrder(res.rows[0])
  } finally {
    client.release()
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  await ensureTable()
  const client = await pool.connect()
  try {
    const res = await client.query("DELETE FROM orders WHERE id = $1", [id])
    return res.rowCount > 0
  } finally {
    client.release()
  }
}

// Out of Stock Management
async function ensureOutOfStockTable() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS out_of_stock_items (
        product_id INTEGER PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } finally {
    client.release()
  }
}

export async function setOutOfStock(productId: number, outOfStock: boolean): Promise<boolean> {
  if (!connectionString) {
    console.error("[db] setOutOfStock: No database connection string")
    return false
  }
  
  await ensureOutOfStockTable()
  const client = await pool.connect()
  try {
    if (outOfStock) {
      // Insert or update to mark as out of stock
      await client.query(
        `INSERT INTO out_of_stock_items (product_id, updated_at) 
         VALUES ($1, CURRENT_TIMESTAMP)
         ON CONFLICT (product_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        [productId]
      )
    } else {
      // Delete to mark as in stock
      await client.query("DELETE FROM out_of_stock_items WHERE product_id = $1", [productId])
    }
    console.log(`[db] setOutOfStock: Product ${productId} set to outOfStock=${outOfStock}`)
    return true
  } catch (err: any) {
    console.error("[db] setOutOfStock error:", err.message)
    return false
  } finally {
    client.release()
  }
}

export async function getOutOfStockItems(): Promise<Set<number>> {
  if (!connectionString) {
    return new Set()
  }
  
  await ensureOutOfStockTable()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT product_id FROM out_of_stock_items")
    return new Set(res.rows.map(row => row.product_id))
  } catch (err: any) {
    console.error("[db] getOutOfStockItems error:", err.message)
    return new Set()
  } finally {
    client.release()
  }
}
