-- ====================================================================
-- PROJECT: NEUT-STUDIO (E-COMMERCE STREETWEAR ARCHITECTURE)
-- FORMAT: PostgreSQL SQL DDL (Ready for dbdiagram.io Import > PostgreSQL)
-- ====================================================================

-- 1. USERS & AUTH
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "phone" varchar(20),
  "role" varchar(20) NOT NULL DEFAULT 'CUSTOMER',
  "avatar_url" varchar(500),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE TABLE "user_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "recipient_name" varchar(100) NOT NULL,
  "phone_number" varchar(20) NOT NULL,
  "province" varchar(100) NOT NULL,
  "district" varchar(100) NOT NULL,
  "ward" varchar(100) NOT NULL,
  "street_address" text NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "wishlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "newsletter_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(20) NOT NULL UNIQUE,
  "discount_code_sent" varchar(50),
  "is_used" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- 2. CATALOG & STREETWEAR PRODUCTS
CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "parent_id" uuid,
  "description" text,
  "image_url" varchar(500),
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(150) NOT NULL,
  "slug" varchar(150) NOT NULL UNIQUE,
  "description" text,
  "banner_url" varchar(500),
  "is_collab" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "collection_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "collection_id" uuid NOT NULL,
  "product_id" uuid NOT NULL
);

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "description" text,
  "material_and_care" text,
  "size_guide_html" text,
  "category_id" uuid,
  "is_published" boolean NOT NULL DEFAULT false,
  "is_featured" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "product_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "sku" varchar(100) NOT NULL UNIQUE,
  "color_name" varchar(50) NOT NULL,
  "color_hex" varchar(10) NOT NULL,
  "size" varchar(20) NOT NULL,
  "price" bigint NOT NULL,
  "sale_price" bigint,
  "stock_quantity" integer NOT NULL DEFAULT 0,
  "thumbnail_url" varchar(500),
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "product_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "minio_bucket" varchar(100) NOT NULL DEFAULT 'products',
  "minio_key" varchar(500) NOT NULL,
  "image_url" varchar(500) NOT NULL,
  "color_attached" varchar(50),
  "is_cover" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "user_id" uuid,
  "customer_name" varchar(100) NOT NULL DEFAULT 'Khách hàng Neut',
  "rating" integer NOT NULL,
  "fit_score" integer NOT NULL DEFAULT 0,
  "user_height_cm" integer,
  "user_weight_kg" integer,
  "purchased_size" varchar(20),
  "comment" text NOT NULL,
  "images" jsonb DEFAULT '[]',
  "is_verified_purchase" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "lookbooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(200) NOT NULL,
  "image_url" varchar(500) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "lookbook_hotspots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lookbook_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "x_percent" integer NOT NULL,
  "y_percent" integer NOT NULL
);

-- 3. CARTS, ORDERS & CHECKOUT
CREATE TABLE "carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "session_id" varchar(100),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cart_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "coupons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(50) NOT NULL UNIQUE,
  "discount_type" varchar(20) NOT NULL,
  "discount_value" integer NOT NULL,
  "max_discount_amount" bigint,
  "min_order_amount" bigint NOT NULL DEFAULT 0,
  "usage_limit" integer NOT NULL DEFAULT 100,
  "used_count" integer NOT NULL DEFAULT 0,
  "start_date" timestamptz NOT NULL DEFAULT now(),
  "end_date" timestamptz NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "coupon_usages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "coupon_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "used_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_code" varchar(50) NOT NULL UNIQUE,
  "user_id" uuid,
  "customer_name" varchar(100) NOT NULL,
  "customer_phone" varchar(20) NOT NULL,
  "customer_email" varchar(150) NOT NULL,
  "shipping_address" jsonb NOT NULL,
  "subtotal" bigint NOT NULL,
  "shipping_fee" bigint NOT NULL DEFAULT 0,
  "discount_amount" bigint NOT NULL DEFAULT 0,
  "total_amount" bigint NOT NULL,
  "payment_method" varchar(20) NOT NULL,
  "payment_status" varchar(20) NOT NULL DEFAULT 'PENDING',
  "order_status" varchar(20) NOT NULL DEFAULT 'PENDING',
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL,
  "variant_id" uuid,
  "product_title" varchar(255) NOT NULL,
  "variant_sku" varchar(100) NOT NULL,
  "variant_color" varchar(50) NOT NULL,
  "variant_size" varchar(20) NOT NULL,
  "unit_price" bigint NOT NULL,
  "quantity" integer NOT NULL,
  "total_price" bigint NOT NULL
);

CREATE TABLE "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL,
  "provider" varchar(20) NOT NULL,
  "provider_transaction_id" varchar(100) NOT NULL UNIQUE,
  "amount" bigint NOT NULL,
  "status" varchar(20) NOT NULL,
  "raw_payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- 4. STORES & RETAIL
CREATE TABLE "stores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(150) NOT NULL,
  "address" varchar(255) NOT NULL,
  "city" varchar(100) NOT NULL,
  "phone" varchar(20),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "store_inventories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "stock_quantity" integer NOT NULL DEFAULT 0
);

-- 5. FOREIGN KEY CONSTRAINTS
ALTER TABLE "user_addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "wishlists" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "wishlists" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;

ALTER TABLE "categories" ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL;
ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL;
ALTER TABLE "collection_products" ADD FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE CASCADE;
ALTER TABLE "collection_products" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_images" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_reviews" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_reviews" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "lookbook_hotspots" ADD FOREIGN KEY ("lookbook_id") REFERENCES "lookbooks" ("id") ON DELETE CASCADE;
ALTER TABLE "lookbook_hotspots" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;

ALTER TABLE "carts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE;

ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL;
ALTER TABLE "payment_transactions" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT;
ALTER TABLE "coupon_usages" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE CASCADE;
ALTER TABLE "coupon_usages" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "coupon_usages" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;

ALTER TABLE "store_inventories" ADD FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE;
ALTER TABLE "store_inventories" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE;
