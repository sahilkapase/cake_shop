import { type NextRequest, NextResponse } from "next/server"
import { sendOTP } from "@/lib/admin"

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json()

    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
    }

    const result = await sendOTP(mobile)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to send OTP",
        demoOtp: result.demoOtp, // Only for debugging when Twilio fails
      }, { status: 400 })
    }

    // When Twilio is properly configured, don't return demoOtp
    // Only return it if there was an error (for debugging)
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully via WhatsApp",
      demoOtp: result.demoOtp, // Only present when Twilio is not configured or failed
    })
  } catch (error: any) {
    console.error("[send-otp] Unexpected error:", error)
    return NextResponse.json({ 
      error: error?.message || "Failed to send OTP",
    }, { status: 500 })
  }
}

