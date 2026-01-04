import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '../../../../src/lib/prisma'

export async function POST(req: NextRequest) {
  const bodyText = await req.text()
  const sig = req.headers.get('x-razorpay-signature') || ''
  const secret = process.env.RAZORPAY_SECRET || ''

  const expected = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
  if (!sig || expected !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(bodyText)
  const providerOrderId = payload?.payload?.payment?.entity?.order_id ?? payload?.payload?.order?.entity?.id

  if (!providerOrderId) return NextResponse.json({ ok: true })

  try {
    await prisma.payment.create({
      data: {
        userId: 'unknown',
        sessionUserId: 'unknown',
        sessionId: providerOrderId,
        amountInPaise: 0,
        provider: 'razorpay',
        providerOrderId,
        status: 'COMPLETED',
        escrowStatus: 'PENDING',
      },
    })
  } catch (e) {
    // ignore duplicate
  }

  return NextResponse.json({ ok: true })
}
