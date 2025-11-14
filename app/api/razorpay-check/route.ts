import { NextResponse } from "next/server"

/**
 * Diagnostic endpoint to check Razorpay configuration
 * Only available in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  return NextResponse.json({
    server: {
      keyId: keyId ? `${keyId.substring(0, 10)}...` : "NOT SET",
      keySecret: keySecret ? "SET (hidden)" : "NOT SET",
      configured: !!(keyId && keySecret),
    },
    client: {
      keyId: publicKeyId ? `${publicKeyId.substring(0, 10)}...` : "NOT SET",
      configured: !!publicKeyId,
    },
    status: {
      serverReady: !!(keyId && keySecret),
      clientReady: !!publicKeyId,
      allReady: !!(keyId && keySecret && publicKeyId),
    },
  })
}

