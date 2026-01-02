// Razorpay Types
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  email: string;
  contact: string;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPayment;
    };
  };
  created_at: number;
}

// PayPal Types
export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture: boolean;
  create_time: string;
  update_time: string;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  resource_type: string;
  resource: {
    id: string;
    status: string;
    amount?: {
      currency_code: string;
      value: string;
    };
  };
  create_time: string;
  summary: string;
}

// Session Settlement Types
export interface SessionSettlement {
  sessionId: string;
  platformShare: number;
  partnerShare: number;
  penaltyApplied: number;
  satisfactionScore: number;
}

export interface SplitCalculation {
  platformShare: number;
  partnerShare: number;
  penaltyApplied: number;
}

// Webhook Handler Response
export interface WebhookHandlerResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

// Order Creation Types
export interface CreateOrderRequest {
  gateway: 'razorpay' | 'paypal';
  sessionType: 'LOVE_CHAT' | 'VOICE_CALL' | 'VIDEO_CALL' | 'PREMIUM_EXPERIENCE';
  partnerId: string;
  seekerId: string;
  currency?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  gateway?: string;
  error?: string;
}

// Payout Request Types
export interface PayoutRequest {
  amount: number;
  method: 'RAZORPAY' | 'PAYPAL' | 'BANK_TRANSFER';
  currency?: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId?: string;
  amount?: number;
  status?: string;
  error?: string;
}
