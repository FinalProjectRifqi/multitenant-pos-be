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
  unit_id?: string;
  reference_number: string;
  amount: number;
  payment_status: PaymentStatus;
  failure_reason: string | null;
  paid_at: Date;
  expired_at: Date;
  qr_code_url: string | null;
  qr_string: string | null;
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
    qr_code_url: string;
    qr_string: string;
    acquirer: string;
    webhook_signature_key: string;
  };
}

export interface PaymentWebhookApiResponse {
  success: true;
  statusCode: 200;
  message: string;
}

export interface PaymentCancelApiResponse {
  success: true;
  statusCode: 200;
  message: string;
}
