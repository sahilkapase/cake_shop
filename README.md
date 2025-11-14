# SAUNDRYA CAKES Mumbai - Cake Shop Website

A modern, fully-functional cake selling website built with Next.js 16, featuring a customer storefront, shopping cart, Razorpay payment integration, and admin dashboard.

## Features

### Customer Features
- **Homepage**: Hero section with featured cakes and smooth scrolling
- **Product Catalog**: Browse 5 signature cakes with images and descriptions
- **Product Details**: Select weight (0.5kg, 1kg, 2kg), quantity, add custom messages
- **Shopping Cart**: Manage items, persistent storage with localStorage
- **Checkout**: Complete delivery form with validation
- **Payment**: Razorpay integration with test mode support
- **Order Confirmation**: Success page with order tracking

### Admin Dashboard
- **Authentication**: Email/password login (demo: admin@sweetcakes.com / Admin@123)
- **Order Management**: View all orders with expandable details
- **Search & Filter**: Find orders by ID, customer name, or phone number
- **Status Updates**: Change order status through workflow (Pending → Preparing → Out for Delivery → Delivered)
- **Order Details**: Dedicated page with full customer info, items, pricing
- **CSV Export**: Download orders for external processing
- **Invoice Download**: Generate text invoices for orders

### Seller Notifications
- **WhatsApp Alerts**: Instant WhatsApp message when order is placed with all details
- **Email Notifications**: Detailed HTML email with order information
- **Automatic**: Triggered immediately after payment verification
- **NEW**: Complete setup guide included (see SETUP_NOTIFICATIONS.md)

### Design
- **Responsive**: Mobile-first design optimized for all screen sizes
- **Accessible**: Semantic HTML, ARIA labels, keyboard navigation
- **Aesthetic**: Soft pastel colors (cream, blush, mint), rounded cards, elegant typography
- **Performance**: Optimized images, efficient state management

## Tech Stack

- **Frontend**: React 19.2, Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: JSON file-based storage (can be upgraded to MongoDB/PostgreSQL)
- **Payments**: Razorpay integration (test mode)
- **Notifications**: Twilio (WhatsApp) + Resend (Email)
- **Deployment**: Vercel-ready

## Quick Start

### Local Development

1. **Clone and install**:
   \`\`\`bash
   git clone <repository-url>
   cd cake-shop
   npm install
   \`\`\`

2. **Environment Variables** (create `.env.local`):
   \`\`\`
   # Razorpay (optional for development)
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_11A500000000001
   RAZORPAY_KEY_SECRET=your_key_secret

   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=+1234567890
   SELLER_WHATSAPP_NUMBER=+919876543210
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=orders@sweetcakes.com
   SELLER_EMAIL=seller@sweetcakes.com
   \`\`\`

3. **Run development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the app**:
   - Customer site: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login
   - Demo credentials: admin@sweetcakes.com / Admin@123

## Setup Notifications

**For WhatsApp + Email notifications**, follow the detailed setup guide:
👉 **[See SETUP_NOTIFICATIONS.md](./SETUP_NOTIFICATIONS.md)**

This includes:
- Creating Twilio account (WhatsApp)
- Creating Resend account (Email)
- Adding environment variables
- Testing notifications
- Troubleshooting guide

## Cake Menu (Fixed Rates)

| Cake | Price |
|------|-------|
| Chocolate Delight | ₹550 |
| Black Forest | ₹500 |
| Red Velvet | ₹650 |
| Butterscotch Dream | ₹450 |
| Fruit Cake | ₹600 |

**Pricing Model**:
- Base price for 1kg
- 0.5kg = 50% of base price
- 2kg = 200% of base price

**Additional Costs**:
- Tax: 5% on subtotal
- Shipping: Free
- Custom Message: Free (max 100 chars)

## Key Routes

### Customer Routes
- `/` - Homepage
- `/product/[id]` - Product details
- `/cart` - Shopping cart
- `/checkout` - Delivery form
- `/payment` - Razorpay payment
- `/success` - Order confirmation

### Admin Routes
- `/admin/login` - Admin login
- `/admin/dashboard` - Orders list
- `/admin/order/[id]` - Order details

## API Routes

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order by ID
- `PUT /api/orders/[id]` - Update order

### Razorpay
- `POST /api/razorpay/create-order` - Create Razorpay order
- `POST /api/razorpay/verify-payment` - Verify payment & send notifications

### Admin
- `POST /api/admin/login` - Admin authentication

## Data Structure

### Order Model
\`\`\`typescript
{
  id: string                    // Unique order ID
  items: CartItem[]             // Array of ordered items
  delivery: DeliveryDetails     // Delivery information
  subtotal: number              // Pre-tax amount
  tax: number                   // 5% tax
  total: number                 // Final amount
  paymentStatus: 'pending' | 'paid' | 'failed'
  orderStatus: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered'
  razorpayOrderId?: string      // Razorpay order reference
  razorpayPaymentId?: string    // Razorpay payment reference
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
}
\`\`\`

## Customization

### Change Cakes
Edit `lib/cakes.json` to modify cake names, prices, and descriptions.

### Update Admin Credentials
Edit `lib/admin.ts` to change the admin email/password. For production, use proper password hashing.

### Customize Seller Info
Update environment variables:
- `SELLER_WHATSAPP_NUMBER` - Seller's WhatsApp
- `SELLER_EMAIL` - Seller's email address

### Razorpay Integration
1. Sign up at https://razorpay.com
2. Get your API keys from the Razorpay dashboard
3. Replace test keys with live keys in environment variables
4. Uncomment Razorpay API calls in `app/api/razorpay/create-order/route.ts`

## Production Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect to Vercel
3. Add all environment variables (see Setup Notifications section)
4. Deploy with one click

### Database Migration
Replace JSON storage with:
- **MongoDB**: Update `lib/db.ts` to use MongoDB client
- **PostgreSQL/Neon**: Update to use `@neondatabase/serverless`
- **Supabase**: Use Supabase client with RLS policies

### Payment Production
- Replace Razorpay test keys with live keys
- Update email/password authentication to use proper hashing (bcrypt)
- Implement proper error handling and logging

## Troubleshooting

### Cart Not Persisting
- Check browser localStorage is enabled
- Clear browser cache and try again

### Admin Login Fails
- Verify credentials: admin@sweetcakes.com / Admin@123
- Check browser console for errors

### Payment Modal Doesn't Appear
- Ensure Razorpay script is loaded
- Check browser console for script loading errors
- Verify Razorpay key is correct in payment page

### Orders Not Saving
- Check `data/orders.json` has write permissions
- Ensure `/data` directory exists

### Notifications Not Sending
- See [SETUP_NOTIFICATIONS.md](./SETUP_NOTIFICATIONS.md#troubleshooting) for detailed troubleshooting
- Verify all environment variables are set correctly
- Check that payment is being verified (not just order created)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in browser console
3. Check `data/orders.json` to verify order data structure
4. For notifications, see [SETUP_NOTIFICATIONS.md](./SETUP_NOTIFICATIONS.md)

## Future Enhancements

- [ ] User accounts with order history
- [ ] Real-time order tracking map
- [ ] Customer reviews and ratings
- [ ] Seasonal cake specials
- [ ] Gift wrapping and delivery customization
- [ ] Subscription cake deliveries
- [ ] Integration with payment gateways (PayPal, Apple Pay)
- [ ] Admin SMS notifications for order updates
