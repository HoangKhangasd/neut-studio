import fs from 'node:fs';
import path from 'node:path';

const outDir = 'c:/Project/Neut-Studio/docs/images';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const diagrams = [
  {
    name: '01_master_erd.png',
    code: `erDiagram
    users ||--o{ user_addresses : "owns"
    users ||--o{ wishlists : "bookmarks"
    users ||--o{ carts : "maintains"
    users ||--o{ orders : "places"
    users ||--o{ product_reviews : "writes"
    users ||--o{ coupon_usages : "redeems"

    categories ||--o{ categories : "parent_of"
    categories ||--o{ products : "classifies"

    collections ||--o{ collection_products : "contains"
    products ||--o{ collection_products : "belongs_to"

    products ||--o{ product_variants : "has_variants"
    products ||--o{ product_images : "has_gallery"
    products ||--o{ wishlists : "saved_in"
    products ||--o{ product_reviews : "evaluated_by"
    products ||--o{ lookbook_hotspots : "pinned_in"

    lookbooks ||--o{ lookbook_hotspots : "features"

    carts ||--o{ cart_items : "contains"
    product_variants ||--o{ cart_items : "added_as"

    orders ||--o{ order_items : "includes"
    product_variants |o--o{ order_items : "referenced_in"
    orders ||--o{ payment_transactions : "paid_via"
    orders ||--o{ coupon_usages : "applied_in"

    coupons ||--o{ coupon_usages : "tracked_in"

    stores ||--o{ store_inventories : "stocks"
    product_variants ||--o{ store_inventories : "stocked_at"`
  },
  {
    name: '02_auth_users.png',
    code: `erDiagram
    users ||--o{ user_addresses : "owns"
    users ||--o{ wishlists : "bookmarks"
    products ||--o{ wishlists : "saved_in"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        varchar role
        varchar avatar_url
    }
    user_addresses {
        uuid id PK
        uuid user_id FK
        varchar recipient_name
        varchar phone_number
        varchar province
        varchar district
        varchar ward
        text street_address
        boolean is_default
    }
    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
    }`
  },
  {
    name: '03_catalog_products.png',
    code: `erDiagram
    categories ||--o{ categories : "parent_of"
    categories ||--o{ products : "classifies"
    collections ||--o{ collection_products : "contains"
    products ||--o{ collection_products : "belongs_to"
    products ||--o{ product_variants : "has_variants"
    products ||--o{ product_images : "has_gallery"

    categories {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK
    }
    collections {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }
    products {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK
        boolean is_published
        boolean is_featured
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        varchar color_name
        varchar color_hex
        varchar size
        bigint price
        bigint sale_price
        integer stock_quantity
    }
    product_images {
        uuid id PK
        uuid product_id FK
        varchar image_url
        varchar color_attached
        boolean is_cover
    }`
  },
  {
    name: '04_lookbook_reviews.png',
    code: `erDiagram
    lookbooks ||--o{ lookbook_hotspots : "features"
    products ||--o{ lookbook_hotspots : "pinned_in"
    products ||--o{ product_reviews : "evaluated_by"
    users ||--o{ product_reviews : "writes"

    lookbooks {
        uuid id PK
        varchar title
        varchar image_url
    }
    lookbook_hotspots {
        uuid id PK
        uuid lookbook_id FK
        uuid product_id FK
        integer x_percent
        integer y_percent
    }
    product_reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        integer fit_score
        integer user_height_cm
        integer user_weight_kg
        text comment
    }`
  },
  {
    name: '05_cart_orders.png',
    code: `erDiagram
    users ||--o{ carts : "owns"
    carts ||--o{ cart_items : "contains"
    product_variants ||--o{ cart_items : "added_as"
    users ||--o{ orders : "places"
    orders ||--o{ order_items : "includes"
    product_variants |o--o{ order_items : "referenced_in"

    carts {
        uuid id PK
        uuid user_id FK
        varchar session_id
    }
    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
    }
    orders {
        uuid id PK
        varchar order_code UK
        uuid user_id FK
        bigint total_amount
        varchar payment_method
        varchar payment_status
        varchar order_status
        timestamp expires_at
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }`
  },
  {
    name: '06_payments_coupons.png',
    code: `erDiagram
    orders ||--o{ payment_transactions : "paid_via"
    coupons ||--o{ coupon_usages : "tracked_in"
    users ||--o{ coupon_usages : "redeems"
    orders ||--o{ coupon_usages : "applied_in"

    payment_transactions {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_transaction_id UK
        bigint amount
        varchar status
    }
    coupons {
        uuid id PK
        varchar code UK
        varchar discount_type
        integer discount_value
        integer usage_limit
        integer used_count
    }
    coupon_usages {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK
    }
    newsletter_leads {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
    }`
  },
  {
    name: '07_stores_inventory.png',
    code: `erDiagram
    stores ||--o{ store_inventories : "stocks"
    product_variants ||--o{ store_inventories : "stocked_at"

    stores {
        uuid id PK
        varchar name
        varchar address
        varchar city
        varchar phone
    }
    store_inventories {
        uuid id PK
        uuid store_id FK
        uuid variant_id FK
        integer stock_quantity
    }`
  }
];

async function run() {
  for (const item of diagrams) {
    const b64 = Buffer.from(item.code.trim()).toString('base64');
    const url = 'https://mermaid.ink/img/' + b64;
    console.log(`Downloading ${item.name}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed ${item.name}: ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(outDir, item.name), buffer);
      console.log(`Saved ${item.name} (${buffer.length} bytes)`);
    } catch (e) {
      console.error(`Error ${item.name}:`, e.message);
    }
  }
  console.log('Done rendering diagrams!');
}

run();
