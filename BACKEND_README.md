# Mhramyraux Backend Infrastructure

Complete backend implementation for a high-scale social marketplace with dual payment gateway integration, 50/50 revenue split, and security middleware.

## 📋 Architecture Overview

- **Database**: PostgreSQL via Prisma ORM (Supabase-ready)
- **Payment Gateways**: Razorpay (International) + PayPal
- **Revenue Split**: 50/50 platform-partner split with satisfaction-based penalties
- **Security**: Webhook signature verification, trial expiration middleware
- **Deployment**: Vercel Serverless Functions with Edge Runtime

## 🗄️ Database Schema

### Core Models

- **User**: Manages seekers, partners, and admins with trial/premium tracking
- **Wallet**: Partner earnings, pending/withdrawal balances, payout methods
- **LiveSession**: Session management with payment tracking and satisfaction scores
- **Transaction**: Complete audit trail for all financial operations
- **Payout**: Partner withdrawal requests and processing status
- **Rating**: User ratings and feedback

### Key Features

- Trial period with 24-hour FOMO countdown
- Dual payment gateway support
- Escrow-based fund holding (24-hour hold period)
- Satisfaction-based penalty system (< 90% triggers penalties)
- Complete transaction audit trail

## 💳 Payment Integration

### Razorpay Integration (`lib/payments/razorpay.ts`)

- Order creation with masked descriptions
- Webhook signature verification (crypto.timingSafeEqual)
- Route API for partner payouts
- Support for international payments

### PayPal Integration (`lib/payments/paypal.ts`)

- Order creation and capture
- Webhook verification
- Payouts API for international transfers
- Sandbox/Live environment support

### Escrow System (`lib/payments/escrow.ts`)

- 24-hour fund hold after payment capture
- Satisfaction-based split calculation
- Automated settlement processing
- Penalty calculation: `penalty = (90 - score) * 0.5% * partnerShare`

## 🔌 API Routes

### Payment Routes

#### `POST /api/payments/create-order`
Creates payment order (Razorpay or PayPal)
```json
{
  "gateway": "razorpay|paypal",
  "sessionType": "LOVE_CHAT",
  "partnerId": "string",
  "seekerId": "string",
  "currency": "INR|USD"
}
```

#### `POST /api/payments/razorpay/webhook`
Handles Razorpay webhook events
- Verifies signature
- Captures payment
- Holds funds in escrow
- Updates wallet pending earnings

#### `POST /api/payments/paypal/webhook`
Handles PayPal webhook events
- Verifies signature
- Processes capture
- Holds funds in escrow
- Updates wallet pending earnings

### Session Routes

#### `POST /api/sessions/complete`
Completes session with satisfaction score
```json
{
  "sessionId": "string",
  "satisfactionScore": 0-100
}
```

Applies penalty if score < 90%:
- Base split: 50/50 (₹25 each for ₹50)
- Score 70%: Partner loses 10% → Gets ₹22.50, Platform gets ₹27.50
- Score 100%: No penalty → ₹25 each

#### `POST /api/sessions/settle`
Settles funds after 24-hour hold
```json
{
  "sessionId": "string"
}
```
Or for batch processing:
```json
{
  "processBatch": true
}
```

### Payout Routes

#### `POST /api/payouts/request`
Partner requests withdrawal
```json
{
  "amount": 500,
  "method": "RAZORPAY|PAYPAL",
  "currency": "INR|USD"
}
```

Validates:
- Minimum withdrawal: ₹500 / $10
- Sufficient balance
- Linked payment account

## 🛡️ Security Features

### Webhook Verification
- Razorpay: HMAC SHA256 signature verification
- PayPal: Certificate-based verification
- Uses `crypto.timingSafeEqual` to prevent timing attacks

### Trial Blocking Middleware (`middleware.ts`)
- Blocks access to protected routes after 24-hour trial
- Routes: `/pulse`, `/void`, `/zenith`
- Redirects to `/upgrade` if trial expired and not premium
- Allows public routes: `/`, `/auth`, `/api`

### Masked Descriptions
All payment descriptions shown as "Global Social Credits" for privacy

## 📊 Revenue Split Logic

### Base Split (50/50)
```
₹50 credit → ₹25 platform + ₹25 partner
$5 credit → $2.50 platform + $2.50 partner
```

### Satisfaction Penalty
```typescript
if (satisfactionScore < 90) {
  penaltyPercent = (90 - satisfactionScore) * 0.5
  penalty = partnerShare * penaltyPercent / 100
  partnerShare = partnerShare - penalty
  platformShare = platformShare + penalty
}
```

### Examples
- Score 90%: No penalty → ₹25.00 + ₹25.00
- Score 85%: 2.5% penalty → ₹24.38 + ₹25.62
- Score 80%: 5% penalty → ₹23.75 + ₹26.25
- Score 70%: 10% penalty → ₹22.50 + ₹27.50
- Score 60%: 15% penalty → ₹21.25 + ₹28.75

## 🔧 Configuration

