# Security & Production Readiness Notes

This document outlines critical security implementations and production requirements that must be completed before deploying to production.

## 🚨 Critical Security Tasks

### 1. Authentication & Authorization

**Current State**: Middleware uses placeholder header-based authentication
**Required Action**: Implement proper authentication system

```typescript
// middleware.ts - Replace placeholder with:
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  // Use user object instead of x-user-data header
}
```

**Files to Update**:
- `middleware.ts` (lines 27-35)
- `app/api/payouts/request/route.ts` (lines 13-14)

### 2. PayPal Webhook Verification

**Current State**: Placeholder implementation that accepts all webhooks
**Required Action**: Implement full certificate-based verification

```typescript
// lib/payments/paypal.ts
// Follow: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-the-webhook-signature

Steps:
1. Fetch PayPal certificate from certUrl
2. Verify certificate chain against PayPal's root CA
3. Construct expected message: transmissionId|transmissionTime|webhookId|crc32(payload)
4. Verify signature using certificate's public key
5. Use crypto.verify() with 'sha256WithRSAEncryption' algorithm
```

**Files to Update**:
- `lib/payments/paypal.ts` (lines 66-89)

### 3. Razorpay Route & Payout API Integration

**Current State**: Placeholder implementations with hardcoded responses
**Required Action**: Implement actual API calls

#### Linked Account Creation
```typescript
// lib/payments/razorpay.ts
export async function createLinkedAccount(email: string, name: string, phone: string) {
  const account = await razorpay.accounts.create({
    email,
    phone,
    type: 'route',
    legal_business_name: name,
    business_type: 'individual',
    contact_name: name,
    profile: {
      category: 'services',
      subcategory: 'social_networking',
    },
  });
  return account;
}
```

#### Route Transfer
```typescript
export async function executeRouteTransfer(
  accountId: string,
  amount: number,
  currency: string,
  transferId: string
) {
  const transfer = await razorpay.transfers.create({
    account: accountId,
    amount: amount * 100, // Convert to paise
    currency,
    notes: { transfer_id: transferId },
  });
  return transfer;
}
```

#### Payout Creation
```typescript
export async function createRazorpayPayout(
  accountId: string,
  amount: number,
  currency: string,
  mode: string = 'IMPS'
) {
  const payout = await razorpay.payouts.create({
    account_number: accountId,
    amount: amount * 100, // Convert to paise
    currency,
    mode,
    purpose: 'payout',
    fund_account: {
      account_type: 'bank_account',
      // Add bank account details
    },
  });
  return payout;
}
```

**Files to Update**:
- `lib/payments/razorpay.ts` (lines 39-78)

### 4. PayPal Payouts API Integration

**Current State**: Placeholder implementation
**Required Action**: Implement actual PayPal Payouts API

```typescript
// lib/payments/paypal.ts
export async function createPayPalPayout(
  email: string,
  amount: number,
  currency: string,
  note: string
) {
  const requestBody = {
    sender_batch_header: {
      sender_batch_id: `batch_${Date.now()}`,
      email_subject: 'You have a payout!',
      email_message: note,
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        receiver: email,
        note,
        sender_item_id: `item_${Date.now()}`,
      },
    ],
  };
  
  const request = new paypal.payouts.PayoutsPostRequest();
  request.requestBody(requestBody);
  const response = await paypalClient.execute(request);
  return response.result;
}
```

**Files to Update**:
- `lib/payments/paypal.ts` (lines 95-117)

### 5. PayPal Order ID Extraction

**Current State**: Incorrect field mapping in webhook handler
**Required Action**: Extract order ID from correct webhook field

```typescript
// app/api/payments/paypal/webhook/route.ts
// PayPal PAYMENT.CAPTURE.COMPLETED event structure:
{
  resource: {
    id: "capture_id_here",
    supplementary_data: {
      related_ids: {
        order_id: "actual_order_id"
      }
    }
  }
}

const orderId = event.resource.supplementary_data?.related_ids?.order_id;
```

**Files to Update**:
- `app/api/payments/paypal/webhook/route.ts` (lines 33-39)

## ⚠️ Important Configuration

### Rate Limiting

Implement rate limiting on all API routes to prevent abuse:

```typescript
// Use @upstash/ratelimit or Vercel's built-in rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // ... rest of handler
}
```

**Files to Update**: All API route handlers

### Input Validation

Add comprehensive input validation using Zod:

```typescript
import { z } from 'zod';

const createOrderSchema = z.object({
  gateway: z.enum(['razorpay', 'paypal']),
  sessionType: z.enum(['LOVE_CHAT', 'VOICE_CALL', 'VIDEO_CALL', 'PREMIUM_EXPERIENCE']),
  partnerId: z.string().cuid(),
  seekerId: z.string().cuid(),
  currency: z.enum(['INR', 'USD']).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createOrderSchema.safeParse(body);
  
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validated.error },
      { status: 400 }
    );
  }
  // Use validated.data
}
```

