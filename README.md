# Mharmyraux — Upgraded scaffold

This repository has been upgraded and scaffolded for the Mharmyraux web app.

What was added in this commit:

- Next.js (App Router) + TypeScript scaffold
- Prisma schema (User, Wallet, LiveSession, Payment, AdminBalance)
- Payment endpoints: `/api/payment/razorpay`, `/api/payment/paypal`
- Webhook placeholders: `/api/payment/webhooks/razorpay` and `/api/payment/webhooks/paypal`
- Vote endpoint to release/penalize escrow: `/api/payment/vote`
- `computePayout` utility implementing the ₹3 per 10% drop penalty
- `tsconfig.json` paths and `next.config.js`
- `.env.example` showing required environment variables

Notes:

- Update environment variables in Vercel or your deployment environment before deploying:
  - `DATABASE_URL` (Postgres recommended)
  - `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET`
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
  - `NEXT_PUBLIC_BASE_URL`

- Prisma is incompatible with the Edge runtime. Ensure API routes that import Prisma run in the Node runtime (do not export `runtime = 'edge'` in those files).

- To run locally:
  1. npm ci
  2. npx prisma generate --schema=./prisma/schema.prisma
  3. npx prisma migrate dev --name init
  4. npm run dev

If you want, I can update other places where the old name appears (README text, docs, metadata) — tell me and I will search and replace references to the previous repo name.
