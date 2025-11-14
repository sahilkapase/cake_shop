"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Loader } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"mobile" | "otp">("mobile")
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [demoOtp, setDemoOtp] = useState("")

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setInfoMessage("")
    
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send OTP")
        setIsLoading(false)
        return
      }

      // Only show demo OTP if Twilio failed or isn't configured (for debugging)
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp)
        console.log(`[DEBUG] OTP (for testing only): ${data.demoOtp}`)
        setInfoMessage("OTP sent via WhatsApp. If you didn't receive it, check console for debug OTP.")
      } else {
        setDemoOtp("")
        setInfoMessage("OTP sent via WhatsApp. Please check your phone.")
      }

      setStep("otp")
      setOtp("") // Clear previous OTP when resending
      setIsLoading(false)
    } catch (err) {
      setError("An error occurred while sending OTP")
    setInfoMessage("")
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
  setInfoMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid OTP")
        setIsLoading(false)
        return
      }

      // Save token to localStorage
      localStorage.setItem("adminToken", data.token)

      // Redirect to dashboard
      router.push("/admin/dashboard")
    } catch (err) {
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  const handleBackToMobile = () => {
    setStep("mobile")
    setOtp("")
    setError("")
  setInfoMessage("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 via-background to-accent/20 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-serif">Admin Login</h1>
          <p className="text-muted-foreground">SAUNDRYA CAKES Mumbai Management</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {!error && infoMessage && (
          <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg text-sm text-center">
            {infoMessage}
          </div>
        )}

        {step === "mobile" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold mb-2">
                Mobile Number
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, "")
                  setMobile(value)
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || mobile.length !== 10}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
            {/* <p className="text-xs text-muted-foreground text-center">
              Enter your admin mobile number: 7264820796
            </p> */}
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold mb-2">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, "")
                  setOtp(value)
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                OTP sent to WhatsApp number +91 {mobile}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Please enter the 6-digit code you received from SAUNDRYA CAKES.
              </p>
              {demoOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-amber-800 text-center font-semibold">
                    ⚠️ Twilio not configured or failed. Debug OTP: {demoOtp}
                  </p>
                  <p className="text-xs text-amber-700 text-center mt-1">
                    Please configure TWILIO_WHATSAPP_NUMBER and other Twilio credentials
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="text-xs text-primary hover:underline mt-2 w-full text-center"
              >
                Resend OTP
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToMobile}
                disabled={isLoading}
                className="flex-1 bg-transparent"
              >
                Change Number
              </Button>
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="border-t border-border pt-4">
          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Card>
    </div>
  )
}
