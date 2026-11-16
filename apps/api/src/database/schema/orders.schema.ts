import { pgTable, uuid, varchar, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderCode: varchar('order_code', { length: 50 }).notNull().unique(), // e.g. NEUT-20261024-XXXX
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerEmail: varchar('customer_email', { length: 150 }).notNull(),
  shippingAddress: jsonb('shipping_address').notNull(), // { province, district, ward, street }
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  shippingFee: bigint('shipping_fee', { mode: 'number' }).notNull().default(0),
  discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'COD' | 'PAYOS' | 'VNPAY'
  paymentStatus: varchar('payment_status', { length: 20 }).default('PENDING').notNull(),
  orderStatus: varchar('order_status', { length: 20 }).default('PENDING').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // 15-minute countdown for QR payments
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'PAYOS' | 'VNPAY'
  providerTransactionId: varchar('provider_transaction_id', { length: 100 }).notNull().unique(), // Idempotency
  amount: bigint('amount', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
