"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function PaymentPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-20 min-h-screen">
        <Card className="p-10 space-y-6 text-center">
          <h1 className="text-3xl font-bold font-serif">Payments Moved to Checkout</h1>
          <p className="text-muted-foreground">
            Razorpay payments now open directly from the checkout page. Please return to your cart and start the
            checkout flow again to complete the payment.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/cart">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Cart
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                Browse Cakes
              </Button>
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </>
  )
}
