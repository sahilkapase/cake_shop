"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Loader, ChevronDown } from "lucide-react"
import type { Order } from "@/lib/db"

interface ExpandedOrders {
  [key: string]: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedOrders, setExpandedOrders] = useState<ExpandedOrders>({})
  const [dateRange, setDateRange] = useState({ from: "", to: "" })

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders")
        const data = await response.json()
        setOrders(data)
        setFilteredOrders(data)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.delivery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.delivery.phone.includes(searchTerm),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.orderStatus === filterStatus)
    }

    if (dateRange.from) {
      const fromDate = new Date(dateRange.from)
      filtered = filtered.filter((order) => new Date(order.createdAt) >= fromDate)
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((order) => new Date(order.createdAt) <= toDate)
    }

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    setFilteredOrders(sorted)
  }, [searchTerm, filterStatus, dateRange, orders])

  const handleExportCSV = () => {
    const headers = ["Order ID", "Customer", "Phone", "Address", "Total", "Payment Status", "Order Status", "Date"]
    const rows = filteredOrders.map((order) => [
      order.id,
      order.delivery.name,
      order.delivery.phone,
      order.delivery.address,
      `₹${order.total}`,
      order.paymentStatus,
      order.orderStatus,
      new Date(order.createdAt).toLocaleDateString("en-IN"),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <>
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <h1 className="text-3xl font-bold font-serif">Orders Management</h1>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/admin/products")} variant="outline" className="w-full md:w-auto">
                  Manage Products
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="w-full md:w-auto bg-transparent">
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>

              <div className="flex items-center justify-between md:justify-end gap-2 text-sm text-muted-foreground">
                <span>Total: {filteredOrders.length}</span>
                <button
                  type="button"
                  onClick={() => setDateRange({ from: "", to: "" })}
                  className="text-primary hover:underline"
                >
                  Clear Dates
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedOrders((prev) => ({
                        ...prev,
                        [order.id]: !prev[order.id],
                      }))
                    }
                    className="w-full p-6 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">{order.delivery.name}</h3>
                        <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{order.delivery.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-primary">₹{order.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p
                            className={`font-medium capitalize ${
                              order.paymentStatus === "paid"
                                ? "text-green-600"
                                : order.paymentStatus === "failed"
                                  ? "text-destructive"
                                  : "text-amber-600"
                            }`}
                          >
                            {order.paymentStatus}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Order Status</p>
                          <p className="font-medium capitalize">{order.orderStatus.replace("_", " ")}</p>
                        </div>
                        {order.razorpayPaymentId && (
                          <div className="md:col-span-4">
                            <p className="text-muted-foreground">UPI Payment ID</p>
                            <p className="font-mono text-xs break-all">{order.razorpayPaymentId}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedOrders[order.id] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedOrders[order.id] && (
                    <div className="border-t border-border p-6 space-y-6 bg-muted/30">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Items</h4>
                        <div className="space-y-2 text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <div>
                                <p className="font-medium">{item.cakeName}</p>
                                <p className="text-muted-foreground">
                                  {item.weight} x {item.quantity}
                                </p>
                                {item.customMessage && (
                                  <p className="text-muted-foreground italic">
                                    Message: &quot;{item.customMessage}&quot;
                                  </p>
                                )}
                              </div>
                              <span className="font-semibold">₹{item.pricePerUnit * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div>
                        <h4 className="font-semibold mb-3">Delivery Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Address</p>
                            <p className="font-medium">
                                {order.delivery.address}
                                {order.delivery.postalCode ? `, ${order.delivery.postalCode}` : ""}
                            </p>
                          </div>
                          {order.delivery.deliveryDate && (
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">
                                {new Date(order.delivery.deliveryDate).toLocaleDateString("en-IN")}
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
                      </div>

                      {/* Payment & Price Breakdown */}
                      <div className="border-t border-border pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Subtotal</p>
                            <p className="font-semibold">₹{order.subtotal}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tax</p>
                            <p className="font-semibold">₹{order.tax}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Shipping</p>
                            <p className="font-semibold">Free</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-bold text-primary">₹{order.total}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-muted-foreground">Razorpay Order ID</p>
                            <p className="font-mono text-xs break-all">{order.razorpayOrderId ?? "—"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-muted-foreground">Razorpay Payment ID</p>
                            <p className="font-mono text-xs break-all">{order.razorpayPaymentId ?? "—"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Status Update */}
                      <OrderStatusUpdate
                        orderId={order.id}
                        currentStatus={order.orderStatus}
                        onUpdate={(updatedOrder) => {
                          setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
                        }}
                      />

                      {/* Timestamps */}
                      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                        <p>Created: {new Date(order.createdAt).toLocaleString("en-IN")}</p>
                        <p>Updated: {new Date(order.updatedAt).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function OrderStatusUpdate({
  orderId,
  currentStatus,
  onUpdate,
}: {
  orderId: string
  currentStatus: string
  onUpdate: (order: Order) => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: selectedStatus }),
      })

      const updated = await response.json()
      if (response.ok) {
        onUpdate(updated)
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <label htmlFor={`status-${orderId}`} className="block text-sm font-semibold mb-2">
          Update Order Status
        </label>
        <select
          id={`status-${orderId}`}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isUpdating}
        >
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
      <Button
        onClick={handleStatusChange}
        disabled={isUpdating || selectedStatus === currentStatus}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isUpdating ? "Updating..." : "Update"}
      </Button>
    </div>
  )
}
