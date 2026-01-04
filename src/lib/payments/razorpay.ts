import crypto from 'crypto';

// Verify Razorpay webhook signature using HMAC SHA256
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

// Minimal placeholder for creating an order (to be replaced with real Razorpay SDK calls)
export async function createRazorpayOrder(amountPaise: number, receipt?: string) {
  // In production replace with Razorpay REST API or SDK using RAZORPAY_KEY/SECRET
  return {
    id: `order_${Date.now()}`,
    amount: amountPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
  };
}
