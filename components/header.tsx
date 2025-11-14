"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { loadCart } from "@/lib/cart"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCartCount = () => {
      const cart = loadCart()
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(totalItems)
    }

    // Initial load
    updateCartCount()

    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cart") {
        updateCartCount()
      }
    }

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      updateCartCount()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("cartUpdated", handleCartUpdate)

    // Poll for changes (in case events don't fire)
    const interval = setInterval(updateCartCount, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("cartUpdated", handleCartUpdate)
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 relative shrink-0">
            <Image src="/logo.png" alt="Saundrya Cakes" fill className="rounded-full shadow-md object-cover" priority />
          </div>
          <span className="text-lg sm:text-2xl font-bold text-primary font-serif hidden sm:inline">SAUNDRYA CAKES</span>
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/#products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <span className="sr-only">Shopping cart</span>
            </Button>
          </Link>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border p-4 flex flex-col gap-3">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/#products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Admin
          </Link>
        </nav>
      )}
    </header>
  )
}
