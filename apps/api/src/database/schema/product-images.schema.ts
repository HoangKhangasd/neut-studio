import { pgTable, uuid, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minioBucket: varchar('minio_bucket', { length: 100 }).default('products').notNull(),
  minioKey: varchar('minio_key', { length: 500 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  colorAttached: varchar('color_attached', { length: 50 }),
  isCover: boolean('is_cover').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
