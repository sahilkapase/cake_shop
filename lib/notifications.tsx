// Notification service for sending WhatsApp and email to seller
import type { Order } from "./db"
import { isTwilioConfigured, sendWhatsAppMessage } from "@/lib/twilio"

interface SellerNotification {
  phoneNumber: string
  email: string
}

// Default seller contact - Replace with actual seller details
const SELLER_CONTACT: SellerNotification = {
  phoneNumber: process.env.SELLER_WHATSAPP_NUMBER || "+919876543210",
  email: process.env.SELLER_EMAIL || "seller@sweetcakes.com",
}

function formatOrderDetails(order: Order): string {
  const itemsList = order.items.map((item) => `• ${item.cakeName} (${item.weight}) x${item.quantity}`).join("\n")

  return `
Order ID: ${order.id}
Total Amount: ₹${order.total}

ITEMS:
${itemsList}

CUSTOMER DETAILS:
Name: ${order.delivery.name}
Phone: ${order.delivery.phone}
Address: ${order.delivery.address}
Postal Code: ${order.delivery.postalCode ?? "Not provided"}

DELIVERY:
Date: ${new Date(order.delivery.deliveryDate).toLocaleDateString("en-IN")}
Time Window: ${order.delivery.timeWindow || "Not specified"}
${
  order.items.some((i) => i.customMessage)
    ? `\nCustom Messages:\n${order.items
        .filter((i) => i.customMessage)
        .map((i) => `• ${i.cakeName}: ${i.customMessage}`)
        .join("\n")}`
    : ""
}

Payment Status: ${order.paymentStatus}
Order Status: ${order.orderStatus}
`.trim()
}

export async function sendOrderNotifications(order: Order): Promise<void> {
  try {
    console.log(`[notifications] Sending order notifications for order ${order.id} to seller`)
    // Send notifications in parallel
    await Promise.all([sendWhatsAppNotification(order), sendEmailNotification(order)])
    console.log(`[notifications] All notifications sent for order ${order.id}`)
  } catch (error: any) {
    console.error("[notifications] Error sending notifications:", error?.message || error)
    // Don't throw - notifications should not block order creation
  }
}

async function sendWhatsAppNotification(order: Order): Promise<void> {
  if (!isTwilioConfigured()) {
    console.warn("[notifications] Twilio is not configured. Skipping WhatsApp notification.")
    return
  }

  try {
    const message = `🎂 New Order Received!\n\n${formatOrderDetails(order)}`
    const phone = SELLER_CONTACT.phoneNumber.replace(/\s+/g, "")
    const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`

    console.log(`[notifications] Sending WhatsApp notification to ${to}`)
    await sendWhatsAppMessage(to, message)
    console.log(`[notifications] WhatsApp notification sent successfully to ${to}`)
  } catch (error: any) {
    console.error("[notifications] Error sending WhatsApp notification:", error?.message || error)
  }
}

async function sendEmailNotification(order: Order): Promise<void> {
  try {
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f7f4; border-radius: 8px; }
    .header { background: #D4A5A5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
    .order-details { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .items-list { list-style: none; padding: 0; }
    .items-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .customer-info { background: #FFF3E0; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .total { font-size: 20px; font-weight: bold; color: #D4A5A5; margin-top: 15px; }
    .button { background: #D4A5A5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎂 New Order Received!</h1>
      <p>Order ID: <strong>${order.id}</strong></p>
    </div>
    <div class="content">
      <p>You have received a new order! Here are the details:</p>
      
      <div class="customer-info">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${order.delivery.name}</p>
        <p><strong>Phone:</strong> ${order.delivery.phone}</p>
        <p><strong>Address:</strong> ${order.delivery.address}${
          order.delivery.postalCode ? `, ${order.delivery.postalCode}` : ""
        }</p>
        <p><strong>Delivery Date:</strong> ${new Date(order.delivery.deliveryDate).toLocaleDateString("en-IN")}</p>
        <p><strong>Time Window:</strong> ${order.delivery.timeWindow || "Not specified"}</p>
      </div>

      <div class="order-details">
        <h3>Order Items</h3>
        <ul class="items-list">
          ${order.items.map((item) => `<li><strong>${item.cakeName}</strong> (${item.weight}) x${item.quantity} - ₹${item.pricePerUnit * item.quantity}</li>`).join("")}
        </ul>
      </div>

      ${
        order.items.some((i) => i.customMessage)
          ? `
      <div class="order-details">
        <h3>Custom Messages</h3>
        <ul class="items-list">
          ${order.items
            .filter((i) => i.customMessage)
            .map((item) => `<li><strong>${item.cakeName}:</strong> "${item.customMessage}"</li>`)
            .join("")}
        </ul>
      </div>
      `
          : ""
      }

      <div class="order-details">
        <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
        <p><strong>Tax (5%):</strong> ₹${order.tax}</p>
        <p class="total">Total: ₹${order.total}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      </div>

      <p style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        This is an automated order notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Using Resend API
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || "orders@sweetcakes.com"

    if (!apiKey) {
      console.warn("[notifications] RESEND_API_KEY not configured. Email notification skipped.")
      return
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: SELLER_CONTACT.email,
        subject: `🎂 New Order - ${order.id} - ₹${order.total}`,
        html: emailBody,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[notifications] Email notification failed:", errorText)
      console.error(`[notifications] Response status: ${response.status}`)
    } else {
      const result = await response.json()
      console.log(`[notifications] Email notification sent successfully to ${SELLER_CONTACT.email}. Email ID: ${result.id}`)
    }
  } catch (error: any) {
    console.error("[notifications] Error sending email notification:", error?.message || error)
  }
}
