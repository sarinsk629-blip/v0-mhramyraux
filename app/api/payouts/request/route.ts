import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayPayout } from '@/lib/payments/razorpay';
import { createPayPalPayout } from '@/lib/payments/paypal';
import { PAYMENT_CONFIG } from '@/lib/payments/constants';
import type { PayoutRequest, PayoutResponse } from '@/types/payments';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body: PayoutRequest = await request.json();
    const { amount, method, currency } = body;

    // Get user ID from session/auth (placeholder - implement proper auth)
    // const userId = await getUserIdFromSession(request);
    const userId = request.headers.get('x-user-id'); // Placeholder

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as PayoutResponse,
        { status: 401 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' } as PayoutResponse,
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' } as PayoutResponse,
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (Number(wallet.withdrawalBalance) < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' } as PayoutResponse,
        { status: 400 }
      );
    }

    // Check minimum withdrawal amount
    const finalCurrency = currency || (wallet.user.role === 'PARTNER' ? 'INR' : 'USD');
    const minAmount =
      finalCurrency === 'INR'
        ? PAYMENT_CONFIG.MIN_WITHDRAWAL_INR
        : PAYMENT_CONFIG.MIN_WITHDRAWAL_USD;

    if (amount < minAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum withdrawal amount is ${finalCurrency} ${minAmount}`,
        } as PayoutResponse,
        { status: 400 }
      );
    }

    // Create payout based on method
    let payoutId: string;
    let payoutDetails: any;

    if (method === 'RAZORPAY') {
      if (!wallet.razorpayAccountId) {
        return NextResponse.json(
          { success: false, error: 'Razorpay account not linked' } as PayoutResponse,
          { status: 400 }
        );
      }

      payoutDetails = await createRazorpayPayout(
        wallet.razorpayAccountId,
        amount,
        finalCurrency
      );
      payoutId = payoutDetails.id;
    } else if (method === 'PAYPAL') {
      if (!wallet.paypalEmail || !wallet.paypalVerified) {
        return NextResponse.json(
          { success: false, error: 'PayPal account not linked or verified' } as PayoutResponse,
          { status: 400 }
        );
      }

      payoutDetails = await createPayPalPayout(
        wallet.paypalEmail,
        amount,
        finalCurrency,
        'Payout from Mhramyraux'
      );
      payoutId = payoutDetails.batch_id;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payout method' } as PayoutResponse,
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        walletId: wallet.id,
        amount,
        currency: finalCurrency,
        method,
        status: 'PROCESSING',
        ...(method === 'RAZORPAY' && { razorpayPayoutId: payoutId }),
        ...(method === 'PAYPAL' && { paypalPayoutId: payoutId }),
      },
    });

    // Deduct from withdrawal balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        withdrawalBalance: {
          decrement: amount,
        },
        totalWithdrawn: {
          increment: amount,
        },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PAYOUT',
        amount,
        currency: finalCurrency,
        gateway: method === 'RAZORPAY' ? 'RAZORPAY' : 'PAYPAL',
        gatewayRefId: payoutId,
        status: 'COMPLETED',
        description: 'Payout',
        internalNote: `Payout via ${method}`,
      },
    });

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
      amount,
      status: 'PROCESSING',
    } as PayoutResponse);
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payout',
      } as PayoutResponse,
      { status: 500 }
    );
  }
}