**Files to Update**: All API route handlers

### Logging & Monitoring

Implement comprehensive logging:

```typescript
// lib/logger.ts
import { createLogger } from 'some-logging-service';

export const logger = createLogger({
  service: 'mhramyraux-api',
  environment: process.env.NODE_ENV,
});

// Use in API routes:
logger.info('Payment order created', {
  sessionId: session.id,
  gateway,
  amount,
  userId: seekerId,
});

logger.error('Payment webhook failed', {
  error: error.message,
  gateway: 'razorpay',
  signature,
});
```

### Database Migrations

Before production:

```bash
# Create production migration
npx prisma migrate deploy

# Never use db push in production
# Always use migrations for schema changes
```

### Environment Variables Validation

Add runtime validation:

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RAZORPAY_KEY_ID: z.string().startsWith('rzp_'),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),
  PAYPAL_CLIENT_ID: z.string(),
  PAYPAL_CLIENT_SECRET: z.string(),
  PAYPAL_WEBHOOK_ID: z.string(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']),
});

export const env = envSchema.parse(process.env);
```

## 📋 Pre-Production Checklist

### Critical (Must Complete)

- [ ] Implement proper authentication in middleware (Supabase/NextAuth)
- [ ] Implement full PayPal webhook signature verification
- [ ] Implement Razorpay Route API integration (linked accounts, transfers)
- [ ] Implement Razorpay Payouts API integration
- [ ] Implement PayPal Payouts API integration
- [ ] Fix PayPal order ID extraction in webhook handler
- [ ] Add rate limiting to all API routes
- [ ] Add comprehensive input validation with Zod
- [ ] Implement logging and monitoring
- [ ] Validate all environment variables at startup

### Important (Strongly Recommended)

- [ ] Add database transaction support for atomic operations
- [ ] Implement retry logic for failed payments/payouts
- [ ] Add health check endpoints
- [ ] Setup alerting for failed webhooks
- [ ] Implement idempotency keys for payment operations
- [ ] Add database indexes for query optimization
- [ ] Setup backup and disaster recovery
- [ ] Implement GDPR compliance (data export/deletion)
- [ ] Add audit logging for all financial transactions
- [ ] Setup monitoring dashboards (Datadog, New Relic, etc.)

### Nice to Have

- [ ] Migrate to newer PayPal SDK (@paypal/paypal-server-sdk)
- [ ] Add GraphQL API layer
- [ ] Implement real-time notifications (WebSocket/SSE)
- [ ] Add batch processing for settlements
- [ ] Implement caching layer (Redis)
- [ ] Add automated testing suite
- [ ] Setup CI/CD pipeline with security scanning
- [ ] Add performance monitoring
- [ ] Implement feature flags

## 🔒 Security Best Practices

### Secrets Management

- Never commit secrets to version control
- Use Vercel Environment Variables or AWS Secrets Manager
- Rotate keys regularly (quarterly minimum)
- Use different keys for sandbox/production

### Database Security

- Enable Row Level Security (RLS) in Supabase
- Use prepared statements (Prisma handles this)
- Implement connection pooling
- Enable SSL for database connections
- Regular security audits

### API Security

- Implement CORS properly
- Use HTTPS only
- Add request size limits
- Implement request timeouts
- Add CSRF protection for state-changing operations
- Use security headers (CSP, HSTS, etc.)

### Payment Security

- Never store full card details (PCI compliance)
- Log all payment operations for audit
- Implement fraud detection
- Monitor for unusual patterns
- Setup alerts for high-value transactions
- Regular reconciliation with payment gateways

## 📚 Additional Resources

- [Razorpay Route API Docs](https://razorpay.com/docs/api/route/)
- [Razorpay Payouts API Docs](https://razorpay.com/docs/api/payouts/)
- [PayPal Webhooks Verification](https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/)
- [PayPal Payouts API](https://developer.paypal.com/docs/api/payments.payouts-batch/v1/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## ⚡ Performance Optimization

### Database Optimization

Add indexes for frequently queried fields:

```prisma
model LiveSession {
  // ... existing fields
  
  @@index([seekerId])
  @@index([partnerId])
  @@index([status])
  @@index([settlementStatus])
  @@index([createdAt])
}
```

### Caching Strategy

Implement caching for:
- Payment gateway credentials
- Configuration constants
- User wallet balances (with TTL)
- Session data during active sessions

### Edge Functions Optimization

- Keep Edge functions under 1MB
- Minimize dependencies
- Use dynamic imports for heavy libraries
- Optimize database queries

---

**Last Updated**: Implementation Phase
**Status**: Development - Not Production Ready
**Review Required**: Yes - Security team approval needed before production deployment
