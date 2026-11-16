import fs from 'node:fs';

const masterCode = `erDiagram
    %% --- RELATIONSHIPS WITH EXPLICIT LINKING FIELDS ---
    USERS ||--o{ USER_ADDRESSES : "user_id -> id"
    USERS ||--o{ WISHLISTS : "user_id -> id"
    PRODUCTS ||--o{ WISHLISTS : "product_id -> id"

    CATEGORIES ||--o{ CATEGORIES : "parent_id -> id"
    CATEGORIES ||--o{ PRODUCTS : "category_id -> id"

    COLLECTIONS ||--o{ COLLECTION_PRODUCTS : "collection_id -> id"
    PRODUCTS ||--o{ COLLECTION_PRODUCTS : "product_id -> id"

    PRODUCTS ||--o{ PRODUCT_VARIANTS : "product_id -> id"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id -> id"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "product_id -> id"
    USERS ||--o{ PRODUCT_REVIEWS : "user_id -> id"

    LOOKBOOKS ||--o{ LOOKBOOK_HOTSPOTS : "lookbook_id -> id"
    PRODUCTS ||--o{ LOOKBOOK_HOTSPOTS : "product_id -> id"

    USERS ||--o{ CARTS : "user_id -> id"
    CARTS ||--o{ CART_ITEMS : "cart_id -> id"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "variant_id -> id"

    USERS ||--o{ ORDERS : "user_id -> id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id -> id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id -> id"

    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "order_id -> id"

    COUPONS ||--o{ COUPON_USAGES : "coupon_id -> id"
    USERS ||--o{ COUPON_USAGES : "user_id -> id"
    ORDERS ||--o{ COUPON_USAGES : "order_id -> id"

    STORES ||--o{ STORE_INVENTORIES : "store_id -> id"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORIES : "variant_id -> id"

    %% --- ENTITY DEFINITIONS SHOWING PK, FK & KEY FIELDS ---
    USERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar role
    }
    USER_ADDRESSES {
        uuid id PK
        uuid user_id FK
        varchar recipient_name
        varchar phone_number
        varchar province
        text street_address
    }
    WISHLISTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
    }
    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK
    }
    COLLECTIONS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }
    COLLECTION_PRODUCTS {
        uuid id PK
        uuid collection_id FK
        uuid product_id FK
    }
    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK
        boolean is_published
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        varchar color_name
        varchar size
        bigint price
        integer stock_quantity
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        varchar image_url
        varchar color_attached
        boolean is_cover
    }
    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        integer fit_score
        varchar purchased_size
    }
    LOOKBOOKS {
        uuid id PK
        varchar title
        varchar image_url
    }
    LOOKBOOK_HOTSPOTS {
        uuid id PK
        uuid lookbook_id FK
        uuid product_id FK
        integer x_percent
        integer y_percent
    }
    CARTS {
        uuid id PK
        uuid user_id FK
        varchar session_id
    }
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
    }
    ORDERS {
        uuid id PK
        varchar order_code UK
        uuid user_id FK
        bigint total_amount
        varchar payment_method
        varchar order_status
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }
    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_transaction_id UK
        bigint amount
        varchar status
    }
    COUPONS {
        uuid id PK
        varchar code UK
        varchar discount_type
        integer discount_value
        integer usage_limit
        integer used_count
    }
    COUPON_USAGES {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK
    }
    STORES {
        uuid id PK
        varchar name
        varchar address
        varchar city
    }
    STORE_INVENTORIES {
        uuid id PK
        uuid store_id FK
        uuid variant_id FK
        integer stock_quantity
    }
    NEWSLETTER_LEADS {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
        boolean is_used
    }`;

async function test() {
  const b64 = Buffer.from(masterCode.trim()).toString('base64');
  console.log('Fetching SVG from mermaid.ink...');
  const res = await fetch('https://mermaid.ink/svg/' + b64);
  console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
  if (!res.ok) {
    const txt = await res.text();
    console.error('Error:', txt);
    return;
  }
  const svg = await res.text();
  fs.writeFileSync('c:/Project/Neut-Studio/docs/images/01_master_erd.svg', svg);
  console.log('Successfully saved 01_master_erd.svg (' + svg.length + ' bytes)');
}

test();
