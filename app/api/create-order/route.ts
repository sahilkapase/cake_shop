import { NextResponse } from "next/server"
import Razorpay from "razorpay"

const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

// Lazily instantiate the Razorpay client so cold starts don't re-create it unnecessarily.
const razorpayClient =
  keyId && keySecret
    ? new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
    : null

interface CreateOrderPayload {
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export async function POST(request: Request) {
  if (!razorpayClient) {
    return NextResponse.json(
      { error: "Razorpay credentials are not configured on the server" },
      { status: 500 },
    )
  }

  try {
    const body = (await request.json()) as CreateOrderPayload
    const { amount, currency = "INR", receipt, notes } = body

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "A valid amount (in paise) is required" }, { status: 400 })
    }

    const order = await razorpayClient.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: receipt ?? `receipt_${Date.now()}`,
      notes,
      // Note: timeout is set in frontend Razorpay checkout options, not here
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error("[create-order] Razorpay error:", error)
    
    // Extract meaningful error message from Razorpay response
    const errorMessage = error?.error?.description || error?.message || error?.toString() || "Failed to create Razorpay order"
    const statusCode = error?.statusCode || error?.status || 500
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          rawError: error?.error,
          keyIdConfigured: !!keyId,
        } : undefined
      }, 
      { status: statusCode }
    )
  }
}

