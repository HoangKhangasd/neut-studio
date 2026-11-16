import fs from 'node:fs';

const verticalERD = `erDiagram
    direction TB

    %% ==========================================
    %% TẦNG 1 -> TẦNG 2: NGƯỜI DÙNG & DANH MỤC
    %% ==========================================
    USERS ||--o{ USER_ADDRESSES : "user_id -> users.id"
    USERS ||--o{ WISHLISTS : "user_id -> users.id"
    USERS ||--o{ CARTS : "user_id -> users.id"
    USERS ||--o{ ORDERS : "user_id -> users.id"
    USERS ||--o{ PRODUCT_REVIEWS : "user_id -> users.id"
    USERS ||--o{ COUPON_USAGES : "user_id -> users.id"

    CATEGORIES ||--o{ PRODUCTS : "category_id -> categories.id"
    COLLECTIONS ||--o{ COLLECTION_PRODUCTS : "collection_id -> collections.id"
    LOOKBOOKS ||--o{ LOOKBOOK_HOTSPOTS : "lookbook_id -> lookbooks.id"

    %% ==========================================
    %% TẦNG 2 -> TẦNG 3: SẢN PHẨM & BIẾN THỂ
    %% ==========================================
    PRODUCTS ||--o{ COLLECTION_PRODUCTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id -> products.id"
    PRODUCTS ||--o{ WISHLISTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "product_id -> products.id"
    PRODUCTS ||--o{ LOOKBOOK_HOTSPOTS : "product_id -> products.id"

    %% ==========================================
    %% TẦNG 3 -> TẦNG 4: GIỎ HÀNG & KHO CHI NHÁNH
    %% ==========================================
    CARTS ||--o{ CART_ITEMS : "cart_id -> carts.id"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "variant_id -> product_variants.id"

    STORES ||--o{ STORE_INVENTORIES : "store_id -> stores.id"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORIES : "variant_id -> product_variants.id"

    %% ==========================================
    %% TẦNG 4 -> TẦNG 5: ĐƠN HÀNG, THANH TOÁN, MÃ
    %% ==========================================
    ORDERS ||--o{ ORDER_ITEMS : "order_id -> orders.id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id -> product_variants.id"

    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "order_id -> orders.id"
    ORDERS ||--o{ COUPON_USAGES : "order_id -> orders.id"
    COUPONS ||--o{ COUPON_USAGES : "coupon_id -> coupons.id"

    %% ==========================================
    %% ĐỊNH NGHĨA THỰC THỂ
    %% ==========================================
    USERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar role "CUSTOMER | ADMIN"
    }

    USER_ADDRESSES {
        uuid id PK
        uuid user_id FK "users.id"
        varchar recipient_name
        varchar phone_number
        text street_address
    }

    WISHLISTS {
        uuid id PK
        uuid user_id FK "users.id"
        uuid product_id FK "products.id"
    }

    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK "categories.id (cha)"
    }

    COLLECTIONS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }

    COLLECTION_PRODUCTS {
        uuid id PK
        uuid collection_id FK "collections.id"
        uuid product_id FK "products.id"
    }

    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK "categories.id"
        boolean is_published
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK "products.id"
        varchar sku UK
        varchar color_name
        varchar size
        bigint price
        integer stock_quantity
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK "products.id"
        varchar image_url
        varchar color_attached
        boolean is_cover
    }

    LOOKBOOKS {
        uuid id PK
        varchar title
        varchar image_url
        boolean is_active
    }

    LOOKBOOK_HOTSPOTS {
        uuid id PK
        uuid lookbook_id FK "lookbooks.id"
        uuid product_id FK "products.id"
        integer x_percent
        integer y_percent
    }

    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK "products.id"
        uuid user_id FK "users.id"
        integer rating
        integer fit_score
        text comment
    }

    CARTS {
        uuid id PK
        uuid user_id FK "users.id"
        varchar session_id
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK "carts.id"
        uuid variant_id FK "product_variants.id"
        integer quantity
    }

    ORDERS {
        uuid id PK
        varchar order_code UK
        uuid user_id FK "users.id"
        bigint total_amount
        varchar payment_method
        varchar order_status
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK "orders.id"
        uuid variant_id FK "product_variants.id"
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }

    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid order_id FK "orders.id"
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
        uuid coupon_id FK "coupons.id"
        uuid user_id FK "users.id"
        uuid order_id FK "orders.id"
    }

    STORES {
        uuid id PK
        varchar name
        varchar address
        varchar city
    }

    STORE_INVENTORIES {
        uuid id PK
        uuid store_id FK "stores.id"
        uuid variant_id FK "product_variants.id"
        integer stock_quantity
    }

    NEWSLETTER_LEADS {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
        boolean is_used
    }`;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body { background: #fff; padding: 40px; margin: 0; display: inline-block; }
    svg { display: block; height: auto !important; max-width: none !important; }
  </style>
</head>
<body>
  <div class="mermaid">
${verticalERD}
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default', er: { useMaxWidth: false, fontSize: 14 } });
  </script>
</body>
</html>`;

fs.writeFileSync('c:/Project/Neut-Studio/scripts/test_vertical.html', html, 'utf8');
console.log('Written test_vertical.html');
