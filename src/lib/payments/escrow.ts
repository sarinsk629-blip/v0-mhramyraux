import { prisma } from '@/lib/prisma';

// Minimal escrow hold implementation. Marks session as ESCROW_HOLD and leaves payments pending.
export async function holdFundsInEscrow(sessionId: string) {
  try {
    await prisma.liveSession.updateMany({ where: { id: sessionId }, data: { status: 'ESCROW_HOLD' } });
  } catch (e) {
    // swallow - best-effort in webhook context
    console.error('holdFundsInEscrow error', e);
  }
}
