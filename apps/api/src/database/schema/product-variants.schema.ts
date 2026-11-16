import { pgTable, uuid, varchar, integer, bigint, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { products } from './products.schema.js';

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  colorName: varchar('color_name', { length: 50 }).notNull(),
  colorHex: varchar('color_hex', { length: 10 }).notNull(),
  size: varchar('size', { length: 20 }).notNull(), // 'S', 'M', 'L', 'XL', '28', '30', 'Freesize'
  price: bigint('price', { mode: 'number' }).notNull(), // VNĐ: 299000
  salePrice: bigint('sale_price', { mode: 'number' }), // VNĐ: 199000
  stockQuantity: integer('stock_quantity').notNull().default(0),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_variant_product_color_size').on(table.productId, table.colorName, table.size),
  check('chk_stock_non_negative', sql`${table.stockQuantity} >= 0`),
  check('chk_price_positive', sql`${table.price} >= 0`),
  check('chk_sale_price_valid', sql`${table.salePrice} IS NULL OR ${table.salePrice} <= ${table.price}`),
]);
