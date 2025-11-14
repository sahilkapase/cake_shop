import { NextResponse } from "next/server"
import { testConnection, getAllOrders } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await testConnection()
    
    if (!connectionTest.connected) {
      return NextResponse.json(
        {
          connected: false,
          error: connectionTest.error || "Database connection failed",
          ordersCount: 0,
          orders: [],
        },
        { status: 500 }
      )
    }

    // Try to get orders to verify queries work
    const orders = await getAllOrders()
    
    return NextResponse.json({
      connected: true,
      ordersCount: orders.length,
      sampleOrderIds: orders.slice(0, 5).map((o) => o.id),
      recentOrders: orders.slice(-3).map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        total: o.total,
        paymentStatus: o.paymentStatus,
      })),
    })
  } catch (error: any) {
    console.error("[test-db] Error:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message || "Unknown error",
        ordersCount: 0,
        orders: [],
      },
      { status: 500 }
    )
  }
}

