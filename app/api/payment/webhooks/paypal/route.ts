import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../src/lib/prisma'
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // PayPal webhook verification requires calling PayPal's verify endpoint with transmission headers.
  // Here we accept webhooks and create a payment record placeholder.
  const payload = await req.json()
  const providerOrderId = payload?.resource?.id || payload?.resource?.order_id
  if (!providerOrderId) return NextResponse.json({ ok: true })

  try {
    await prisma.payment.create({
      data: {
        userId: 'unknown',
        sessionUserId: 'unknown',
        sessionId: providerOrderId,
        amountInPaise: 0,
        provider: 'paypal',
        providerOrderId,
        status: 'COMPLETED',
        escrowStatus: 'PENDING',
      },
    })
  } catch (e) {}

  return NextResponse.json({ ok: true })
}
