import paypal from '@paypal/checkout-server-sdk';
import crypto from 'crypto';

// Initialize PayPal client
function getPayPalClient() {
  const environment =
    process.env.PAYPAL_MODE === 'live'
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        );
  return new paypal.core.PayPalHttpClient(environment);
}

export const paypalClient = getPayPalClient();

// Create order function
export async function createPayPalOrder(amount: number, currency: string) {
  try {
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

    const order = await paypalClient.execute(request);
    return order.result;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

// Capture payment
export async function capturePayPalPayment(orderId: string) {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await paypalClient.execute(request);
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
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const authAlgo = headers['paypal-auth-algo'];

    // Note: Full PayPal webhook verification would require
    // fetching the certificate and verifying the signature
    // This is a simplified version
    return true; // Placeholder
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
    // Note: PayPal Payouts API integration would go here
    // This is a placeholder for the actual implementation
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
