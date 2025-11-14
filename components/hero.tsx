"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Hero() {
  const scrollToProducts = () => {
    const element = document.getElementById("products")
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      {/* background image layer (separate so we can filter/opacity it without affecting content) */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/cake3.jpg')",
          filter: "brightness(0.5) saturate(0.3) ",
          opacity: 0.5,
          
        }}
      />

      {/* subtle gradient/tint overlay to keep text readable */}
      <div className="absolute inset-0 bg-linear-to-br from-black/10 via-transparent to-black/5 z-10" />

      <div className="relative max-w-2xl text-center space-y-8 z-20">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground font-serif leading-tight text-balance">
          Freshly Baked Joy Delivered
        </h1>

        <p className="text-xl text-foreground/90 text-balance">
          Premium handcrafted cakes made fresh daily. Perfect for celebrations, birthdays, and special moments.
        </p>

        <Button onClick={scrollToProducts} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Order Your Cake
        </Button>
      </div>

      <button
        onClick={scrollToProducts}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20"
        aria-label="Scroll to products"
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </button>
    </div>
  )
}
