import { isTwilioConfigured, sendWhatsAppMessage } from "@/lib/twilio"

const ADMIN_MOBILE = "7264820796" // Admin mobile number (OTP will be sent to +917264820796)

// In-memory OTP storage (in production, use Redis or database)
interface OTPData {
  otp: string
  mobile: string
  expiresAt: number
}

const otpStore = new Map<string, OTPData>()

// OTP expires after 5 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP to mobile number via Twilio WhatsApp
 */
export async function sendOTP(mobile: string): Promise<{ success: boolean; error?: string; demoOtp?: string }> {
  const normalizedMobile = mobile.replace(/\D/g, "")

  if (normalizedMobile !== ADMIN_MOBILE) {
    return { success: false, error: "Mobile number not registered" }
  }

  const otp = generateOTP()
  const expiresAt = Date.now() + OTP_EXPIRY_MS

  // Store OTP
  otpStore.set(normalizedMobile, {
    otp,
    mobile: normalizedMobile,
    expiresAt,
  })

  const message = `SAUNDRYA CAKES Admin Login OTP: ${otp}. This code is valid for 5 minutes. Do not share this code with anyone.`

  if (isTwilioConfigured()) {
    try {
      // Format: whatsapp:+91XXXXXXXXXX (for Indian numbers)
      const whatsappNumber = `whatsapp:+91${normalizedMobile}`
      await sendWhatsAppMessage(whatsappNumber, message)
      console.log(`[admin] OTP sent successfully via WhatsApp to ${whatsappNumber}`)
      // Don't return demoOtp when Twilio is properly configured
      return { success: true }
    } catch (error: any) {
      console.error("[admin] Failed to send OTP via WhatsApp:", error?.message || error)
      // Only return demoOtp as fallback if Twilio fails
      // This helps with debugging but shouldn't be shown in production
      const errorMessage = error?.message || "Unknown error"
      console.warn(`[admin] Fallback: OTP for ${normalizedMobile} is ${otp} (Error: ${errorMessage})`)
      return {
        success: false,
        error: `Failed to send OTP via WhatsApp: ${errorMessage}. Please check your Twilio configuration.`,
        demoOtp: otp, // Only for debugging
      }
    }
  } else {
    console.warn("[admin] Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables.")
    return { 
      success: false, 
      error: "Twilio WhatsApp is not configured. Please contact administrator.",
      demoOtp: otp // Only for development/testing
    }
  }
}

/**
 * Verify OTP for mobile number
 */
export function verifyOTP(mobile: string, otp: string): boolean {
  const normalizedMobile = mobile.replace(/\D/g, "")
  const stored = otpStore.get(normalizedMobile)

  if (!stored) {
    console.log(`[admin] OTP not found for mobile: ${normalizedMobile}`)
    return false
  }

  // Check if OTP expired
  if (Date.now() > stored.expiresAt) {
    console.log(`[admin] OTP expired for mobile: ${normalizedMobile}`)
    otpStore.delete(normalizedMobile)
    return false
  }

  // Verify OTP
  if (stored.otp !== otp) {
    console.log(`[admin] OTP mismatch for mobile: ${normalizedMobile}. Expected: ${stored.otp}, Got: ${otp}`)
    return false
  }

  // OTP verified, remove it (one-time use)
  console.log(`[admin] OTP verified successfully for mobile: ${normalizedMobile}`)
  otpStore.delete(normalizedMobile)
  return true
}

export function createAdminToken(mobile: string): string {
  // Normalize mobile number for token
  const normalizedMobile = mobile.replace(/\D/g, "")
  const token = Buffer.from(`${normalizedMobile}:${Date.now()}`).toString("base64")
  return token
}

export function validateAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString()
    const [mobile] = decoded.split(":")
    const normalizedMobile = mobile.replace(/\D/g, "")
    return normalizedMobile === ADMIN_MOBILE
  } catch {
    return false
  }
}
