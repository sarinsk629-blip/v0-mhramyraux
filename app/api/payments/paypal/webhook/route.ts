import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayPalWebhook } from '@/lib/payments/paypal';
import { holdFundsInEscrow } from '@/lib/payments/escrow';
import type { PayPalWebhookEvent, WebhookHandlerResponse } from '@/types/payments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    
    // Extract PayPal headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('paypal-')) {
        headers[key.toLowerCase()] = value;
      }
    });

    // Verify webhook signature
    if (!verifyPayPalWebhook(body, headers)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' } as WebhookHandlerResponse,
        { status: 401 }
      );
    }

    const event: PayPalWebhookEvent = JSON.parse(body);

    // Handle PAYMENT.CAPTURE.COMPLETED event
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource.id;
      
      // Extract order ID from resource supplementary data
      // Note: PayPal webhook structure varies - adjust based on actual event structure
      // In real implementation, extract from event.resource.supplementary_data.related_ids.order_id
      const orderId = (event.resource as any).supplementary_data?.related_ids?.order_id || captureId;

      // Find session by order ID
      const session = await prisma.liveSession.findFirst({
        where: { paypalOrderId: orderId },
        include: { partner: { include: { wallet: true } } },
      });

      if (!session) {
        console.error('Session not found for order:', orderId);
        return NextResponse.json(
          { success: false, error: 'Session not found' } as WebhookHandlerResponse,
          { status: 404 }
        );
      }

      // Update session with payment details
      await prisma.liveSession.update({
        where: { id: session.id },
        data: {
          paypalCaptureId: captureId,
          status: 'PAYMENT_RECEIVED',
          paymentStatus: 'CAPTURED',
        },
      });

      // Hold funds in escrow
      await holdFundsInEscrow(session.id);

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: session.seekerId,
          sessionId: session.id,
          type: 'CREDIT_PURCHASE',
          amount: session.amountPaid,
          currency: session.currency,
          gateway: 'PAYPAL',
          gatewayRefId: captureId,
          status: 'COMPLETED',
          description: 'Global Social Credits',
          internalNote: `Payment for session ${session.id}`,
          metadata: event.resource as any,
        },
      });

      // Update partner's wallet pending earnings
      if (session.partner.wallet) {
        await prisma.wallet.update({
          where: { id: session.partner.wallet.id },
          data: {
            pendingEarnings: {
              increment: session.partnerShare,
            },
            totalEarnings: {
              increment: session.partnerShare,
            },
          },
        });
      } else {
        // Create wallet if doesn't exist
        await prisma.wallet.create({
          data: {
            userId: session.partnerId,
            pendingEarnings: session.partnerShare,
            totalEarnings: session.partnerShare,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment captured successfully',
        sessionId: session.id,
      } as WebhookHandlerResponse);
    }

    // Return success for other events
    return NextResponse.json({
      success: true,
      message: 'Event processed',
    } as WebhookHandlerResponse);
  } catch (error) {
    console.error('Error handling PayPal webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      } as WebhookHandlerResponse,
      { status: 500 }
    );
  }
}
