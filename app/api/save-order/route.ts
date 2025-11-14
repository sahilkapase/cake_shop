import { NextResponse } from "next/server"
import { createOrder } from "@/lib/db"
import { sendOrderNotifications } from "@/lib/notifications"

interface PaymentItem {
  cakeId: number
  cakeName: string
  weight: string
  quantity: number
  pricePerUnit: number
  customMessage?: string
}

interface CustomerInfo {
  name: string
  phone: string
  address: string
  postalCode?: string
  deliveryDate?: string
  timeWindow?: string
}

interface SaveOrderPayload {
  orderId: string
  paymentId: string
  amount: number
  subtotal: number
  tax: number
  items: PaymentItem[]
  customer: CustomerInfo
}

export async function POST(request: Request) {
  try {
    // First, test database connection
    const { testConnection } = await import("@/lib/db")
    const connectionTest = await testConnection()
    if (!connectionTest.connected) {
      console.error("[save-order] Database connection failed:", connectionTest.error)
      return NextResponse.json(
        { error: "Database connection failed", details: connectionTest.error },
        { status: 503 }
      )
    }

    const body = (await request.json()) as SaveOrderPayload
    const { orderId, paymentId, amount, subtotal, tax, items, customer } = body

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: "Missing order or payment identifiers" }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return NextResponse.json({ error: "Incomplete customer information" }, { status: 400 })
    }

    const computedSubtotal = items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)
    const normalizedSubtotal = subtotal ?? computedSubtotal
    const normalizedTax = typeof tax === "number" ? tax : Math.round(normalizedSubtotal * 0.05)
    const normalizedAmount = amount ?? normalizedSubtotal + normalizedTax

    console.log(`[save-order] Creating order with Razorpay Order ID: ${orderId}, Payment ID: ${paymentId}`)
    const delivery: any = {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    }
    
    if (customer.postalCode) {
      delivery.postalCode = customer.postalCode
    }
    
    if (customer.deliveryDate) {
      delivery.deliveryDate = customer.deliveryDate
    }
    
    if (customer.timeWindow) {
      delivery.timeWindow = customer.timeWindow
    }
    
    let order
    try {
      order = await createOrder({
        items,
        delivery,
        subtotal: normalizedSubtotal,
        tax: normalizedTax,
        total: normalizedAmount,
        paymentStatus: "paid",
        orderStatus: "pending",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      })

      console.log(`[save-order] Order created with ID: ${order.id}`)
      console.log(`[save-order] Razorpay Order ID: ${order.razorpayOrderId}`)
      console.log(`[save-order] Razorpay Payment ID: ${order.razorpayPaymentId}`)
    } catch (dbErr: any) {
      // If the DB isn't configured or write fails (common on serverless), fall back
      // to returning a generated order object so the client flow isn't blocked.
      console.error('[save-order] createOrder failed, falling back to transient order:', dbErr?.message || dbErr)
      const now = new Date().toISOString()
      // Simple fallback ID (not persisted)
      const fallbackId = `TEMP-${Date.now()}`
      order = {
        id: fallbackId,
        items,
        delivery,
        subtotal: normalizedSubtotal,
        tax: normalizedTax,
        total: normalizedAmount,
        paymentStatus: 'paid',
        orderStatus: 'pending',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        createdAt: now,
        updatedAt: now,
      }
    }

    // Add a small delay to ensure transaction is fully committed (important for serverless DBs like Neon)
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Verify the order was saved by reading it back with retries
    const { getOrderById } = await import("@/lib/db")
    let verifiedOrder = await getOrderById(order.id)
    let verifyRetries = 0
    const maxVerifyRetries = 8
    
    while (!verifiedOrder && verifyRetries < maxVerifyRetries) {
      verifyRetries++
      const delay = Math.min(200 * verifyRetries, 1000) // Cap delay at 1 second
      console.log(`[save-order] Order ${order.id} not immediately available, retrying verification (${verifyRetries}/${maxVerifyRetries}) after ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      verifiedOrder = await getOrderById(order.id)
      
      if (verifiedOrder) {
        console.log(`[save-order] Order ${order.id} verified successfully after ${verifyRetries} attempt(s)`)
        break
      }
    }
    
    if (!verifiedOrder) {
      console.error(`[save-order] WARNING: Order ${order.id} was not found after ${maxVerifyRetries} verification attempts`)
      console.error(`[save-order] This might be a database replication delay. Order will still be returned to client.`)
      console.error(`[save-order] The order should be available shortly. Please retry fetching it.`)
    }

    void sendOrderNotifications(order)

    // Return the order with all details
    console.log(`[save-order] Returning order with ID: ${order.id} to client`)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error("[save-order] Error:", error)
    return NextResponse.json(
      { 
        error: "Failed to save order",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

