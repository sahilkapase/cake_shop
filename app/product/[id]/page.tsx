"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import cakes from "@/lib/cakes.json"
import { addToCart, saveCart } from "@/lib/cart"

const WEIGHT_OPTIONS = ["250gm", "0.5kg", "1kg", "2kg"]
const WEIGHT_MULTIPLIERS: Record<string, number> = {
  "250gm": 0.25,
  "0.5kg": 0.5,
  "1kg": 1,
  "2kg": 2,
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const cakeId = Number.parseInt(params.id, 10)
  const cake = cakes.find((c) => c.id === cakeId)

  const [selectedWeight, setSelectedWeight] = useState("250gm")
  const [quantity, setQuantity] = useState(1)
  const [customMessage, setCustomMessage] = useState("")

  if (!cake) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Cake not found</p>
          <Link href="/">
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const multiplier = WEIGHT_MULTIPLIERS[selectedWeight]
  const pricePerUnit = Math.round(cake.price * multiplier)
  const total = pricePerUnit * quantity
  const isOutOfStock = cake.outOfStock || false

  const buildCartItem = () => ({
    cakeId: cake.id,
    cakeName: cake.name,
    weight: selectedWeight,
    quantity,
    pricePerUnit,
    customMessage: customMessage || undefined,
  })

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addToCart(buildCartItem())
    alert("Added to cart!")
  }

  const handleBuyNow = () => {
    if (isOutOfStock) return
    saveCart([buildCartItem()])
    router.push("/checkout")
  }

  return (
    <>
      <Header />
      <main>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Product Image */}
            <div className="relative flex items-center justify-center bg-muted rounded-xl overflow-hidden h-96">
              <img src={cake.image || "/placeholder.svg"} alt={cake.name} className="w-full h-full object-cover" />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold text-lg">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold font-serif mb-2">{cake.name}</h1>
                <p className="text-muted-foreground text-lg">{cake.description}</p>
              </div>

              <Card className="p-6 bg-secondary/30">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-primary">₹{pricePerUnit}</span>
                  <span className="text-sm text-muted-foreground">per {selectedWeight}</span>
                </div>
              </Card>

              {/* Weight Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">Select Weight</label>
                <div className="flex gap-3">
                  {WEIGHT_OPTIONS.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setSelectedWeight(weight)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedWeight === weight
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold mb-3">Quantity</label>
                <div className="flex items-center gap-3 w-fit">
                  <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-3">
                  Custom Message <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, 100))}
                  placeholder="Add a personal message to your cake..."
                  maxLength={100}
                  className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{customMessage.length}/100 characters</p>
              </div>

              {/* Add to Cart */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isOutOfStock}
                >
                  Add to Cart — ₹{total}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  size="lg"
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  disabled={isOutOfStock}
                >
                  Buy Now
                </Button>
                <Link href="/cart">
                  <Button variant="outline" size="lg" className="w-full bg-transparent">
                    View Cart
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
