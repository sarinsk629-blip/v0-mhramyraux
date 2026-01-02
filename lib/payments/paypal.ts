import paypal from '@paypal/checkout-server-sdk';
import crypto from 'crypto';

// Lazy initialization
let paypalClientInstance: paypal.core.PayPalHttpClient | null = null;

function getPayPalClient(): paypal.core.PayPalHttpClient {
  if (!paypalClientInstance) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
    }
    
    const environment = process.env.PAYPAL_MODE === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
    paypalClientInstance = new paypal.core.PayPalHttpClient(environment);
  }
  return paypalClientInstance;
}

// Create order function
export async function createPayPalOrder(amount: number, currency: string) {
  try {
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Global Social Credits',
        },
      ],
    });

    const order = await client.execute(request);
    return order.result;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

// Capture payment
export async function capturePayPalPayment(orderId: string) {
  try {
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await client.execute(request);
    return capture.result;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
}

// Verify webhook signature
export function verifyPayPalWebhook(
  payload: string,
  headers: Record<string, string>
): boolean {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return false;
    }
    
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const authAlgo = headers['paypal-auth-algo'];

    // IMPORTANT: In production, implement full PayPal webhook verification:
    // 1. Fetch the certificate from certUrl
    // 2. Verify the certificate chain
    // 3. Construct the expected message: transmissionId|transmissionTime|webhookId|crc32(payload)
    // 4. Verify the signature using the certificate
    // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-the-webhook-signature
    
    // For development, check basic headers presence
    if (!transmissionId || !transmissionTime || !transmissionSig) {
      console.error('Missing required PayPal webhook headers');
      return false;
    }
    
    // TODO: Implement full signature verification before production deployment
    console.warn('PayPal webhook verification is not fully implemented. Do not use in production without proper verification.');
    return true; // Placeholder - implement full verification
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

// Create payout
export async function createPayPalPayout(
  email: string,
  amount: number,
  currency: string,
  note: string
) {
  try {
    // IMPORTANT: Implement actual PayPal Payouts API before production
    // See: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
    // Steps:
    // 1. Create payout batch: POST /v1/payments/payouts
    // 2. Include sender_batch_header and items array
    // 3. Poll for payout status
    console.warn('PayPal payout creation is a placeholder. Implement before production.');
    return {
      batch_id: 'batch_' + Date.now(),
      amount,
      currency,
      status: 'processing',
    };
  } catch (error) {
    console.error('Error creating PayPal payout:', error);
    throw error;
  }
}
