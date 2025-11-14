"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartItem } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { CartItem as CartItemData, loadCart, saveCart, removeFromCart } from "@/lib/cart"

const WEIGHT_MULTIPLIERS: Record<string, number> = {
  "250gm": 0.25,
  "0.5kg": 0.5,
  "1kg": 1,
  "2kg": 2,
}

const TAX_RATE = 0.05 // 5% tax

export default function CartPage() {
  const [cart, setCart] = useState<CartItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [outOfStockIds, setOutOfStockIds] = useState<Set<number>>(new Set())

  // Fetch current out-of-stock status from API
  const fetchOutOfStockStatus = async () => {
    try {
      const res = await fetch(`/api/products`, { cache: "no-store" })
      if (res.ok) {
        const products = await res.json()
        const outOfStock = new Set(products.filter((p: any) => p.outOfStock).map((p: any) => p.id))
        setOutOfStockIds(outOfStock)
      }
    } catch (err) {
      console.error("Failed to fetch product stock status:", err)
    }
  }

  useEffect(() => {
    setCart(loadCart())
    setIsLoading(false)
  }, [])

  // Fetch out-of-stock status when cart loads
  useEffect(() => {
    if (cart.length > 0) {
      fetchOutOfStockStatus()
    }
  }, [])

  // Persist cart to localStorage when it changes, but skip the initial load
  const isFirstSave = useRef(true)
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    saveCart(cart)
  }, [cart])

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCart((prev) => {
      const nextCart = prev
        .map((item) => {
          const itemId = `${item.cakeId}-${item.weight}`
          return itemId === id ? { ...item, quantity } : item
        })
        .filter((item) => item.quantity > 0)

      return nextCart
    })
  }

  const handleRemove = (id: string) => {
    // Use the centralized helper so removal persists and triggers vibration
    removeFromCart(id)
    setCart(loadCart())
  }

  const handleChangeWeight = (id: string, newWeight: string) => {
    setCart((prev) => {
      const nextCart = prev.map((item) => {
        const itemId = `${item.cakeId}-${item.weight}`
        if (itemId !== id) return item

        const oldMultiplier = WEIGHT_MULTIPLIERS[item.weight] ?? 1
        const newMultiplier = WEIGHT_MULTIPLIERS[newWeight] ?? 1
        const basePrice = Math.round(item.pricePerUnit / oldMultiplier)
        const newPricePerUnit = Math.round(basePrice * newMultiplier)

        return {
          ...item,
          weight: newWeight,
          pricePerUnit: newPricePerUnit,
        }
      })
      saveCart(nextCart)
      return nextCart
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  const isEmpty = cart.length === 0
  const hasOutOfStockItems = cart.some((item) => outOfStockIds.has(item.cakeId))

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>

        <h1 className="text-3xl font-bold font-serif mb-8">Your Cart</h1>

        {isEmpty ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Browse Cakes</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {hasOutOfStockItems && (
              <div className="lg:col-span-2 mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-700 font-semibold">⚠️ Some items in your cart are out of stock. Please remove them before proceeding.</p>
              </div>
            )}
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <CartItem
                  key={`${item.cakeId}-${item.weight}`}
                  id={`${item.cakeId}-${item.weight}`}
                  cakeName={item.cakeName}
                  weight={item.weight}
                  quantity={item.quantity}
                  pricePerUnit={item.pricePerUnit}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                  onChangeWeight={handleChangeWeight}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-24">
                <h2 className="font-bold text-lg mb-4">Order Summary</h2>

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

                <Link href="/checkout" className="w-full">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={hasOutOfStockItems}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
