import type { Knex } from 'knex';
import type { PaymentRow, PaymentStatus } from '../models/payment.model';

export interface CreatePaymentData {
  order_id: string;
  reference_number: string;
  amount: number;
  payment_status: PaymentStatus;
  failure_reason: string | null;
  paid_at: Date;
  expired_at: Date;
}

export interface UpdatePaymentData {
  payment_status: PaymentStatus;
  failure_reason?: string | null;
  paid_at?: Date;
  expired_at?: Date;
}

export interface IPaymentRepository {
  findByOrderId(unitId: string, orderId: string): Promise<PaymentRow[]>;
  findById(
    unitId: string,
    orderId: string,
    paymentId: string,
  ): Promise<PaymentRow | null>;
  findActiveByOrderId(orderId: string): Promise<PaymentRow | null>;
  findByReferenceNumber(referenceNumber: string): Promise<PaymentRow | null>;
  create(data: CreatePaymentData): Promise<{ payment_id: string }>;
  updateStatus(paymentId: string, data: UpdatePaymentData): Promise<void>;
}

const PAYMENT_SELECT_COLUMNS = [
  'p.payment_id',
  'p.order_id',
  'p.reference_number',
  'p.amount',
  'p.payment_status',
  'p.failure_reason',
  'p.paid_at',
  'p.expired_at',
  'p.created_at',
  'p.updated_at',
  'p.deleted_at',
];

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly db: Knex) {}

  async findByOrderId(unitId: string, orderId: string): Promise<PaymentRow[]> {
    const rows = await this.db('payments as p')
      .leftJoin('orders as o', function () {
        this.on('o.order_id', '=', 'p.order_id').andOnNull('o.deleted_at');
      })
      .select(PAYMENT_SELECT_COLUMNS)
      .where('o.unit_id', unitId)
      .where('o.order_id', orderId)
      .whereNull('p.deleted_at')
      .orderBy('p.created_at', 'desc');

    return rows as PaymentRow[];
  }

  async findById(
    unitId: string,
    orderId: string,
    paymentId: string,
  ): Promise<PaymentRow | null> {
    const row = await this.db('payments as p')
      .leftJoin('orders as o', function () {
        this.on('o.order_id', '=', 'p.order_id').andOnNull('o.deleted_at');
      })
      .select(PAYMENT_SELECT_COLUMNS)
      .where('o.unit_id', unitId)
      .where('o.order_id', orderId)
      .where('p.payment_id', paymentId)
      .whereNull('p.deleted_at')
      .first<PaymentRow | undefined>();

    return row ?? null;
  }

  async findActiveByOrderId(orderId: string): Promise<PaymentRow | null> {
    const row = await this.db('payments as p')
      .select(PAYMENT_SELECT_COLUMNS)
      .where('p.order_id', orderId)
      .whereIn('p.payment_status', ['pending', 'paid'])
      .whereNull('p.deleted_at')
      .orderBy('p.created_at', 'desc')
      .first<PaymentRow | undefined>();

    return row ?? null;
  }

  async findByReferenceNumber(
    referenceNumber: string,
  ): Promise<PaymentRow | null> {
    const row = await this.db('payments as p')
      .leftJoin('orders as o', function () {
        this.on('o.order_id', '=', 'p.order_id').andOnNull('o.deleted_at');
      })
      .select(PAYMENT_SELECT_COLUMNS)
      .where('p.reference_number', referenceNumber)
      .whereNull('p.deleted_at')
      .first<PaymentRow | undefined>();

    return row ?? null;
  }

  async create(data: CreatePaymentData): Promise<{ payment_id: string }> {
    const [row] = await this.db('payments')
      .insert({
        order_id: data.order_id,
        reference_number: data.reference_number,
        amount: data.amount,
        payment_status: data.payment_status,
        failure_reason: data.failure_reason,
        paid_at: data.paid_at,
        expired_at: data.expired_at,
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      })
      .returning(['payment_id']);

    return row as { payment_id: string };
  }

  async updateStatus(
    paymentId: string,
    data: UpdatePaymentData,
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      payment_status: data.payment_status,
      updated_at: this.db.fn.now(),
    };

    if (data.failure_reason !== undefined)
      payload.failure_reason = data.failure_reason;
    if (data.paid_at !== undefined) payload.paid_at = data.paid_at;
    if (data.expired_at !== undefined) payload.expired_at = data.expired_at;

    await this.db('payments')
      .where('payment_id', paymentId)
      .whereNull('deleted_at')
      .update(payload);
  }
}
