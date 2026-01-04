export async function createPayPalOrder(amount: number, currency = 'INR') {
  return {
    id: `paypal_order_${Date.now()}`,
    amount,
    currency,
    status: 'CREATED',
  };
}

export async function createPayPalPayout(email: string, amount: number, currency = 'INR', note?: string) {
  return {
    batch_id: `paypal_batch_${Date.now()}`,
    amount,
    currency,
    status: 'PENDING',
    to: email,
    note,
  };
}

export function verifyPayPalWebhook(body: string, headers: Record<string, string>) {
  // Placeholder: implement real verify-webhook-signature call in production.
  if (!process.env.PAYPAL_WEBHOOK_ID) return false;
  return true;
}
