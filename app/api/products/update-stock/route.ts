import { type NextRequest, NextResponse } from "next/server"
import { validateAdminToken } from "@/lib/admin"
import { setOutOfStock } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.headers.get("x-admin-token") || ""
    
    if (!token || !validateAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, outOfStock } = body

    if (!productId || typeof outOfStock !== "boolean") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Update stock status in database
    const success = await setOutOfStock(productId, outOfStock)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update stock status (database unavailable)" },
        { status: 503 }
      )
    }

    return NextResponse.json({
      id: productId,
      outOfStock,
      message: "Stock status updated successfully",
    })
  } catch (error: any) {
    console.error("[products/update-stock] Error:", error)
    return NextResponse.json(
      { error: "Failed to update stock status", details: error.message },
      { status: 500 }
    )
  }
}

