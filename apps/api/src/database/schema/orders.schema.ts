import { pgTable, uuid, varchar, bigint, jsonb, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema.js';
import { coupons } from './coupons.schema.js';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderCode: varchar('order_code', { length: 50 }).notNull().unique(), // e.g. NEUT-20261024-A1B2C3D4
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  couponId: uuid('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  couponCode: varchar('coupon_code', { length: 50 }),
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
}, (table) => [
  check('chk_orders_subtotal_non_negative', sql`${table.subtotal} >= 0`),
  check('chk_orders_shipping_fee_non_negative', sql`${table.shippingFee} >= 0`),
  check('chk_orders_discount_non_negative', sql`${table.discountAmount} >= 0`),
  check('chk_orders_total_non_negative', sql`${table.totalAmount} >= 0`),
]);

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
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
