"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Loader, Edit2, Download } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/db"

interface OrderDetailPageProps {
  params: { id: string }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { id } = params
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`)
        const data = await response.json()
        if (!response.ok) throw new Error("Order not found")
        setOrder(data)
        setNewStatus(data.orderStatus)
      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [id, router])

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.orderStatus) return

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      })

      const updated = await response.json()
      if (response.ok) {
        setOrder(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  const downloadInvoice = () => {
    if (!order) return

    const invoiceContent = `
SAUNDRYA CAKES MUMBAI - ORDER INVOICE
${"=".repeat(50)}

ORDER ID: ${order.id}
DATE: ${new Date(order.createdAt).toLocaleDateString("en-IN")}

CUSTOMER DETAILS:
Name: ${order.delivery.name}
Phone: ${order.delivery.phone}
Address: ${order.delivery.address}${order.delivery.postalCode ? `, ${order.delivery.postalCode}` : ""}
Delivery Date: ${new Date(order.delivery.deliveryDate).toLocaleDateString("en-IN")}

ITEMS:
${order.items.map((item) => `${item.cakeName} (${item.weight}) x ${item.quantity} - ₹${item.pricePerUnit * item.quantity}`).join("\n")}

PRICE BREAKDOWN:
Subtotal: ₹${order.subtotal}
Tax (5%): ₹${order.tax}
Shipping: Free
TOTAL: ₹${order.total}

PAYMENT STATUS: ${order.paymentStatus.toUpperCase()}
ORDER STATUS: ${order.orderStatus.toUpperCase()}

${"=".repeat(50)}
Generated on ${new Date().toLocaleString("en-IN")}
    `

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${order.id}.txt`
    a.click()
  }

  if (isLoading) {
    return (
      <>
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground mb-4">Order not found</p>
          <Link href="/admin/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Order Details</h1>
              <p className="text-muted-foreground font-mono">{order.id}</p>
            </div>
            <Button onClick={downloadInvoice} variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Invoice
            </Button>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
              <p
                className={`text-2xl font-bold capitalize ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : order.paymentStatus === "failed"
                      ? "text-destructive"
                      : "text-amber-600"
                }`}
              >
                {order.paymentStatus}
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Order Status</p>
              <p className="text-2xl font-bold capitalize">{order.orderStatus.replace("_", " ")}</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₹{order.total}</p>
            </Card>
          </div>

          {/* Customer & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Customer Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{order.delivery.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.delivery.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">N/A</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Delivery Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {order.delivery.address}
                    {order.delivery.postalCode && (
                      <>
                        <br />
                        {order.delivery.postalCode}
                      </>
                    )}
                  </p>
                </div>
                {order.delivery.deliveryDate && (
                  <div>
                    <p className="text-muted-foreground">Delivery Date</p>
                    <p className="font-medium">
                      {new Date(order.delivery.deliveryDate).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {order.delivery.timeWindow && (
                  <div>
                    <p className="text-muted-foreground">Time Window</p>
                    <p className="font-medium">{order.delivery.timeWindow.replace("-", " - ")}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Items */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.cakeName}</p>
                    <p className="text-sm text-muted-foreground">
                      Weight: {item.weight} | Quantity: {item.quantity}
                    </p>
                    {item.customMessage && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        Custom Message: &quot;{item.customMessage}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.pricePerUnit}</p>
                    <p className="text-sm text-muted-foreground">₹{item.pricePerUnit * item.quantity} total</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Price Breakdown */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Price Breakdown</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>₹{order.tax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">₹{order.total}</span>
              </div>
            </div>
          </Card>

          {/* Status Update */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Update Order Status
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>

                <div className="flex gap-2">
                  <Button
                    onClick={handleStatusUpdate}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setNewStatus(order.orderStatus)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold capitalize">{order.orderStatus.replace("_", " ")}</p>
                </div>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </Card>

          {/* Timestamps */}
          <Card className="p-6 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">
              Created: {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">
              Last Updated: {new Date(order.updatedAt).toLocaleString("en-IN")}
            </p>
          </Card>
        </div>
      </main>
    </>
  )
}
