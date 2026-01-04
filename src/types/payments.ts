export type WebhookHandlerResponse = {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
};

export interface RazorpayWebhookEvent {
  event: string;
  payload?: any;
}

export interface PayPalWebhookEvent {
  event_type: string;
  resource?: any;
}
