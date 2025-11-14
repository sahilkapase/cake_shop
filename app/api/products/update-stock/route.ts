import { type NextRequest, NextResponse } from "next/server"
import { validateAdminToken } from "@/lib/admin"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.headers.get("x-admin-token") || ""
    
    if (!token || !validateAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, outOfStock } = body

    if (!productId || typeof outOfStock !== "boolean") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Read the current cakes.json file
    const filePath = join(process.cwd(), "lib", "cakes.json")
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Products file not found" }, { status: 404 })
    }

    const fileContent = await readFile(filePath, "utf-8")
    const cakes = JSON.parse(fileContent)

    // Find and update the product
    const productIndex = cakes.findIndex((c: any) => c.id === productId)
    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update the product
    cakes[productIndex] = {
      ...cakes[productIndex],
      outOfStock,
    }

    // Write back to file
    await writeFile(filePath, JSON.stringify(cakes, null, 2), "utf-8")

    return NextResponse.json({ 
      id: productId,
      outOfStock,
      message: "Stock status updated successfully" 
    })
  } catch (error: any) {
    console.error("[products/update-stock] Error:", error)
    return NextResponse.json(
      { error: "Failed to update stock status", details: error.message },
      { status: 500 }
    )
  }
}

