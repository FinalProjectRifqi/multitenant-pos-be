export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded';

// ===========================
// DB Row Types
// ===========================

export interface PaymentRow {
  payment_id: string;
  order_id: string;
  reference_number: string;
  amount: number;
  payment_status: PaymentStatus;
  failure_reason: string | null;
  paid_at: Date;
  expired_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ===========================
// Response Shapes
// ===========================

export interface PaymentResponse {
  payment_id: string;
  order_id: string;
  reference_number: string;
  amount: number;
  payment_status: PaymentStatus;
  failure_reason: string | null;
  paid_at: Date;
  expired_at: Date;
  created_at: Date;
}

// ===========================
// API Response Envelopes
// ===========================

export interface PaymentListApiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: PaymentResponse[];
}

export interface PaymentDetailApiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: PaymentResponse;
}

export interface PaymentCreateApiResponse {
  success: true;
  statusCode: 201;
  message: string;
  data: PaymentResponse;
}

export interface PaymentCashlessCreateApiResponse {
  success: true;
  statusCode: 201;
  message: string;
  data: {
    payment: PaymentResponse;
    snap_token: string;
    redirect_url: string;
    webhook_signature_key: string;
  };
}

export interface PaymentWebhookApiResponse {
  success: true;
  statusCode: 200;
  message: string;
}
