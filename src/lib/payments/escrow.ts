import { prisma } from '@/lib/prisma';

export async function holdFundsInEscrow(sessionId: string) {
  try {
    await prisma.liveSession.updateMany({ where: { id: sessionId }, data: { status: 'ESCROW_HOLD' } });
  } catch (e) {
    console.error('holdFundsInEscrow error', e);
  }
}
