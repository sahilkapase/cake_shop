import { type NextRequest, NextResponse } from "next/server"
import { createOrder, getAllOrders } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, delivery, subtotal, tax, total } = body

    const order = await createOrder({
      items,
      delivery,
      subtotal,
      tax,
      total,
      paymentStatus: "pending",
      orderStatus: "pending",
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 400 })
  }
}

export async function GET() {
  try {
    const orders = await getAllOrders()
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 400 })
  }
}
