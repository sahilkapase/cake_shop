import { useCallback, useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    Razorpay?: any
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js"

interface PaymentItem {
  cakeId: number
  cakeName: string
  weight: string
  quantity: number
  pricePerUnit: number
  customMessage?: string
}

interface CustomerDetails {
  name: string
  phone: string
  address: string
  postalCode?: string
  deliveryDate?: string
  timeWindow?: string
}

interface PaymentOptions {
  order?: RazorpayOrder
  amount: number
  subtotal: number
  tax: number
  items: PaymentItem[]
  customer: CustomerDetails
  onSuccess?: (order: any) => void
  onError?: (error: Error) => void
}

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt?: string
}

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false

  if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)) {
    return true
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script")
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Opens the Razorpay checkout modal for the supplied order.
 * The hook takes care of loading the Razorpay SDK, wiring UPI defaults,
 * and persisting the successful payment via our /api/save-order endpoint.
 */
export function useRazorpayPayment(order?: RazorpayOrder | null) {
  const [isProcessing, setIsProcessing] = useState(false)
  const scriptLoaded = useRef(false)
  const latestOrderRef = useRef<RazorpayOrder | null>(order ?? null)

  useEffect(() => {
    latestOrderRef.current = order ?? null
  }, [order])

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      scriptLoaded.current = loaded
    })
  }, [])

  const initiatePayment = useCallback(
    async ({ order: overrideOrder, items, customer, amount, subtotal, tax, onSuccess, onError }: PaymentOptions) => {
      const activeOrder = overrideOrder ?? latestOrderRef.current

      if (!activeOrder) {
        throw new Error("A Razorpay order is required before initiating payment")
      }

      if (!scriptLoaded.current) {
        const loaded = await loadRazorpayScript()
        scriptLoaded.current = loaded
        if (!loaded) {
          throw new Error("Failed to load Razorpay checkout script")
        }
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is not available in the browser")
      }

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!key) {
        throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured")
      }

      setIsProcessing(true)

      const options = {
        key,
        order_id: activeOrder.id,
        amount: activeOrder.amount,
        currency: activeOrder.currency ?? "INR",
        name: "SAUNDRYA CAKES Mumbai",
        description: "Cake order payment",
        prefill: {
          name: customer.name,
          contact: customer.phone.startsWith("+") ? customer.phone : `+91${customer.phone}`,
          // Providing contact number in prefill skips the contact details modal
        },
        theme: {
          color: "#a85a3a",
        },
        config: {
          // Optimized for mobile: UPI apps shown first, then QR code
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  { method: "upi" }, // Shows UPI apps (GPay, PhonePe, etc.) on mobile
                  { method: "upi_qr" }, // Shows QR code for scanning
                ],
              },
            },
            sequence: ["block.upi", "block.card", "block.netbanking"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        timeout: 300,
        handler: async (response: any) => {
          try {
            const saveResponse = await fetch("/api/save-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                amount,
                subtotal,
                tax,
                items,
                customer,
              }),
            })

            const savedOrder = await saveResponse.json()

            if (!saveResponse.ok) {
              throw new Error(savedOrder.error ?? "Failed to save order")
            }

            console.log(`[razorpay] Order saved successfully with ID: ${savedOrder.id}`)
            console.log(`[razorpay] Redirecting to success page with orderId: ${savedOrder.id}`)

            onSuccess?.(savedOrder)
          } catch (error) {
            const err = error instanceof Error ? error : new Error("Unexpected error while saving order")
            onError?.(err)
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            onError?.(new Error("Payment cancelled"))
          },
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on("payment.failed", (event: any) => {
        setIsProcessing(false)
        const description = event?.error?.description ?? "Payment failed"
        onError?.(new Error(description))
      })

      razorpay.open()
    },
    [],
  )

  return {
    initiatePayment,
    isProcessing,
  }
}

