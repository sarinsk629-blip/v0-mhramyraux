// Minimal PayPal webhook verifier skeleton. In production this should call
// PayPal's /v1/notifications/verify-webhook-signature endpoint with
// PAYPAL_CLIENT_ID and PAYPAL_SECRET.
export function verifyPayPalWebhook(body: string, headers: Record<string, string>) {
  // If PAYPAL_WEBHOOK_ID not configured, return false
  if (!process.env.PAYPAL_WEBHOOK_ID) return false;
  // For now, accept webhook when WEBHOOK_ID exists to allow deployment; replace with real verification.
  return true;
}
