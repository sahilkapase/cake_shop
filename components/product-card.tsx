"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { addToCart, saveCart } from "@/lib/cart"

interface ProductCardProps {
  id: number
  name: string
  price: number
  description: string
  image: string
  outOfStock?: boolean
}

export function ProductCard({ id, name, price, description, image, outOfStock = false }: ProductCardProps) {
  const router = useRouter()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    
    const cartItem = {
      cakeId: id,
      cakeName: name,
      weight: "1kg",
      quantity: 1,
      pricePerUnit: price,
    }
    addToCart(cartItem)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    
    const cartItem = {
      cakeId: id,
      cakeName: name,
      weight: "1kg",
      quantity: 1,
      pricePerUnit: price,
    }
    // Redirect to product page so user can change weight/quantity before buying
    router.push(`/product/${id}`)
  }

  return (
    <Link href={`/product/${id}`} className="block">
      <Card className="overflow-hidden transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative h-48 bg-muted overflow-hidden">
          <img
            src={image || "placesholder.png"}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col grow">
          <h3 className="text-lg font-semibold mb-2">{name}</h3>
          <p className="text-muted-foreground text-sm mb-4 grow">{description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">₹{price}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                Add to Cart
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={handleBuyNow}
                disabled={outOfStock}
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
