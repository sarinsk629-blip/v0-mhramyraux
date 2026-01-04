import crypto from 'crypto';

export async function createRazorpayOrder(amount: number, currency = 'INR', receipt?: string) {
  return {
    id: `razorpay_order_${Date.now()}`,
    amount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    status: 'created',
  };
}

export async function createRazorpayPayout(accountId: string, amount: number, currency = 'INR') {
  return {
    id: `razorpay_payout_${Date.now()}`,
    accountId,
    amount,
    currency,
    status: 'processing',
  };
}

export function verifyRazorpayWebhook(body: string, signature: string) {
  const secret = process.env.RAZORPAY_SECRET || '';
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature;
  } catch (e) {
    console.error('Razorpay verify error', e);
    return false;
  }
}
