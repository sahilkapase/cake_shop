#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const twilio = require('twilio')

// Lightweight .env.local parser to avoid needing dotenv during tests
function loadDotEnv(filePath) {
  try {
    const src = fs.readFileSync(filePath, 'utf8')
    const lines = src.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      // only set if not already set in environment
      if (!process.env[key]) process.env[key] = val
    }
  } catch (err) {
    // ignore
  }
}

loadDotEnv(path.resolve(process.cwd(), '.env.local'))

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER
const defaultTo = process.env.SELLER_WHATSAPP_NUMBER

function ensureWhatsAppPrefix(number) {
  if (!number) return number
  if (number.startsWith('whatsapp:')) return number
  return `whatsapp:${number}`
}

async function main() {
  if (!accountSid || !authToken) {
    console.error('Twilio credentials missing. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local')
    process.exit(1)
  }

  const client = twilio(accountSid, authToken)

  const arg = process.argv[2]
  const toRaw = arg || defaultTo
  if (!toRaw) {
    console.error('No recipient provided. Pass a number like +917264820796 or set SELLER_WHATSAPP_NUMBER in .env.local')
    process.exit(1)
  }

  const fromNumber = ensureWhatsAppPrefix(whatsappFrom || '')
  const toNumber = ensureWhatsAppPrefix(toRaw.replace(/\s+/g, ''))

  console.log('[test-otp] From:', fromNumber)
  console.log('[test-otp] To:', toNumber)

  if (fromNumber === toNumber) {
    console.error('[test-otp] ERROR: From and To are identical. Check TWILIO_WHATSAPP_NUMBER in .env.local')
    process.exit(2)
  }

  try {
    const msg = await client.messages.create({ from: fromNumber, to: toNumber, body: 'Test OTP: 123456' })
    console.log('[test-otp] Message SID:', msg.sid, 'Status:', msg.status)
  } catch (err) {
    console.error('[test-otp] Twilio error:', err?.code || 'N/A', err?.message || err)
    process.exit(3)
  }
}

main()
