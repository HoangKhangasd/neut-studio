import { pgTable, uuid, varchar, integer, bigint, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from './orders.schema.js';
import { productVariants } from './product-variants.schema.js';
import { users } from './users.schema.js';

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }), // Preserve historical sales data
  productTitle: varchar('product_title', { length: 255 }).notNull(),
  variantSku: varchar('variant_sku', { length: 100 }).notNull(),
  variantColor: varchar('variant_color', { length: 50 }).notNull(),
  variantSize: varchar('variant_size', { length: 20 }).notNull(),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  quantity: integer('quantity').notNull(),
  totalPrice: bigint('total_price', { mode: 'number' }).notNull(),
}, (table) => [
  check('chk_order_item_qty_positive', sql`${table.quantity} > 0`),
]);

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 100 }), // Guest cart identifier
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('chk_cart_item_qty_positive', sql`${table.quantity} > 0`),
]);