### Payment Constants (`lib/payments/constants.ts`)
```typescript
CREDIT_PRICE_INR: 50
CREDIT_PRICE_USD: 5
SESSION_DURATION_SECONDS: 600 (10 minutes)
PLATFORM_SHARE_PERCENT: 50
PARTNER_SHARE_PERCENT: 50
SATISFACTION_THRESHOLD: 90
PENALTY_MULTIPLIER: 0.5
MIN_WITHDRAWAL_INR: 500
MIN_WITHDRAWAL_USD: 10
ESCROW_HOLD_HOURS: 24
TRIAL_DURATION_HOURS: 24
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

This installs:
- `@prisma/client` & `prisma`: Database ORM
- `razorpay`: Razorpay payment gateway SDK
- `@paypal/checkout-server-sdk`: PayPal integration

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in:
```env
DATABASE_URL="postgresql://..."
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."
PAYPAL_MODE="sandbox" # or "live"
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

### 4. Test API Routes
```bash
npm run dev
```

## 📦 Project Structure

```
/home/runner/work/v0-mhramyraux/v0-mhramyraux/
├── prisma/
│   └── schema.prisma           # Database schema with all models
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   └── payments/
│       ├── constants.ts       # Payment configuration
│       ├── razorpay.ts       # Razorpay integration
│       ├── paypal.ts         # PayPal integration
│       └── escrow.ts         # Escrow & settlement logic
├── types/
│   ├── payments.ts           # TypeScript interfaces
│   └── paypal.d.ts          # PayPal SDK type definitions
├── app/api/
│   ├── payments/
│   │   ├── create-order/route.ts      # Order creation
│   │   ├── razorpay/webhook/route.ts  # Razorpay webhooks
│   │   └── paypal/webhook/route.ts    # PayPal webhooks
│   ├── sessions/
│   │   ├── complete/route.ts   # Complete with satisfaction
│   │   └── settle/route.ts     # Settlement processing
│   └── payouts/
│       └── request/route.ts    # Withdrawal requests
├── middleware.ts              # Trial blocking middleware
├── .env.example              # Environment variables template
└── .gitignore               # Git ignore rules
```

## 🔄 Payment Flow

### 1. Session Creation
```
User → Create Order API → Razorpay/PayPal → Order ID returned
```

### 2. Payment Capture
```
User Pays → Gateway Webhook → Verify Signature → Hold in Escrow
→ Update Session Status → Credit Partner Pending Earnings
```

### 3. Session Completion
```
Session Ends → Complete API (with satisfaction) → Calculate Split
→ Apply Penalty if needed → Update Final Shares
```

### 4. Settlement
```
After 24h → Settle API → Move Pending → Withdrawal Balance
```

### 5. Payout
```
Partner Requests → Payout API → Create Payout (Razorpay/PayPal)
→ Deduct from Withdrawal Balance → Update Total Withdrawn
```

## 🎯 Key Features Implemented

✅ Complete Prisma schema with all relationships
✅ Dual payment gateway support (Razorpay + PayPal)
✅ Webhook signature verification with timing-safe comparison
✅ 50/50 revenue split with satisfaction-based penalties
✅ 24-hour escrow hold period
✅ Trial expiration middleware
✅ Masked payment descriptions for privacy
✅ Complete transaction audit trail
✅ Type-safe TypeScript implementation
✅ Edge runtime optimization for Vercel
✅ Minimum withdrawal validation
✅ Linked account verification for payouts

## 🔐 Security Best Practices

- ✅ Webhook signature verification
- ✅ Timing-safe comparison for signatures
- ✅ No secret keys exposed to client
- ✅ Masked descriptions for bank statements
- ✅ Input validation on all API routes
- ✅ Trial expiration checks via middleware
- ✅ Escrow system for fraud protection
- ✅ Complete audit trail for all transactions

## 🚦 Next Steps

1. **Database Migration**: Run `npx prisma migrate dev`
2. **Configure Webhooks**: Set webhook URLs in Razorpay/PayPal dashboards
3. **Test Payments**: Use sandbox/test mode credentials
4. **Setup Cron Jobs**: For automated settlement processing
5. **Add Rate Limiting**: Protect API routes (use Upstash or Vercel)
6. **Implement Auth**: Integrate with Supabase Auth
7. **Add Logging**: Implement comprehensive logging for audit

## 📝 Notes

- PayPal SDK package is deprecated but still functional. Consider migrating to `@paypal/paypal-server-sdk` in production.
- Prisma client is auto-generated via `postinstall` script
- All API routes use Edge runtime for optimal performance
- Middleware runs on protected routes only
- Trial duration is 24 hours by default (configurable)

## 🤝 Contributing

This is a complete backend infrastructure. To extend:

1. Add new payment methods in `lib/payments/`
2. Create new API routes in `app/api/`
3. Update Prisma schema and run migrations
4. Add corresponding TypeScript types in `types/`

---

**Status**: ✅ Complete Backend Infrastructure Implemented
**Commit**: b7f5b7f
