// PDF receipt generator for cake shop orders
export async function generatePDFReceipt(orderDetails: any) {
  // Dynamically import jsPDF and html2canvas
  const { jsPDF } = await import("jspdf")

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin

  // Header with brand
  pdf.setFontSize(20)
  pdf.setTextColor(220, 20, 60) // Crimson red
  pdf.setFont("helvetica", "bold")
  pdf.text("SAUNDRYA CAKES", margin, yPosition)
  yPosition += 8

  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont("helvetica", "normal")
  pdf.text("Mumbai - Freshly Baked Happiness", margin, yPosition)
  yPosition += 8

  // Decorative line
  pdf.setDrawColor(220, 20, 60)
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Order ID and Date
  pdf.setFontSize(10)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "bold")
  pdf.text("Order ID:", margin, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(orderDetails.id, margin + 30, yPosition)
  yPosition += 6

  pdf.setFont("helvetica", "bold")
  pdf.text("Date:", margin, yPosition)
  pdf.setFont("helvetica", "normal")
  const orderDate = new Date(orderDetails.createdAt).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  pdf.text(orderDate, margin + 30, yPosition)
  yPosition += 10

  // Customer Details Section
  pdf.setFontSize(11)
  pdf.setTextColor(220, 20, 60)
  pdf.setFont("helvetica", "bold")
  pdf.text("CUSTOMER DETAILS", margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "normal")
  const customerLines = [
    `Name: ${orderDetails.delivery.name}`,
    `Phone: ${orderDetails.delivery.phone}`,
    `Address: ${orderDetails.delivery.address}${
      orderDetails.delivery.postalCode ? `, ${orderDetails.delivery.postalCode}` : ""
    }`,
  ]

  customerLines.forEach((line) => {
    const splitLines = pdf.splitTextToSize(line, contentWidth - 10)
    pdf.text(splitLines, margin + 5, yPosition)
    yPosition += splitLines.length * 5 + 2
  })

  yPosition += 3

  // Delivery Information
  pdf.setFontSize(11)
  pdf.setTextColor(220, 20, 60)
  pdf.setFont("helvetica", "bold")
  pdf.text("DELIVERY INFORMATION", margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "normal")
  if (orderDetails.delivery.deliveryDate) {
    const deliveryDate = new Date(orderDetails.delivery.deliveryDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    pdf.text(`Delivery Date: ${deliveryDate}`, margin + 5, yPosition)
    yPosition += 6
  }
  if (orderDetails.delivery.timeWindow) {
    pdf.text(`Time Window: ${orderDetails.delivery.timeWindow}`, margin + 5, yPosition)
    yPosition += 6
  }

  yPosition += 5

  // Items Section - Table Header
  pdf.setFontSize(11)
  pdf.setTextColor(220, 20, 60)
  pdf.setFont("helvetica", "bold")
  pdf.text("ORDER ITEMS", margin, yPosition)
  yPosition += 8

  // Table headers
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  pdf.setFillColor(220, 20, 60)

  const col1 = margin
  const col2 = margin + 70
  const col3 = margin + 95
  const col4 = pageWidth - margin - 25

  pdf.rect(col1, yPosition - 5, contentWidth, 6, "F")
  pdf.text("Item Name", col1 + 3, yPosition)
  pdf.text("Weight", col2 + 3, yPosition)
  pdf.text("Qty", col3 + 3, yPosition)
  pdf.text("Amount", col4 + 3, yPosition, { align: "right" })

  yPosition += 8

  // Items rows
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(50, 50, 50)
  let itemYPos = yPosition

  orderDetails.items.forEach((item: any, index: number) => {
    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(240, 240, 240)
      pdf.rect(col1, itemYPos - 4, contentWidth, 7, "F")
    }

    pdf.setFontSize(9)
    const itemName = pdf.splitTextToSize(item.cakeName, 60)
    pdf.text(itemName, col1 + 3, itemYPos)

    pdf.text(item.weight, col2 + 3, itemYPos)
    pdf.text(String(item.quantity), col3 + 3, itemYPos)
    pdf.text(`₹${item.pricePerUnit * item.quantity}`, col4 + 3, itemYPos, { align: "right" })

    itemYPos += itemName.length > 1 ? itemName.length * 4 + 3 : 7
  })

  yPosition = itemYPos + 3

  // Custom messages if any
  const customMessages = orderDetails.items.filter((item: any) => item.customMessage)
  if (customMessages.length > 0) {
    pdf.setFontSize(10)
    pdf.setTextColor(220, 20, 60)
    pdf.setFont("helvetica", "bold")
    pdf.text("CUSTOM MESSAGES", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(9)
    pdf.setTextColor(50, 50, 50)
    pdf.setFont("helvetica", "normal")
    customMessages.forEach((item: any) => {
      const msgLines = pdf.splitTextToSize(`• ${item.cakeName}: "${item.customMessage}"`, contentWidth - 10)
      msgLines.forEach((line: string) => {
        pdf.text(line, margin + 5, yPosition)
        yPosition += 5
      })
      yPosition += 2
    })
    yPosition += 3
  }

  // Price Summary Section
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(220, 20, 60)
  pdf.text("PRICE SUMMARY", margin, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "normal")

  const summaryLines = [
    { label: "Subtotal", value: `₹${orderDetails.subtotal}` },
    { label: "Tax (5%)", value: `₹${orderDetails.tax}` },
    { label: "Shipping", value: "Free" },
  ]

  summaryLines.forEach((line) => {
    pdf.text(line.label, margin + 5, yPosition)
    pdf.text(line.value, pageWidth - margin - 5, yPosition, { align: "right" })
    yPosition += 6
  })

  // Total line with background
  yPosition += 3
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, yPosition - 5, contentWidth, 10, "F")

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(220, 20, 60)
  pdf.text("TOTAL AMOUNT", margin + 5, yPosition + 1)
  pdf.text(`₹${orderDetails.total}`, pageWidth - margin - 5, yPosition + 1, { align: "right" })

  yPosition += 15

  // Payment Status
  pdf.setFontSize(10)
  pdf.setTextColor(50, 50, 50)
  pdf.setFont("helvetica", "bold")
  pdf.text("Payment Status:", margin, yPosition)
  pdf.setTextColor(34, 197, 94) // Green
  pdf.text("✓ Paid", margin + 40, yPosition)

  yPosition += 8

  // Footer
  const footerY = pageHeight - 20
  pdf.setFontSize(9)
  pdf.setTextColor(120, 120, 120)
  pdf.setFont("helvetica", "normal")
  pdf.text("Thank you for your order!", margin, footerY)
  pdf.text("Your cake will be freshly prepared and delivered with care.", margin, footerY + 5)
  pdf.text("For any queries, please contact us.", margin, footerY + 10)

  // Small decorative line at bottom
  pdf.setDrawColor(220, 20, 60)
  pdf.setLineWidth(0.3)
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  // Download the PDF
  pdf.save(`receipt-${orderDetails.id}.pdf`)
}
