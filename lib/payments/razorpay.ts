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
    // IMPORTANT: Implement actual Razorpay Route API integration before production
    // See: https://razorpay.com/docs/api/route/
    // Steps:
    // 1. Create linked account: POST /v1/accounts
    // 2. Upload KYC documents
    // 3. Activate account after verification
    console.warn('Razorpay linked account creation is a placeholder. Implement before production.');
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
    // IMPORTANT: Implement actual Razorpay Route transfer before production
    // See: https://razorpay.com/docs/api/route/transfers/
    // Use: POST /v1/transfers with account_id and amount
    console.warn('Razorpay route transfer is a placeholder. Implement before production.');
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
    // IMPORTANT: Implement actual Razorpay Payout API before production
    // See: https://razorpay.com/docs/api/payouts/
    // Use: POST /v1/payouts with account_number, amount, currency, mode
    console.warn('Razorpay payout creation is a placeholder. Implement before production.');
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
