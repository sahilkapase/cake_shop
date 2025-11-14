"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader, Package, CheckCircle2, XCircle } from "lucide-react"
import cakes from "@/lib/cakes.json"

interface Cake {
  id: number
  name: string
  price: number
  description: string
  image: string
  outOfStock?: boolean
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Cake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
      return
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          // Fallback to static import if API fails
          setProducts(cakes as Cake[])
        } else {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
        // Fallback to static import
        setProducts(cakes as Cake[])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [router])

  const handleToggleStock = async (productId: number) => {
    setUpdatingId(productId)
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
      return
    }

    try {
      const response = await fetch("/api/products/update-stock", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ productId, outOfStock: !products.find(p => p.id === productId)?.outOfStock }),
      })

      if (!response.ok) {
        throw new Error("Failed to update stock status")
      }

      const updated = await response.json()
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId ? { ...p, outOfStock: updated.outOfStock } : p
        )
      )
      
      // Reload products from API to ensure consistency
      const refreshResponse = await fetch("/api/products")
      if (refreshResponse.ok) {
        const refreshedProducts = await refreshResponse.json()
        setProducts(refreshedProducts)
      }
    } catch (error) {
      console.error("Failed to update stock:", error)
      alert("Failed to update stock status. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold font-serif">Product Management</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.outOfStock || false
              const isUpdating = updatingId === product.id

              return (
                <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{product.description}</p>
                      <p className="text-xl font-bold text-primary">₹{product.price}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {isOutOfStock ? (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-red-500 font-medium">Out of Stock</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-500 font-medium">In Stock</span>
                          </>
                        )}
                      </div>

                      <Button
                        onClick={() => handleToggleStock(product.id)}
                        disabled={isUpdating}
                        variant={isOutOfStock ? "default" : "outline"}
                        size="sm"
                        className={isOutOfStock ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {isUpdating ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : isOutOfStock ? (
                          "Mark In Stock"
                        ) : (
                          "Mark Out of Stock"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}

