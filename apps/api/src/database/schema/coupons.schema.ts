import { pgTable, uuid, varchar, integer, bigint, boolean, text, jsonb, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema.js';
import { products } from './products.schema.js';

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g. "NEUT10", "WELCOME2026"
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'PERCENT' | 'FIXED'
  discountValue: integer('discount_value').notNull(), // e.g. 10 (%) or 50000 (VND)
  maxDiscountAmount: bigint('max_discount_amount', { mode: 'number' }),
  minOrderAmount: bigint('min_order_amount', { mode: 'number' }).default(0).notNull(),
  usageLimit: integer('usage_limit').default(100).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).defaultNow().notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('chk_coupon_valid_dates', sql`${table.endDate} > ${table.startDate}`),
  check('chk_coupon_usage_limit', sql`${table.usedCount} <= ${table.usageLimit}`),
]);

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lookbooks = pgTable('lookbooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lookbookHotspots = pgTable('lookbook_hotspots', {
  id: uuid('id').defaultRandom().primaryKey(),
  lookbookId: uuid('lookbook_id').notNull().references(() => lookbooks.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  xPercent: integer('x_percent').notNull(), // 0 - 100%
  yPercent: integer('y_percent').notNull(), // 0 - 100%
});

export const productReviews = pgTable('product_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 100 }).notNull().default('Khách hàng Neut'),
  rating: integer('rating').notNull(), // 1 - 5 stars
  fitScore: integer('fit_score').notNull().default(0), // -1: Tight, 0: True to size, 1: Loose
  userHeightCm: integer('user_height_cm'),
  userWeightKg: integer('user_weight_kg'),
  purchasedSize: varchar('purchased_size', { length: 20 }),
  comment: text('comment').notNull(),
  images: jsonb('images').$type<string[]>().default([]), // Photo feedback URLs
  isVerifiedPurchase: boolean('is_verified_purchase').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
