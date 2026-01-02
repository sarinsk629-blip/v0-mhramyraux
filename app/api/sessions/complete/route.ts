import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSplitWithPenalty } from '@/lib/payments/escrow';
import type { SessionSettlement } from '@/types/payments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, satisfactionScore } = body;

    // Validate inputs
    if (!sessionId || satisfactionScore === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (satisfactionScore < 0 || satisfactionScore > 100) {
      return NextResponse.json(
        { success: false, error: 'Satisfaction score must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Get session
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { partner: { include: { wallet: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Calculate split with penalty
    const split = calculateSplitWithPenalty(
      Number(session.amountPaid),
      satisfactionScore
    );

    // Update session
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        satisfactionScore,
        platformShare: split.platformShare,
        partnerShare: split.partnerShare,
        penaltyApplied: split.penaltyApplied,
        endedAt: new Date(),
      },
    });

    // If penalty was applied, adjust wallet pending earnings
    if (split.penaltyApplied > 0 && session.partner.wallet) {
      const originalPartnerShare = Number(session.partnerShare);
      const adjustment = originalPartnerShare - split.partnerShare;

      await prisma.wallet.update({
        where: { id: session.partner.wallet.id },
        data: {
          pendingEarnings: {
            decrement: adjustment,
          },
        },
      });

      // Create penalty transaction
      await prisma.transaction.create({
        data: {
          userId: session.partnerId,
          sessionId: session.id,
          type: 'PENALTY_DEDUCTION',
          amount: split.penaltyApplied,
          currency: session.currency,
          gateway: session.paymentGateway,
          status: 'COMPLETED',
          description: 'Quality penalty',
          internalNote: `Penalty for satisfaction score ${satisfactionScore}%`,
        },
      });
    }

    // Create session earning transaction
    await prisma.transaction.create({
      data: {
        userId: session.partnerId,
        sessionId: session.id,
        type: 'SESSION_EARNING',
        amount: split.partnerShare,
        currency: session.currency,
        gateway: session.paymentGateway,
        status: 'COMPLETED',
        description: 'Session earning',
        internalNote: `Earning from session ${session.id}`,
      },
    });

    // Create platform fee transaction
    await prisma.transaction.create({
      data: {
        userId: session.seekerId,
        sessionId: session.id,
        type: 'PLATFORM_FEE',
        amount: split.platformShare,
        currency: session.currency,
        gateway: session.paymentGateway,
        status: 'COMPLETED',
        description: 'Platform fee',
        internalNote: `Platform fee for session ${session.id}`,
      },
    });

    const result: SessionSettlement = {
      sessionId: session.id,
      platformShare: split.platformShare,
      partnerShare: split.partnerShare,
      penaltyApplied: split.penaltyApplied,
      satisfactionScore,
    };

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete session',
      },
      { status: 500 }
    );
  }
}
