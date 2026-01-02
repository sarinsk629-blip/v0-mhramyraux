import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay client
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create order function
export async function createRazorpayOrder(amount: number, currency: string, receipt: string) {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in smallest currency unit (paise)
      currency,
      receipt,
      notes: {
        description: 'Global Social Credits',
      },
    });
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

// Verify webhook signature
export function verifyRazorpayWebhook(payload: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Razorpay webhook:', error);
    return false;
  }
}

// Create linked account (for partners)
export async function createLinkedAccount(email: string, name: string, phone: string) {
  try {
    // Note: Razorpay Route API integration would go here
    // This is a placeholder for the actual implementation
    return {
      id: 'acc_' + Date.now(),
      status: 'created',
    };
  } catch (error) {
    console.error('Error creating linked account:', error);
    throw error;
  }
}

// Execute route transfer
export async function executeRouteTransfer(
  accountId: string,
  amount: number,
  currency: string,
  transferId: string
) {
  try {
    // Note: Razorpay Route API integration would go here
    // This is a placeholder for the actual implementation
    return {
      id: transferId,
      amount,
      currency,
      status: 'processed',
    };
  } catch (error) {
    console.error('Error executing route transfer:', error);
    throw error;
  }
}

// Create payout
export async function createRazorpayPayout(
  accountId: string,
  amount: number,
  currency: string,
  mode: string = 'IMPS'
) {
  try {
    // Note: Razorpay Payout API integration would go here
    // This is a placeholder for the actual implementation
    return {
      id: 'pout_' + Date.now(),
      amount,
      currency,
      status: 'processing',
    };
  } catch (error) {
    console.error('Error creating Razorpay payout:', error);
    throw error;
  }
}
