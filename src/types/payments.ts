export type WebhookHandlerResponse = {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
};

export type CreateOrderRequest = {
  gateway: 'razorpay' | 'paypal';
  sessionType: string;
  partnerId: string;
  seekerId: string;
  currency?: string;
};

export type CreateOrderResponse = {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  gateway?: string;
  sessionId?: string;
  error?: string;
};

export type PayoutRequest = {
  amount: number;
  method: 'RAZORPAY' | 'PAYPAL';
  currency?: string;
};

export type PayoutResponse = {
  success: boolean;
  payoutId?: string;
  amount?: number;
  status?: string;
  error?: string;
};
