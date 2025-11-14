"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { loadCart, saveCart, type CartItem as CartItemData } from "@/lib/cart"
import { useRazorpayPayment } from "@/hooks/use-razorpay-payment"

const TAX_RATE = 0.05

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { initiatePayment, isProcessing } = useRazorpayPayment()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    postalCode: "",
    deliveryDate: "",
    timeWindow: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const cartItems = loadCart()
    if (cartItems.length === 0) {
      router.push("/cart")
    } else {
      setCart(cartItems)
    }
    setIsLoading(false)
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = "Please enter a valid 10-digit phone number"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    
    // Delivery date is now optional, but if provided, it must be a future date
    if (formData.deliveryDate) {
      const selectedDate = new Date(formData.deliveryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        newErrors.deliveryDate = "Please select a future date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleCheckout = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total * 100,
        }),
      })

      const razorpayOrder = await response.json()

      if (!response.ok) {
        const errorMsg = razorpayOrder.error || "Failed to create Razorpay order"
        const details = razorpayOrder.details ? `\n\nDetails: ${JSON.stringify(razorpayOrder.details, null, 2)}` : ""
        throw new Error(`${errorMsg}${details}`)
      }

      initiatePayment({
        order: razorpayOrder,
        amount: total,
        subtotal,
        tax,
        items: cart,
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          postalCode: formData.postalCode || undefined,
          deliveryDate: formData.deliveryDate || undefined,
          timeWindow: formData.timeWindow || undefined,
        },
        onSuccess: (savedOrder) => {
          saveCart([])
          setCart([])
          router.push(`/success?orderId=${savedOrder.id}`)
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Payment could not be completed"
          alert(message)
        },
      })
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to initialise payment"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </>
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
        <Link href="/cart">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
        </Link>

        <h1 className="text-3xl font-bold font-serif mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-6">Delivery Details</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.name ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                    }`}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit phone number"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.phone ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                    }`}
                  />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold mb-2">
                    Full Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address, colony, locality"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.address ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                    }`}
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-semibold mb-2">
                    Postal Code <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Postal code"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.postalCode
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-primary"
                    }`}
                  />
                  {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-semibold mb-2">
                      Delivery Date <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      id="deliveryDate"
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      min={minDateStr}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.deliveryDate
                          ? "border-destructive focus:ring-destructive"
                          : "border-border focus:ring-primary"
                      }`}
                    />
                    {errors.deliveryDate && <p className="text-sm text-destructive mt-1">{errors.deliveryDate}</p>}
                  </div>

                  <div>
                    <label htmlFor="timeWindow" className="block text-sm font-semibold mb-2">
                      Time Window <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <select
                      id="timeWindow"
                      name="timeWindow"
                      value={formData.timeWindow}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a time</option>
                      <option value="09-12">9 AM - 12 PM</option>
                      <option value="12-15">12 PM - 3 PM</option>
                      <option value="15-18">3 PM - 6 PM</option>
                      <option value="18-21">6 PM - 9 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary & Payment */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-border max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.cakeId}-${item.weight}`} className="flex justify-between text-sm">
                    <span>
                      {item.cakeName} ({item.weight}) x {item.quantity}
                    </span>
                    <span className="font-semibold">₹{item.pricePerUnit * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isSubmitting || isProcessing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting || isProcessing ? "Processing..." : "Pay with Razorpay"}
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
