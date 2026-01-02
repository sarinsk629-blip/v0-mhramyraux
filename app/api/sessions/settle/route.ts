import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processSettlement, getSessionsReadyForSettlement } from '@/lib/payments/escrow';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, processBatch } = body;

    // Process single session settlement
    if (sessionId) {
      const result = await processSettlement(sessionId);
      return NextResponse.json(result);
    }

    // Process batch settlements (for cron jobs)
    if (processBatch) {
      const sessions = await getSessionsReadyForSettlement();
      const results = [];

      for (const session of sessions) {
        try {
          const result = await processSettlement(session.id);
          results.push({
            sessionId: session.id,
            success: result.success,
            message: result.message,
          });
        } catch (error) {
          results.push({
            sessionId: session.id,
            success: false,
            error: error instanceof Error ? error.message : 'Settlement failed',
          });
        }
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing sessionId or processBatch parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error settling session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to settle session',
      },
      { status: 500 }
    );
  }
}
