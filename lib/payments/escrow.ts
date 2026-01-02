import { prisma } from '@/lib/prisma';
import { PAYMENT_CONFIG } from './constants';
import { Decimal } from '@prisma/client/runtime/library';

// Hold funds logic
export async function holdFundsInEscrow(sessionId: string) {
  try {
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        paymentStatus: 'HELD_IN_ESCROW',
        status: 'PAYMENT_RECEIVED',
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error holding funds in escrow:', error);
    throw error;
  }
}

// Release funds logic
export async function releaseFunds(sessionId: string) {
  try {
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        paymentStatus: 'RELEASED',
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error releasing funds:', error);
    throw error;
  }
}

// Calculate split with penalty
export function calculateSplitWithPenalty(
  amountPaid: number,
  satisfactionScore: number
): {
  platformShare: number;
  partnerShare: number;
  penaltyApplied: number;
} {
  const basePartnerShare = amountPaid * (PAYMENT_CONFIG.PARTNER_SHARE_PERCENT / 100);
  const basePlatformShare = amountPaid * (PAYMENT_CONFIG.PLATFORM_SHARE_PERCENT / 100);

  let penaltyApplied = 0;
  let partnerShare = basePartnerShare;
  let platformShare = basePlatformShare;

  // Apply penalty if satisfaction score is below threshold
  if (satisfactionScore < PAYMENT_CONFIG.SATISFACTION_THRESHOLD) {
    const penaltyPercent =
      (PAYMENT_CONFIG.SATISFACTION_THRESHOLD - satisfactionScore) *
      PAYMENT_CONFIG.PENALTY_MULTIPLIER;
    penaltyApplied = (basePartnerShare * penaltyPercent) / 100;
    partnerShare = basePartnerShare - penaltyApplied;
    platformShare = basePlatformShare + penaltyApplied;
  }

  return {
    platformShare: Math.round(platformShare * 100) / 100,
    partnerShare: Math.round(partnerShare * 100) / 100,
    penaltyApplied: Math.round(penaltyApplied * 100) / 100,
  };
}

// Settlement cron job helper
export async function processSettlement(sessionId: string) {
  try {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { partner: { include: { wallet: true } } },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.settlementStatus === 'COMPLETED') {
      return { success: true, message: 'Already settled' };
    }

    // Check if 24-hour hold period has passed
    const holdPeriodMs = PAYMENT_CONFIG.ESCROW_HOLD_HOURS * 60 * 60 * 1000;
    const timeSincePayment = Date.now() - (session.endedAt?.getTime() || 0);

    if (timeSincePayment < holdPeriodMs) {
      return {
        success: false,
        message: 'Hold period not yet elapsed',
      };
    }

    // Move funds from pending to withdrawal balance
    if (session.partner.wallet) {
      await prisma.wallet.update({
        where: { id: session.partner.wallet.id },
        data: {
          pendingEarnings: {
            decrement: session.partnerShare,
          },
          withdrawalBalance: {
            increment: session.partnerShare,
          },
        },
      });
    }

    // Update session settlement status
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        settlementStatus: 'COMPLETED',
        settledAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing settlement:', error);
    throw error;
  }
}

// Check if sessions are ready for settlement
export async function getSessionsReadyForSettlement() {
  try {
    const holdPeriodMs = PAYMENT_CONFIG.ESCROW_HOLD_HOURS * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - holdPeriodMs);

    const sessions = await prisma.liveSession.findMany({
      where: {
        status: 'COMPLETED',
        settlementStatus: 'PENDING',
        endedAt: {
          lte: cutoffTime,
        },
      },
      take: 100, // Process in batches
    });

    return sessions;
  } catch (error) {
    console.error('Error getting sessions ready for settlement:', error);
    throw error;
  }
}
