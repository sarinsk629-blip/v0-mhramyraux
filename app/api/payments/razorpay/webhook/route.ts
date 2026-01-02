import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayWebhook } from '@/lib/payments/razorpay';
import { holdFundsInEscrow } from '@/lib/payments/escrow';
import type { RazorpayWebhookEvent, WebhookHandlerResponse } from '@/types/payments';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyRazorpayWebhook(body, signature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' } as WebhookHandlerResponse,
        { status: 401 }
      );
    }

    const event: RazorpayWebhookEvent = JSON.parse(body);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find session by order ID
      const session = await prisma.liveSession.findFirst({
        where: { razorpayOrderId: orderId },
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
          razorpayPaymentId: payment.id,
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
          gateway: 'RAZORPAY',
          gatewayRefId: payment.id,
          status: 'COMPLETED',
          description: 'Global Social Credits',
          internalNote: `Payment for session ${session.id}`,
          metadata: payment as any,
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
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      } as WebhookHandlerResponse,
      { status: 500 }
    );
  }
}
