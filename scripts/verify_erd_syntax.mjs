import fs from 'node:fs';

const masterERD = `erDiagram
    direction TB

    %% --- 1. NGƯỜI DÙNG & TÀI KHOẢN ---
    users ||--o{ user_addresses : "user_id -> users.id"
    users ||--o{ wishlists : "user_id -> users.id"
    users ||--o{ carts : "user_id -> users.id"
    users ||--o{ orders : "user_id -> users.id"
    users ||--o{ product_reviews : "user_id -> users.id"
    users ||--o{ coupon_usages : "user_id -> users.id"

    %% --- 2. DANH MỤC & SẢN PHẨM ---
    categories ||--o{ products : "category_id -> categories.id"
    collections ||--o{ collection_products : "collection_id -> collections.id"
    products ||--o{ collection_products : "product_id -> products.id"
    products ||--o{ product_variants : "product_id -> products.id"
    products ||--o{ product_images : "product_id -> products.id"
    products ||--o{ wishlists : "product_id -> products.id"
    products ||--o{ product_reviews : "product_id -> products.id"
    products ||--o{ lookbook_hotspots : "product_id -> products.id"
    lookbooks ||--o{ lookbook_hotspots : "lookbook_id -> lookbooks.id"

    %% --- 3. GIỎ HÀNG & KHO CHI NHÁNH ---
    carts ||--o{ cart_items : "cart_id -> carts.id"
    product_variants ||--o{ cart_items : "variant_id -> product_variants.id"
    stores ||--o{ store_inventories : "store_id -> stores.id"
    product_variants ||--o{ store_inventories : "variant_id -> product_variants.id"

    %% --- 4. ĐƠN HÀNG & THANH TOÁN ---
    orders ||--o{ order_items : "order_id -> orders.id"
    product_variants ||--o{ order_items : "variant_id -> product_variants.id"
    orders ||--o{ payment_transactions : "order_id -> orders.id"
    orders ||--o{ coupon_usages : "order_id -> orders.id"
    coupons ||--o{ coupon_usages : "coupon_id -> coupons.id"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        varchar role
        varchar avatar_url
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
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
        timestamp created_at
    }
    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp created_at
    }
    categories {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK
        text description
        varchar image_url
        integer sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    collections {
        uuid id PK
        varchar name
        varchar slug UK
        text description
        varchar banner_url
        boolean is_collab
        boolean is_active
        timestamp created_at
    }
    collection_products {
        uuid id PK
        uuid collection_id FK
        uuid product_id FK
    }
    products {
        uuid id PK
        varchar title
        varchar slug UK
        text description
        text material_and_care
        text size_guide_html
        uuid category_id FK
        boolean is_published
        boolean is_featured
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
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
        varchar thumbnail_url
        timestamp deleted_at
        timestamp created_at
    }
    product_images {
        uuid id PK
        uuid product_id FK
        varchar minio_bucket
        varchar minio_key
        varchar image_url
        varchar color_attached
        boolean is_cover
        integer sort_order
        timestamp created_at
    }
    lookbooks {
        uuid id PK
        varchar title
        varchar image_url
        boolean is_active
        integer sort_order
        timestamp created_at
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
        varchar customer_name
        integer rating
        integer fit_score
        integer user_height_cm
        integer user_weight_kg
        varchar purchased_size
        text comment
        jsonb images
        boolean is_verified_purchase
        timestamp created_at
    }
    carts {
        uuid id PK
        uuid user_id FK
        varchar session_id
        timestamp updated_at
    }
    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
        timestamp created_at
    }
    orders {
        uuid id PK
        varchar order_code UK
        uuid user_id FK
        varchar customer_name
        varchar customer_phone
        varchar customer_email
        jsonb shipping_address
        bigint subtotal
        bigint shipping_fee
        bigint discount_amount
        bigint total_amount
        varchar payment_method
        varchar payment_status
        varchar order_status
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_title
        varchar variant_sku
        varchar variant_color
        varchar variant_size
        bigint unit_price
        integer quantity
        bigint total_price
    }
    payment_transactions {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_transaction_id UK
        bigint amount
        varchar status
        jsonb raw_payload
        timestamp created_at
    }
    coupons {
        uuid id PK
        varchar code UK
        varchar discount_type
        integer discount_value
        bigint max_discount_amount
        bigint min_order_amount
        integer usage_limit
        integer used_count
        timestamp start_date
        timestamp end_date
        boolean is_active
        timestamp created_at
    }
    coupon_usages {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK
        timestamp used_at
    }
    stores {
        uuid id PK
        varchar name
        varchar address
        varchar city
        varchar phone
        boolean is_active
        timestamp created_at
    }
    store_inventories {
        uuid id PK
        uuid store_id FK
        uuid variant_id FK
        integer stock_quantity
    }
    newsletter_leads {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
        boolean is_used
        timestamp created_at
    }`;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
  <div class="mermaid">${masterERD}</div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default', er: { useMaxWidth: false, fontSize: 13 } });
  </script>
</body>
</html>`;

fs.writeFileSync('c:/Project/Neut-Studio/scripts/test_clean_vertical.html', html, 'utf8');
console.log('Saved test_clean_vertical.html');
