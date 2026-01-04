/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Common payment-related types used across the codebase.
 *
 * NOTE: This file provides minimal, safe types (including SessionSettlement)
 * so other modules can import them. Extend these definitions as needed.
 */

export interface PaymentSplit {
  recipientId: string;
  amount: number;
}

export interface PaymentSession {
  id: string;
  totalAmount: number;
  participants: string[];
  // Optional metadata
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface SessionSettlement {
  /** The session ID being settled */
  sessionId: string;
  /** Total amount for the settlement */
  totalAmount: number;
  /** Numeric penalty applied during the settlement (if any) */
  penalty?: number;
  /** How the total was split between recipients */
  splits: PaymentSplit[];
  /** When the settlement was processed */
  settledAt?: string;
  /** Status of the settlement */
  status?: 'pending' | 'settled' | 'failed';
  /** Optional provider or transaction id returned by payment provider */
  transactionId?: string;
}

export type { };
