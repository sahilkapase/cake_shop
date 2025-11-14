"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartItem } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { CartItem as CartItemData, loadCart, saveCart } from "@/lib/cart"

const TAX_RATE = 0.05 // 5% tax

export default function CartPage() {
  const [cart, setCart] = useState<CartItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setCart(loadCart())
    setIsLoading(false)
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
    setCart((prev) => {
      const nextCart = prev.filter((item) => `${item.cakeId}-${item.weight}` !== id)
      return nextCart
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  const isEmpty = cart.length === 0

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
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
