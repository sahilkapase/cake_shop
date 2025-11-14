"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  CheckCircle, 
  Loader, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  Download, 
  ShoppingBag,
  Sparkles,
  Receipt,
  Phone,
  User
} from "lucide-react"
import Link from "next/link"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("orderId")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!orderId || orderId === "undefined") {
      router.push("/")
      return
    }

    const fetchOrder = async (retries = 5, delay = 1000) => {
      try {
        console.log(`[success] Fetching order ${orderId} (${retries} retries left)`)
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store", // Ensure we don't get cached 404 responses
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          // Retry if order not found (might be a timing issue)
          if (retries > 0 && response.status === 404) {
            const nextDelay = Math.min(delay + 500, 3000)
            console.log(`[success] Order not found (${response.status}), retrying in ${nextDelay}ms... (${retries} attempts left)`)
            setTimeout(() => fetchOrder(retries - 1, nextDelay), delay)
            return
          }
          // If still not found after retries, show error
          console.error(`[success] Order ${orderId} not found after all retries. Error:`, errorData.error)
          setError("Unable to load order details. Please contact support with order ID: " + orderId)
          setIsLoading(false)
          return
        }
        
        const order = await response.json()
        console.log(`[success] Order ${orderId} loaded successfully`)
        setOrderDetails(order)
        setError("") // Clear any previous errors
        setIsLoading(false)
      } catch (err) {
        console.error("[success] Error fetching order:", err)
        if (retries > 0) {
          const nextDelay = Math.min(delay + 500, 3000)
          setTimeout(() => fetchOrder(retries - 1, nextDelay), delay)
          return
        }
        setError("Unable to load order details. Please contact support with order ID: " + orderId)
        setIsLoading(false)
      }
    }

    // Add a small initial delay to ensure order is saved and transaction is committed
    setTimeout(() => fetchOrder(), 800)
  }, [orderId, router])

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10">
          <div className="text-center space-y-3 sm:space-y-4 w-full">
            <div className="relative mx-auto w-fit">
              <Loader className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 animate-pulse"></div>
              </div>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg">Loading your order details...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const estimatedDelivery = (() => {
    if (!orderDetails || !orderDetails.delivery || !orderDetails.delivery.deliveryDate) return ""
    try {
      const d = new Date(orderDetails.delivery.deliveryDate)
      const estimate = new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000)
      return estimate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return ""
    }
  })()

  const handleDownloadReceipt = () => {
    if (!orderDetails) return

    const receipt = [
      "SAUNDRYA CAKES MUMBAI - ORDER RECEIPT",
      "=".repeat(50),
      "",
      `Order ID: ${orderDetails.id}`,
      `Date: ${new Date(orderDetails.createdAt).toLocaleString("en-IN")}`,
      "",
      "CUSTOMER DETAILS:",
      `Name: ${orderDetails.delivery.name}`,
      `Phone: ${orderDetails.delivery.phone}`,
      `Address: ${orderDetails.delivery.address}${
        orderDetails.delivery.postalCode ? `, ${orderDetails.delivery.postalCode}` : ""
      }`,
      `Delivery Date: ${new Date(orderDetails.delivery.deliveryDate).toLocaleDateString("en-IN")}`,
      orderDetails.delivery.timeWindow ? `Time Window: ${orderDetails.delivery.timeWindow}` : "",
      "",
      "ITEMS:",
      ...orderDetails.items.map(
        (item: any) => `${item.cakeName} (${item.weight}) x ${item.quantity} - ₹${item.pricePerUnit * item.quantity}`,
      ),
      "",
      "PRICE SUMMARY:",
      `Subtotal: ₹${orderDetails.subtotal}`,
      `Tax (5%): ₹${orderDetails.tax}`,
      "Shipping: Free",
      `Total: ₹${orderDetails.total}`,
      "",
      "=".repeat(50),
      "Thank you for choosing SAUNDRYA CAKES Mumbai!",
    ]
      .filter(Boolean)
      .join("\n")

    const blob = new Blob([receipt], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `receipt-${orderDetails.id}.txt`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  if (error && !orderDetails) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
          <Card className="p-6 sm:p-8 md:p-10 space-y-4 sm:space-y-6 text-center shadow-lg border-2">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shadow-lg animate-pulse">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent px-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
                We received your payment successfully.
              </p>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
              <p className="text-xs sm:text-sm text-destructive font-medium break-words">{error}</p>
            </div>
            <div className="space-y-3 pt-2 sm:pt-4 px-2 sm:px-0">
              <Link href="/" className="block">
                <Button size="lg" className="w-full text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
        {orderDetails && (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Success Header Card - Enhanced Mobile Design */}
            <Card className="p-6 sm:p-8 md:p-10 text-center space-y-5 sm:space-y-6 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-secondary/30 to-primary/5 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -ml-12 -mb-12"></div>
              
              <div className="relative mx-auto w-fit z-10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-green-100 via-green-50 to-green-100 animate-pulse shadow-lg"></div>
                </div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-green-500 flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 ring-4 ring-green-200/50">
                  <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-400 animate-pulse drop-shadow-md" />
                </div>
                <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse delay-300" />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 px-2 relative z-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent leading-tight drop-shadow-sm">
                  Order Confirmed! 🎉
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-md mx-auto leading-relaxed px-2">
                  Thank you for your order. Your cake will be freshly prepared and delivered with care.
                </p>
              </div>
            </Card>

            {/* Order Summary Card - Enhanced Mobile Design */}
            <Card className="p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-xl border border-primary/10 bg-gradient-to-br from-card to-secondary/5 relative overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/3 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-primary/10 relative z-10">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-sm">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif bg-gradient-to-r from-foreground to-foreground/80">Order Summary</h2>
              </div>

              {/* Order Info Grid - Enhanced Mobile Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/8 via-primary/5 to-primary/8 border-2 border-primary/20 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Order ID
                  </p>
                  <p className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground break-all leading-tight">{orderDetails.id}</p>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-green-50 via-green-100/60 to-green-50 border-2 border-green-300/50 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Payment
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <p className="font-bold text-base sm:text-lg text-green-700">Paid</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-accent/8 via-accent/5 to-accent/8 border-2 border-accent/20 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    Status
                  </p>
                  <p className="font-bold text-base sm:text-lg capitalize text-foreground">{orderDetails.orderStatus.replace("_", " ")}</p>
                </div>
              </div>

              {/* Order Items - Enhanced Mobile Design */}
              <div className="space-y-4 sm:space-y-5 relative z-10">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Items Ordered</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {orderDetails.items.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-4 sm:p-5 rounded-2xl border-2 border-primary/10 bg-gradient-to-br from-background via-secondary/5 to-background shadow-md hover:shadow-xl transition-all transform hover:scale-[1.01] relative overflow-hidden"
                    >
                      {/* Decorative accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60"></div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pl-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          <p className="font-bold text-base sm:text-lg break-words text-foreground">{item.cakeName}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs sm:text-sm font-semibold text-primary">
                              {item.weight}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="px-2.5 py-1 rounded-lg bg-secondary/50 border border-secondary/30 text-xs sm:text-sm font-semibold">
                              {item.quantity}
                            </span>
                          </div>
                          {item.customMessage && (
                            <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border-2 border-accent/30 shadow-sm">
                              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">Custom Message:</p>
                              <p className="text-sm sm:text-base italic text-foreground break-words leading-relaxed">&quot;{item.customMessage}&quot;</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-xl sm:text-2xl text-primary">₹{item.pricePerUnit * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown - Enhanced Mobile Design */}
              <div className="pt-5 sm:pt-6 border-t-2 border-primary/10 space-y-3 sm:space-y-4 relative z-10">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-secondary/30">
                  <span className="text-sm sm:text-base text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold text-base sm:text-lg">₹{orderDetails.subtotal}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-secondary/20">
                  <span className="text-sm sm:text-base text-muted-foreground font-medium">Tax (5%)</span>
                  <span className="font-bold text-base sm:text-lg">₹{orderDetails.tax}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-green-50/50 border border-green-200/50">
                  <span className="text-sm sm:text-base text-muted-foreground font-medium">Shipping</span>
                  <span className="font-bold text-base sm:text-lg text-green-600">Free</span>
                </div>
                <div className="pt-4 border-t-2 border-primary/20 mt-4 flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 shadow-lg">
                  <span className="text-lg sm:text-xl font-bold text-foreground">Total Amount</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-primary drop-shadow-sm">₹{orderDetails.total}</span>
                </div>
              </div>
            </Card>

            {/* Delivery Details Card - Enhanced Mobile Design */}
            <Card className="p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-xl border border-accent/10 bg-gradient-to-br from-card to-accent/5 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -ml-12 -mb-12"></div>
              
              <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-5 border-b-2 border-accent/20 relative z-10">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border-2 border-accent/20 shadow-sm">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif bg-gradient-to-r from-foreground to-foreground/80">Delivery Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-background via-secondary/10 to-background border-2 border-primary/10 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Name</p>
                  </div>
                  <p className="font-bold text-base sm:text-lg break-words text-foreground">{orderDetails.delivery.name}</p>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-background via-secondary/10 to-background border-2 border-primary/10 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Phone</p>
                  </div>
                  <p className="font-bold text-base sm:text-lg break-words text-foreground">{orderDetails.delivery.phone}</p>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-background via-secondary/10 to-background border-2 border-accent/20 shadow-md hover:shadow-lg transition-all sm:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Address</p>
                  </div>
                  <p className="font-bold text-base sm:text-lg break-words leading-relaxed text-foreground">
                    {orderDetails.delivery.address}
                    {orderDetails.delivery.postalCode ? `, ${orderDetails.delivery.postalCode}` : ""}
                  </p>
                </div>
                {orderDetails.delivery.deliveryDate && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-background via-secondary/10 to-background border-2 border-primary/10 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Delivery Date</p>
                    </div>
                    <p className="font-bold text-sm sm:text-base break-words leading-relaxed text-foreground">
                      {new Date(orderDetails.delivery.deliveryDate).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {orderDetails.delivery.timeWindow && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-background via-secondary/10 to-background border-2 border-primary/10 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Time Window</p>
                    </div>
                    <p className="font-bold text-base sm:text-lg text-foreground">{orderDetails.delivery.timeWindow.replace("-", " AM - ")} PM</p>
                  </div>
                )}
              </div>
              {estimatedDelivery && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/15 border-2 border-primary/30 shadow-lg relative z-10">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/20">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-primary">Estimated Delivery</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed pl-8">Your order will be delivered by {estimatedDelivery}</p>
                </div>
              )}
            </Card>

            {/* Action Buttons - Enhanced Mobile Design */}
            <Card className="p-5 sm:p-6 shadow-xl border-2 border-primary/10 bg-gradient-to-br from-card to-secondary/5">
              <div className="space-y-3 sm:space-y-4">
                <Link href="/" className="block">
                  <Button size="lg" className="w-full text-base sm:text-lg bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all h-14 sm:h-16 rounded-2xl font-bold border-2 border-primary/20 hover:scale-[1.02] transform">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 mr-2.5 shrink-0" />
                    <span>Continue Shopping</span>
                  </Button>
                </Link>
                <Button 
                  onClick={handleDownloadReceipt} 
                  variant="outline" 
                  size="lg"
                  className="w-full text-base sm:text-lg border-2 border-primary/30 hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/5 transition-all h-14 sm:h-16 rounded-2xl font-bold hover:scale-[1.02] transform shadow-md hover:shadow-lg"
                >
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2.5 shrink-0" />
                  <span>Download Receipt</span>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
