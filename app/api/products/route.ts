import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(request: NextRequest) {
  try {
    const filePath = join(process.cwd(), "lib", "cakes.json")
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Products file not found" }, { status: 404 })
    }

    const fileContent = await readFile(filePath, "utf-8")
    const cakes = JSON.parse(fileContent)

    return NextResponse.json(cakes)
  } catch (error: any) {
    console.error("[products] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    )
  }
}

