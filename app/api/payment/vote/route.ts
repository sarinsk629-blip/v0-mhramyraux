import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../src/lib/prisma'
import { computePayout } from '../../../../src/utils/penalty'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, userId, satisfactionPercent } = body
  if (!sessionId || !userId || typeof satisfactionPercent !== 'number') return NextResponse.json({ error: 'Missing' }, { status: 400 })

  const payments = await prisma.payment.findMany({ where: { providerOrderId: sessionId } })
  if (!payments || payments.length === 0) return NextResponse.json({ error: 'No payments found' }, { status: 404 })

  const payment = payments[0]
  const amount = payment.amountInPaise

  const { adminShare, userShare, hostShare } = computePayout(amount, satisfactionPercent)

  await prisma.$transaction(async (tx) => {
    await tx.wallet.upsert({ where: { userId }, create: { userId, balanceInPaise: userShare }, update: { balanceInPaise: { increment: userShare } } })

    await tx.wallet.upsert({ where: { userId: payment.userId }, create: { userId: payment.userId, balanceInPaise: hostShare }, update: { balanceInPaise: { increment: hostShare } } })

    await tx.adminBalance.upsert({ where: { id: 'ADMIN' }, create: { id: 'ADMIN', balanceInPaise: adminShare }, update: { balanceInPaise: { increment: adminShare } } })

    await tx.payment.update({ where: { id: payment.id }, data: { escrowStatus: adminShare > 0 ? 'PENALIZED' : 'RELEASED' } })

    await tx.liveSession.updateMany({ where: { sessionId }, data: { satisfaction: satisfactionPercent } })
  })

  return NextResponse.json({ ok: true, adminShare, userShare, hostShare })
}
