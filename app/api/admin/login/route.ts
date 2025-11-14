import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP, createAdminToken } from "@/lib/admin"

export async function POST(request: NextRequest) {
  try {
    const { mobile, otp } = await request.json()

    if (!mobile || !otp) {
      return NextResponse.json({ error: "Mobile number and OTP are required" }, { status: 400 })
    }

    console.log(`[admin/login] Verifying OTP for mobile: ${mobile.replace(/\D/g, "")}`)
    const isValid = verifyOTP(mobile, otp)

    if (!isValid) {
      console.log(`[admin/login] OTP verification failed for ${mobile.replace(/\D/g, "")}`)
      return NextResponse.json({ error: "Invalid or expired OTP. Please request a new OTP." }, { status: 401 })
    }

    const token = createAdminToken(mobile)
    console.log(`[admin/login] OTP verified successfully for ${mobile.replace(/\D/g, "")}`)

    return NextResponse.json({ token, mobile })
  } catch (error) {
    console.error("[admin/login] Error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 400 })
  }
}
