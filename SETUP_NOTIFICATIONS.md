# WhatsApp & Email Notifications Setup

This guide explains how to set up automated WhatsApp and email notifications for new orders.

## Overview

When a customer completes payment for a cake order, the seller automatically receives:
1. **WhatsApp Message** - Instant notification with complete order details
2. **Email Notification** - Detailed HTML email with all order information

## Prerequisites

You'll need accounts for:
- **Twilio** (for WhatsApp notifications) - Free trial available
- **Resend** (for Email notifications) - Free tier includes 100 emails/day

## Setup Instructions

### Step 1: Twilio Setup (WhatsApp)

1. **Create Twilio Account**:
   - Go to https://www.twilio.com/try-twilio
   - Sign up for free (no credit card required for trial)
   - Verify your phone number

2. **Get Your Credentials**:
   - Go to Twilio Console: https://console.twilio.com
   - Find your **Account SID** and **Auth Token** on the dashboard
   - Save these - you'll need them for environment variables

3. **Set Up WhatsApp Sandbox** (for testing):
   - Go to Messaging → WhatsApp → Sandbox
   - Follow the instructions to join the sandbox
   - You'll get a **Sandbox WhatsApp Number** (starts with +1, e.g., `whatsapp:+14155238886`)
   - **Important for Admin Login**: The admin phone number must join the sandbox first
     - Send a WhatsApp message to your sandbox number with the join code (e.g., "join <keyword>")
     - This allows the sandbox to send OTP messages to your admin number
   - Save this number - this is your `TWILIO_WHATSAPP_NUMBER`

4. **Important Notes**:
   - Trial accounts are in sandbox mode (messages go only to verified numbers)
   - To go production and message anyone, upgrade your Twilio account
   - Each message costs ~₹0.50-₹1 after trial ends

### Step 2: Resend Setup (Email)

1. **Create Resend Account**:
   - Go to https://resend.com
   - Sign up (free tier available)
   - Verify your email

2. **Get Your API Key**:
   - Go to API Keys in settings
   - Create a new API key
   - Save this key - you'll use it in environment variables

3. **Domain Setup** (Optional but recommended):
   - Add your custom domain in Resend
   - Update email sending address to your domain
   - Default: orders@resend.dev

### Step 3: Add Environment Variables

Create `.env.local` file in your project root and add:

\`\`\`env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VA51a8317a693caf763c17a90625a5952c

# Seller WhatsApp Number (with country code, no spaces)
SELLER_WHATSAPP_NUMBER=+919876543210

# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=orders@sweetcakes.com

# Seller Email
SELLER_EMAIL=seller@sweetcakes.com
\`\`\`

**How to find each value:**

- **TWILIO_ACCOUNT_SID**: Twilio Console → Account Info
- **TWILIO_AUTH_TOKEN**: Twilio Console → Account Info (Auth Token)
- **TWILIO_WHATSAPP_NUMBER**: Twilio Console → Messaging → WhatsApp → Sandbox
  - Format: `whatsapp:+14155238886` (include the `whatsapp:` prefix if your sandbox number doesn't have it)
  - This is the "from" number that will send OTP messages
- **TWILIO_VERIFY_SERVICE_SID**: Twilio Console → Verify → Services (use Verify Service SID for OTP flows)
- **SELLER_WHATSAPP_NUMBER**: Your WhatsApp number (format: +919XXXXXXXXXX for India)
- **RESEND_API_KEY**: Resend Dashboard → API Keys
- **RESEND_FROM_EMAIL**: Your domain email or default resend.dev email
- **SELLER_EMAIL**: Your email address

### Step 4: Update for Production

For **Vercel Deployment**:
1. Go to your Vercel project settings
2. Add the same environment variables in Settings → Environment Variables
3. Deploy your project

## How It Works

### Notification Flow

1. **Customer completes checkout** → Order created with status "pending"
2. **Customer makes payment** → Payment verified
3. **Seller notifications sent automatically**:
   - WhatsApp message with order details
   - Email with formatted order information

### What Information is Sent

**WhatsApp Message includes:**
- Order ID and total amount
- Customer name and phone
- Delivery address and date
- Time window preference
- List of cakes ordered (with quantities and weights)
- Any custom messages written on cakes
- Payment and order status

**Email includes:**
- All WhatsApp information formatted nicely
- Itemized pricing breakdown
- Clickable links for admin dashboard
- Professional HTML template

## Testing

### Test Mode (Before Going Live)

1. **With Twilio Sandbox**:
   - Messages only go to verified phone numbers
   - No cost during trial
   - Perfect for testing

2. **With Resend Free Tier**:
   - 100 free emails per day
   - No credit card required
   - Great for testing

### Production Mode

1. **Upgrade Twilio** (if sending WhatsApp to customers):
   - Convert from sandbox to production
   - Add payment method
   - ~₹0.50 per message

2. **Resend Free Tier**:
   - Already works for production (100/day free)
   - Or upgrade for unlimited emails

## Troubleshooting

### WhatsApp Message Not Sending

**Problem**: "Invalid WhatsApp number"
- **Solution**: Ensure seller number includes country code (e.g., +919876543210)

**Problem**: "Sandbox not joined"
- **Solution**: Go to Twilio WhatsApp Sandbox and follow join instructions

**Problem**: "Invalid credentials"
- **Solution**: Double-check TWILIO_ACCOUNT_SID and AUTH_TOKEN

### Email Not Receiving

**Problem**: "Email not received in inbox"
- **Solution**: Check spam folder, emails from Resend sometimes go there initially

**Problem**: "Invalid API key"
- **Solution**: Regenerate API key in Resend dashboard

**Problem**: "Sender email not verified"
- **Solution**: Verify domain in Resend or use default resend.dev email

### Orders Not Triggering Notifications

**Problem**: "Notifications not sending but orders are created"
- **Solution**: Check browser console for errors (F12 → Console tab)
- **Solution**: Verify all environment variables are correctly set
- **Solution**: Check payment is actually being verified (not just pending)

### Checking Logs

To debug notifications:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for "[v0]" messages showing notification status
4. Check Twilio/Resend dashboards for delivery logs

## Cost Breakdown

### Twilio WhatsApp
- **Free Trial**: First 100 WhatsApp messages free
- **After Trial**: ~₹0.50 - ₹1 per message (varies by country)
- **Monthly**: ~₹500-1000 for ~1000 messages

### Resend Email
- **Free Tier**: 100 emails/day (includes 3000/month)
- **Paid Plan**: $20/month for unlimited emails
- **Plus**: No credit card needed for free tier

## Best Practices

1. **Verify Numbers Carefully**:
   - Always include country code (+91 for India)
   - No spaces or dashes in phone numbers

2. **Monitor Costs**:
   - Set up billing alerts in Twilio
   - Check monthly usage

3. **Handle Failures Gracefully**:
   - Notifications are non-blocking (orders don't fail if notifications don't send)
   - Order is still created even if notification fails

4. **Update Seller Info**:
   - To change seller phone/email, update environment variables
   - Restart your app after changes

## Next Steps

- [ ] Set up Twilio account and get credentials
- [ ] Set up Resend account and get API key
- [ ] Add environment variables to `.env.local`
- [ ] Test with a sample order (admin dashboard)
- [ ] Deploy to Vercel with production environment variables
- [ ] Monitor first week of notifications

## Additional Resources

- **Twilio WhatsApp Docs**: https://www.twilio.com/docs/whatsapp
- **Resend Email Docs**: https://resend.com/docs
- **Twilio Pricing**: https://www.twilio.com/whatsapp/pricing
- **Resend Pricing**: https://resend.com/pricing
