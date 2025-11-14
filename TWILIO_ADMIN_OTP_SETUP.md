# Twilio WhatsApp OTP Setup for Admin Login

This guide explains how to set up Twilio WhatsApp for real-time OTP delivery to admin login.

## Quick Setup

1. **Get Twilio Credentials**:
   - `TWILIO_ACCOUNT_SID`: From Twilio Console → Account Info
   - `TWILIO_AUTH_TOKEN`: From Twilio Console → Account Info
   - `TWILIO_WHATSAPP_NUMBER`: From Twilio Console → Messaging → WhatsApp → Sandbox

2. **Join Twilio WhatsApp Sandbox** (Required for testing):
   - Go to Twilio Console → Messaging → WhatsApp → Sandbox
   - You'll see a message like: "Send 'join <keyword>' to +14155238886"
   - Send this message from your admin WhatsApp number (7264820796)
   - Wait for confirmation that you've joined the sandbox

3. **Set Environment Variables**:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

## How It Works

1. Admin enters mobile number on login page
2. System generates 6-digit OTP
3. OTP is sent via Twilio WhatsApp to `whatsapp:+91<admin_number>`
4. Admin receives OTP on WhatsApp
5. Admin enters OTP to complete login

## Testing

1. Make sure you've joined the Twilio WhatsApp sandbox
2. Enter admin mobile number: `7264820796`
3. Click "Send OTP"
4. Check your WhatsApp for the OTP message
5. Enter the OTP to login

## Troubleshooting

### OTP Not Received

1. **Check Sandbox Join**: Make sure you've sent the join message to Twilio sandbox
2. **Check Environment Variables**: Verify all three Twilio variables are set
3. **Check Console Logs**: Look for Twilio error messages in server logs
4. **Check Number Format**: Admin number should be 10 digits (no country code in input)

### Common Errors

- **Error 21608**: "Recipient has not joined the Twilio WhatsApp sandbox"
  - Solution: Send 'join <keyword>' message to your Twilio sandbox number
  
- **Error 21211**: "Invalid 'To' phone number"
  - Solution: Check that admin number is correct (7264820796)

- **Error 21212**: "Invalid 'From' phone number"
  - Solution: Check TWILIO_WHATSAPP_NUMBER format (should be `whatsapp:+14155238886`)

### Debug Mode

If Twilio is not configured or fails, the system will:
- Show an error message
- Display a debug OTP in the UI (amber warning box)
- Log the OTP to console

This helps with testing but should not be used in production.

## Production Setup

For production, you'll need to:
1. Upgrade Twilio account (sandbox only works for verified numbers)
2. Get approved WhatsApp Business API access
3. Use production WhatsApp number instead of sandbox

## Security Notes

- OTP expires after 5 minutes
- OTP can only be used once
- Admin mobile number is hardcoded (7264820796) for security
- OTP is stored in memory (use Redis for production)

