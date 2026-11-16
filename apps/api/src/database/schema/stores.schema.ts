import { pgTable, uuid, varchar, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { productVariants } from './product-variants.schema.js';

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(), // e.g. "DirtyCoins 561 Sư Vạn Hạnh"
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(), // "TP. Hồ Chí Minh", "Hà Nội", "Hải Phòng"
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const storeInventories = pgTable('store_inventories', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  stockQuantity: integer('stock_quantity').notNull().default(0),
}, (table) => [
  uniqueIndex('idx_store_variant_stock').on(table.storeId, table.variantId),
]);

export const newsletterLeads = pgTable('newsletter_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  discountCodeSent: varchar('discount_code_sent', { length: 50 }),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
