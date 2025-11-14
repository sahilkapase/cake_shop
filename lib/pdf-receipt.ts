// PDF receipt generator for cake shop orders - optimized for speed
export async function generatePDFReceipt(orderDetails: any) {
  // Dynamically import jsPDF
  const { jsPDF } = await import("jspdf")

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin

  // Header with brand - minimal styling for speed
  pdf.setFontSize(18)
  pdf.setTextColor(220, 20, 60)
  pdf.setFont("helvetica", "bold")
  pdf.text("SAUNDRYA CAKES", margin, yPosition)
  yPosition += 6

  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont("helvetica", "normal")
  pdf.text("Mumbai", margin, yPosition)
  yPosition += 6

  // Simple line
  pdf.setDrawColor(220, 20, 60)
  pdf.setLineWidth(0.3)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Order ID and Date - fast format
  pdf.setFontSize(9)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "bold")
  pdf.text(`Order: ${orderDetails.id}`, margin, yPosition)
  yPosition += 4

  pdf.setFont("helvetica", "normal")
  const orderDate = new Date(orderDetails.createdAt).toLocaleDateString("en-IN")
  pdf.text(`Date: ${orderDate}`, margin, yPosition)
  yPosition += 6

  // Customer Details - condensed
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.text("Customer", margin, yPosition)
  yPosition += 4

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.text(`${orderDetails.delivery.name}`, margin, yPosition)
  yPosition += 3
  pdf.text(`Ph: ${orderDetails.delivery.phone}`, margin, yPosition)
  yPosition += 3

  const addressLines = pdf.splitTextToSize(orderDetails.delivery.address, contentWidth - 5)
  addressLines.forEach((line: string) => {
    pdf.text(line, margin, yPosition)
    yPosition += 3
  })
  yPosition += 2

  // Items - condensed table
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(255, 255, 255)
  pdf.setFillColor(220, 20, 60)
  pdf.rect(margin, yPosition - 3, contentWidth, 4, "F")
  pdf.text("Item", margin + 2, yPosition)
  pdf.text("Qty", margin + 50, yPosition)
  pdf.text("₹", pageWidth - margin - 15, yPosition, { align: "right" })

  yPosition += 4

  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(50, 50, 50)
  let itemYPos = yPosition

  orderDetails.items.forEach((item: any, index: number) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, itemYPos - 2.5, contentWidth, 3, "F")
    }
    pdf.setFontSize(7)
    const itemName = item.cakeName.substring(0, 25)
    pdf.text(itemName, margin + 1, itemYPos)
    pdf.text(String(item.quantity), margin + 50, itemYPos)
    pdf.text(`${item.pricePerUnit * item.quantity}`, pageWidth - margin - 15, itemYPos, { align: "right" })
    itemYPos += 3
  })

  yPosition = itemYPos + 2

  // Price Summary - fast format
  yPosition += 2
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  
  const summaryData = [
    ["Subtotal", `₹${orderDetails.subtotal}`],
    ["Tax (5%)", `₹${orderDetails.tax}`],
    ["Shipping", "Free"],
  ]

  summaryData.forEach(([label, value]) => {
    pdf.text(label, margin, yPosition)
    pdf.text(value, pageWidth - margin - 3, yPosition, { align: "right" })
    yPosition += 3
  })

  // Total - simple and fast
  yPosition += 2
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(220, 20, 60)
  pdf.text("Total", margin, yPosition)
  pdf.text(`₹${orderDetails.total}`, pageWidth - margin - 3, yPosition, { align: "right" })

  // Footer - minimal
  yPosition += 8
  pdf.setFontSize(7)
  pdf.setTextColor(120, 120, 120)
  pdf.setFont("helvetica", "normal")
  pdf.text("Thank you for your order!", margin, yPosition)

  // Download immediately
  pdf.save(`receipt-${orderDetails.id}.pdf`)
}
