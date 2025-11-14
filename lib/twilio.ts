import twilio, { type Twilio } from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER?.replace(/\s+/g, "")
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

let twilioClient: Twilio | null = null

if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken)
  } catch (error) {
    console.error("[twilio] Failed to instantiate client", error)
    twilioClient = null
  }
}

function ensureWhatsAppPrefix(number: string) {
  if (number.startsWith("whatsapp:")) {
    return number
  }
  return `whatsapp:${number}`
}

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!twilioClient) {
    throw new Error("Twilio client is not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN")
  }

  if (!whatsappFrom) {
    throw new Error("TWILIO_WHATSAPP_NUMBER is not configured. Please set this environment variable.")
  }

  try {
    const cleanedTo = to.replace(/\s+/g, "")
    const fromNumber = ensureWhatsAppPrefix(whatsappFrom)
    const toNumber = ensureWhatsAppPrefix(cleanedTo)
    
    console.log(`[twilio] Sending WhatsApp message from ${fromNumber} to ${toNumber}`)

    // Guard against misconfigured env where TWILIO_WHATSAPP_NUMBER is set to the recipient number
    if (fromNumber === toNumber) {
      throw new Error(
        "TWILIO_WHATSAPP_NUMBER appears to be the same as the recipient number. Set `TWILIO_WHATSAPP_NUMBER` to your Twilio WhatsApp sandbox number (e.g. whatsapp:+14155238886) or your Twilio-enabled WhatsApp sender, not the admin's personal number.",
      )
    }
    
    const message = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body,
    })

    console.log(`[twilio] Message sent successfully. SID: ${message.sid}, Status: ${message.status}`)
    return message
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error"
    const errorCode = error?.code || "N/A"
    console.error(`[twilio] Failed to send WhatsApp message. Code: ${errorCode}, Message: ${errorMessage}`)
    
    // Provide more helpful error messages
    if (error?.code === 21211) {
      throw new Error("Invalid 'To' phone number. Please check the recipient number format.")
    } else if (error?.code === 21608) {
      throw new Error("Recipient has not joined the Twilio WhatsApp sandbox. Please send 'join <sandbox-keyword>' to the Twilio WhatsApp number first.")
    } else if (error?.code === 21212) {
      throw new Error("Invalid 'From' phone number. Please check TWILIO_WHATSAPP_NUMBER format.")
    }
    
    throw new Error(`Twilio error: ${errorMessage}`)
  }
}

export function isTwilioConfigured() {
  return Boolean(twilioClient && whatsappFrom)
}

export { verifyServiceSid }

