import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getOutOfStockItems } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Read static cakes data
    const filePath = join(process.cwd(), "lib", "cakes.json")
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Products file not found" }, { status: 404 })
    }

    const fileContent = await readFile(filePath, "utf-8")
    const cakes = JSON.parse(fileContent)

    // Merge with DB stock status
    try {
      const outOfStockIds = await getOutOfStockItems()
      const productsWithStock = cakes.map((cake: any) => ({
        ...cake,
        outOfStock: outOfStockIds.has(cake.id) || cake.outOfStock || false,
      }))
      return NextResponse.json(productsWithStock)
    } catch (dbError) {
      // If DB fails, just return static data with whatever outOfStock flag is there
      console.warn("[products] Could not get stock status from DB, returning static data:", dbError)
      return NextResponse.json(cakes)
    }
  } catch (error: any) {
    console.error("[products] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    )
  }
}

