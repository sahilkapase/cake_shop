import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"

export default async function Home() {
  // Fetch products from API (no-cache) so out-of-stock updates are reflected in real-time
  let products = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/products`, {
      cache: "no-store",
    })
    if (res.ok) {
      products = await res.json()
    }
  } catch (e) {
    // Fallback to static file if API fails
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cakes = require("@/lib/cakes.json")
    products = cakes
  }

  return (
    <>
      <Header />
      <main>
        <Hero />

        <section id="products" className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-serif">Our Signature Cakes</h2>
            <p className="text-muted-foreground text-lg">Handcrafted with premium ingredients and love</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((cake: any) => (
              <ProductCard
                key={cake.id}
                id={cake.id}
                name={cake.name}
                price={cake.price}
                description={cake.description}
                image={cake.image}
                outOfStock={cake.outOfStock || false}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
