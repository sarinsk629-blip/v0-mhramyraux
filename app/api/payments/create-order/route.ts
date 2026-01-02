import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { createPayPalOrder } from '@/lib/payments/paypal';
import { PAYMENT_CONFIG } from '@/lib/payments/constants';
import type { CreateOrderRequest, CreateOrderResponse } from '@/types/payments';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { gateway, sessionType, partnerId, seekerId, currency } = body;

    // Validate required fields
    if (!gateway || !sessionType || !partnerId || !seekerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as CreateOrderResponse,
        { status: 400 }
      );
    }

    // Determine amount based on currency
    const isINR = currency === 'INR' || !currency;
    const amount = isINR ? PAYMENT_CONFIG.CREDIT_PRICE_INR : PAYMENT_CONFIG.CREDIT_PRICE_USD;
    const finalCurrency = currency || (isINR ? 'INR' : 'USD');

    // Calculate initial split (50/50)
    const platformShare = amount * (PAYMENT_CONFIG.PLATFORM_SHARE_PERCENT / 100);
    const partnerShare = amount * (PAYMENT_CONFIG.PARTNER_SHARE_PERCENT / 100);

    // Create session record
    const session = await prisma.liveSession.create({
      data: {
        seekerId,
        partnerId,
        sessionType,
        amountPaid: amount,
        currency: finalCurrency,
        paymentGateway: gateway.toUpperCase() as 'RAZORPAY' | 'PAYPAL',
        platformShare,
        partnerShare,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        settlementStatus: 'PENDING',
      },
    });

    // Create order based on gateway
    let orderId: string;
    let orderDetails: any;

    if (gateway === 'razorpay') {
      orderDetails = await createRazorpayOrder(
        amount,
        finalCurrency,
        `session_${session.id}`
      );
      orderId = orderDetails.id;

      // Update session with Razorpay order ID
      await prisma.liveSession.update({
        where: { id: session.id },
        data: { razorpayOrderId: orderId },
      });
    } else if (gateway === 'paypal') {
      orderDetails = await createPayPalOrder(amount, finalCurrency);
      orderId = orderDetails.id;

      // Update session with PayPal order ID
      await prisma.liveSession.update({
        where: { id: session.id },
        data: { paypalOrderId: orderId },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment gateway' } as CreateOrderResponse,
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      currency: finalCurrency,
      gateway,
      sessionId: session.id,
    } as CreateOrderResponse);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      } as CreateOrderResponse,
      { status: 500 }
    );
  }
}
