import { type NextRequest, NextResponse } from "next/server"
import { getOrderById, getOrderByRazorpayOrderId, updateOrder } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const normalizedId = id?.trim()
  
  if (!normalizedId) {
    console.error(`[orders] No order ID provided`)
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }
  
  try {
    console.log(`[orders/${normalizedId}] Fetching order with ID: "${normalizedId}"`)
    // First check transient in-memory store (used when DB persistence is unavailable)
    try {
      const { getTransientOrder } = await import('@/lib/transient-orders')
      const transient = getTransientOrder(normalizedId)
      if (transient) {
        console.log(`[orders/${normalizedId}] Found transient order in memory store`)
        return NextResponse.json(transient)
      }
    } catch (tErr) {
      console.warn(`[orders/${normalizedId}] transient store check failed:`, tErr?.message || tErr)
    }
    // First, test database connection
    const { testConnection } = await import("@/lib/db")
    const connectionTest = await testConnection()
    if (!connectionTest.connected) {
      console.warn(`[orders/${normalizedId}] Database connection failed (continuing with retries):`, connectionTest.error)
      // don't return; we'll try to find the order with retries
    }
    
    // Retry logic for database queries (handles eventual consistency)
    let order = null
    const maxRetries = 3
    let retryCount = 0
    
    while (!order && retryCount < maxRetries) {
      try {
        // Try to find by internal order ID first
        order = await getOrderById(normalizedId)

        // If not found, try to find by Razorpay order ID (fallback)
        if (!order) {
          console.log(`[orders/${normalizedId}] Order not found by ID, trying Razorpay order ID...`)
          order = await getOrderByRazorpayOrderId(normalizedId)
        }

        // If still not found and we have retries left, wait a bit and retry
        if (!order && retryCount < maxRetries - 1) {
          retryCount++
          console.log(`[orders/${normalizedId}] Order not found, retrying (${retryCount}/${maxRetries - 1})...`)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount)) // Exponential backoff
        } else {
          break
        }
      } catch (dbError: any) {
        console.error(`[orders/${normalizedId}] Database error on attempt ${retryCount + 1}:`, dbError.message)
        if (retryCount < maxRetries - 1) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        } else {
          throw dbError
        }
      }
    }

    if (!order) {
      // Get all orders for debugging
      const { getAllOrders } = await import("@/lib/db")
      let allOrders: any[] = []
      try {
        allOrders = await getAllOrders()
        console.log(`[orders/${normalizedId}] Order not found after ${maxRetries} retries. Total orders in database: ${allOrders.length}`)
        if (allOrders.length > 0) {
          console.log(`[orders/${normalizedId}] Available order IDs:`, allOrders.slice(0, 10).map(o => o.id).join(", "))
          console.log(`[orders/${normalizedId}] Available Razorpay order IDs:`, allOrders.filter(o => o.razorpayOrderId).slice(0, 10).map(o => o.razorpayOrderId))
          // Check if the searched ID is similar to any existing IDs
          const similarIds = allOrders.filter(o => 
            o.id.toLowerCase().includes(normalizedId.toLowerCase()) || 
            normalizedId.toLowerCase().includes(o.id.toLowerCase())
          ).map(o => o.id)
          if (similarIds.length > 0) {
            console.log(`[orders/${normalizedId}] Similar order IDs found:`, similarIds)
          }
        }
      } catch (err) {
        console.error(`[orders/${normalizedId}] Error fetching all orders for debugging:`, err)
      }
      return NextResponse.json({ 
        error: "Order not found",
        searchedId: normalizedId,
        totalOrdersInDb: allOrders.length,
        sampleOrderIds: allOrders.slice(0, 5).map(o => o.id),
      }, { status: 404 })
    }

    console.log(`[orders/${normalizedId}] Order found: ${order.id}`)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error(`[orders/${normalizedId}] Error:`, error)
    return NextResponse.json({ 
      error: "Failed to fetch order",
      details: error.message || "Unknown error"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const updated = await updateOrder(id, body)

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 400 })
  }
}
