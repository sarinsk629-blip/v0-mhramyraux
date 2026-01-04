# v0-mhramyraux — Upgraded scaffold

This commit scaffolds a Next.js (App Router) + TypeScript project with Prisma, payment route stubs for Razorpay and PayPal, webhook handlers, an escrow workflow and a satisfaction-penalty utility.

Key pieces added:
- Prisma schema (User, Wallet, LiveSession, Payment, AdminBalance)
- Payment endpoints: /api/payment/razorpay, /api/payment/paypal
- Webhook placeholders: /api/payment/webhooks/razorpay and /api/payment/webhooks/paypal
- Vote endpoint to release/penalize escrow: /api/payment/vote
- computePayout utility implementing the ₹3 per 10% drop penalty
- tsconfig paths and next.config.js
- .env.example showing required env vars

Important notes:
- No real secrets or provider calls are included. Replace placeholders with real calls and secure the endpoints.
- This commit pushes directly to main as requested. After deploy, run prisma migrations:
  1. npx prisma generate
  2. npx prisma migrate dev --name init

- Recommended DB: PostgreSQL for production.
