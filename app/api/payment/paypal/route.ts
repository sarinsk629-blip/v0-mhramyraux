import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amountInPaise, userId, sessionId } = body
  if (!amountInPaise || !userId || !sessionId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  // Convert paise to rupees for PayPal
  const amountInRupees = (amountInPaise / 100).toFixed(2)

  // In production, call PayPal Orders v2 API using server-side credentials to create an order.
  const fakeOrder = {
    id: `PAYPAL_ORDER_${Date.now()}`,
    amount: amountInRupees,
    currency: 'INR',
    status: 'CREATED',
  }

  return NextResponse.json({ order: fakeOrder })
}
